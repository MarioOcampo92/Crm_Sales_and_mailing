-- Habilitar RLS en la tabla de suscripciones
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores por si existen
DROP POLICY IF EXISTS "Admin full access" ON public.subscriptions;
DROP POLICY IF EXISTS "Client read access" ON public.subscriptions;

-- 1. Política para administradores (pueden hacer TODO)
-- Los admins no tienen el rol 'client'.
CREATE POLICY "Admin full access" ON public.subscriptions
FOR ALL
TO authenticated
USING (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'client'
)
WITH CHECK (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'client'
);

-- 2. Política para clientes (solo pueden LEER sus propias suscripciones)
-- Valida que el email coincida exactamente con el de la sesión
CREATE POLICY "Client read access" ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'client'
  AND
  lower(client_email) = lower(auth.jwt() ->> 'email')
);
