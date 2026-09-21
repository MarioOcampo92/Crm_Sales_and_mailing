import { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, TrendingUp, Search, Loader2, CheckCircle2, Plus, X, Calendar, Zap, Edit, Paperclip, ExternalLink, Download, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // all, stripe, manual
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    website_url: '',
    plan_name: '',
    amount: '',
    next_billing_date: '',
    status: 'active',
    billing_cycle: 'annual',
    invoice_url: ''
  });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState([]);

  const openHistoryModal = async (sub) => {
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    setInvoiceHistory([]);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-invoices', {
        body: { email: sub.client_email }
      });
      if (error) throw error;
      setInvoiceHistory(data.invoices || []);
    } catch (err) {
      toast.error('Error cargando el historial de facturas');
    } finally {
      setLoadingHistory(false);
    }
  };

  async function fetchSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      client_name: '',
      client_email: '',
      plan_name: '',
      amount: '',
      next_billing_date: '',
      status: 'active',
      billing_cycle: 'annual',
      invoice_url: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingId(sub.id);
    setFormData({
      client_name: sub.client_name,
      client_email: sub.client_email || '',
      client_phone: sub.client_phone || '',
      website_url: sub.website_url || '',
      plan_name: sub.plan_name,
      amount: sub.amount,
      next_billing_date: sub.next_billing_date ? sub.next_billing_date.split('T')[0] : '',
      status: sub.status,
      billing_cycle: sub.billing_cycle || 'annual',
      invoice_url: sub.invoice_url || ''
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingInvoice(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('invoices').getPublicUrl(filePath);
      
      setFormData({ ...formData, invoice_url: data.publicUrl });
      toast.success('Factura subida exitosamente');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleRenew = () => {
    if (!formData.next_billing_date) {
      toast.error('Selecciona una fecha base primero');
      return;
    }
    const current = new Date(formData.next_billing_date);
    let monthsToAdd = 1;
    if (formData.billing_cycle === 'annual') monthsToAdd = 12;
    if (formData.billing_cycle === 'semester') monthsToAdd = 6;
    if (formData.billing_cycle === 'quadrimester') monthsToAdd = 4;
    
    current.setMonth(current.getMonth() + monthsToAdd);
    setFormData({ ...formData, next_billing_date: current.toISOString().split('T')[0], status: 'active' });
    toast.success(`Renovado por ${monthsToAdd} meses. ¡Haz clic en Guardar Cambios!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        website_url: formData.website_url,
        plan_name: formData.plan_name,
        amount: parseFloat(formData.amount),
        next_billing_date: formData.next_billing_date,
        status: formData.status,
        billing_cycle: formData.billing_cycle,
        invoice_url: formData.invoice_url
      };

      if (editingId) {
        const { error } = await supabase.from('subscriptions').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Suscripción actualizada');
      } else {
        payload.source = 'manual';
        const { error } = await supabase.from('subscriptions').insert([payload]);
        if (error) throw error;
        toast.success('Suscripción agregada correctamente');
      }
      
      setIsModalOpen(false);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado general (Búsqueda + Origen)
  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = (sub.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (sub.client_email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    let matchesSource = false;
    const isExpiredManual = sub.source !== 'stripe' && sub.status === 'active' && sub.next_billing_date && new Date(sub.next_billing_date) < new Date(new Date().setHours(0,0,0,0));

    if (sourceFilter === 'all') {
      matchesSource = true;
    }
    else if (sourceFilter === 'attention') {
      matchesSource = (sub.status === 'past_due' || sub.status === 'unpaid' || sub.status === 'canceled' || isExpiredManual || sub.cancel_at_period_end);
    }
    else {
      matchesSource = sub.source === sourceFilter;
    }

    return matchesSearch && matchesSource;
  });

  // Próximos a vencer (Próximos 30 días, activos)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const upcomingSubs = subscriptions.filter(s => {
    if (s.status !== 'active' || !s.next_billing_date || s.source === 'stripe') return false;
    const billDate = new Date(s.next_billing_date);
    return billDate >= today && billDate <= thirtyDaysFromNow;
  }).sort((a, b) => new Date(a.next_billing_date) - new Date(b.next_billing_date));

  // KPIs y Proyecciones separadas
  const activeSubs = subscriptions.filter(s => s.status === 'active' && !s.cancel_at_period_end).length;
  const pastDueSubs = subscriptions.filter(s => s.status === 'past_due' || s.status === 'canceled' || s.cancel_at_period_end).length;
  
  const stripeSubs = subscriptions.filter(s => s.source === 'stripe' && s.status === 'active');
  const manualSubs = subscriptions.filter(s => s.source !== 'stripe' && s.status === 'active');

  // MRR aproximado de Stripe
  const stripeMRR = stripeSubs.reduce((acc, s) => {
    let m = s.billing_cycle === 'annual' ? 1/12 : 1;
    return acc + (Number(s.amount) * m);
  }, 0);

  // Acumulado a 12 meses de Manuales
  const manualAnualAcumulado = manualSubs.reduce((acc, s) => {
    let multiplier = 0;
    if (s.billing_cycle === 'monthly') multiplier = 12;
    if (s.billing_cycle === 'quadrimester') multiplier = 3;
    if (s.billing_cycle === 'semester') multiplier = 2;
    if (s.billing_cycle === 'annual') multiplier = 1;
    return acc + (Number(s.amount) * multiplier);
  }, 0);

  // Desglose de meses para Manuales (basado en su next_billing_date de forma DInámica)
  const manualGroupsMap = {};
  manualSubs.forEach(sub => {
    if (!sub.next_billing_date) return;
    const d = new Date(sub.next_billing_date);
    const m = d.getMonth();
    const y = d.getFullYear();
    const key = `${y}-${m}`;
    
    if (!manualGroupsMap[key]) {
      manualGroupsMap[key] = {
        label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        total: 0,
        subs: [],
        sortVal: y * 100 + m
      };
    }
    
    manualGroupsMap[key].total += Number(sub.amount);
    manualGroupsMap[key].subs.push(sub);
  });

  const upcomingManualMonths = Object.values(manualGroupsMap).sort((a, b) => a.sortVal - b.sortVal);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Suscripciones</h1>
          <p className="text-sm text-gray-500">Gestiona cobros automáticos de Stripe y clientes manuales.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Nueva Suscripción
        </button>
      </div>

      {/* KPIs Separados */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <KpiCard icon={<TrendingUp size={20} />} label="Stripe (Mes)" value={`${stripeMRR.toFixed(2)}€`} color="indigo" subtitle="Ingresos automáticos" />
        <KpiCard icon={<Calendar size={20} />} label="Estimado Manual" value={`${manualAnualAcumulado.toFixed(2)}€`} color="amber" subtitle="Potencial a 12 meses" />
        <KpiCard icon={<CheckCircle2 size={20} />} label="Activas" value={activeSubs} color="green" subtitle="Total de clientes" />
        <KpiCard icon={<AlertCircle size={20} />} label="Atención" value={pastDueSubs} color="red" subtitle="Impagos o canceladas" />
      </div>

      {/* Desprendible: Proyección Manuales */}
      <details className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden group">
        <summary className="px-5 py-4 cursor-pointer font-bold text-gray-800 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-amber-600" />
            Estimado de Renovaciones Manuales (Clientes a Contactar)
          </div>
          <ChevronDown size={20} className="text-gray-400 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="p-5 border-t border-gray-100 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {upcomingManualMonths.length === 0 ? (
               <p className="text-gray-500 text-sm col-span-full">No hay clientes manuales pendientes de contactar para renovación.</p>
            ) : upcomingManualMonths.map((m, i) => (
              <div key={i} className="border border-amber-100/60 rounded-lg p-3 shadow-sm bg-amber-50/30 hover:bg-amber-50/50 transition-colors">
                <div className="flex justify-between items-start border-b border-amber-100 pb-2 mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-amber-900 capitalize">{m.label}</h4>
                    <p className="text-xs font-medium text-amber-700 mt-0.5">{m.subs.length} {m.subs.length === 1 ? 'cliente por contactar' : 'clientes por contactar'}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700/60 mb-0.5">Ingreso Estimado</div>
                  <div className="text-xl font-black text-amber-600">{m.total.toFixed(2)}€</div>
                </div>
                <ul className="space-y-1.5 border-t border-amber-100/50 pt-2">
                  {m.subs.map(s => (
                    <li key={s.id} className="text-xs flex justify-between items-center group/item">
                      <span className="truncate pr-2 text-gray-600 font-medium group-hover/item:text-amber-900 transition-colors">{s.client_name}</span>
                      <span className="font-bold text-gray-900">{Number(s.amount).toFixed(0)}€</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* Tabla Próximos a Vencer (si hay alguno) */}
      {upcomingSubs.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-100/50 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold text-amber-800">Renovaciones Próximas (30 días)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50 text-amber-700/80 font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Vencimiento</th>
                  <th className="px-4 py-2">Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {upcomingSubs.map(sub => (
                  <tr key={`upcoming-${sub.id}`}>
                    <td className="px-4 py-2 font-medium text-amber-900">{sub.client_name}</td>
                    <td className="px-4 py-2 text-amber-800">{sub.plan_name}</td>
                    <td className="px-4 py-2 font-bold text-amber-900">
                      {new Date(sub.next_billing_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-2"><SourceBadge source={sub.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtro y Tabla Principal */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/30">
          
          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            <button onClick={() => setSourceFilter('all')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Todos</button>
            <button onClick={() => setSourceFilter('stripe')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceFilter === 'stripe' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Stripe</button>
            <button onClick={() => setSourceFilter('manual')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceFilter === 'manual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Manuales</button>
            <button onClick={() => setSourceFilter('attention')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${sourceFilter === 'attention' ? 'bg-rose-100 shadow-sm text-rose-700' : 'text-gray-500 hover:text-rose-600'}`}>⚠️ Atención</button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar cliente o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Ciclo</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Próximo Cobro</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubs.length > 0 ? (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{sub.client_name}</p>
                      {sub.client_email && <p className="text-xs text-gray-500">{sub.client_email}</p>}
                      {sub.client_phone && <p className="text-xs text-gray-400 mt-0.5">{sub.client_phone}</p>}
                      {sub.website_url && (
                        <a href={sub.website_url.startsWith('http') ? sub.website_url : `https://${sub.website_url}`} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-500 hover:text-indigo-700 mt-0.5 flex items-center gap-1">
                          <ExternalLink size={10} /> {sub.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sub.plan_name}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{Number(sub.amount).toFixed(2)}€</td>
                    <td className="px-4 py-3">
                      {sub.invoice_url ? (
                        <a href={sub.invoice_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                          <ExternalLink size={12} /> Ver
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><CycleBadge cycle={sub.billing_cycle} /></td>
                    <td className="px-4 py-3"><SourceBadge source={sub.source} /></td>
                    <td className="px-4 py-3"><StatusBadge status={sub.status} source={sub.source} nextDate={sub.next_billing_date} cancel_at_period_end={sub.cancel_at_period_end} /></td>
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {sub.next_billing_date 
                        ? new Date(sub.next_billing_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {sub.source === 'stripe' ? (
                        <button 
                          onClick={() => openHistoryModal(sub)} 
                          className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                          title="Ver Historial"
                        >
                          <CreditCard size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => openEditModal(sub)} 
                          className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard size={32} className="text-gray-300 mb-3" />
                      <p>No se encontraron suscripciones.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Historial de Stripe */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-violet-600" />
                <h3 className="font-bold text-gray-900 text-lg">Historial de Facturas</h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
                  <p className="text-gray-500 font-medium">Cargando desde Stripe...</p>
                </div>
              ) : invoiceHistory.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Factura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceHistory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{new Date(inv.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-gray-900 font-bold">{inv.amount.toFixed(2)}€</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-[11px] uppercase tracking-wide font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pagada</span></td>
                        <td className="px-4 py-3 text-right">
                          <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
                            <Download size={14} /> Descargar
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>No se encontraron facturas pagadas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingId ? 'Editar Suscripción' : 'Añadir Suscripción Manual'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                  <input required type="text" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email del Cliente</label>
                  <input required type="email" value={formData.client_email} onChange={e => setFormData({...formData, client_email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del Cliente (Opcional)</label>
                  <input type="text" value={formData.client_phone} onChange={e => setFormData({...formData, client_phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web / URL (Opcional)</label>
                  <input type="url" placeholder="https://" value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
                <input required type="text" value={formData.plan_name} onChange={e => setFormData({...formData, plan_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo de Facturación</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button type="button" onClick={() => setFormData({...formData, billing_cycle: 'monthly'})} className={`px-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${formData.billing_cycle === 'monthly' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Mensual</button>
                  <button type="button" onClick={() => setFormData({...formData, billing_cycle: 'quadrimester'})} className={`px-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${formData.billing_cycle === 'quadrimester' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>4 Meses</button>
                  <button type="button" onClick={() => setFormData({...formData, billing_cycle: 'semester'})} className={`px-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${formData.billing_cycle === 'semester' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>6 Meses</button>
                  <button type="button" onClick={() => setFormData({...formData, billing_cycle: 'annual'})} className={`px-2 py-2.5 rounded-lg text-xs font-medium border transition-all ${formData.billing_cycle === 'annual' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Anual</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto (€)</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Cobro</label>
                  <div className="flex gap-2">
                    <input required type="date" value={formData.next_billing_date} onChange={e => setFormData({...formData, next_billing_date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    {editingId && (
                      <button type="button" onClick={handleRenew} title="Confirmar Pago y Renovar" className="px-3 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors border border-emerald-200">
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option value="active">Activa</option>
                  <option value="past_due">Impago</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>

              {/* Subir Factura */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Factura adjunta (Opcional)</label>
                {formData.invoice_url ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <a href={formData.invoice_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:underline">
                      <Paperclip size={16} /> Ver factura actual
                    </a>
                    <button type="button" onClick={() => setFormData({...formData, invoice_url: ''})} className="text-sm text-rose-500 hover:text-rose-700 font-medium">Quitar</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="file" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingInvoice} />
                    <div className={`w-full flex items-center justify-center gap-2 px-3 py-6 border-2 border-dashed rounded-lg text-sm transition-colors ${uploadingInvoice ? 'border-indigo-300 bg-indigo-50 text-indigo-500' : 'border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-400'}`}>
                      {uploadingInvoice ? (
                        <><Loader2 size={18} className="animate-spin" /> Subiendo archivo...</>
                      ) : (
                        <><Download size={18} /> Haz clic o arrastra una factura aquí</>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-5 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting || uploadingInvoice} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Guardar Cambios' : 'Crear Suscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, source, nextDate, cancel_at_period_end }) {
  const isExpiredManual = source !== 'stripe' && status === 'active' && nextDate && new Date(nextDate) < new Date(new Date().setHours(0,0,0,0));
  
  if (isExpiredManual) {
    return <span className="px-2 py-1 rounded-full text-[11px] uppercase tracking-wide font-bold bg-rose-50 text-rose-700 border border-rose-200">Vencida</span>;
  }

  if (cancel_at_period_end) {
    return <span className="px-2 py-1 rounded-full text-[11px] uppercase tracking-wide font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Se cancelará al término del período">Va a cancelar</span>;
  }

  const config = {
    active:   { label: source === 'stripe' ? 'Pagada' : 'Activa',    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    past_due: { label: 'Impago',    classes: 'bg-rose-50 text-rose-700 border border-rose-200' },
    canceled: { label: 'Cancelada', classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
    unpaid:   { label: 'Sin Pagar', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
  };
  const { label, classes } = config[status] || config.canceled;
  return <span className={`px-2 py-1 rounded-full text-[11px] uppercase tracking-wide font-bold ${classes}`}>{label}</span>;
}

function SourceBadge({ source }) {
  if (source === 'stripe') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200"><Zap size={11} /> Stripe</span>;
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Manual</span>;
}

function CycleBadge({ cycle }) {
  if (cycle === 'annual') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Calendar size={11} /> Anual</span>;
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">Mensual</span>;
}

function KpiCard({ icon, label, value, color, subtitle }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    red:    'bg-rose-50 text-rose-600',
    gray:   'bg-gray-100 text-gray-500',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
