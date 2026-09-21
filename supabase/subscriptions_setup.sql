-- ============================================
-- RECORDATORIOS DE COBRO: Mensuales y Anuales
-- Ejecutar en Supabase SQL Editor (reemplaza la función anterior)
-- ============================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Función de recordatorios inteligente (mensual + anual)
CREATE OR REPLACE FUNCTION send_billing_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub RECORD;
    email_subject TEXT;
    email_body TEXT;
BEGIN
    -- ===== RECORDATORIOS MENSUALES (3 días antes) =====
    FOR sub IN 
        SELECT client_name, client_email, plan_name, amount, billing_cycle, source
        FROM public.subscriptions 
        WHERE DATE(next_billing_date) = CURRENT_DATE + interval '3 days'
          AND status = 'active'
          AND client_email IS NOT NULL
          AND (billing_cycle = 'monthly' OR billing_cycle IS NULL)
    LOOP
        IF sub.source = 'stripe' THEN
            email_subject := 'Cobro automático próximo: ' || sub.plan_name;
            email_body := '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f7"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#004AAD,#655BC9,#CB6CE6);padding:32px;text-align:center"><img src="https://ventas.vestrasolutions.org/vestra-logo-mail.png" width="60" height="60" style="border-radius:15px;margin-bottom:12px" /><h1 style="color:#fff;margin:0;font-size:22px">Vestra Solutions</h1></div><div style="padding:32px"><p style="font-size:16px;color:#333">Hola <strong>' || sub.client_name || '</strong>,</p><p style="font-size:15px;color:#555;line-height:1.6">Te informamos que en <strong>3 días</strong> se realizará el cobro automático de tu suscripción:</p><div style="background:linear-gradient(135deg,#004AAD,#655BC9);border-radius:12px;padding:24px;text-align:center;margin:24px 0"><p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px">' || sub.plan_name || '</p><p style="color:#fff;margin:0;font-size:36px;font-weight:800">' || sub.amount || '€</p><p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px">Cobro automático vía Stripe</p></div><p style="font-size:14px;color:#888;line-height:1.5">Si necesitas hacer algún cambio, no dudes en contactarnos antes de la fecha de cobro.</p></div><div style="padding:20px 32px;background:#f8f8fa;text-align:center;border-top:1px solid #eee"><p style="font-size:12px;color:#aaa;margin:0">Vestra Solutions &mdash; vestrasolutions.org</p></div></div></div></body></html>';
        ELSE
            email_subject := 'Recordatorio de pago: ' || sub.plan_name;
            email_body := '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f7"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#004AAD,#655BC9,#CB6CE6);padding:32px;text-align:center"><img src="https://ventas.vestrasolutions.org/vestra-logo-mail.png" width="60" height="60" style="border-radius:15px;margin-bottom:12px" /><h1 style="color:#fff;margin:0;font-size:22px">Vestra Solutions</h1></div><div style="padding:32px"><p style="font-size:16px;color:#333">Hola <strong>' || sub.client_name || '</strong>,</p><p style="font-size:15px;color:#555;line-height:1.6">Te recordamos que tu pago mensual vence en <strong>3 días</strong>:</p><div style="background:linear-gradient(135deg,#004AAD,#655BC9);border-radius:12px;padding:24px;text-align:center;margin:24px 0"><p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px">' || sub.plan_name || '</p><p style="color:#fff;margin:0;font-size:36px;font-weight:800">' || sub.amount || '€</p><p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px">Pago mensual</p></div><p style="font-size:14px;color:#888;line-height:1.5">Contacta con nosotros para realizar el pago y mantener tu servicio activo.</p></div><div style="padding:20px 32px;background:#f8f8fa;text-align:center;border-top:1px solid #eee"><p style="font-size:12px;color:#aaa;margin:0">Vestra Solutions &mdash; vestrasolutions.org</p></div></div></div></body></html>';
        END IF;

        PERFORM net.http_post(
            url := 'https://api.resend.com/emails',
            headers := '{"Authorization": "Bearer YOUR_RESEND_API_KEY", "Content-Type": "application/json"}'::jsonb,
            body := json_build_object(
                'from', 'Vestra Solutions <suscripciones@vestrasolutions.org>',
                'to', array[sub.client_email],
                'subject', email_subject,
                'html', email_body
            )::jsonb
        );
    END LOOP;

    -- ===== RECORDATORIOS ANUALES (30 días antes) =====
    FOR sub IN 
        SELECT client_name, client_email, plan_name, amount
        FROM public.subscriptions 
        WHERE DATE(next_billing_date) = CURRENT_DATE + interval '30 days'
          AND status = 'active'
          AND client_email IS NOT NULL
          AND billing_cycle = 'annual'
    LOOP
        PERFORM net.http_post(
            url := 'https://api.resend.com/emails',
            headers := '{"Authorization": "Bearer YOUR_RESEND_API_KEY", "Content-Type": "application/json"}'::jsonb,
            body := json_build_object(
                'from', 'Vestra Solutions <suscripciones@vestrasolutions.org>',
                'to', array[sub.client_email],
                'subject', 'Renovación anual próxima: ' || sub.plan_name,
                'html', '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f7"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#004AAD,#655BC9,#CB6CE6);padding:32px;text-align:center"><img src="https://ventas.vestrasolutions.org/vestra-logo-mail.png" width="60" height="60" style="border-radius:15px;margin-bottom:12px" /><h1 style="color:#fff;margin:0;font-size:22px">Vestra Solutions</h1></div><div style="padding:32px"><p style="font-size:16px;color:#333">Hola <strong>' || sub.client_name || '</strong>,</p><p style="font-size:15px;color:#555;line-height:1.6">Queremos informarte que tu contrato anual vence en <strong>30 días</strong>. Es momento de gestionar la renovación para mantener tu servicio activo sin interrupciones.</p><div style="background:linear-gradient(135deg,#004AAD,#655BC9);border-radius:12px;padding:24px;text-align:center;margin:24px 0"><p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px">' || sub.plan_name || '</p><p style="color:#fff;margin:0;font-size:36px;font-weight:800">' || sub.amount || '€</p><p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px">Renovación anual</p></div><p style="font-size:14px;color:#888;line-height:1.5">Ponte en contacto con nosotros para renovar tu plan y seguir disfrutando de nuestros servicios. Responde a este correo o llámanos directamente.</p></div><div style="padding:20px 32px;background:#f8f8fa;text-align:center;border-top:1px solid #eee"><p style="font-size:12px;color:#aaa;margin:0">Vestra Solutions &mdash; vestrasolutions.org</p></div></div></div></body></html>'
            )::jsonb
        );
    END LOOP;
END;
$$;

-- 3. Reprogramar el cron (borra el anterior y crea uno nuevo)
SELECT cron.unschedule('billing-reminders');
SELECT cron.schedule(
    'billing-reminders',
    '0 8 * * *',
    $$ SELECT send_billing_reminders() $$
);
