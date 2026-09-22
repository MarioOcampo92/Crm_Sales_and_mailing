import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Loader2, FileText, Download, ExternalLink, CheckCircle2, AlertCircle, Calendar, CreditCard, Clock } from 'lucide-react';

export default function PortalDashboardPage() {
  const { session } = useAuth();
  const clientEmail = session?.user?.email;
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    if (!clientEmail) return;
    fetchData();
  }, [clientEmail]);

  async function fetchData() {
    setLoading(true);

    // 1. Obtener datos de todas las suscripciones
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('client_email', clientEmail)
      .order('created_at', { ascending: false });

    setSubscriptions(subData || []);

    // 2. Si alguna es Stripe, obtener facturas globales
    const hasStripe = subData?.some(s => s.source === 'stripe');
    if (hasStripe) {
      setLoadingInvoices(true);
      try {
        const { data: invData } = await supabase.functions.invoke('stripe-invoices', {
          body: { email: clientEmail }
        });
        if (invData?.invoices) {
          setInvoices(invData.invoices);
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
      }
      setLoadingInvoices(false);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-700 mb-2">Sin suscripción encontrada</h2>
        <p className="text-sm text-gray-500">No hemos encontrado ninguna suscripción asociada a <strong>{clientEmail}</strong>.</p>
        <p className="text-xs text-gray-400 mt-4">Si crees que es un error, contacta con soporte@vestrasolutions.org</p>
      </div>
    );
  }

  const cycleLabels = { monthly: 'Mensual', quadrimester: 'Cuatrimestral', semester: 'Semestral', annual: 'Anual' };
  const clientName = subscriptions[0]?.client_name;
  const hasStripeSubs = subscriptions.some(s => s.source === 'stripe');
  const manualInvoices = subscriptions.filter(s => s.invoice_url);

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hola, {clientName} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Aquí puedes consultar tus servicios y descargar tus facturas.</p>
      </div>

      {/* Lista de Suscripciones */}
      <div className="space-y-6">
        {subscriptions.map((sub) => {
          const isActive = sub.status === 'active' && !sub.cancel_at_period_end;
          const isCanceling = sub.cancel_at_period_end;
          
          return (
            <div key={sub.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Tu suscripción</p>
                    <h2 className="text-xl font-bold mt-1">{sub.plan_name}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{Number(sub.amount).toFixed(2)}€</p>
                    <p className="text-indigo-200 text-xs">/{cycleLabels[sub.billing_cycle] || sub.billing_cycle}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                {/* Estado */}
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <CheckCircle2 size={14} />
                    Estado
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} /> Activa
                    </span>
                  ) : isCanceling ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                      <AlertCircle size={12} /> Cancelación pendiente
                    </span>
                  ) : sub.status === 'past_due' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      <AlertCircle size={12} /> Pago pendiente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      Cancelada
                    </span>
                  )}
                </div>

                {/* Ciclo */}
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Clock size={14} />
                    Ciclo de facturación
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{cycleLabels[sub.billing_cycle] || 'Mensual'}</p>
                </div>

                {/* Próximo cobro */}
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Calendar size={14} />
                    Próximo cobro
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {sub.next_billing_date
                      ? new Date(sub.next_billing_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Facturas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText size={18} className="text-indigo-500" />
          <h3 className="font-bold text-gray-900">Historial de Facturas</h3>
        </div>

        {/* Facturas manuales adjuntas */}
        {manualInvoices.map((sub, idx) => (
          <div key={`manual-${idx}`} className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              <span className="text-sm font-medium text-indigo-800">Factura adjunta: {sub.plan_name}</span>
            </div>
            <a
              href={sub.invoice_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <Download size={14} /> Descargar
            </a>
          </div>
        ))}

        {/* Facturas de Stripe */}
        {hasStripeSubs && (
          loadingInvoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Factura</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Monto</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{inv.number || `#${i + 1}`}</td>
                      <td className="px-6 py-3 text-gray-500">
                        {inv.created ? new Date(inv.created * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{(inv.amount_paid / 100).toFixed(2)}€</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status === 'paid' ? 'Pagada' : inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {inv.invoice_pdf && (
                          <a
                            href={inv.invoice_pdf}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <Download size={14} /> PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No se encontraron facturas de Stripe.</p>
            </div>
          )
        )}

        {/* Mensaje vacío si no hay facturas de ningún tipo */}
        {!hasStripeSubs && manualInvoices.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aún no hay facturas disponibles.</p>
            <p className="text-xs text-gray-300 mt-1">Contacta con nosotros si necesitas una copia de tu factura.</p>
          </div>
        )}
      </div>

      {/* Info de contacto */}
      <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-2xl border border-gray-200 p-6 text-center">
        <CreditCard size={24} className="text-indigo-400 mx-auto mb-3" />
        <h4 className="font-bold text-gray-800 mb-1">¿Tienes dudas sobre tu facturación?</h4>
        <p className="text-sm text-gray-500">
          Escríbenos a{' '}
          <a href="mailto:soporte@vestrasolutions.org" className="text-indigo-600 font-medium hover:underline">
            soporte@vestrasolutions.org
          </a>{' '}
          y te ayudaremos encantados.
        </p>
      </div>
    </div>
  );
}
