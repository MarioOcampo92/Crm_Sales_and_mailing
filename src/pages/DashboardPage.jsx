import { useState, useMemo } from 'react';
import { useLeads, classifyOpportunity } from '../hooks/useLeads';
import { PIPELINE_COLUMNS } from '../data/mockLeads';
import { Globe, Phone, TrendingUp, Loader2 } from 'lucide-react';
import NichoFilter from '../components/NichoFilter';

export default function DashboardPage() {
  const [nichoFilter, setNichoFilter] = useState('all');
  const { leads, loading, nichos }    = useLeads(nichoFilter);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );

  const enriched     = leads.map((l) => ({ ...l, oportunidad: classifyOpportunity(l.tiene_web, l.website_url) }));
  const totalLeads   = enriched.length;
  const webOpp       = enriched.filter((l) => l.oportunidad === 'web+llamadas').length;
  const soloLlamadas = enriched.filter((l) => l.oportunidad === 'solo-llamadas').length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-4">Resumen del embudo de ventas de Vestra Solutions</p>

      <div className="mb-5">
        <NichoFilter nichos={nichos} active={nichoFilter} onChange={setNichoFilter} />
      </div>

      {totalLeads === 0 ? (
        <div className="text-center p-10 bg-white border border-gray-200 rounded-xl">
          <p className="text-base font-medium text-gray-700">
            {nichoFilter === 'all' ? 'No hay leads aún' : `No hay leads en "${nichoFilter}"`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {nichoFilter === 'all' ? 'Ve a Importar para subir tu CSV' : 'Prueba seleccionando "Todos los nichos"'}
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <KpiCard icon={<TrendingUp size={20} />} label="Total Leads"                value={totalLeads}   color="indigo" />
            <KpiCard icon={<Globe size={20} />}       label="Web + Llamadas"             value={webOpp}       color="green"  subtitle="Sin web real → vender todo" />
            <KpiCard icon={<Phone size={20} />}       label="Solo Llamadas"              value={soloLlamadas} color="gray"   subtitle="Ya tienen web propia" />
          </div>

          {/* Pipeline */}
          <h2 className="text-base font-semibold text-gray-800 mb-3">Pipeline</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PIPELINE_COLUMNS.map((col) => {
              const count = enriched.filter((l) => l.status === col.id).length;
              return (
                <div key={col.id} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <span className="text-xl">{col.emoji}</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{col.label}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color, subtitle }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-emerald-50 text-emerald-600',
    gray:   'bg-gray-100 text-gray-500',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
