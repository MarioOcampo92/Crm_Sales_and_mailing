import emailjs from '@emailjs/browser';

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE EMAILJS
// Crea tu cuenta gratis en https://www.emailjs.com/
// y rellena estas tres constantes (ver instrucciones abajo)
// ─────────────────────────────────────────────────────────────
const SERVICE_ID  = 'PENDIENTE';  // Ej: 'service_abc123'
const TEMPLATE_ID = 'PENDIENTE';  // Ej: 'template_xyz789'
const PUBLIC_KEY  = 'PENDIENTE';  // Ej: 'user_aBcDeFgHiJ'
// ─────────────────────────────────────────────────────────────

/**
 * Envía un email de notificación al vendedor asignado.
 * @param {object} params
 * @param {string} params.vendedorNombre
 * @param {string} params.vendedorEmail
 * @param {string} params.leadNombre
 * @param {string} params.leadZona
 * @param {string} params.leadTelefono
 * @param {string} params.leadOportunidad  - 'web+llamadas' | 'solo-llamadas'
 * @param {string} params.asignadoPor      - nombre del usuario que asignó
 */
export async function notificarAsignacion({
  vendedorNombre,
  vendedorEmail,
  leadNombre,
  leadZona,
  leadTelefono,
  leadOportunidad,
  asignadoPor,
}) {
  // Si no hay email o las credenciales no están configuradas, no hacer nada
  if (!vendedorEmail || SERVICE_ID === 'PENDIENTE') {
    console.warn('EmailJS no configurado o email vacío — asignación guardada sin notificación.');
    return;
  }

  const templateParams = {
    to_name:     vendedorNombre,
    to_email:    vendedorEmail,
    lead_nombre: leadNombre,
    lead_zona:   leadZona,
    lead_tel:    leadTelefono,
    oportunidad: leadOportunidad === 'web+llamadas'
      ? '🔥 Web + Llamadas (sin web real)'
      : '📞 Solo Llamadas (ya tiene web)',
    asignado_por: asignadoPor || 'El equipo',
    crm_url:     'https://ventas.vestrasolutions.org/kanban',
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log(`Email enviado a ${vendedorEmail}`);
  } catch (err) {
    console.error('Error enviando email de asignación:', err);
  }
}
