-- 1. Xóa các đối tượng cũ để đảm bảo không xung đột
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS public.user_role;

-- 2. Tạo Type cho Role (Dùng ENUM cho dữ liệu nhất quán)
CREATE TYPE public.user_role AS ENUM ('guest', 'free', 'premium', 'admin');

-- 3. Tạo bảng Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  role public.user_role NOT NULL DEFAULT 'free'::public.user_role,
  subscription_tier text NOT NULL DEFAULT 'free',
  try_on_credits integer NOT NULL DEFAULT 5,
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Bật bảo mật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Người dùng chỉ được xem profile của chính mình
CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 6. Policy: Người dùng được phép cập nhật thông tin cá nhân của chính mình
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 7. Function tạo profile tự động khi đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    subscription_tier, 
    try_on_credits, 
    avatar_url
  )
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'free'::public.user_role, -- Ép kiểu về ENUM
    'free',
    5,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger kích hoạt khi có user mới
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();