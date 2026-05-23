-- 1. Dọn dẹp cấu trúc cũ với CASCADE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Dùng CASCADE để xóa luôn các Policy đang phụ thuộc vào hàm này
DROP FUNCTION IF EXISTS public.is_admin() CASCADE; 
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.subscription_tier;

-- 2. Tạo Enum cho Role và Subscription
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.subscription_tier AS ENUM ('guest', 'free', 'pro', 'premium');

-- 3. Tạo bảng Profiles đầy đủ
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  role public.user_role NOT NULL DEFAULT 'user',
  subscription_tier public.subscription_tier NOT NULL DEFAULT 'free',
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tạo hàm kiểm tra Admin (SECURITY DEFINER giúp tránh đệ quy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Bật bảo mật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Policy: Người dùng đọc profile của chính mình
CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 7. Policy: Admin đọc được tất cả
CREATE POLICY "Admins can read all"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

-- 8. Policy: User chỉ cập nhật thông tin cá nhân và subscription tier của chính mình
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  -- Allow users to change subscription_tier but not role
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 9. Policy: Admin có toàn quyền sửa tất cả
CREATE POLICY "Admins can update all"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 10. Function xử lý tạo user và gán Admin tự động
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name, role, subscription_tier, avatar_url
  )
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    CASE WHEN new.email = 'admin@gmail.com' THEN 'admin'::public.user_role ELSE 'user'::public.user_role END,
    'free'::public.subscription_tier,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger kích hoạt
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();