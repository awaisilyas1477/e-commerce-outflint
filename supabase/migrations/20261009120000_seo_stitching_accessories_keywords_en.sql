-- Apply usable stitching/sewing accessories keyword cluster to money collections.
-- Primary: stitching accessories / sewing accessories (Pakistan + online buy intent).
-- Split organizer/box/kit phrases onto sewing-storage to avoid cannibalization.

with targets as (
  select *
  from (
    values
      (
        'stitching-accessories'::text,
        'Stitching Accessories in Pakistan | Sewing Tools & Parts - Outflint'::text,
        'Buy stitching accessories and sewing accessories online in Pakistan — needles, snips, machine parts, and kits. Fast COD from Outflint.'::text,
        array[
          'stitching accessories pakistan',
          'sewing accessories pakistan',
          'sewing accessories online',
          'stitching accessories online',
          'sewing accessories kit',
          'sewing machine accessories',
          'tailoring tools pakistan'
        ]::text[]
      ),
      (
        'sewing-storage-and-organizer-cases',
        'Sewing Accessories Organizer & Storage Cases in Pakistan | Outflint',
        'Shop sewing accessories organizers, stitching accessories boxes, needle cases, and bobbin storage in Pakistan with quick COD delivery.',
        array[
          'sewing accessories organizer',
          'sewing accessories box',
          'stitching accessories box',
          'sewing storage case pakistan',
          'needle case',
          'bobbin organizer',
          'tailoring storage'
        ]::text[]
      )
  ) as t(slug, title_new, description_new, keywords_new)
)
update public.seo_meta sm
set
  title = targets.title_new,
  description = left(targets.description_new, 160),
  keywords = targets.keywords_new,
  updated_at = now()
from targets
join public.collections c on c.slug = targets.slug
where sm.subject_type = 'collection'
  and sm.subject_id = c.id
  and sm.locale = 'en';

insert into public.seo_meta (
  subject_type,
  subject_id,
  subject_key,
  locale,
  title,
  description,
  keywords,
  canonical_url,
  og_image_url,
  og_image_alt,
  og_image_width,
  og_image_height,
  twitter_card,
  noindex,
  nofollow,
  json_ld_overrides
)
select
  'collection'::text,
  c.id,
  null::text,
  'en'::text,
  t.title_new,
  left(t.description_new, 160),
  t.keywords_new,
  '',
  '',
  '',
  null,
  null,
  'summary_large_image'::text,
  false,
  false,
  '{}'::jsonb
from (
  values
    (
      'stitching-accessories'::text,
      'Stitching Accessories in Pakistan | Sewing Tools & Parts - Outflint'::text,
      'Buy stitching accessories and sewing accessories online in Pakistan — needles, snips, machine parts, and kits. Fast COD from Outflint.'::text,
      array[
        'stitching accessories pakistan',
        'sewing accessories pakistan',
        'sewing accessories online',
        'stitching accessories online',
        'sewing accessories kit',
        'sewing machine accessories',
        'tailoring tools pakistan'
      ]::text[]
    ),
    (
      'sewing-storage-and-organizer-cases',
      'Sewing Accessories Organizer & Storage Cases in Pakistan | Outflint',
      'Shop sewing accessories organizers, stitching accessories boxes, needle cases, and bobbin storage in Pakistan with quick COD delivery.',
      array[
        'sewing accessories organizer',
        'sewing accessories box',
        'stitching accessories box',
        'sewing storage case pakistan',
        'needle case',
        'bobbin organizer',
        'tailoring storage'
      ]::text[]
    )
) as t(slug, title_new, description_new, keywords_new)
join public.collections c on c.slug = t.slug
where not exists (
  select 1
  from public.seo_meta sm
  where sm.subject_type = 'collection'
    and sm.subject_id = c.id
    and sm.locale = 'en'
);
