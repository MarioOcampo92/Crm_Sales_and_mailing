import { useState, useMemo } from 'react';
import { Search, ExternalLink, Flame, Phone, Globe, MapPin, SlidersHorizontal, X, UserPlus } from 'lucide-react';
import { useLeads, classifyOpportunity } from '../hooks/useLeads';
import { PIPELINE_COLUMNS } from '../data/mockLeads';
import { getVendedor } from '../data/vendedores';
import NichoFilter from '../components/NichoFilter';
import LeadDetailModal from '../components/kanban/LeadDetailModal';
import NewLeadModal from '../components/kanban/NewLeadModal';

const STATUS_STYLES = {
  nuevo:      'bg-blue-100 text-blue-700',
  contactado: 'bg-amber-100 text-amber-700',
  demo:       'bg-purple-100 text-purple-700',
  ganado:     'bg-green-100 text-green-700',
  perdido:    'bg-red-100 text-red-500',
};

export default function DirectorioPage() {
  const [nichoFilter, setNichoFilter]           = useState('all');
  const { leads, loading, nichos, updateLeadStatus, deleteLead } = useLeads(nichoFilter);
  const [search, setSearch]                     = useState('');
  const [oportunidadFilter, setOportunidadFilter] = useState('all');
  const [statusFilter, setStatusFilter]         = useState('all');
  const [selectedLead, setSelectedLead]         = useState(null);
  const [showFilters, setShowFilters]           = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  const enriched = useMemo(() =>
    leads.map((l) => ({ ...l, oportunidad: classifyOpportunity(l.tiene_web, l.website_url) })),
    [leads]
  );

  const filtered = useMemo(() => {
    let rows = enriched;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((l) =>
        l.nombre.toLowerCase().includes(q) ||
        l.zona.toLowerCase().includes(q) ||
        l.telefono.toLowerCase().includes(q)
      );
    }
    if (oportunidadFilter !== 'all') rows = rows.filter((l) => l.oportunidad === oportunidadFilter);
    if (statusFilter !== 'all')      rows = rows.filter((l) => l.status === statusFilter);
    return rows;
  }, [enriched, search, oportunidadFilter, statusFilter]);

  async function handleStatusChange(leadId, newStatus, newVendedor) {
    await updateLeadStatus(leadId, newStatus, newVendedor);
    setSelectedLead((prev) => prev?.id === leadId ? { ...prev, status: newStatus, vendedor: newVendedor } : prev);
  }

  const activeFilters = [oportunidadFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Directorio de Leads</h1>
          <p className="text-sm text-gray-500">Vista completa de todos los leads importados</p>
        </div>
        <button
          onClick={() => setIsNewLeadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus size={16} />
          Nuevo Lead
        </button>
      </div>

      {/* Nicho pills */}
      <div className="mb-3">
        <NichoFilter nichos={nichos} active={nichoFilter} onChange={setNichoFilter} />
      </div>

      {/* Search + filter toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, zona, teléfono..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors flex-shrink-0 ${
            activeFilters > 0
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {activeFilters > 0 && <span className="text-xs bg-white/30 rounded-full px-1">{activeFilters}</span>}
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <select
            value={oportunidadFilter}
            onChange={(e) => setOportunidadFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las oportunidades</option>
            <option value="web+llamadas">🔥 Web + Llamadas</option>
            <option value="solo-llamadas">📞 Solo Llamadas</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los estados</option>
            {PIPELINE_COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>{col.emoji} {col.label}</option>
            ))}
          </select>
          {activeFilters > 0 && (
            <button
              onClick={() => { setOportunidadFilter('all'); setStatusFilter('all'); }}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
            >
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-3">{filtered.length} de {enriched.length} leads</p>

      {/* MOBILE: Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando leads...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No se encontraron leads con esos filtros</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{lead.nombre}</p>
                  {lead.oportunidad === 'web+llamadas' ? (
                    <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">🔥 W+L</span>
                  ) : (
                    <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">📞 L</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MapPin size={11} />{lead.zona}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} />{lead.telefono}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[lead.status] || 'bg-gray-100 text-gray-500'}`}>
                    {PIPELINE_COLUMNS.find((c) => c.id === lead.status)?.emoji} {lead.status}
                  </span>
                  {lead.vendedor && (
                    <div className="flex items-center gap-1.5" title={lead.vendedor}>
                      <span className="text-[10px] text-gray-500 font-medium">{lead.vendedor}</span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${getVendedor(lead.vendedor)?.color || 'bg-indigo-500'}`}>
                        {getVendedor(lead.vendedor)?.initials || lead.vendedor.charAt(0)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Zona</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Web</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Oportunidad</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nicho</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendedor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-gray-100 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-300" />{lead.zona}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-1"><Phone size={13} className="text-gray-300" />{lead.telefono}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {lead.website_url ? (
                        <a href={lead.website_url} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-indigo-600 hover:underline truncate"
                          title={lead.website_url}
                        >
                          <Globe size={13} />
                          <span className="truncate">{lead.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').substring(0, 28)}</span>
                          <ExternalLink size={11} className="flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">Sin web</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.oportunidad === 'web+llamadas' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Flame size={11} />Web+Llamadas</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><Phone size={11} />Solo Llamadas</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[lead.status] || 'bg-gray-100 text-gray-500'}`}>
                        {PIPELINE_COLUMNS.find((c) => c.id === lead.status)?.emoji} {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{lead.nicho || '—'}</td>
                    <td className="px-4 py-3">
                      {lead.vendedor ? (
                        <div className="flex items-center gap-1.5" title={lead.vendedor}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${getVendedor(lead.vendedor)?.color || 'bg-indigo-500'}`}>
                            {getVendedor(lead.vendedor)?.initials || lead.vendedor.charAt(0)}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{lead.vendedor}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
          onDelete={async (id) => {
            await deleteLead(id);
            setSelectedLead(null);
          }}
          onInfoChange={(id, updates) => {
            setSelectedLead((prev) => prev?.id === id ? { ...prev, ...updates } : prev);
          }}
        />
      )}

      {isNewLeadModalOpen && (
        <NewLeadModal
          onClose={() => setIsNewLeadModalOpen(false)}
          onLeadCreated={(newLead) => {
            setSelectedLead(newLead);
          }}
        />
      )}
    </div>
  );
}
