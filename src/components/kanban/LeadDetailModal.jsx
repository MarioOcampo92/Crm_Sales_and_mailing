import { useState, useEffect } from 'react';
import { X, MapPin, Phone, Globe, Flame, ExternalLink, NotebookPen, Check, Loader2, Trash2, Pencil } from 'lucide-react';
import { PIPELINE_COLUMNS } from '../../data/mockLeads';
import { VENDEDORES } from '../../data/vendedores';
import { supabase } from '../../lib/supabase';
import { classifyOpportunity } from '../../hooks/useLeads';

export default function LeadDetailModal({ lead, onClose, onStatusChange, onDelete, onInfoChange }) {
  const isHotLead = lead.oportunidad === 'web+llamadas';
  const [notas, setNotas]         = useState(lead.notas || '');
  const [saving, setSaving]       = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [dirty, setDirty]         = useState(false); // cambios sin guardar

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    nombre: lead.nombre || '',
    zona: lead.zona || '',
    direccion: lead.direccion || '',
    telefono: lead.telefono || '',
    website_url: lead.website_url || ''
  });

  useEffect(() => { 
    setNotas(lead.notas || ''); 
    setDirty(false); 
    setSaved(false); 
    setIsEditingInfo(false);
    setInfoForm({
      nombre: lead.nombre || '',
      zona: lead.zona || '',
      direccion: lead.direccion || '',
      telefono: lead.telefono || '',
      website_url: lead.website_url || ''
    });
  }, [lead]);

  function handleNotasChange(e) {
    setNotas(e.target.value);
    setDirty(true);
    setSaved(false);
  }

  async function handleSaveNotas() {
    setSaving(true);
    const { error } = await supabase
      .from('leads')
      .update({ notas })
      .eq('id', lead.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setDirty(false);
    }
  }

  async function handleSaveInfo() {
    setSavingInfo(true);
    const updates = { 
      ...infoForm,
      tiene_web: infoForm.website_url ? 'Sí' : 'No'
    };
    
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', lead.id);
      
    setSavingInfo(false);
    if (!error) {
      setIsEditingInfo(false);
      if (onInfoChange) {
        onInfoChange(lead.id, updates);
      }
    } else {
      alert('Error guardando información: ' + error.message);
    }
  }

  async function handleDelete() {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${lead.nombre}? Esta acción no se puede deshacer.`)) {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(lead.id);
      }
      setIsDeleting(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md sm:mx-4 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900 pr-4 leading-tight">{lead.nombre}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Opportunity badge */}
          {isHotLead ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Flame size={18} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-700">Web + Llamadas</p>
                <p className="text-xs text-amber-600">
                  {!lead.website_url
                    ? 'No tiene sitio web → Oportunidad de venderle desarrollo web'
                    : 'Su "web" es una red social → Necesita web profesional'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <Phone size={18} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-600">Solo Llamadas</p>
                <p className="text-xs text-gray-500">Ya tiene sitio web propio</p>
              </div>
            </div>
          )}

          {/* Info rows */}
          <div className="space-y-3 relative">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Información de contacto</span>
              {!isEditingInfo ? (
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                >
                  <Pencil size={11} /> Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingInfo(false);
                      setInfoForm({
                        nombre: lead.nombre || '',
                        zona: lead.zona || '',
                        direccion: lead.direccion || '',
                        telefono: lead.telefono || '',
                        website_url: lead.website_url || ''
                      });
                    }}
                    className="text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveInfo}
                    disabled={savingInfo}
                    className="flex items-center gap-1 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {savingInfo ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Guardar
                  </button>
                </div>
              )}
            </div>

            {isEditingInfo ? (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Nombre</label>
                  <input
                    type="text"
                    value={infoForm.nombre}
                    onChange={(e) => setInfoForm(prev => ({...prev, nombre: e.target.value}))}
                    className="w-full text-sm border-b border-gray-300 bg-transparent py-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Zona</label>
                  <input
                    type="text"
                    value={infoForm.zona}
                    onChange={(e) => setInfoForm(prev => ({...prev, zona: e.target.value}))}
                    className="w-full text-sm border-b border-gray-300 bg-transparent py-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Dirección</label>
                  <input
                    type="text"
                    value={infoForm.direccion}
                    onChange={(e) => setInfoForm(prev => ({...prev, direccion: e.target.value}))}
                    className="w-full text-sm border-b border-gray-300 bg-transparent py-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Teléfono</label>
                  <input
                    type="text"
                    value={infoForm.telefono}
                    onChange={(e) => setInfoForm(prev => ({...prev, telefono: e.target.value}))}
                    className="w-full text-sm border-b border-gray-300 bg-transparent py-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wide">Sitio Web</label>
                  <input
                    type="text"
                    value={infoForm.website_url}
                    onChange={(e) => setInfoForm(prev => ({...prev, website_url: e.target.value}))}
                    className="w-full text-sm border-b border-gray-300 bg-transparent py-1 focus:outline-none focus:border-indigo-500"
                    placeholder="https://"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <InfoRow icon={<MapPin size={16} />} label="Zona"      value={lead.zona} />
                <InfoRow icon={<MapPin size={16} />} label="Dirección" value={lead.direccion} />
                <InfoRow icon={<Phone  size={16} />} label="Teléfono"  value={
                  <a href={`tel:${lead.telefono?.replace(/\s/g, '')}`} className="text-indigo-600">{lead.telefono}</a>
                } />
                {lead.website_url && (
                  <div className="flex items-start gap-3">
                    <Globe size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Web / RRSS</p>
                      <a
                        href={lead.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1 break-all"
                      >
                        {lead.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').substring(0, 40)}
                        <ExternalLink size={12} className="flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="pt-1 border-t border-gray-100">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
              <NotebookPen size={13} /> Notas
            </label>
            <textarea
              value={notas}
              onChange={handleNotasChange}
              placeholder="Ej: Llamé el lunes, interesada. Llamo el viernes..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-gray-300"
            />
            <button
              onClick={handleSaveNotas}
              disabled={saving || !dirty}
              className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                saved && !dirty
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : dirty
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              ) : saved && !dirty ? (
                <><Check size={14} /> Notas guardadas</>
              ) : (
                <><NotebookPen size={14} /> Guardar notas</>
              )}
            </button>
          </div>

          {/* Vendedor / Asignación */}
          <div className="pt-1 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Asignar a (Vendedor)</label>
            <select
              value={lead.vendedor || ''}
              onChange={async (e) => {
                const newVendedor = e.target.value;
                // update local state optimistic
                onStatusChange(lead.id, lead.status, newVendedor); // Re-using onStatusChange for now, maybe create onVendedorChange
              }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sin asignar</option>
              {VENDEDORES.map((v) => (
                <option key={v.nombre} value={v.nombre}>{v.nombre}</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="pt-1 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Cambiar estado</label>
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value, lead.vendedor)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PIPELINE_COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.emoji} {col.label}</option>
              ))}
            </select>
          </div>

          {/* Delete Action */}
          <div className="pt-4 mt-2 border-t border-red-50 flex justify-center">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {isDeleting ? 'Eliminando...' : 'Eliminar lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-sm text-gray-800">{value}</div>
      </div>
    </div>
  );
}
