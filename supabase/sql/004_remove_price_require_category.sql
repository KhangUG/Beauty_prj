-- 1. Bắt buộc category_id (NOT NULL) - các sản phẩm cũ sẽ phải có category_id hợp lệ trước
alter table public.products
  alter column category_id set not null;

-- 2. Xóa price column nếu tồn tại
alter table public.products
  drop column if exists price;
