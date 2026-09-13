// Configuración de vendedores de Vestra Solutions
// Para añadir el email de JP Morgan, rellena el campo email abajo

export const VENDEDORES = [
  {
    nombre: 'Mario',
    email:  'mario@vestraweb.es',
    color:  'bg-indigo-500',
    initials: 'M',
  },
  {
    nombre: 'John',
    email:  'john@vestrasolutions.org',
    color:  'bg-emerald-500',
    initials: 'J',
  },
  {
    nombre: 'JP Morgan',
    email:  '', // ← añadir email cuando esté disponible
    color:  'bg-amber-500',
    initials: 'JP',
  },
];

export function getVendedor(nombre) {
  return VENDEDORES.find((v) => v.nombre === nombre) || null;
}
