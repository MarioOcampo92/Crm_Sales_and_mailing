import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  console.log('[stripe-webhook] Received request, signature present:', !!signature)

  try {
    // Restauramos el escudo de seguridad porque comprobamos que funciona perfecto
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') as string,
      undefined,
      cryptoProvider
    )

    console.log('[stripe-webhook] Event verified:', event.type, event.id)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object;
      
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer?.id;
      
      console.log('[stripe-webhook] Customer ID:', customerId)
      
      const customer = await stripe.customers.retrieve(customerId as string);
      
      if (customer && !customer.deleted && customer.email) {
        const client_email = customer.email;
        const client_name = customer.name || 'Cliente Web';
        const client_phone = customer.phone || null;

        // Obtener la suscripción fresca para asegurar todos los campos
        const fullSub = await stripe.subscriptions.retrieve(subscription.id);
        
        const items = fullSub.items?.data || [];
        const item = items[0];
        
        // Obtener el nombre real del producto desde Stripe
        let plan_name = item?.price?.nickname || 'Suscripción Stripe';
        if (!item?.price?.nickname && item?.price?.product) {
           try {
             const product = await stripe.products.retrieve(item.price.product as string);
             plan_name = product.name || plan_name;
           } catch (e) { console.log('Error fetching product name'); }
        }

        const amount = (item?.price?.unit_amount || 0) / 100;
        const interval = item?.plan?.interval || 'month';
        const billing_cycle = interval === 'year' ? 'annual' : 'monthly';
        
        // Fecha de próximo cobro exacta desde la suscripción fresca
        let next_billing_date = new Date().toISOString();
        if (fullSub.current_period_end) {
          next_billing_date = new Date(fullSub.current_period_end * 1000).toISOString();
        }
        
        let status = 'active';
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = 'active';
        } else if (subscription.status === 'past_due') {
          status = 'past_due';
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          status = 'canceled';
        }
        
        const cancel_at_period_end = subscription.cancel_at_period_end || false;

        console.log('[stripe-webhook] Upserting:', { client_email, client_name, plan_name, amount, status, cancel_at_period_end })

        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('client_email', client_email)
          .maybeSingle();

        if (existingSub) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ plan_name, amount, next_billing_date, status, source: 'stripe', billing_cycle, client_phone, cancel_at_period_end })
            .eq('id', existingSub.id);
        } else {
          await supabaseAdmin
            .from('subscriptions')
            .insert({ client_name, client_email, client_phone, plan_name, amount, next_billing_date, status, source: 'stripe', billing_cycle, cancel_at_period_end });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[stripe-webhook] FULL ERROR:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
