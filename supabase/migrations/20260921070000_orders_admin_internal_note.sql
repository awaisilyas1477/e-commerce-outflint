-- Fix admin orders list: missing column referenced by admin panel SELECT
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_internal_note text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.orders.admin_internal_note IS
  'Admin-only internal note for fulfillment desk.';
