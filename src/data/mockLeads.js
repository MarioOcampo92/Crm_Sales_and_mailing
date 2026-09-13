/**
 * Datos mockeados basados en leads reales del CSV de Tarragona.
 * 
 * Lógica de oportunidad:
 * - "web+llamadas": No tiene web O su "web" es realmente un enlace a RRSS → Se le puede vender TODO
 * - "solo-llamadas": Tiene web real → Solo se le vende el servicio de llamadas
 */

const SOCIAL_DOMAINS = [
  'instagram.com', 'facebook.com', 'fb.com', 'wa.me',
  'booksy.com', 'ivof.com', 'wixsite.com', 'estetical.es',
  'negocioscerca.es', 'wwwcafe.de', 'walink.co',
];

/**
 * Determina si una URL es una web real o un perfil de red social / directorio.
 */
function isSocialOrDirectory(url) {
  if (!url) return true; // sin web → oportunidad total
  const lower = url.toLowerCase();
  return SOCIAL_DOMAINS.some((domain) => lower.includes(domain));
}

function classifyOpportunity(tieneWeb, url) {
  if (tieneWeb !== 'Sí' || !url) return 'web+llamadas';
  if (isSocialOrDirectory(url)) return 'web+llamadas';
  return 'solo-llamadas';
}

// --- Leads mockeados (selección representativa del CSV) ---

const MOCK_LEADS = [
  // === NUEVO (leads recién importados) ===
  {
    id: 'lead-01',
    nombre: 'SPLENDOR CENTER TARRAGONA',
    zona: 'Centro, Tarragona',
    direccion: 'Carrer del Gasòmetre, 4, 43001 Tarragona',
    telefono: '651 61 86 95',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'nuevo',
  },
  {
    id: 'lead-02',
    nombre: 'Laura Estetik',
    zona: 'Campclar, Tarragona',
    direccion: 'C. Francolí, 69, 43006 Tarragona',
    telefono: '692 06 69 05',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'nuevo',
  },
  {
    id: 'lead-03',
    nombre: 'Centre Estètic Cris',
    zona: 'Centro, Reus',
    direccion: 'Carrer del Vapor Vell, 29, 43201 Reus',
    telefono: '639 93 15 20',
    tieneWeb: 'Sí',
    websiteUrl: 'https://www.instagram.com/centre_estetic_cris/',
    status: 'nuevo',
  },
  {
    id: 'lead-04',
    nombre: 'PRESTIGE BEAUTY By KRISTIANA',
    zona: 'Calafell Poble',
    direccion: 'Carrer Mallorca, 42, 43820 Calafell',
    telefono: '613 77 76 02',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'nuevo',
  },
  {
    id: 'lead-05',
    nombre: 'Jackelin Beauty',
    zona: 'Mestral, Reus',
    direccion: 'Carrer de Santa Teresa, 12, 43201 Reus',
    telefono: '610 65 67 44',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'nuevo',
  },
  {
    id: 'lead-06',
    nombre: 'Miriam Estètica',
    zona: 'Centro, Tarragona',
    direccion: 'Av. Catalunya, 25, 43002 Tarragona',
    telefono: '684 00 87 35',
    tieneWeb: 'Sí',
    websiteUrl: 'https://instagram.com/miriam.estetica',
    status: 'nuevo',
  },

  // === CONTACTADO (ya se les ha llamado) ===
  {
    id: 'lead-07',
    nombre: 'Kobba Beauty Studio',
    zona: 'Centro, Tarragona',
    direccion: 'Via Augusta, 35, 43003 Tarragona',
    telefono: '615 76 37 68',
    tieneWeb: 'Sí',
    websiteUrl: 'http://www.kobbabeauty.com/',
    status: 'contactado',
  },
  {
    id: 'lead-08',
    nombre: 'AINARA BROWS',
    zona: 'Campclar, Tarragona',
    direccion: 'Carrer Vint-I-Dos, 10, Bonavista, 43100 Tarragona',
    telefono: '696 28 39 73',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'contactado',
  },
  {
    id: 'lead-09',
    nombre: "Mima't Centre d'estètica",
    zona: 'Centro, Reus',
    direccion: "Carrer d'Antoni Rius i Miró, 7, 43205 Reus",
    telefono: '623 34 12 10',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'contactado',
  },
  {
    id: 'lead-10',
    nombre: 'Ekora Bienestar Integral',
    zona: 'Ponent, Reus',
    direccion: 'Passeig de Misericòrdia, 55, bajos 2B, 43205 Reus',
    telefono: '625 38 31 18',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'contactado',
  },

  // === DEMO (demo agendada o en curso) ===
  {
    id: 'lead-11',
    nombre: 'Hera Centre Mèdic Estètic',
    zona: 'Centro, Reus',
    direccion: 'Carrer de Jesús, 24, 43201 Reus',
    telefono: '645 55 31 16',
    tieneWeb: 'Sí',
    websiteUrl: 'https://clinicaherareus.com/',
    status: 'demo',
  },
  {
    id: 'lead-12',
    nombre: 'Salut i Bellesa Yolanda',
    zona: 'Calafell Poble',
    direccion: 'Carrer de Mar, 48, 43820 Calafell',
    telefono: '620 22 87 26',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'demo',
  },
  {
    id: 'lead-13',
    nombre: 'Estética Silvia',
    zona: 'Centro, Reus',
    direccion: 'Carrer de Francesc Ferrer i Guàrdia, 43206 Reus',
    telefono: '687 94 68 07',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'demo',
  },

  // === GANADO (clientes cerrados) ===
  {
    id: 'lead-14',
    nombre: 'ATMOSFERA Centro de Bienestar y Belleza',
    zona: 'Centro, Tarragona',
    direccion: 'Carrer Major, 40, 43003 Tarragona',
    telefono: '657 16 53 06',
    tieneWeb: 'Sí',
    websiteUrl: 'https://atmosfera-spa.com/',
    status: 'ganado',
  },
  {
    id: 'lead-15',
    nombre: 'LidiaFernández DEPILIFE',
    zona: 'Campclar, Tarragona',
    direccion: 'Carrer Riu Besòs, bloque 1, Esc.2, local B, 43006 Tarragona',
    telefono: '691 61 37 20',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'ganado',
  },
  {
    id: 'lead-16',
    nombre: 'Ishtar Beauty Centro de Belleza',
    zona: 'Campclar, Tarragona',
    direccion: 'Carrer Violant d\'Hongria, 25, 43007 Tarragona',
    telefono: '682 02 07 78',
    tieneWeb: 'No',
    websiteUrl: '',
    status: 'ganado',
  },

  // === PERDIDO ===
  {
    id: 'lead-17',
    nombre: 'Clínica Mayol',
    zona: 'Centro, Tarragona',
    direccion: 'Av. de Ramón y Cajal, 25, 43001 Tarragona',
    telefono: '977 22 22 42',
    tieneWeb: 'Sí',
    websiteUrl: 'https://clinicamayol.com/',
    status: 'perdido',
  },
  {
    id: 'lead-18',
    nombre: 'Clínica Londres',
    zona: 'Centro, Tarragona',
    direccion: "Carrer Enric d'Ossó, 2, 43005 Tarragona",
    telefono: '977 24 92 62',
    tieneWeb: 'Sí',
    websiteUrl: 'https://www.clinicalondres.es/clinicas/tarragona',
    status: 'perdido',
  },
];

// Enriquecer cada lead con el campo de oportunidad
export const leads = MOCK_LEADS.map((lead) => ({
  ...lead,
  oportunidad: classifyOpportunity(lead.tieneWeb, lead.websiteUrl),
}));

// Columnas del pipeline en orden
export const PIPELINE_COLUMNS = [
  { id: 'nuevo',      label: 'Nuevo',      color: 'blue',   emoji: '🆕' },
  { id: 'contactado', label: 'Contactado', color: 'amber',  emoji: '📞' },
  { id: 'demo',       label: 'Demo',       color: 'purple', emoji: '🎯' },
  { id: 'ganado',     label: 'Ganado',     color: 'green',  emoji: '✅' },
  { id: 'perdido',    label: 'Perdido',    color: 'red',    emoji: '❌' },
];

/**
 * Agrupa los leads por status para inicializar el Kanban.
 */
export function groupLeadsByStatus(leadsList) {
  const grouped = {};
  for (const col of PIPELINE_COLUMNS) {
    grouped[col.id] = [];
  }
  for (const lead of leadsList) {
    if (grouped[lead.status]) {
      grouped[lead.status].push(lead);
    }
  }
  return grouped;
}
