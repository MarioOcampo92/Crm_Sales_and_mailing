import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ valid: false, error: 'Email requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar si el email tiene alguna suscripción (activa o no)
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('id, client_name, status')
      .eq('client_email', email.toLowerCase().trim())
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[validate-portal-email] DB error:', error);
      return new Response(JSON.stringify({ valid: false, error: 'Error interno' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ valid: false, error: 'No se encontraron suscripciones asociadas a este email.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ valid: true, client_name: data.client_name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[validate-portal-email] Error:', err);
    return new Response(JSON.stringify({ valid: false, error: 'Error procesando solicitud' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
