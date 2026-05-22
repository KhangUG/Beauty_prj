-- 1. XÓA CÁC ĐỐI TƯỢNG CŨ ĐỂ LÀM SẠCH (Tránh xung đột)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.product_configs CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role;

-- 2. TẠO TYPE ENUM
CREATE TYPE public.user_role AS ENUM ('guest', 'free', 'premium', 'admin');

-- 3. TẠO BẢNG PROFILES (Quản lý User)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    first_name text,
    last_name text,
    role public.user_role NOT NULL DEFAULT 'free',
    subscription_tier text NOT NULL DEFAULT 'free',
    try_on_credits integer NOT NULL DEFAULT 5,
    avatar_url text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. BẢNG DANH MỤC (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    api_category_key text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. BẢNG SẢN PHẨM (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    brand text,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. BẢNG CẤU HÌNH (Product Configs)
CREATE TABLE IF NOT EXISTS public.product_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    hex_color text,
    texture text,
    color_intensity integer CHECK (color_intensity >= 0 AND color_intensity <= 100),
    pattern_name text,
    extra_params jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. CẤU HÌNH INDEXES (Tối ưu truy vấn)
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS product_configs_product_id_idx ON public.product_configs(product_id);
CREATE INDEX IF NOT EXISTS product_configs_extra_params_idx ON public.product_configs USING GIN (extra_params);
CREATE INDEX IF NOT EXISTS idx_product_configs_lookup ON public.product_configs(hex_color, texture);

-- 8. TÍCH HỢP RLS (Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_configs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Categories/Products/Configs Policies
CREATE POLICY "Read access for all authenticated" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access for all authenticated" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read access for all authenticated" ON public.product_configs FOR SELECT TO authenticated USING (true);

-- Admin Policies (Giả định bạn có hàm is_admin_user() hoặc dựa vào role trong profiles)
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "Admin manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "Admin manage configs" ON public.product_configs FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 9. TRIGGER TỰ ĐỘNG TẠO PROFILE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role, subscription_tier, try_on_credits, avatar_url)
    VALUES (
        new.id, 
        new.email,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        'free'::public.user_role,
        'free',
        5,
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Thêm các cột vào bảng products
alter table public.products
  add column if not exists image_url text,
  add column if not exists external_url text;

-- (Tùy chọn) Nếu bạn muốn thêm mô tả sản phẩm để hỗ trợ SEO hoặc hiển thị thông tin
alter table public.products
  add column if not exists description text;