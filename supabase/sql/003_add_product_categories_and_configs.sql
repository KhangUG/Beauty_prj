-- 1. Tạo bảng categories trước (Bảng cha)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_category_key text not null unique,
  created_at timestamptz not null default now()
);

-- 2. Sau đó mới sửa bảng products để thêm khóa ngoại
alter table public.products
  add column if not exists brand text,
  add column if not exists price numeric(10,2),
  add column if not exists category_id uuid references public.categories(id) on delete set null;

-- 3. Tạo bảng product_configs
create table if not exists public.product_configs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  hex_color text,
  texture text,
  color_intensity integer check (color_intensity >= 0 and color_intensity <= 100),
  pattern_name text,
  extra_params jsonb,
  created_at timestamptz not null default now()
);

-- 4. Tạo các chỉ mục (indexes) để truy vấn nhanh hơn
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists product_configs_product_id_idx on public.product_configs(product_id);

-- 5. Cấu hình RLS và Policies (Nhớ tạo hàm is_admin_user() trước nếu chưa có)
alter table public.categories enable row level security;
alter table public.product_configs enable row level security;

-- (Giữ nguyên các chính sách RLS bạn đã viết ở trên)

create policy "categories are readable by authenticated users"
  on public.categories
  for select
  to authenticated
  using (true);

create policy "categories manageable by admin"
  on public.categories
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "product configs are readable by authenticated users"
  on public.product_configs
  for select
  to authenticated
  using (true);

create policy "product configs manageable by admin"
  on public.product_configs
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());
alter table public.products disable row level security;

alter table public.categories disable row level security;