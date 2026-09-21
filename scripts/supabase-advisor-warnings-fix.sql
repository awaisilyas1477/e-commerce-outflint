-- Outflint Advisor WARN cleanup (Auth RLS InitPlan, multiple permissive, bucket listing)
-- Safe: preserves policy intent; wraps auth.uid(); merges known overlapping SELECTs.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Auth RLS Initialization Plan: auth.uid() -> (select auth.uid())
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  using_expr text;
  check_expr text;
  new_using text;
  new_check text;
  role_list text;
  cmd text;
  sql text;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      p.polname AS policy_name,
      p.polcmd,
      p.polpermissive,
      pg_get_expr(p.polqual, p.polrelid) AS using_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr,
      COALESCE((
        SELECT string_agg(quote_ident(pr.rolname), ', ' ORDER BY pr.rolname)
        FROM pg_roles pr
        WHERE pr.oid = ANY (p.polroles)
      ), 'public') AS roles
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname IN ('public', 'storage')
      AND (
        COALESCE(pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%auth.uid()%'
        OR COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%auth.uid()%'
        OR COALESCE(pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%current_setting(%'
        OR COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%current_setting(%'
      )
  LOOP
    using_expr := COALESCE(r.using_expr, '');
    check_expr := COALESCE(r.check_expr, '');

    -- Avoid double-wrapping already fixed expressions
    new_using := replace(using_expr, '(select auth.uid())', '__UID__');
    new_using := replace(new_using, 'auth.uid()', '(select auth.uid())');
    new_using := replace(new_using, '__UID__', '(select auth.uid())');

    new_check := replace(check_expr, '(select auth.uid())', '__UID__');
    new_check := replace(new_check, 'auth.uid()', '(select auth.uid())');
    new_check := replace(new_check, '__UID__', '(select auth.uid())');

    IF new_using IS DISTINCT FROM using_expr AND using_expr <> '' THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        r.policy_name, r.schema_name, r.table_name, new_using
      );
    END IF;

    IF new_check IS DISTINCT FROM check_expr AND check_expr <> '' THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        r.policy_name, r.schema_name, r.table_name, new_check
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Multiple permissive SELECTs on products / variants:
--    fold order-history policies into the main public_or_admin policy
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  main_using text;
  order_using text;
BEGIN
  SELECT pg_get_expr(p.polqual, p.polrelid) INTO main_using
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'products'
    AND p.polname = 'products_select_public_or_admin';

  SELECT pg_get_expr(p.polqual, p.polrelid) INTO order_using
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'products'
    AND p.polname = 'products_select_if_in_customer_order';

  IF main_using IS NOT NULL AND order_using IS NOT NULL THEN
    order_using := replace(order_using, '(select auth.uid())', '__UID__');
    order_using := replace(order_using, 'auth.uid()', '(select auth.uid())');
    order_using := replace(order_using, '__UID__', '(select auth.uid())');
    main_using := replace(main_using, '(select auth.uid())', '__UID__');
    main_using := replace(main_using, 'auth.uid()', '(select auth.uid())');
    main_using := replace(main_using, '__UID__', '(select auth.uid())');

    EXECUTE format(
      'ALTER POLICY products_select_public_or_admin ON public.products USING ((%s) OR (%s))',
      main_using, order_using
    );
    DROP POLICY IF EXISTS products_select_if_in_customer_order ON public.products;
  END IF;

  SELECT pg_get_expr(p.polqual, p.polrelid) INTO main_using
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'product_variants'
    AND p.polname = 'product_variants_select_public_or_admin';

  SELECT pg_get_expr(p.polqual, p.polrelid) INTO order_using
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'product_variants'
    AND p.polname = 'product_variants_select_if_in_customer_order';

  IF main_using IS NOT NULL AND order_using IS NOT NULL THEN
    order_using := replace(order_using, '(select auth.uid())', '__UID__');
    order_using := replace(order_using, 'auth.uid()', '(select auth.uid())');
    order_using := replace(order_using, '__UID__', '(select auth.uid())');
    main_using := replace(main_using, '(select auth.uid())', '__UID__');
    main_using := replace(main_using, 'auth.uid()', '(select auth.uid())');
    main_using := replace(main_using, '__UID__', '(select auth.uid())');

    EXECUTE format(
      'ALTER POLICY product_variants_select_public_or_admin ON public.product_variants USING ((%s) OR (%s))',
      main_using, order_using
    );
    DROP POLICY IF EXISTS product_variants_select_if_in_customer_order ON public.product_variants;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Multiple permissive: merge users_select_own + users_select_admin into one
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  own_using text;
  admin_using text;
BEGIN
  SELECT pg_get_expr(p.polqual, p.polrelid) INTO own_using
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'users' AND p.polname = 'users_select_own';

  SELECT pg_get_expr(p.polqual, p.polrelid) INTO admin_using
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'users' AND p.polname = 'users_select_admin';

  IF own_using IS NOT NULL AND admin_using IS NOT NULL THEN
    own_using := replace(replace(replace(own_using, '(select auth.uid())', '__UID__'), 'auth.uid()', '(select auth.uid())'), '__UID__', '(select auth.uid())');
    admin_using := replace(replace(replace(admin_using, '(select auth.uid())', '__UID__'), 'auth.uid()', '(select auth.uid())'), '__UID__', '(select auth.uid())');
    DROP POLICY IF EXISTS users_select_own ON public.users;
    DROP POLICY IF EXISTS users_select_admin ON public.users;
    EXECUTE format(
      'CREATE POLICY users_select_own_or_admin ON public.users FOR SELECT TO authenticated USING ((%s) OR (%s))',
      own_using, admin_using
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Storage: keep public object URLs, remove broad SELECT that enables listing
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ecommerce_store_select_public ON storage.objects;
-- Public bucket URLs (/object/public/...) still work without a SELECT policy.
-- Admin uploads keep insert/update/delete policies.

-- ---------------------------------------------------------------------------
-- 5) Re-assert SECURITY DEFINER execute grants (storefront must keep anon/auth)
--    Revoke PUBLIC; grant explicitly â€” clears true PUBLIC grants if any remain.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6) Multiple permissive: admin FOR ALL policies that overlap SELECT policies
--    Recreate as INSERT/UPDATE/DELETE only (keep existing SELECT policies).
-- ---------------------------------------------------------------------------
 Multiple permissive: admin FOR ALL policies that overlap SELECT policies
--    Recreate as INSERT/UPDATE/DELETE only (keep existing SELECT policies).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  using_expr text;
  check_expr text;
  roles text;
  exists_select boolean;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      p.polname AS policy_name,
      pg_get_expr(p.polqual, p.polrelid) AS using_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr,
      COALESCE((
        SELECT string_agg(quote_ident(pr.rolname), ', ' ORDER BY pr.rolname)
        FROM pg_roles pr WHERE pr.oid = ANY (p.polroles)
      ), 'public') AS roles
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND p.polcmd = '*' -- ALL
      AND p.polpermissive
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM pg_policy p2
      JOIN pg_class c2 ON c2.oid = p2.polrelid
      JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
      WHERE n2.nspname = r.schema_name
        AND c2.relname = r.table_name
        AND p2.polname <> r.policy_name
        AND p2.polcmd = 'r'
        AND p2.polpermissive
    ) INTO exists_select;

    IF NOT exists_select THEN
      CONTINUE;
    END IF;

    using_expr := COALESCE(r.using_expr, 'true');
    check_expr := COALESCE(r.check_expr, using_expr);
    using_expr := replace(replace(replace(using_expr, '(select auth.uid())', '__UID__'), 'auth.uid()', '(select auth.uid())'), '__UID__', '(select auth.uid())');
    check_expr := replace(replace(replace(check_expr, '(select auth.uid())', '__UID__'), 'auth.uid()', '(select auth.uid())'), '__UID__', '(select auth.uid())');
    roles := r.roles;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policy_name, r.schema_name, r.table_name);

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR INSERT TO %s WITH CHECK (%s)',
      r.policy_name || '__ins', r.schema_name, r.table_name, roles, check_expr
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
      r.policy_name || '__upd', r.schema_name, r.table_name, roles, using_expr, check_expr
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR DELETE TO %s USING (%s)',
      r.policy_name || '__del', r.schema_name, r.table_name, roles, using_expr
    );
  END LOOP;
END $$;

COMMIT;

-- Verify remaining bare auth.uid() in policies (should be empty)
SELECT n.nspname AS schema, c.relname AS table, p.polname AS policy,
       pg_get_expr(p.polqual, p.polrelid) AS using_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage')
  AND pg_get_expr(p.polqual, p.polrelid) LIKE '%auth.uid()%'
  AND pg_get_expr(p.polqual, p.polrelid) NOT LIKE '%(select auth.uid())%';