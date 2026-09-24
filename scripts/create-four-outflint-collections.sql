-- Carve 4 shop categories from existing active stock (name-match + product_collections).
-- Safe to re-run: upserts collections by slug; join rows use ON CONFLICT DO NOTHING.

insert into public.collections (slug, name, description, hero_image, sort_order, collection_type)
values
  (
    'needles-and-bobbins',
    'Needles & Bobbins',
    'Bobbins, firki, needle cases, and threaders for home and industrial machines.',
    'https://qnlqcfwdebrscvqxxahe.supabase.co/storage/v1/object/public/e-commerce-store/products/media/03a8550c-480e-44a0-83c4-7d78721ef47d.jpeg',
    5,
    'manual'
  ),
  (
    'scissors-and-cutting-tools',
    'Scissors & Cutting Tools',
    'Tailor shears, snips, seam rippers, and fabric cutting tools for the bench.',
    'https://qnlqcfwdebrscvqxxahe.supabase.co/storage/v1/object/public/e-commerce-store/products/media/48bef954-9e58-421a-b537-009cc13a7d2e.jpeg',
    6,
    'manual'
  ),
  (
    'sewing-machine-parts',
    'Sewing Machine Parts',
    'Hooks, tension assemblies, plates, winders, belts, and industrial spare parts.',
    'https://qnlqcfwdebrscvqxxahe.supabase.co/storage/v1/object/public/e-commerce-store/products/media/b30e98b2-fe90-45e2-b917-d9db0e745ec0.webp',
    7,
    'manual'
  ),
  (
    'measuring-and-marking-tools',
    'Measuring & Marking Tools',
    'Rulers, gauges, marking pens, and seam guides for accurate cutting and stitch lines.',
    'https://qnlqcfwdebrscvqxxahe.supabase.co/storage/v1/object/public/e-commerce-store/products/media/48bef954-9e58-421a-b537-009cc13a7d2e.jpeg',
    8,
    'manual'
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  hero_image = excluded.hero_image,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Needles & Bobbins (exclude machine-part bobbin hooks / winders)
insert into public.product_collections (product_id, collection_id)
select p.id, c.id
from public.products p
cross join public.collections c
where c.slug = 'needles-and-bobbins'
  and p.status = 'active'
  and (
    (lower(p.name) ~ '\y(bobbins?|firki)\y' and lower(p.name) !~ '(winder|hook)')
    or (
      lower(p.name) ~ '\y(needle|needles)\y'
      and lower(p.name) !~ '(single needle|needle plate|presser foot)'
    )
    or lower(p.name) ~ '\ythreader\y'
  )
on conflict do nothing;

-- Scissors & Cutting Tools
insert into public.product_collections (product_id, collection_id)
select p.id, c.id
from public.products p
cross join public.collections c
where c.slug = 'scissors-and-cutting-tools'
  and p.status = 'active'
  and lower(p.name) ~ '(scissor|shear|snip|seam ripper|thread cutter|loop turner|side cutter|pinking)'
on conflict do nothing;

-- Sewing Machine Parts
insert into public.product_collections (product_id, collection_id)
select p.id, c.id
from public.products p
cross join public.collections c
where c.slug = 'sewing-machine-parts'
  and p.status = 'active'
  and (
    lower(p.name) ~ '(tension|handwheel|rotary hook|screw kit|needle plate|feed dog|feed dial|spool pin|thread guide|quick changer|clamp holder|foot lifter|bobbin winder|motor belt|spare parts kit|thread stand|spring presser foot clamp)'
    or lower(p.name) ~ 'turret for 3 presser'
  )
on conflict do nothing;

-- Measuring & Marking Tools (exclude presser-foot titles)
insert into public.product_collections (product_id, collection_id)
select p.id, c.id
from public.products p
cross join public.collections c
where c.slug = 'measuring-and-marking-tools'
  and p.status = 'active'
  and lower(p.name) ~ '(ruler|gauge|measuring tape|marking pen|seam guide|edge guide seam|positioning tool|curve scale|expanding sewing)'
  and lower(p.name) !~ 'presser foot'
on conflict do nothing;

-- Refresh hero images from first linked product when available
update public.collections c
set
  hero_image = coalesce(nullif(trim(p.images ->> 0), ''), c.hero_image),
  updated_at = now()
from (
  select distinct on (pc.collection_id)
    pc.collection_id,
    pr.images
  from public.product_collections pc
  join public.products pr on pr.id = pc.product_id
  where pr.status = 'active'
    and coalesce(nullif(trim(pr.images ->> 0), ''), '') <> ''
  order by pc.collection_id, pr.name
) p
where c.id = p.collection_id
  and c.slug in (
    'needles-and-bobbins',
    'scissors-and-cutting-tools',
    'sewing-machine-parts',
    'measuring-and-marking-tools'
  );

-- Verify counts
select c.slug, c.name, count(pc.product_id) as products
from public.collections c
left join public.product_collections pc on pc.collection_id = c.id
where c.slug in (
  'needles-and-bobbins',
  'scissors-and-cutting-tools',
  'sewing-machine-parts',
  'measuring-and-marking-tools',
  'stitching-accessories',
  'presser-foot-collection',
  'sewing-storage-and-organizer-cases',
  'deals'
)
group by c.slug, c.name, c.sort_order
order by c.sort_order, c.slug;
