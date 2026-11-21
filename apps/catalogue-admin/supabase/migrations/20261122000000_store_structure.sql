-- Store structure: category tree, collections, mega menu picks, design
-- options, product badges, content pages and homepage sections.
-- Run once in the Supabase SQL editor after 20261121000000_size_guides_seo.sql.
-- Safe to re-run.
--
-- Until this runs, the public site keeps building (the new tables are
-- treated as empty) and the admin shows a reminder on the new screens.

-- ---------------------------------------------------------------- categories

-- Images use the same pipeline as product photos: `image_path` is the storage
-- path without the width suffix, stored as `${image_path}-${width}.webp`.
alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete set null,
  add column if not exists description text not null default '',
  add column if not exists image_path text,
  add column if not exists image_widths integer[] not null default '{}',
  add column if not exists image_width integer,
  add column if not exists image_height integer,
  add column if not exists show_in_menu boolean not null default true,
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_parent_not_self') then
    alter table public.categories
      add constraint categories_parent_not_self check (parent_id is null or parent_id <> id);
  end if;
end;
$$;

create index if not exists categories_parent_idx on public.categories (parent_id);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- products

alter table public.products
  add column if not exists badge text not null default 'none'
    constraint products_badge_check check (badge in ('none', 'new', 'bestseller')),
  -- Products sharing a non-empty group show each other under "More designs".
  add column if not exists design_group text not null default '';

create index if not exists products_design_group_idx on public.products (design_group) where design_group <> '';

-- ---------------------------------------------------------------- collections

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  image_path text,
  image_widths integer[] not null default '{}',
  image_width integer,
  image_height integer,
  show_on_home boolean not null default false,
  sort_order integer not null default 0,
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create table if not exists public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (product_id, collection_id)
);

create index if not exists product_collections_collection_idx on public.product_collections (collection_id, sort_order);

-- ---------------------------------------------------------------- mega menu picks

-- At most 2 per category. The admin enforces the limit; the site shows the
-- newest products of the category when there are none.
create table if not exists public.category_menu_products (
  category_id uuid not null references public.categories (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (category_id, product_id)
);

create index if not exists category_menu_products_product_idx on public.category_menu_products (product_id);

-- ---------------------------------------------------------------- design options

create table if not exists public.product_designs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  in_stock boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists product_designs_product_idx on public.product_designs (product_id);

alter table public.product_images
  add column if not exists design_id uuid references public.product_designs (id) on delete set null;

create index if not exists product_images_design_idx on public.product_images (design_id);

-- ---------------------------------------------------------------- content pages

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 120),
  -- Formatted HTML from the admin's editor. Sanitized again at build time.
  html text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_pages_set_updated_at on public.site_pages;
create trigger site_pages_set_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- homepage sections

-- Ordered list of { "id": "new-arrivals", "enabled": true }. Empty means the
-- site's default order.
alter table public.site_settings
  add column if not exists home_sections jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------- access

grant select on public.collections, public.product_collections, public.category_menu_products,
  public.product_designs, public.site_pages to anon, authenticated;
grant all on public.collections, public.product_collections, public.category_menu_products,
  public.product_designs, public.site_pages to service_role;

alter table public.collections enable row level security;
alter table public.product_collections enable row level security;
alter table public.category_menu_products enable row level security;
alter table public.product_designs enable row level security;
alter table public.site_pages enable row level security;

drop policy if exists "Public can read collections" on public.collections;
create policy "Public can read collections" on public.collections
  for select to anon, authenticated using (true);

drop policy if exists "Public can read collection links of published products" on public.product_collections;
create policy "Public can read collection links of published products" on public.product_collections
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_collections.product_id and p.status = 'published'
    )
  );

drop policy if exists "Public can read menu picks of published products" on public.category_menu_products;
create policy "Public can read menu picks of published products" on public.category_menu_products
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = category_menu_products.product_id and p.status = 'published'
    )
  );

drop policy if exists "Public can read designs of published products" on public.product_designs;
create policy "Public can read designs of published products" on public.product_designs
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_designs.product_id and p.status = 'published'
    )
  );

drop policy if exists "Public can read site pages" on public.site_pages;
create policy "Public can read site pages" on public.site_pages
  for select to anon, authenticated using (true);

-- No insert, update or delete policies: only the secret key can write.
