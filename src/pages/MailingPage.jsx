import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail as MailIcon, Plus, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import NewSubscriberModal from '../components/kanban/NewSubscriberModal';

export default function MailingPage() {
  const [activeTab, setActiveTab] = useState('subscribers'); // 'subscribers' | 'campaigns'
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Campaigns state
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSubscribers(data);
    }
    setLoading(false);
  }

  async function handleSendCampaign(e) {
    e.preventDefault();
    if (!asunto || !cuerpo) return toast.error('Por favor, rellena asunto y cuerpo');
    
    setIsSending(true);
    try {
      // 1. Guardar campaña en DB
      const { data: campaign, error: dbError } = await supabase
        .from('campaigns')
        .insert([{ asunto, cuerpo_html: cuerpo, estado: 'enviando' }])
        .select()
        .single();
        
      if (dbError) throw dbError;

      // 2. Llamar a la Edge Function
      const { data: resData, error: fnError } = await supabase.functions.invoke('send-campaign', {
        body: { campaign_id: campaign.id }
      });

      if (fnError) throw fnError;

      toast.success('¡Campaña enviada con éxito!');
      setAsunto('');
      setCuerpo('');
    } catch (err) {
      console.error(err);
      toast.error('Hubo un error al enviar la campaña: ' + err.message);
    } finally {
      setIsSending(false);
    }
  }

  

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Mailing & Newsletter</h1>
          <p className="text-sm text-gray-500">Gestiona tus suscriptores y envía correos masivos.</p>
        </div>
        {activeTab === 'subscribers' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> Añadir Suscriptor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'subscribers' 
              ? 'border-b-2 border-indigo-500 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} /> Suscriptores ({subscribers.length})
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'campaigns' 
              ? 'border-b-2 border-indigo-500 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MailIcon size={16} /> Nueva Campaña
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'subscribers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : subscribers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No tienes suscriptores todavía. ¡Instala el widget en tu web!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Nombre</th>
                      <th className="px-6 py-3 font-medium">Origen (Source)</th>
                      <th className="px-6 py-3 font-medium">Fecha</th>
                      <th className="px-6 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{sub.email}</td>
                        <td className="px-6 py-4 text-gray-600">{sub.nombre || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                            {sub.source || 'Directo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'activo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Redactar Correo</h2>
            <form onSubmit={handleSendCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input
                  type="text"
                  required
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej: Novedades de este mes..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (HTML o Texto)</label>
                <p className="text-xs text-gray-500 mb-2">Puedes usar etiquetas HTML como &lt;b&gt; para negrita, &lt;br&gt; para saltos de línea, etc.</p>
                <textarea
                  required
                  rows={8}
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Se enviará a <strong>{subscribers.filter(s => s.status === 'activo').length}</strong> suscriptores activos.
                </p>
                <button
                  type="submit"
                  disabled={isSending || subscribers.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isSending ? 'Enviando...' : 'Enviar Campaña'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showModal && (
        <NewSubscriberModal 
          onClose={() => setShowModal(false)} 
          onAdd={(newSub) => setSubscribers([newSub, ...subscribers])} 
        />
      )}
    </div>
  );
}
