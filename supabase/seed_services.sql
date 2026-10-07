-- Base service menu. Run once in the Supabase SQL editor AFTER schema.sql.
-- Safe to re-run: skips any name that already exists. Edit prices later in the admin panel.
-- NOT included on purpose: "with feet" services and festival prices (not confirmed current).
insert into public.services (name, description, price_from, is_addon, sort_order)
select v.name, v.description, v.price, v.addon, v.ord
from (values
  ('Gel Polish',              'Gel polish application.',                      199, false, 1),
  ('Gel Polish + Extension',  'Gel polish with nail extensions.',             299, false, 2),
  ('Soft Gel Extension',      'Soft gel nail extensions.',                    499, false, 3),
  ('Acrylic Extension',       'Acrylic nail extensions.',                     699, false, 4),
  ('Gel Polish Removal',      'Safe removal of gel polish.',                   99, false, 5),
  ('Extension Removal',       'Safe removal of nail extensions.',             149, false, 6),
  ('Cat Eye',                 'Cat eye effect, added to any service.',         50, true,  7),
  ('Nail Art',                'Nail art, added to any service.',               10, true,  8)
) as v(name, description, price, addon, ord)
where not exists (select 1 from public.services s where s.name = v.name);
