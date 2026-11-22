-- Cash on delivery orders from the site's checkout.
-- Run once in the Supabase SQL editor after 20261122000000_store_structure.sql.
-- Safe to re-run.
--
-- Access model:
--   * Orders hold customer names, phones and addresses, so the publishable
--     (anon) key gets NO access at all: no select, no insert, no policies.
--   * Only two places hold the secret (service_role) key: the order endpoint
--     on Cloudflare (functions/api/order.ts) and the local admin.
--   * The endpoint writes through place_catalogue_order(), which saves an
--     order and its items in one transaction, applies the idempotency key and
--     the rate limits, and returns the order number.
--
-- Until this runs, the site keeps building and checkout falls back to
-- WhatsApp with the order already written.

-- ---------------------------------------------------------------- order numbers

-- Short, readable over the phone: AFK-1001, AFK-1002, ...
create sequence if not exists public.catalogue_order_number_seq start with 1001;

-- ---------------------------------------------------------------- orders

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- One per checkout page visit, so a double tap or a retry saves one order.
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 80),
  -- Hash of the spam check (proof of work) answer, so one answer places one order.
  challenge_hash text unique,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (phone ~ '^01[3-9][0-9]{8}$'),
  email text check (email is null or char_length(email) <= 254),
  district text not null check (char_length(district) between 1 and 40),
  zone text not null check (zone in ('inside_dhaka', 'dhaka_suburban', 'outside_dhaka')),
  address text not null check (char_length(address) between 1 and 300),
  note text not null default '' check (char_length(note) <= 500),
  subtotal_bdt integer not null check (subtotal_bdt >= 0),
  delivery_bdt integer not null check (delivery_bdt >= 0),
  total_bdt integer not null,
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  -- Owner and customer emails: pending until the endpoint has tried to send them.
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  -- SHA-256 of the visitor's IP with a secret salt. Used only for rate limits.
  ip_hash text,
  -- Set by the admin's anonymise action. Personal fields are blanked.
  anonymised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches check (total_bdt = subtotal_bdt + delivery_bdt)
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_idx on public.orders (phone, created_at desc);
create index if not exists orders_ip_hash_idx on public.orders (ip_hash, created_at desc) where ip_hash is not null;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Prices and names are copied when the order is placed, so later edits to a
-- product never rewrite an order.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_slug text not null,
  product_name text not null,
  color text,
  design text,
  size text,
  quantity integer not null check (quantity between 1 and 10),
  unit_price_bdt integer not null check (unit_price_bdt >= 0),
  line_total_bdt integer not null,
  sort_order integer not null default 0,
  constraint order_items_total_matches check (line_total_bdt = unit_price_bdt * quantity)
);

create index if not exists order_items_order_idx on public.order_items (order_id, sort_order);

-- What happened to an order and when: placed, emails sent or failed, status changes.
create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (char_length(kind) between 1 and 40),
  detail text not null default '' check (char_length(detail) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------- access

-- No grants to anon or authenticated: the publishable key cannot see or add orders.
revoke all on public.orders, public.order_items, public.order_events from anon, authenticated;
revoke all on sequence public.catalogue_order_number_seq from anon, authenticated;
grant all on public.orders, public.order_items, public.order_events to service_role;
grant usage on sequence public.catalogue_order_number_seq to service_role;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
-- No policies on purpose. service_role bypasses row level security.

-- ---------------------------------------------------------------- place an order

-- Saves an order with its items in one transaction.
--
--   p_order: { idempotency_key, challenge_hash, name, phone, email, district,
--              zone, address, note, subtotal_bdt, delivery_bdt, total_bdt,
--              ip_hash }
--   p_items: [{ product_id, product_slug, product_name, color, design, size,
--               quantity, unit_price_bdt }]
--
-- Returns one row:
--   result 'created'   a new order was saved
--   result 'duplicate' this idempotency key already placed an order (same code returned)
--   result 'limited'   too many recent orders from this phone or network
--   result 'replayed'  this spam check answer was already used for another order
create or replace function public.place_catalogue_order(p_order jsonb, p_items jsonb)
returns table (result text, order_id uuid, order_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.orders%rowtype;
  v_id uuid;
  v_code text;
  v_phone text := p_order ->> 'phone';
  v_ip_hash text := nullif(p_order ->> 'ip_hash', '');
  v_challenge text := nullif(p_order ->> 'challenge_hash', '');
begin
  -- Two requests with the same key wait for each other here instead of racing.
  perform pg_advisory_xact_lock(hashtext('catalogue_order:' || (p_order ->> 'idempotency_key')));

  select * into v_existing from public.orders where idempotency_key = p_order ->> 'idempotency_key';
  if found then
    return query select 'duplicate'::text, v_existing.id, v_existing.code;
    return;
  end if;

  if v_challenge is not null and exists (select 1 from public.orders where challenge_hash = v_challenge) then
    return query select 'replayed'::text, null::uuid, null::text;
    return;
  end if;

  -- Rate limits: 3 orders per phone and 6 per network in the last hour.
  if (select count(*) from public.orders where phone = v_phone and created_at > now() - interval '1 hour') >= 3
    or (v_ip_hash is not null
      and (select count(*) from public.orders where ip_hash = v_ip_hash and created_at > now() - interval '1 hour') >= 6)
  then
    return query select 'limited'::text, null::uuid, null::text;
    return;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    raise exception 'An order needs between 1 and 20 items';
  end if;

  v_code := 'AFK-' || nextval('public.catalogue_order_number_seq');

  insert into public.orders (
    code, idempotency_key, challenge_hash, name, phone, email, district, zone, address, note,
    subtotal_bdt, delivery_bdt, total_bdt, ip_hash
  ) values (
    v_code,
    p_order ->> 'idempotency_key',
    v_challenge,
    p_order ->> 'name',
    v_phone,
    nullif(p_order ->> 'email', ''),
    p_order ->> 'district',
    p_order ->> 'zone',
    p_order ->> 'address',
    coalesce(p_order ->> 'note', ''),
    (p_order ->> 'subtotal_bdt')::integer,
    (p_order ->> 'delivery_bdt')::integer,
    (p_order ->> 'total_bdt')::integer,
    v_ip_hash
  )
  returning id into v_id;

  insert into public.order_items (
    order_id, product_id, product_slug, product_name, color, design, size,
    quantity, unit_price_bdt, line_total_bdt, sort_order
  )
  select
    v_id,
    nullif(item ->> 'product_id', '')::uuid,
    item ->> 'product_slug',
    item ->> 'product_name',
    nullif(item ->> 'color', ''),
    nullif(item ->> 'design', ''),
    nullif(item ->> 'size', ''),
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price_bdt')::integer,
    (item ->> 'unit_price_bdt')::integer * (item ->> 'quantity')::integer,
    (ordinality - 1)::integer
  from jsonb_array_elements(p_items) with ordinality as t(item, ordinality);

  -- The order total must match its items, even if the caller made a mistake.
  -- Columns are qualified: order_id is also the name of this function's output column.
  if (select coalesce(sum(oi.line_total_bdt), 0) from public.order_items oi where oi.order_id = v_id)
    <> (p_order ->> 'subtotal_bdt')::integer then
    raise exception 'Order subtotal does not match its items';
  end if;

  insert into public.order_events (order_id, kind, detail) values (v_id, 'placed', 'Checkout on the website');

  return query select 'created'::text, v_id, v_code;
end;
$$;

revoke all on function public.place_catalogue_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.place_catalogue_order(jsonb, jsonb) to service_role;
