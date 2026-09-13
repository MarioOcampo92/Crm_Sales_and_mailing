import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, AlertTriangle, CheckCircle, Loader2, Eye, Trash2, Globe, ChevronDown } from 'lucide-react';

const SOCIAL_DOMAINS = [
  'instagram.com', 'facebook.com', 'fb.com', 'wa.me',
  'booksy.com', 'ivof.com', 'wixsite.com', 'estetical.es',
  'negocioscerca.es', 'wwwcafe.de', 'walink.co',
];

// Nichos predefinidos + opción de escribir uno nuevo
const NICHOS_PREDEFINIDOS = [
  'Estéticas',
  'Talleres mecánicos',
  'Veterinarias',
  'Restaurantes',
  'Inmobiliarias',
  'Peluquerías',
  'Clínicas dentales',
  'Gimnasios',
  'Academias / Formación',
  'General',
];

function classifyOpportunity(tieneWeb, url) {
  if (tieneWeb !== 'Sí' || !url) return 'web+llamadas';
  const lower = url.toLowerCase();
  if (SOCIAL_DOMAINS.some((d) => lower.includes(d))) return 'web+llamadas';
  return 'solo-llamadas';
}

function parseCSV(text, nicho) {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i]);
    if (fields.length < 2) continue;

    const zona       = fields[0] || '';
    const nombre     = fields[1] || '';
    const direccion  = fields[2] || '';
    const telefono   = fields[3] || '';
    const tieneWeb   = fields[4] || 'No';
    const websiteUrl = fields[5] || '';
    const oportunidad = classifyOpportunity(tieneWeb, websiteUrl);

    const warnings = [];
    if (!nombre) warnings.push('Sin nombre');
    if (!telefono || telefono === 'No disponible') warnings.push('Sin teléfono');
    if (tieneWeb === 'Sí' && !websiteUrl) warnings.push('Dice que tiene web pero no hay URL');

    rows.push({
      zona,
      nombre,
      direccion,
      telefono,
      tiene_web: tieneWeb,
      website_url: websiteUrl,
      oportunidad,
      nicho,
      status: 'nuevo',
      warnings,
      _selected: true,
    });
  }
  return rows;
}

export default function ImportPage() {
  const [nicho, setNicho]           = useState('Estéticas');
  const [nichoCustom, setNichoCustom] = useState('');
  const [useCustom, setUseCustom]   = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState(null);
  const [fileName, setFileName]     = useState('');
  const fileRef = useRef(null);

  const nichoFinal = useCustom ? nichoCustom.trim() : nicho;

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target?.result, nichoFinal || 'General');
      setParsedRows(rows);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function toggleRow(index) {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, _selected: !r._selected } : r))
    );
  }

  function toggleAll() {
    const allSelected = parsedRows.every((r) => r._selected);
    setParsedRows((prev) => prev.map((r) => ({ ...r, _selected: !allSelected })));
  }

  async function handleImport() {
    const toImport = parsedRows
      .filter((r) => r._selected)
      .map(({ warnings, _selected, ...rest }) => rest);

    if (toImport.length === 0) return;

    setImporting(true);
    setResult(null);

    const { data, error } = await supabase.from('leads').insert(toImport).select();

    setImporting(false);

    if (error) {
      setResult({ type: 'error', message: error.message });
    } else {
      setResult({ type: 'success', count: data.length, nicho: nichoFinal });
      setParsedRows([]);
      setFileName('');
    }
  }

  const selectedCount  = parsedRows.filter((r) => r._selected).length;
  const withWarnings   = parsedRows.filter((r) => r.warnings.length > 0).length;
  const webOpp         = parsedRows.filter((r) => r._selected && r.oportunidad === 'web+llamadas').length;

  return (
    <div className="p-6 max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Importar Leads</h1>
      <p className="text-sm text-gray-500 mb-6">
        Selecciona el nicho, sube el CSV, revisa los datos y confirma la importación
      </p>

      {/* === PASO 1: Nicho === */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-bold mr-2">1</span>
          ¿A qué nicho pertenece este CSV?
        </h2>

        <div className="flex flex-wrap gap-2 mb-3">
          {NICHOS_PREDEFINIDOS.map((n) => (
            <button
              key={n}
              onClick={() => { setNicho(n); setUseCustom(false); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !useCustom && nicho === n
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              useCustom
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
            }`}
          >
            + Otro...
          </button>
        </div>

        {useCustom && (
          <input
            type="text"
            value={nichoCustom}
            onChange={(e) => setNichoCustom(e.target.value)}
            placeholder="Ej: Fontaneros, Abogados, Ópticas..."
            className="w-full max-w-sm text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        )}

        {nichoFinal && (
          <p className="text-xs text-gray-400 mt-2">
            Nicho seleccionado: <strong className="text-indigo-600">{nichoFinal}</strong>
          </p>
        )}
      </div>

      {/* === PASO 2: Subir CSV === */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-bold mr-2">2</span>
          Sube el archivo CSV
        </h2>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
        >
          <Upload size={28} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">
            {fileName || 'Haz clic para seleccionar tu archivo CSV'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Formato: Zona, Nombre, Dirección, Teléfono, Tiene Web, URL</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
      </div>

      {/* Resultado */}
      {result?.type === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg mb-5">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            ✅ {result.count} leads de <strong>{result.nicho}</strong> importados correctamente. Ve al Pipeline para verlos.
          </p>
        </div>
      )}
      {result?.type === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-5">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">Error: {result.message}</p>
        </div>
      )}

      {/* === PASO 3: Revisar e importar === */}
      {parsedRows.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-bold mr-2">3</span>
              Revisa los datos antes de importar
            </h2>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-700"><strong>{parsedRows.length}</strong> leads encontrados</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-700"><strong>{selectedCount}</strong> seleccionados</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm font-medium text-indigo-700">Nicho: {nichoFinal}</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-emerald-700 font-medium">🔥 {webOpp} Web+Llamadas</span>
              {withWarnings > 0 && (
                <>
                  <span className="text-sm text-gray-400">·</span>
                  <span className="text-sm text-amber-700">⚠️ {withWarnings} con advertencias</span>
                </>
              )}
              <div className="ml-auto">
                <button
                  onClick={handleImport}
                  disabled={importing || selectedCount === 0 || !nichoFinal}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Importar {selectedCount} leads
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={parsedRows.every((r) => r._selected)}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Zona</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Teléfono</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Web</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Oportunidad</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 transition-colors ${
                      row.warnings.length > 0
                        ? 'bg-amber-50/50'
                        : row._selected
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <td className="p-3">
                      <input type="checkbox" checked={row._selected} onChange={() => toggleRow(i)} className="rounded" />
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-gray-900">{row.nombre || '—'}</span>
                      {row.warnings.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {row.warnings.map((w, wi) => (
                            <span key={wi} className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                              ⚠ {w}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{row.zona}</td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">{row.telefono}</td>
                    <td className="p-3">
                      {row.website_url ? (
                        <a
                          href={row.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline truncate block max-w-[200px]"
                          title={row.website_url}
                        >
                          {row.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').substring(0, 30)}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin web</span>
                      )}
                    </td>
                    <td className="p-3">
                      {row.oportunidad === 'web+llamadas' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          🔥 Web+Llamadas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          📞 Solo Llamadas
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleRow(i)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400"
                        title={row._selected ? 'Excluir' : 'Incluir'}
                      >
                        {row._selected ? <Eye size={14} /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
