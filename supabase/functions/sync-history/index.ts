import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'active' });
    let count = 0;

    for (const sub of subscriptions.data) {
      const customer = typeof sub.customer === 'string' ? await stripe.customers.retrieve(sub.customer) : sub.customer;
      if (!customer || customer.deleted || !customer.email) continue;
      
      const client_phone = customer.phone || null;

      const items = sub.items?.data || [];
      const item = items[0];
      
      let plan_name = item?.price?.nickname || 'Suscripción Stripe';
      if (!item?.price?.nickname && item?.price?.product) {
         try {
           const product = await stripe.products.retrieve(item.price.product as string);
           plan_name = product.name || plan_name;
         } catch (e) {}
      }

      const amount = (item?.price?.unit_amount || 0) / 100;
      const interval = item?.plan?.interval || 'month';
      const billing_cycle = interval === 'year' ? 'annual' : 'monthly';
      
      const next_billing_date = new Date(sub.current_period_end * 1000).toISOString();
      const cancel_at_period_end = sub.cancel_at_period_end || false;

      const { data: existingSub } = await supabaseAdmin.from('subscriptions').select('id').eq('client_email', customer.email).maybeSingle();

      if (existingSub) {
        await supabaseAdmin.from('subscriptions').update({ plan_name, amount, next_billing_date, status: 'active', source: 'stripe', billing_cycle, client_phone, cancel_at_period_end }).eq('id', existingSub.id);
      } else {
        await supabaseAdmin.from('subscriptions').insert({ client_name: customer.name || 'Cliente', client_email: customer.email, client_phone, plan_name, amount, next_billing_date, status: 'active', source: 'stripe', billing_cycle, cancel_at_period_end });
      }
      count++;
    }

    return new Response(JSON.stringify({ success: true, synced: count }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})
