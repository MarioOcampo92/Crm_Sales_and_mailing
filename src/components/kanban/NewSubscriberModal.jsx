import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewSubscriberModal({ onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('subscribers')
      .insert([{ email, nombre, source: 'Añadido Manualmente', status: 'activo' }])
      .select()
      .single();

    if (error) {
      toast.error('Error al añadir: ' + error.message);
    } else {
      toast.success('¡Suscriptor añadido!');
      onAdd(data);
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <UserPlus size={18} className="text-indigo-600" />
            <span>Añadir Suscriptor</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (Opcional)</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Añadir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
