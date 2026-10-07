import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'

const schema = fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8')
const db = new PGlite()

// ---- minimal Supabase stand-ins ----
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage, public to anon, authenticated;
`)
await db.exec(schema)
// idempotency: second run must not fail
await db.exec(schema)
await db.exec(`grant select, insert, update, delete on all tables in schema public, storage to anon, authenticated;
               grant usage, select on all sequences in schema public to anon, authenticated;`)

const admin = (await db.query(`insert into auth.users(email) values ('admin@x.com') returning id`)).rows[0].id
const rando = (await db.query(`insert into auth.users(email) values ('rando@x.com') returning id`)).rows[0].id
await db.exec(`insert into public.admins(user_id) values ('${admin}')`) // as postgres

let pass = 0, fail = 0
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${ok ? '' : extra}`) }

async function as(role, sub, fn) {
  await db.exec(`set role ${role}; select set_config('request.jwt.sub', '${sub || ''}', false);`)
  try { return await fn() } finally { await db.exec('reset role') }
}
const tryq = async (sql, params) => { try { const r = await db.query(sql, params); return { ok: true, r } } catch (e) { return { ok: false, e: e.message } } }

// seed as admin
let seed
await as('authenticated', admin, async () => {
  seed = await tryq(`insert into products(slug,name,price,size_options) values
    ('rose-set','Rose set',500,'{S,M,L}'),('sold-set','Sold set',300,'{}') returning id,slug`)
  check('admin can insert products', seed.ok, seed.e)
  const u = await tryq(`update products set is_available=false where slug='sold-set'`)
  check('admin can update products', u.ok, u.e)
  await tryq(`insert into products(slug,name,price,is_published) values ('hidden','Hidden',1,false)`)
  await tryq(`insert into services(name) values ('Gel'),('Inactive')`)
  await tryq(`update services set is_active=false where name='Inactive'`)
  await tryq(`insert into gallery_items(image_url,is_visible) values ('a.jpg',true),('b.jpg',false)`)
  const o = await tryq(`insert into storage.objects(bucket_id,name) values ('media','a.png')`)
  check('admin can upload to media bucket', o.ok, o.e)
})
const rose = seed.r.rows.find(r => r.slug === 'rose-set').id
const sold = seed.r.rows.find(r => r.slug === 'sold-set').id

// ---- anon (public visitor) ----
await as('anon', '', async () => {
  const p = await tryq(`select slug from products`)
  check('anon sees only published products', p.ok && p.r.rows.length === 2 && !p.r.rows.some(x => x.slug === 'hidden'), JSON.stringify(p.r?.rows))
  const s = await tryq(`select name from services`)
  check('anon sees only active services', s.ok && s.r.rows.length === 1, JSON.stringify(s.r?.rows))
  const g = await tryq(`select * from gallery_items`)
  check('anon sees only visible gallery', g.ok && g.r.rows.length === 1)
  check('anon cannot read orders', (await tryq(`select * from orders`)).r.rows.length === 0)
  check('anon cannot read appointments', (await tryq(`select * from appointment_requests`)).r.rows.length === 0)
  check('anon cannot read admins', (await tryq(`select * from admins`)).r.rows.length === 0)
  check('anon cannot insert product', !(await tryq(`insert into products(slug,name,price) values ('x','x',1)`)).ok)
  check('anon cannot insert order directly', !(await tryq(`insert into orders(customer_name,phone,address_line,city,pincode,items,subtotal) values ('a','1','a','c','1','[]',0)`)).ok)
  check('anon cannot self-promote to admin', !(await tryq(`insert into admins(user_id) values ('${rando}')`)).ok)
  const upd = await tryq(`update products set price=1 returning id`)
  check('anon cannot update prices', upd.ok && upd.r.rows.length === 0 || !upd.ok)
  const del = await tryq(`delete from products returning id`)
  check('anon cannot delete products', del.ok && del.r.rows.length === 0 || !del.ok)
  check('anon cannot upload to storage', !(await tryq(`insert into storage.objects(bucket_id,name) values ('media','evil.png')`)).ok)
  check('anon cannot list storage', (await tryq(`select * from storage.objects`)).r.rows.length === 0)

  const cust = { name: 'Test Customer', phone: '+91 98765 43210', address_line: '12 Rose Lane', city: 'Vadodara', pincode: '390001' }
  // price tampering: client sends a price - server must ignore it
  const t = await tryq(`select place_order($1::jsonb,$2::jsonb) as r`, [JSON.stringify(cust),
    JSON.stringify([{ product_id: rose, qty: 2, size: 'M', unit_price: 1, price: 1, line_total: 1 }])])
  check('valid order accepted', t.ok, t.e)
  check('server recomputes price (2 x 500 = 1000, not tampered 1)', t.ok && Number(t.r.rows[0].r.total) === 1000, JSON.stringify(t.r?.rows))
  const bad = [
    ['sold-out item rejected', cust, [{ product_id: sold, qty: 1 }]],
    ['missing size rejected', cust, [{ product_id: rose, qty: 1 }]],
    ['invalid size rejected', cust, [{ product_id: rose, qty: 1, size: 'XXL' }]],
    ['qty 0 rejected', cust, [{ product_id: rose, qty: 0, size: 'S' }]],
    ['qty 999 rejected', cust, [{ product_id: rose, qty: 999, size: 'S' }]],
    ['negative qty rejected', cust, [{ product_id: rose, qty: -3, size: 'S' }]],
    ['unknown product rejected', cust, [{ product_id: '00000000-0000-0000-0000-000000000000', qty: 1 }]],
    ['garbage product id rejected', cust, [{ product_id: 'nope', qty: 1 }]],
    ['empty cart rejected', cust, []],
    ['non-array cart rejected', cust, { a: 1 }],
    ['bad phone rejected', { ...cust, phone: 'abc' }, [{ product_id: rose, qty: 1, size: 'S' }]],
    ['short name rejected', { ...cust, name: 'A' }, [{ product_id: rose, qty: 1, size: 'S' }]],
    ['bad email rejected', { ...cust, email: 'nope' }, [{ product_id: rose, qty: 1, size: 'S' }]],
  ]
  for (const [name, c, items] of bad) {
    const r = await tryq(`select place_order($1::jsonb,$2::jsonb)`, [JSON.stringify(c), JSON.stringify(items)])
    check(name, !r.ok, 'was accepted!')
  }
  // rate limit: 1 order placed above; 4 more allowed, 6th blocked
  let blocked = false
  for (let i = 0; i < 6; i++) {
    const r = await tryq(`select place_order($1::jsonb,$2::jsonb)`, [JSON.stringify(cust), JSON.stringify([{ product_id: rose, qty: 1, size: 'S' }])])
    if (!r.ok && /Too many/.test(r.e)) blocked = true
  }
  check('rate limit blocks flood of orders from one phone', blocked)

  const a = await tryq(`select request_appointment($1::jsonb) as r`, [JSON.stringify({ name: 'Anu', phone: '9999999999', preferred_date: '2999-01-01', message: 'hi' })])
  check('appointment request accepted', a.ok, a.e)
  check('past date rejected', !(await tryq(`select request_appointment($1::jsonb)`, [JSON.stringify({ name: 'Anu', phone: '9999999999', preferred_date: '2000-01-01' })])).ok)
  check('bad appointment date rejected', !(await tryq(`select request_appointment($1::jsonb)`, [JSON.stringify({ name: 'Anu', phone: '9999999999', preferred_date: 'soon' })])).ok)
  check('appointment bad phone rejected', !(await tryq(`select request_appointment($1::jsonb)`, [JSON.stringify({ name: 'Anu', phone: 'x' })])).ok)
})

// ---- logged-in but NOT admin ----
await as('authenticated', rando, async () => {
  check('non-admin cannot read orders', (await tryq(`select * from orders`)).r.rows.length === 0)
  check('non-admin cannot see unpublished product', (await tryq(`select * from products where slug='hidden'`)).r.rows.length === 0)
  check('non-admin cannot insert product', !(await tryq(`insert into products(slug,name,price) values ('y','y',1)`)).ok)
  const u = await tryq(`update orders set status='paid' returning id`)
  check('non-admin cannot update orders', u.ok && u.r.rows.length === 0 || !u.ok)
  check('non-admin cannot upload to storage', !(await tryq(`insert into storage.objects(bucket_id,name) values ('media','evil.png')`)).ok)
  check('non-admin cannot self-promote', !(await tryq(`insert into admins(user_id) values ('${rando}')`)).ok)
})

// ---- admin ----
await as('authenticated', admin, async () => {
  const o = await tryq(`select * from orders`)
  check('admin can read orders', o.ok && o.r.rows.length >= 1)
  check('order stored server-side price', o.r.rows.some(x => Number(x.subtotal) === 1000))
  const u = await tryq(`update orders set status='confirmed' where order_no=(select min(order_no) from orders) returning status`)
  check('admin can update order status', u.ok && u.r.rows[0]?.status === 'confirmed', JSON.stringify(u.r?.rows) + (u.e||'') + JSON.stringify((await tryq('select order_no,status from orders')).r?.rows))
  check('admin rejects invalid status', !(await tryq(`update orders set status='hacked'`)).ok)
  check('admin can read appointments', (await tryq(`select * from appointment_requests`)).r.rows.length >= 1)
  check('admin sees unpublished product', (await tryq(`select * from products where slug='hidden'`)).r.rows.length === 1)
  check('admin sees inactive services', (await tryq(`select * from services`)).r.rows.length === 2)
  check('admin can delete product', (await tryq(`delete from products where slug='hidden' returning id`)).r.rows.length === 1)
  check('admin can delete from storage', (await tryq(`delete from storage.objects where name='a.png' returning id`)).r.rows.length === 1)
  check('admin cannot add other admins (no policy)', !(await tryq(`insert into admins(user_id) values ('${rando}')`)).ok)
  check('product constraint: bad slug rejected', !(await tryq(`insert into products(slug,name,price) values ('Bad Slug','z',1)`)).ok)
  check('product constraint: negative price rejected', !(await tryq(`insert into products(slug,name,price) values ('neg','z',-5)`)).ok)
})

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
