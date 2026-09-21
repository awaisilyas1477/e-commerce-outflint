-- Outflint advisor cleanup — safe batch (no policy drops)
BEGIN;

-- 1) Critical: security definer views → invoker
ALTER VIEW IF EXISTS public.profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.voucher_batch_stats SET (security_invoker = true);

-- 2) Homepage featured / why-shop (null was blanking callout)
UPDATE public.home_page_settings
SET
  featured_block = jsonb_build_object(
    'eyebrow', 'Shop by category',
    'title', 'Tailoring essentials, sorted',
    'description', 'Browse presser feet, needles, sewing storage and machine accessories for Singer, Brother, Juki and industrial machines across Pakistan.',
    'imageUrl', '',
    'primaryLabel', 'Shop accessories',
    'primaryHref', '/collections/stitching-accessories',
    'secondaryLabel', 'All collections',
    'secondaryHref', '/collections'
  ),
  why_shop_block = null,
  updated_at = now()
WHERE id = 1;

-- 3) Mutable search_path on flagged functions
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'normalize_voucher_instance_code',
        'normalize_voucher_batch_shared_code',
        'map_identity_provider_to_enum',
        'touch_user_saved_addresses_updated_at',
        'touch_newsletter_subscriptions_updated_at',
        'seo_meta_for_subject',
        'seo_meta_for_route',
        'seo_social_profiles_normalize_url'
      ])
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      r.schema_name, r.func_name, r.args
    );
  END LOOP;
END $$;

-- 4) SECURITY DEFINER: revoke PUBLIC execute; grant only needed roles
DO $$
DECLARE
  r record;
  fn text;
  storefront text[] := ARRAY[
    'place_order',
    'preview_voucher',
    'apply_voucher',
    '_voucher_quote',
    'newsletter_subscribe_after_order',
    'newsletter_unsubscribe_by_token',
    'newsletter_resubscribe_by_token',
    'auth_email_registered_for_reset',
    'auth_user_id_by_email',
    'user_has_ordered_product',
    'is_active_admin'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    fn := format('%I.%I(%s)', r.schema_name, r.func_name, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres, service_role', fn);
    IF r.func_name = ANY (storefront) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', fn);
    ELSE
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', fn);
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Verify
SELECT 'profiles' AS view_name, reloptions
FROM pg_class WHERE relname = 'profiles' AND relkind = 'v'
UNION ALL
SELECT 'voucher_batch_stats', reloptions
FROM pg_class WHERE relname = 'voucher_batch_stats' AND relkind = 'v';

SELECT featured_block->>'title' AS featured_title,
       why_shop_block->>'title' AS why_title
FROM home_page_settings WHERE id = 1;
