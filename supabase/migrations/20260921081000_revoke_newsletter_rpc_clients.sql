-- Revoke client EXECUTE on newsletter token RPCs (now called via service_role only)
BEGIN;

DO $$
DECLARE
  r record;
  fn text;
  funcs text[] := ARRAY[
    'newsletter_unsubscribe_by_token',
    'newsletter_resubscribe_by_token'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname AS schema_name, p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname = ANY (funcs)
  LOOP
    fn := format('%I.%I(%s)', r.schema_name, r.func_name, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres, service_role', fn);
  END LOOP;
END $$;

COMMIT;
