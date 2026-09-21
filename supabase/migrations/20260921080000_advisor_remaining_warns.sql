-- Remaining Advisor WARN cleanup for Outflint
-- 1) Merge overlapping permissive policies
-- 2) Revoke anon/authenticated EXECUTE on service-role-only SECURITY DEFINER RPCs

BEGIN;

-- ---------------------------------------------------------------------------
-- header_nav_menu_items: one SELECT (active OR admin)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS header_nav_menu_items_select_admin ON public.header_nav_menu_items;
DROP POLICY IF EXISTS header_nav_menu_items_select_public ON public.header_nav_menu_items;

CREATE POLICY header_nav_menu_items_select_public_or_admin
  ON public.header_nav_menu_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR is_active_admin());

-- ---------------------------------------------------------------------------
-- home_hero_slides: one SELECT (active OR admin)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS home_hero_slides_select_admin ON public.home_hero_slides;
DROP POLICY IF EXISTS home_hero_slides_select_storefront ON public.home_hero_slides;

CREATE POLICY home_hero_slides_select_public_or_admin
  ON public.home_hero_slides
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR is_active_admin());

-- ---------------------------------------------------------------------------
-- reviews INSERT: merge admin + own into one policy for authenticated
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS reviews_insert_admin ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;

CREATE POLICY reviews_insert_own_or_admin
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_active_admin()
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = reviews.user_id
        AND u.auth_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: revoke client execute where only service_role / internal
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  fn text;
  -- Called only via service role or other DEFINER functions — not from browser
  service_only text[] := ARRAY[
    'auth_email_registered_for_reset',
    'auth_user_id_by_email',
    'newsletter_subscribe_after_order',
    'newsletter_unsubscribe_by_token',
    'newsletter_resubscribe_by_token',
    'apply_voucher',
    '_voucher_quote'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname = ANY (service_only)
  LOOP
    fn := format('%I.%I(%s)', r.schema_name, r.func_name, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres, service_role', fn);
  END LOOP;
END $$;

-- Keep intentional storefront RPCs executable by anon/authenticated
-- (place_order, preview_voucher, newsletter_*_by_token, is_active_admin)
DO $$
DECLARE
  r record;
  fn text;
  storefront text[] := ARRAY[
    'place_order',
    'preview_voucher',
    'is_active_admin',
    'user_has_ordered_product'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname = ANY (storefront)
  LOOP
    fn := format('%I.%I(%s)', r.schema_name, r.func_name, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres, service_role, anon, authenticated', fn);
  END LOOP;
END $$;

COMMIT;
