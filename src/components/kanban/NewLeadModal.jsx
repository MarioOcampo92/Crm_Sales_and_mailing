import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { PIPELINE_COLUMNS } from '../../data/mockLeads';
import { VENDEDORES } from '../../data/vendedores';
import { supabase } from '../../lib/supabase';

export default function NewLeadModal({ onClose, onLeadCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    zona: '',
    direccion: '',
    telefono: '',
    tiene_web: 'No',
    website_url: '',
    nicho: '',
    status: 'nuevo',
    vendedor: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('leads')
      .insert([formData])
      .select();

    setLoading(false);

    if (error) {
      console.error('Error creando lead:', error.message);
      alert('Error al crear el lead: ' + error.message);
      return;
    }

    if (onLeadCreated) {
      onLeadCreated(data[0]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-indigo-600">
            <UserPlus size={20} />
            <h2 className="text-base font-bold text-gray-900">Añadir Nuevo Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          <form id="new-lead-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Negocio *</label>
              <input
                required
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Estética Bella"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                <input
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 600 123 456"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Zona / Barrio</label>
                <input
                  name="zona"
                  value={formData.zona}
                  onChange={handleChange}
                  placeholder="Ej: Tarragona Centro"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dirección completa</label>
              <input
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: Calle Mayor 12, Local B"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">¿Tiene Web?</label>
                <select
                  name="tiene_web"
                  value={formData.tiene_web}
                  onChange={handleChange}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">URL de Web/RRSS</label>
                <input
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="Ej: https://instagram.com/..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nicho / Sector</label>
                <input
                  name="nicho"
                  value={formData.nicho}
                  onChange={handleChange}
                  placeholder="Ej: Estéticas, Talleres..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado inicial</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {PIPELINE_COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.emoji} {col.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Asignar a</label>
              <select
                name="vendedor"
                value={formData.vendedor}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Sin asignar</option>
                {VENDEDORES.map((v) => (
                  <option key={v.nombre} value={v.nombre}>{v.nombre}</option>
                ))}
              </select>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-lead-form"
            disabled={loading || !formData.nombre.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Crear Lead
          </button>
        </div>

      </div>
    </div>
  );
}
