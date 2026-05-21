-- Make external_url nullable (optional)
alter table public.products
  alter column external_url drop not null;
