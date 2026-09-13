/**
 * NichoFilter — barra de filtro de nicho reutilizable.
 * Props:
 *  - nichos: string[] — lista de nichos únicos en la BD
 *  - active: string   — nicho activo ('all' o el nombre del nicho)
 *  - onChange: fn     — callback con el nuevo nicho seleccionado
 */
export default function NichoFilter({ nichos, active, onChange }) {
  if (nichos.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400 font-medium mr-1">Nicho:</span>
      <button
        onClick={() => onChange('all')}
        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
          active === 'all'
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        }`}
      >
        Todos ({nichos.length})
      </button>
      {nichos.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            active === n
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
