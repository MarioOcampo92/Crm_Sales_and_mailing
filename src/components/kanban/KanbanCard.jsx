import { Phone, Globe, MapPin, Flame } from 'lucide-react';
import { getVendedor } from '../../data/vendedores';

export default function KanbanCard({ lead, provided, isDragging, onClick }) {
  const isHotLead = lead.oportunidad === 'web+llamadas';

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing transition-shadow select-none ${
        isDragging ? 'shadow-lg ring-2 ring-indigo-400 rotate-[2deg]' : 'shadow-sm hover:shadow-md'
      }`}
    >
      {/* Row 1: Nombre + badge oportunidad */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
          {lead.nombre}
        </h4>
        {isHotLead ? (
          <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700" title="Sin web real → Vender Web + Llamadas">
            <Flame size={10} />
            W+L
          </span>
        ) : (
          <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500" title="Ya tiene web → Solo Llamadas">
            <Phone size={10} className="inline mr-0.5" />
            L
          </span>
        )}
      </div>

      {/* Row 2: Zona */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <MapPin size={11} className="text-gray-400 flex-shrink-0" />
        <span className="truncate">{lead.zona}</span>
      </div>

      {/* Row 3: Teléfono */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Phone size={11} className="text-gray-400 flex-shrink-0" />
        <span>{lead.telefono}</span>
      </div>

      {/* Row 4: Footer - Web indicator + Vendedor */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        {lead.website_url ? (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 max-w-[70%]">
            <Globe size={10} className="flex-shrink-0" />
            <span className="truncate">{lead.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
          </div>
        ) : <div />}
        
        {lead.vendedor && (
          <div 
            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${getVendedor(lead.vendedor)?.color || 'bg-indigo-500'}`}
            title={`Asignado a: ${lead.vendedor}`}
          >
            {getVendedor(lead.vendedor)?.initials || lead.vendedor.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
}
