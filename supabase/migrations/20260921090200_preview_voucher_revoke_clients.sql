DROP FUNCTION IF EXISTS public.preview_voucher(text, numeric, uuid[]);
REVOKE ALL ON FUNCTION public.preview_voucher(text, numeric, uuid[], uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.preview_voucher(text, numeric, uuid[], uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preview_voucher(text, numeric, uuid[], uuid) TO service_role, postgres;
