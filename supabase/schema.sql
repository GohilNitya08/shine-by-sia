-- =====================================================================
-- Shine by Sia - Supabase schema, RLS and storage
-- Run once in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
-- =====================================================================

-- ---------- helpers ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- admins -------------------------------------------------
-- Only people listed here can manage the shop. Rows are added manually
-- in the SQL editor (see README), never from the website.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins can read own row" on public.admins;
create policy "admins can read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());
-- (no insert/update/delete policy on purpose: nobody can self-promote)

-- ---------- products (press-on shop) --------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name text not null check (length(name) between 1 and 120),
  description text not null default '' check (length(description) <= 4000),
  price numeric(10,2) check (price is null or price >= 0), -- null => "price on request"
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  images text[] not null default '{}',
  size_options text[] not null default '{}',
  category text not null default 'Press-ons' check (length(category) <= 60),
  is_available boolean not null default true,   -- false => shows "Sold out"
  is_published boolean not null default true,   -- false => hidden from the site
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists products_updated on public.products;
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();
alter table public.products enable row level security;

drop policy if exists "public reads published products" on public.products;
create policy "public reads published products" on public.products
  for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "admin inserts products" on public.products;
create policy "admin inserts products" on public.products
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin updates products" on public.products;
create policy "admin updates products" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes products" on public.products;
create policy "admin deletes products" on public.products
  for delete to authenticated using (public.is_admin());

-- ---------- services ------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  description text not null default '' check (length(description) <= 2000),
  price_from numeric(10,2) check (price_from is null or price_from >= 0), -- null => "price on request"
  duration_minutes int check (duration_minutes is null or duration_minutes between 5 and 600),
  image_url text,
  is_addon boolean not null default false, -- true => shown as "+ ₹x" extra, not bookable on its own
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- upgrade path for databases created before these two changes (safe to re-run)
alter table public.services add column if not exists is_addon boolean not null default false;
alter table public.products alter column price drop not null;

drop trigger if exists services_updated on public.services;
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();
alter table public.services enable row level security;

drop policy if exists "public reads active services" on public.services;
create policy "public reads active services" on public.services
  for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "admin inserts services" on public.services;
create policy "admin inserts services" on public.services
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin updates services" on public.services;
create policy "admin updates services" on public.services
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes services" on public.services;
create policy "admin deletes services" on public.services
  for delete to authenticated using (public.is_admin());

-- ---------- gallery -------------------------------------------------
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '' check (length(caption) <= 200),
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.gallery_items enable row level security;

drop policy if exists "public reads visible gallery" on public.gallery_items;
create policy "public reads visible gallery" on public.gallery_items
  for select to anon, authenticated using (is_visible or public.is_admin());
drop policy if exists "admin inserts gallery" on public.gallery_items;
create policy "admin inserts gallery" on public.gallery_items
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin updates gallery" on public.gallery_items;
create policy "admin updates gallery" on public.gallery_items
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes gallery" on public.gallery_items;
create policy "admin deletes gallery" on public.gallery_items
  for delete to authenticated using (public.is_admin());

-- ---------- orders (guest checkout, no customer accounts) ------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  customer_name text not null,
  phone text not null,
  email text,
  address_line text not null,
  city text not null,
  state text,
  pincode text not null,
  notes text,
  items jsonb not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  status text not null default 'new'
    check (status in ('new','confirmed','paid','shipped','delivered','cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (phone, created_at desc);
drop trigger if exists orders_updated on public.orders;
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
alter table public.orders enable row level security;

-- Visitors have NO direct access. They can only call place_order() below.
drop policy if exists "admin reads orders" on public.orders;
create policy "admin reads orders" on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists "admin updates orders" on public.orders;
create policy "admin updates orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes orders" on public.orders;
create policy "admin deletes orders" on public.orders
  for delete to authenticated using (public.is_admin());

-- ---------- appointment requests ------------------------------------
create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  request_no bigint generated always as identity,
  name text not null,
  phone text not null,
  email text,
  service_id uuid references public.services(id) on delete set null,
  service_name text,
  preferred_date date,
  preferred_time text,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','confirmed','completed','cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appt_created_idx on public.appointment_requests (created_at desc);
create index if not exists appt_phone_idx on public.appointment_requests (phone, created_at desc);
drop trigger if exists appt_updated on public.appointment_requests;
create trigger appt_updated before update on public.appointment_requests
  for each row execute function public.set_updated_at();
alter table public.appointment_requests enable row level security;

drop policy if exists "admin reads appointments" on public.appointment_requests;
create policy "admin reads appointments" on public.appointment_requests
  for select to authenticated using (public.is_admin());
drop policy if exists "admin updates appointments" on public.appointment_requests;
create policy "admin updates appointments" on public.appointment_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes appointments" on public.appointment_requests;
create policy "admin deletes appointments" on public.appointment_requests
  for delete to authenticated using (public.is_admin());

-- ---------- public RPCs (the ONLY way visitors write data) -----------
-- place_order: prices are re-read from the products table on the server,
-- so a visitor can never change what they pay by editing the request.
create or replace function public.place_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(coalesce(p_customer->>'name', ''));
  v_phone text := btrim(coalesce(p_customer->>'phone', ''));
  v_email text := nullif(btrim(coalesce(p_customer->>'email', '')), '');
  v_addr text := btrim(coalesce(p_customer->>'address_line', ''));
  v_city text := btrim(coalesce(p_customer->>'city', ''));
  v_state text := nullif(btrim(coalesce(p_customer->>'state', '')), '');
  v_pin text := btrim(coalesce(p_customer->>'pincode', ''));
  v_notes text := nullif(btrim(coalesce(p_customer->>'notes', '')), '');
  v_item jsonb;
  v_prod public.products%rowtype;
  v_qty int;
  v_size text;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal numeric(10,2) := 0;
  v_count int;
  v_order public.orders%rowtype;
begin
  if length(v_name) not between 2 and 100 then raise exception 'Please enter your name.'; end if;
  if v_phone !~ '^[0-9+() -]{7,20}$' then raise exception 'Please enter a valid phone number.'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email.'; end if;
  if length(v_addr) not between 5 and 300 then raise exception 'Please enter your address.'; end if;
  if length(v_city) not between 2 and 80 then raise exception 'Please enter your city.'; end if;
  if v_pin !~ '^[0-9A-Za-z -]{4,10}$' then raise exception 'Please enter a valid pincode.'; end if;
  if v_notes is not null and length(v_notes) > 1000 then raise exception 'Notes are too long.'; end if;
  if v_state is not null and length(v_state) > 80 then raise exception 'State is too long.'; end if;

  if jsonb_typeof(p_items) <> 'array' then raise exception 'Your cart is empty.'; end if;
  v_count := jsonb_array_length(p_items);
  if v_count < 1 or v_count > 30 then raise exception 'Your cart must have between 1 and 30 items.'; end if;

  -- simple abuse guard: max 5 orders per phone per hour
  if (select count(*) from public.orders
        where phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many orders from this number. Please try again later.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_qty := (v_item->>'qty')::int;
      select * into v_prod from public.products
        where id = (v_item->>'product_id')::uuid and is_published;
    exception when others then
      raise exception 'Invalid cart item.';
    end;
    if not found then raise exception 'An item in your cart is no longer available.'; end if;
    if not v_prod.is_available then raise exception '% is sold out.', v_prod.name; end if;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'Invalid quantity for %.', v_prod.name; end if;

    if v_prod.price is null then raise exception '% is price on request. Please message Sia on WhatsApp.', v_prod.name; end if;

    v_size := nullif(btrim(coalesce(v_item->>'size', '')), '');
    if cardinality(v_prod.size_options) > 0 then
      if v_size is null or not (v_size = any (v_prod.size_options)) then
        raise exception 'Please choose a valid size for %.', v_prod.name;
      end if;
    else
      v_size := null;
    end if;

    v_subtotal := v_subtotal + v_prod.price * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_prod.id, 'name', v_prod.name, 'size', v_size,
      'qty', v_qty, 'unit_price', v_prod.price, 'line_total', v_prod.price * v_qty));
  end loop;

  insert into public.orders (customer_name, phone, email, address_line, city, state, pincode, notes, items, subtotal)
  values (v_name, v_phone, v_email, v_addr, v_city, v_state, v_pin, v_notes, v_lines, v_subtotal)
  returning * into v_order;

  return jsonb_build_object('order_no', v_order.order_no, 'total', v_order.subtotal, 'items', v_lines);
end $$;
revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

create or replace function public.request_appointment(p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(coalesce(p->>'name', ''));
  v_phone text := btrim(coalesce(p->>'phone', ''));
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_time text := nullif(btrim(coalesce(p->>'preferred_time', '')), '');
  v_msg text := nullif(btrim(coalesce(p->>'message', '')), '');
  v_date date;
  v_service_id uuid;
  v_service_name text;
  v_row public.appointment_requests%rowtype;
begin
  if length(v_name) not between 2 and 100 then raise exception 'Please enter your name.'; end if;
  if v_phone !~ '^[0-9+() -]{7,20}$' then raise exception 'Please enter a valid phone number.'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email.'; end if;
  if v_time is not null and length(v_time) > 40 then raise exception 'Preferred time is too long.'; end if;
  if v_msg is not null and length(v_msg) > 1500 then raise exception 'Message is too long.'; end if;

  begin
    v_date := nullif(p->>'preferred_date', '')::date;
  exception when others then
    raise exception 'Please enter a valid date.';
  end;
  if v_date is not null and v_date < current_date then raise exception 'Please choose a future date.'; end if;

  begin
    v_service_id := nullif(p->>'service_id', '')::uuid;
  exception when others then
    v_service_id := null;
  end;
  if v_service_id is not null then
    select name into v_service_name from public.services where id = v_service_id and is_active;
    if v_service_name is null then v_service_id := null; end if;
  end if;

  if (select count(*) from public.appointment_requests
        where phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many requests from this number. Please try again later.';
  end if;

  insert into public.appointment_requests (name, phone, email, service_id, service_name, preferred_date, preferred_time, message)
  values (v_name, v_phone, v_email, v_service_id, v_service_name, v_date, v_time, v_msg)
  returning * into v_row;

  return jsonb_build_object('request_no', v_row.request_no);
end $$;
revoke all on function public.request_appointment(jsonb) from public;
grant execute on function public.request_appointment(jsonb) to anon, authenticated;

-- ---------- storage: public image bucket, admin-only writes ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

-- Public buckets serve files by URL without any policy; we deliberately add
-- NO public select policy, so nobody can list the bucket. Only admins write.
drop policy if exists "admin uploads media" on storage.objects;
create policy "admin uploads media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin updates media" on storage.objects;
create policy "admin updates media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin deletes media" on storage.objects;
create policy "admin deletes media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin lists media" on storage.objects;
create policy "admin lists media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());
