alter table public.orders
  add column if not exists delivery_address text not null default '';

alter table public.orders
  alter column preferred_time drop not null,
  alter column payment_method drop not null;
