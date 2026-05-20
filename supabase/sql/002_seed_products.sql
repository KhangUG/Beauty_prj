insert into public.products (id, name, description, image_url, external_url, tags)
values
  (
    '10f3f31d-f25f-4f8e-b57f-26e57f26f151',
    'Aether Glow Cleanser',
    'Low-foam cleanser that removes sunscreen and excess oil without stripping the skin barrier.',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80',
    'https://example.com/products/aether-glow-cleanser',
    array['cleanser', 'sensitive', 'barrier']::text[]
  ),
  (
    'ac95f484-df9d-4143-bff5-c41c432f6ad6',
    'LumiPeptide Hydration Serum',
    'Peptide and hyaluronic blend that deeply hydrates and smooths fine dehydration lines.',
    'https://images.unsplash.com/photo-1556229162-5c63ed9c4efb?auto=format&fit=crop&w=900&q=80',
    'https://example.com/products/lumipeptide-hydration-serum',
    array['serum', 'hydration', 'peptide']::text[]
  ),
  (
    '924ae79d-a654-4b95-b4d5-c0d4fb0f8ac4',
    'Nocturne Retinal Cream',
    'Evening cream with gentle retinal and ceramides to support texture renewal overnight.',
    'https://images.unsplash.com/photo-1556228578-dd6f2f9d79fd?auto=format&fit=crop&w=900&q=80',
    'https://example.com/products/nocturne-retinal-cream',
    array['night', 'retinal', 'texture']::text[]
  ),
  (
    '16947b68-a331-4c16-bf87-e4a58ff53e19',
    'Solar Veil SPF 50 Fluid',
    'Lightweight broad-spectrum sunscreen with no white cast for daily UV defense.',
    'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=900&q=80',
    'https://example.com/products/solar-veil-spf-50-fluid',
    array['spf', 'daytime', 'protection']::text[]
  ),
  (
    '6ffcd5ce-044d-4554-98f0-fda8b2f13806',
    'Velvet Calm Repair Mask',
    'Soothing overnight mask with centella and panthenol for redness-prone skin.',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80',
    'https://example.com/products/velvet-calm-repair-mask',
    array['mask', 'calming', 'recovery']::text[]
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  external_url = excluded.external_url,
  tags = excluded.tags;
