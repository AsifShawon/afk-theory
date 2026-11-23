-- Optional Meta Content ID for Meta catalogue product tracking.
-- Run once in the Supabase SQL editor.
-- Safe to re-run.

alter table public.products
  add column if not exists meta_content_id text;
