-- ============================================
-- MIGRACIÓN: Añadir source y billing_cycle
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Añadir columna 'source' (stripe o manual)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- 2. Añadir columna 'billing_cycle' (monthly o annual)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';

-- 3. (Opcional) Si ya tienes datos, podrías marcarlos:
-- UPDATE public.subscriptions SET source = 'manual', billing_cycle = 'annual' WHERE ...;
