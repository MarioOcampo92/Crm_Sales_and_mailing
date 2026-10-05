import { useState, useMemo } from 'react';
import { 
  X, MapPin, Phone, Globe, Flame, Navigation, Printer, 
  Check, ExternalLink, CheckSquare, Square, Search, 
  MessageSquare, Save, Loader2, Sparkles, Compass
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PIPELINE_COLUMNS } from '../../data/mockLeads';

const CP_NAMES = {
  '12001': 'Castellón Centro (Plaça Major / Enmedio)',
  '12004': 'Castellón Oeste (Av. Cardenal Costa / Ribera)',
  '12002': 'Castellón Este (Sant Vicent)',
  '12003': 'Castellón Norte',
  '12005': 'Castellón Sur',
  '12006': 'Castellón Estación / Morella',
  '12100': 'El Grao de Castellón',
  '12530': 'Burriana',
  '12540': 'Vila-real',
  '12550': 'Almassora',
  '12560': 'Benicàssim',
  '12600': 'La Vall d\'Uixó',
  '12200': 'Onda',
  '43001': 'Tarragona Centro',
  '43002': 'Tarragona Eixample',
  '43003': 'Tarragona Part Alta',
  '43005': 'Tarragona Ponent',
  '43201': 'Reus Centro',
  '43820': 'Calafell Poble',
};

function extractPostalCode(address) {
  if (!address) return null;
  const match = address.match(/\b(12\d{3}|43\d{3})\b/);
  return match ? match[1] : null;
}

export default function RoutePlannerModal({ leads, onClose, onLeadStatusChange }) {
  const [selectedCp, setSelectedCp] = useState('12001'); // Default to Castellón Centro!
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('nuevo'); // Focus on new leads by default
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingNotes, setEditingNotes] = useState({});
  const [savingNotesId, setSavingNotesId] = useState(null);
  const [savedNotesId, setSavedNotesId] = useState(null);

  // Group all leads by CP
  const postalCodeGroups = useMemo(() => {
    const groups = {};
    leads.forEach((l) => {
      const cp = extractPostalCode(l.direccion) || 'Otros';
      if (!groups[cp]) groups[cp] = [];
      groups[cp].push(l);
    });
    return groups;
  }, [leads]);

  // List of available CPs sorted by number of leads descending
  const cpList = useMemo(() => {
    return Object.keys(postalCodeGroups).sort((a, b) => {
      // Prioritize Castellón 12001, 12004, etc.
      if (a === '12001') return -1;
      if (b === '12001') return 1;
      return postalCodeGroups[b].length - postalCodeGroups[a].length;
    });
  }, [postalCodeGroups]);

  // Filtered leads for the current selection
  const filteredLeads = useMemo(() => {
    let pool = leads;
    if (selectedCp !== 'all') {
      pool = postalCodeGroups[selectedCp] || [];
    }
    if (statusFilter !== 'all') {
      pool = pool.filter((l) => (l.status || 'nuevo') === statusFilter);
    }
    if (search.trim()) {
      const q = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      pool = pool.filter((l) => 
        (l.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(q) ||
        (l.direccion || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(q) ||
        (l.telefono || '').includes(q)
      );
    }
    return pool;
  }, [leads, selectedCp, statusFilter, search, postalCodeGroups]);

  // List of leads in the active route (selected by user, or all filtered by default)
  const activeRouteLeads = useMemo(() => {
    if (selectedIds.size === 0) {
      return filteredLeads;
    }
    return filteredLeads.filter((l) => selectedIds.has(l.id));
  }, [filteredLeads, selectedIds]);

  function toggleLead(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // Google Maps walking link generator
  function getGoogleMapsUrl(routeItems, maxStops = 10) {
    if (!routeItems.length) return '#';
    const items = routeItems.slice(0, maxStops);
    if (items.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(items[0].direccion || items[0].nombre)}`;
    }
    const origin = items[0].direccion || items[0].nombre;
    const destination = items[items.length - 1].direccion || items[items.length - 1].nombre;
    const waypoints = items
      .slice(1, -1)
      .map((i) => i.direccion || i.nombre)
      .filter(Boolean)
      .map((w) => encodeURIComponent(w))
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${waypoints}` : ''}`;
  }

  async function handleQuickStatusChange(leadId, newStatus) {
    if (onLeadStatusChange) {
      await onLeadStatusChange(leadId, newStatus);
    }
  }

  async function handleSaveNote(leadId) {
    const noteText = editingNotes[leadId];
    if (noteText === undefined) return;
    setSavingNotesId(leadId);
    const { error } = await supabase.from('leads').update({ notas: noteText }).eq('id', leadId);
    setSavingNotesId(null);
    if (!error) {
      setSavedNotesId(leadId);
      setTimeout(() => setSavedNotesId(null), 2000);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 backdrop-blur-md">
              <Compass size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Planificador de Ruta de Visitas</h2>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Navigation size={10} /> A pie
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/80">
                Optimiza tus visitas comerciales a pie sin perder tiempo caminando en círculos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
              title="Imprimir hoja de ruta en papel o guardar como PDF"
            >
              <Printer size={14} />
              Imprimir Ruta
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex-shrink-0 space-y-3">
          {/* CP and City Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              1. Selecciona la zona o código postal:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCp('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCp === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >
                Todas las zonas ({leads.length})
              </button>
              {cpList.map((cp) => {
                const count = postalCodeGroups[cp]?.length || 0;
                const label = CP_NAMES[cp] ? `${cp} - ${CP_NAMES[cp]}` : `CP ${cp}`;
                const isCastellonCentro = cp === '12001';
                return (
                  <button
                    key={cp}
                    onClick={() => setSelectedCp(cp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCp === cp
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                        : isCastellonCentro
                        ? 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    {isCastellonCentro && <span>⭐</span>}
                    <span>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCp === cp ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subfilters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar en esta zona..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos los estados</option>
                <option value="nuevo">🆕 Solo Nuevos</option>
                <option value="contactado">📞 Ya Contactados</option>
                <option value="demo">🎯 Con Demo</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Mostrando: <strong>{filteredLeads.length}</strong> clientes
              </span>
              <span className="text-gray-300">|</span>
              <button
                onClick={selectAll}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Elegir todos
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:underline"
              >
                Limpiar selección
              </button>
            </div>
          </div>
        </div>

        {/* Action Callout & Quick Launch to Google Maps */}
        <div className="bg-indigo-50/80 border-b border-indigo-100 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
              {activeRouteLeads.length}
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">
                {selectedIds.size > 0 
                  ? `${selectedIds.size} clientes seleccionados para tu ruta` 
                  : `Ruta completa con los ${activeRouteLeads.length} clientes`}
              </p>
              <p className="text-[11px] text-indigo-700">
                Google Maps permite hasta 10 paradas por enlace directo. Haz clic para abrir la ruta a pie:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeRouteLeads.length <= 10 ? (
              <a
                href={getGoogleMapsUrl(activeRouteLeads, 10)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Navigation size={14} />
                Abrir Ruta en Google Maps ({activeRouteLeads.length} paradas)
                <ExternalLink size={12} />
              </a>
            ) : (
              <>
                <a
                  href={getGoogleMapsUrl(activeRouteLeads.slice(0, 9), 9)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  <Navigation size={13} />
                  Parte 1 (Paradas 1-9)
                  <ExternalLink size={11} />
                </a>
                <a
                  href={getGoogleMapsUrl(activeRouteLeads.slice(9, 18), 9)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold rounded-lg transition-all"
                >
                  <Navigation size={13} />
                  Parte 2 (Paradas 10-18)
                  <ExternalLink size={11} />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Route Stops List (Interactive Walk Mode) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 print:p-0">
          {activeRouteLeads.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Compass size={40} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No hay clientes con los filtros seleccionados.</p>
              <p className="text-xs text-gray-400 mt-1">Prueba seleccionando otro código postal o cambiando el estado.</p>
            </div>
          ) : (
            activeRouteLeads.map((lead, index) => {
              const isSelected = selectedIds.has(lead.id);
              const isHotLead = lead.oportunidad === 'web+llamadas';
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${encodeURIComponent(lead.direccion || lead.nombre)}`;
              const currentNote = editingNotes[lead.id] !== undefined ? editingNotes[lead.id] : (lead.notas || '');

              return (
                <div
                  key={lead.id}
                  className={`bg-white border rounded-xl p-3 sm:p-4 transition-all shadow-sm ${
                    isSelected ? 'border-indigo-400 ring-2 ring-indigo-400/20 bg-indigo-50/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox & Stop Number */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
                      <button
                        onClick={() => toggleLead(lead.id)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title={isSelected ? 'Deseleccionar de la ruta' : 'Seleccionar para la ruta'}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                      <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>

                    {/* Main Lead Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                            {lead.nombre}
                          </h4>
                          {isHotLead ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <Flame size={11} /> Web + Llamadas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              <Phone size={11} /> Solo Llamadas
                            </span>
                          )}
                        </div>

                        {/* Quick Status Buttons */}
                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px]">
                          {PIPELINE_COLUMNS.map((col) => {
                            const isCurrent = (lead.status || 'nuevo') === col.id;
                            return (
                              <button
                                key={col.id}
                                onClick={() => handleQuickStatusChange(lead.id, col.id)}
                                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                                  isCurrent
                                    ? 'bg-white text-gray-900 shadow-sm font-bold'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                                title={`Mover a estado ${col.label}`}
                              >
                                {col.emoji} {col.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dirección + Links */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                        <div className="flex items-center gap-1 font-medium text-gray-800">
                          <MapPin size={13} className="text-red-500 flex-shrink-0" />
                          <span>{lead.direccion || 'Sin dirección registrada'}</span>
                        </div>

                        {lead.telefono && (
                          <a
                            href={`tel:${lead.telefono.replace(/\s+/g, '')}`}
                            className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
                          >
                            <Phone size={12} />
                            <span>{lead.telefono}</span>
                          </a>
                        )}

                        {lead.website_url && (
                          <a
                            href={lead.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-gray-500 hover:underline truncate max-w-[200px]"
                          >
                            <Globe size={12} />
                            <span>{lead.website_url.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                      </div>

                      {/* Commercial Pitch Note */}
                      <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-2 text-xs text-amber-900 mb-2 flex items-start gap-2">
                        <Sparkles size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Argumento comercial:</strong>{' '}
                          {isHotLead ? (
                            <span>
                              No tienen página web propia (o solo redes sociales). Ofréceles el pack de{' '}
                              <strong>Web profesional moderna + Agente telefónico IA</strong> para no perder citas.
                            </span>
                          ) : (
                            <span>
                              Ya cuentan con web propia. Enfócate en el <strong>asistente de llamadas IA</strong> que responde citas 24/7 y se integra con su agenda.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Visit Notes */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={currentNote}
                            onChange={(e) => setEditingNotes({ ...editingNotes, [lead.id]: e.target.value })}
                            placeholder="Apuntar nota de la visita (ej: Hablé con dueña María, pasar jueves a las 16h)..."
                            className="w-full text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
                          />
                          {savedNotesId === lead.id && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 text-[10px] font-bold flex items-center gap-0.5">
                              <Check size={12} /> Guardado
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleSaveNote(lead.id)}
                          disabled={savingNotesId === lead.id}
                          className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {savingNotesId === lead.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Guardar
                        </button>

                        {/* Direct GPS Button */}
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm ml-auto"
                        >
                          <Navigation size={12} />
                          <span>Cómo llegar</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0 text-xs text-gray-500">
          <div>
            💡 <strong>Consejo para mañana:</strong> Puedes llevar esta ventana abierta en el navegador de tu móvil para ir marcando cada cliente conforme salgas del local.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
