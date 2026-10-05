import { useState, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Search, Loader2, AlertTriangle, UserPlus, Compass } from 'lucide-react';
import { PIPELINE_COLUMNS } from '../data/mockLeads';
import { useLeads, classifyOpportunity } from '../hooks/useLeads';
import KanbanColumn from '../components/kanban/KanbanColumn';
import LeadDetailModal from '../components/kanban/LeadDetailModal';
import NewLeadModal from '../components/kanban/NewLeadModal';
import RoutePlannerModal from '../components/kanban/RoutePlannerModal';
import NichoFilter from '../components/NichoFilter';

function groupByStatus(leads) {
  const grouped = {};
  for (const col of PIPELINE_COLUMNS) grouped[col.id] = [];
  for (const lead of leads) {
    const enriched = { ...lead, oportunidad: classifyOpportunity(lead.tiene_web, lead.website_url) };
    const rawStatus = lead.status ? String(lead.status).trim().toLowerCase() : 'nuevo';
    const status = grouped[rawStatus] ? rawStatus : 'nuevo';
    grouped[status].push(enriched);
  }
  return grouped;
}

export default function KanbanPage() {
  const [nichoFilter, setNichoFilter] = useState('all');
  const { leads, loading, error, nichos, updateLeadStatus, deleteLead } = useLeads(nichoFilter);
  const [search, setSearch]           = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [localOverrides, setLocalOverrides] = useState({});
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  const effectiveLeads = useMemo(() =>
    leads.map((l) => localOverrides[l.id] ? { ...l, status: localOverrides[l.id] } : l),
    [leads, localOverrides]
  );

  const columns = useMemo(() => {
    const cols = groupByStatus(effectiveLeads);
    const breakdown = Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, v.length]));
    console.log('[Kanban] Total leads recibidos en Pipeline:', effectiveLeads.length, 'Desglose por columnas:', breakdown);
    return cols;
  }, [effectiveLeads]);

  const filteredColumns = useMemo(() => {
    if (!search.trim()) return columns;
    const q = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const filtered = {};
    for (const [status, list] of Object.entries(columns)) {
      filtered[status] = list.filter(
        (l) => 
          String(l.nombre || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(q) || 
          String(l.zona || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [columns, search]);

  const handleDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId;
    setLocalOverrides((prev) => ({ ...prev, [draggableId]: newStatus }));
    const ok = await updateLeadStatus(draggableId, newStatus);
    if (ok) {
      setLocalOverrides((prev) => { const c = { ...prev }; delete c[draggableId]; return c; });
    }
  }, [updateLeadStatus]);

  const handleStatusChange = useCallback(async (leadId, newStatus, newVendedor) => {
    setLocalOverrides((prev) => ({ ...prev, [leadId]: newStatus }));
    const ok = await updateLeadStatus(leadId, newStatus, newVendedor);
    if (ok) {
      setLocalOverrides((prev) => { const c = { ...prev }; delete c[leadId]; return c; });
      setSelectedLead((prev) => prev?.id === leadId ? { ...prev, status: newStatus, vendedor: newVendedor !== undefined ? newVendedor : prev.vendedor } : prev);
    }
  }, [updateLeadStatus]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
      <span className="ml-3 text-gray-500">Cargando leads...</span>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        <AlertTriangle size={40} className="mx-auto text-amber-500 mb-3" />
        <p className="text-gray-700 font-medium">Error al conectar con Supabase</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
    </div>
  );

  if (leads.length === 0 && nichoFilter === 'all') return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        <p className="text-lg font-medium text-gray-700">No hay leads aún</p>
        <p className="text-sm text-gray-500 mt-1">Ve a <strong>Importar</strong> en el menú lateral para subir tu CSV</p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 pb-3 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>
            <p className="text-sm text-gray-500">Arrastra los leads entre las fases del embudo</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o zona..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <button
              onClick={() => setIsRouteModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0 shadow-sm"
              title="Crear ruta a pie de visitas para Google Maps"
            >
              <Compass size={16} />
              Planificar Ruta
            </button>
            <button
              onClick={() => setIsNewLeadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <UserPlus size={16} />
              Nuevo Lead
            </button>
          </div>
        </div>

        {/* Filtro de nicho */}
        <NichoFilter nichos={nichos} active={nichoFilter} onChange={setNichoFilter} />
      </div>

      {/* Kanban board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-5 pb-5">
          <div className="flex gap-4 h-full min-w-max">
            {PIPELINE_COLUMNS.map((col) => (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided, snapshot) => (
                  <KanbanColumn
                    column={col}
                    leads={filteredColumns[col.id] || []}
                    provided={provided}
                    isDraggingOver={snapshot.isDraggingOver}
                    onCardClick={setSelectedLead}
                  />
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

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
            // Se sincroniza solo por realtime, o abrimos el modal del nuevo lead:
            setSelectedLead(newLead);
          }}
        />
      )}

      {isRouteModalOpen && (
        <RoutePlannerModal
          leads={effectiveLeads}
          onClose={() => setIsRouteModalOpen(false)}
          onLeadStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
