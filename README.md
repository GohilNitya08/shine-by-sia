# Shine by Sia: nail studio website

React + Vite front end, Supabase for database, admin login and image storage.
Customers browse, shop press-ons and check out as guests (no accounts). Sia manages everything from `/admin`.

> **Content status:** the site ships with clearly-marked *sample* content and placeholder artwork.
> Nothing here is taken from Sia's Instagram. Replace the samples with her real photos, prices and wording (steps 5–6).

## 1. Create the Supabase project (free tier is fine)
1. Sign up at supabase.com → **New project**.
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**. (Safe to re-run.)
   This creates the tables, row-level security, the order/booking functions and the image bucket.

**Then run `supabase/seed_services.sql`** the same way. It adds the base service menu (Gel Polish ₹199 … Nail Art +₹10). Press-ons and custom orders stay “Price on request” until you set prices in `/admin`. Already have a database from an earlier version? Re-run `schema.sql` first (it upgrades safely).

## 2. Create Sia's admin login
1. **Authentication → Users → Add user** → email + strong password (tick *Auto-confirm*).
2. **Authentication → Providers → Email → turn OFF "Allow new users to sign up"** (so nobody can register themselves).
3. In the SQL Editor run (use her real email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'sia@example.com';
   ```
   Only accounts in this table can use the admin panel, even if someone else somehow had a login.

## 3. Connect the site
Copy `.env.example` to `.env` and fill in the two **public** values from *Project Settings → API*:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```
**Never** put the `service_role` / secret key anywhere in this project. The app refuses to start if it detects one.

## 4. Run locally
```
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run test:db    # security tests for the database rules
npm run build
```

## 5. Customise
* `src/config/site.js` is the single file for name, tagline, city, **WhatsApp number**, email, Instagram, currency, about text, checkout wording, hero/about images.
  Set `showPlaceholderBadge: false` once real content is in.
* `src/styles/theme.css` has the colours and fonts as variables at the top.
* In `/admin`: add products (photos, price, sizes, in stock/sold out), services, gallery photos, and handle orders and appointment requests.

## 6. Deploy (Vercel or Netlify)
1. Push this folder to a GitHub repo.
2. Import it in Vercel (or Netlify). Build command `npm run build`, output `dist`. (Config files for both are included.)
3. Add the two environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's settings, then deploy.
4. In Supabase: **Authentication → URL Configuration** → set *Site URL* to your live address.

## How security works
* Visitors can only **read** published products, active services and visible gallery photos.
* Orders and appointment requests can only be created through two server functions (`place_order`, `request_appointment`) that re-check everything, **recompute prices from the database** (a customer can't change what they pay), reject sold-out items and limit each phone number to 5 submissions per hour. Visitors can't read any order.
* Every admin action (edit, delete, upload) is allowed only for accounts listed in `public.admins`, enforced by the database, not just the UI.
* The image bucket is public to *view* but only admins can upload/delete (5 MB, JPG/PNG/WebP/AVIF). Photos are auto-resized in the browser.
* Forms have a hidden bot trap. Only the public anon key is ever in the browser.

## Notes
* Payments are **not** integrated: checkout records the order and Sia confirms payment/delivery on WhatsApp (edit the wording in `site.js`). Razorpay/UPI can be added later.
* Orders/requests don't send email automatically; check the dashboard (or add a Supabase Database Webhook later).
