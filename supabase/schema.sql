create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(8, 2) not null check (price >= 0),
  flavor_color text not null default '#22d3ee',
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.delivery_points (
  id text primary key,
  name text not null unique,
  x_percent numeric(5, 2) not null check (x_percent between 0 and 100),
  y_percent numeric(5, 2) not null check (y_percent between 0 and 100),
  eta_minutes integer not null check (eta_minutes > 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  delivery_point_id text not null references public.delivery_points(id),
  delivery_address text not null default '',
  classroom text not null default '',
  preferred_time text,
  payment_method text check (payment_method in ('Yape', 'Plin', 'Efectivo')),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total numeric(8, 2) not null check (total >= 0),
  status text not null default 'pending' check (status = 'pending'),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.delivery_points enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select
  using (is_active = true);

drop policy if exists "Public can read delivery points" on public.delivery_points;
create policy "Public can read delivery points"
  on public.delivery_points for select
  using (true);

drop policy if exists "Public can create pending orders" on public.orders;
create policy "Public can create pending orders"
  on public.orders for insert
  with check (status = 'pending');

grant select on public.products, public.delivery_points to anon, authenticated;
grant insert on public.orders to anon, authenticated;

insert into public.products
  (id, name, slug, description, price, flavor_color, image_url, is_featured, sort_order)
values
  ('lucuma', 'Lúcuma Especial', 'lucuma-especial', 'La reina de la casa, hecha con lúcuma peruana.', 5.00, '#e8a24a', '/assets/ice-pops.jpg', true, 1),
  ('fresa', 'Fresa Rellena', 'fresa-rellena', 'Fresa cremosa con centro suave para antojarse.', 5.00, '#f472b6', '/assets/ice-pops.jpg', true, 2),
  ('mango', 'Mango Menta', 'mango-menta', 'Mango maduro con un toque fresco de menta.', 4.00, '#f6c854', '/assets/assorted-pops.webp', false, 3),
  ('maracuya', 'Maracuyá Citrus', 'maracuya-citrus', 'Maracuyá intenso para despertar el recreo.', 4.00, '#f5a444', '/assets/assorted-pops.webp', false, 4),
  ('coco', 'Coco Cremoso', 'coco-cremoso', 'Coco cremosito, frío y artesanal.', 4.00, '#c5e8e8', '/assets/ice-pop-pair.png', false, 5)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  price = excluded.price,
  flavor_color = excluded.flavor_color,
  image_url = excluded.image_url,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order;

insert into public.delivery_points (id, name, x_percent, y_percent, eta_minutes)
values
  ('fisi', 'FISI', 27, 29, 8),
  ('economia', 'Economía', 64, 24, 10),
  ('ciencias', 'Ciencias', 73, 52, 12),
  ('medicina', 'Medicina', 42, 45, 9),
  ('citfsn', 'CITFSN', 25, 69, 14),
  ('agraria', 'Agraria', 54, 76, 15),
  ('educacion', 'Educación', 82, 77, 11)
on conflict (id) do update set
  name = excluded.name,
  x_percent = excluded.x_percent,
  y_percent = excluded.y_percent,
  eta_minutes = excluded.eta_minutes;
