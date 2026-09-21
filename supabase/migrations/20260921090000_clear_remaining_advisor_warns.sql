-- Clear remaining Advisor WARNs + password_reset_tokens INFO suggestion
-- 1) RLS helpers → SECURITY INVOKER (admins_select_own already exists)
-- 2) place_order / preview_voucher → service_role only (+ auth uid from API)
-- 3) password_reset_tokens → explicit deny policy for anon/authenticated

BEGIN;

-- ---------------------------------------------------------------------------
-- is_active_admin: INVOKER (uses admins_select_own)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.auth_id = auth.uid()
      AND a.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO anon, authenticated, service_role, postgres;

-- ---------------------------------------------------------------------------
-- user_has_ordered_product: INVOKER (own order RLS covers the joins)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_ordered_product(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders ord ON ord.id = oi.order_id
    JOIN public.users u ON u.id = ord.user_id
    JOIN public.product_variants pv ON pv.id = oi.product_variant_id
    WHERE pv.product_id = p_product_id
      AND u.auth_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_ordered_product(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_ordered_product(uuid) TO anon, authenticated, service_role, postgres;

-- ---------------------------------------------------------------------------
-- preview_voucher: allow service_role to pass verified auth uid
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preview_voucher(
  p_code text,
  p_cart_subtotal numeric,
  p_cart_product_ids uuid[],
  p_auth_uid uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_public_id uuid;
  v_quote jsonb;
BEGIN
  IF v_uid IS NULL
     AND coalesce(auth.jwt()->>'role', '') = 'service_role'
     AND p_auth_uid IS NOT NULL THEN
    v_uid := p_auth_uid;
  END IF;

  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Code required', 'error_code', 'code_required');
  END IF;

  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated', 'error_code', 'not_authenticated');
  END IF;

  SELECT u.id INTO v_public_id
  FROM public.users u
  WHERE u.auth_id = v_uid
  LIMIT 1;

  IF v_public_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Profile not found', 'error_code', 'profile_not_found');
  END IF;

  v_quote := public._voucher_quote(
    v_public_id,
    p_code,
    p_cart_subtotal,
    coalesce(p_cart_product_ids, '{}'::uuid[]),
    false
  );

  RETURN v_quote;
END;
$$;

REVOKE ALL ON FUNCTION public.preview_voucher(text, numeric, uuid[], uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.preview_voucher(text, numeric, uuid[]) FROM PUBLIC;
DROP FUNCTION IF EXISTS public.preview_voucher(text, numeric, uuid[]);
GRANT EXECUTE ON FUNCTION public.preview_voucher(text, numeric, uuid[], uuid) TO service_role, postgres;
REVOKE EXECUTE ON FUNCTION public.preview_voucher(text, numeric, uuid[], uuid) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- password_reset_tokens: clear rls_enabled_no_policy INFO
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS password_reset_tokens_no_client ON public.password_reset_tokens;
CREATE POLICY password_reset_tokens_no_client
  ON public.password_reset_tokens
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMIT;
