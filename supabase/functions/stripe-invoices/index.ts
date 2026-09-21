import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { email } = await req.json()
    if (!email) throw new Error('Email is required')

    const customers = await stripe.customers.search({
      query: `email:'${email}'`,
      limit: 1
    });

    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ invoices: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const customerId = customers.data[0].id;
    const invoices = await stripe.invoices.list({
      customer: customerId,
      status: 'paid',
      limit: 12
    });

    const history = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      amount: inv.amount_paid / 100,
      date: new Date(inv.created * 1000).toISOString(),
      pdf_url: inv.hosted_invoice_url
    }));

    return new Response(JSON.stringify({ invoices: history }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
