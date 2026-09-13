import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { campaign_id } = await req.json()
    if (!campaign_id) throw new Error('Missing campaign_id')

    // 1. Fetch Campaign
    const { data: campaign, error: campErr } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campErr || !campaign) throw new Error('Campaign not found')

    // 2. Fetch Active Subscribers
    const { data: subscribers, error: subErr } = await supabaseClient
      .from('subscribers')
      .select('email')
      .eq('status', 'activo')

    if (subErr) throw new Error('Error fetching subscribers')
    if (!subscribers || subscribers.length === 0) throw new Error('No active subscribers')

    // 3. Send via Resend Batch API
    // Resend allows up to 100 emails per batch request
    const emails = subscribers.map(s => s.email)
    const chunkSize = 100;
    
    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      
      const batchPayload = chunk.map(email => ({
        from: 'Vestra CRM <boletin@vestrasolutions.org>',
        to: email,
        subject: campaign.asunto,
        html: campaign.cuerpo_html
      }));

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify(batchPayload)
      })

      if (!res.ok) {
        const errData = await res.text();
        console.error('Resend error:', errData);
        throw new Error('Error enviando con Resend: ' + errData);
      }
    }

    // 4. Update Campaign status
    await supabaseClient
      .from('campaigns')
      .update({ estado: 'enviado', sent_at: new Date().toISOString() })
      .eq('id', campaign_id)

    return new Response(JSON.stringify({ success: true, count: emails.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
