# Contexto del Proyecto: Vestra CRM

¡Hola, IA! Si estás leyendo esto, acabas de asumir el control del proyecto **Vestra CRM**. Aquí tienes todo el contexto para que puedas continuar el trabajo sin interrupciones:

## 1. ¿De dónde venimos?
El usuario y yo (el agente de la conversación anterior) decidimos separar este CRM de la web principal ("Vestra Llamadas"). El usuario tiene una base de datos en Excel con leads locales scrappeados (zona de Tarragona, Reus, Calafell, etc.) y necesita un CRM moderno estilo "Salesforce" para gestionar su embudo de ventas.

## 2. Lo que ya se ha hecho (Estado Actual)
Un sub-agente acaba de inicializar este repositorio desde cero. Ya contamos con:
*   **React + Vite** configurados.
*   **Tailwind CSS** instalado y funcionando.
*   Dependencias clave instaladas: `react-router-dom`, `lucide-react`, `@hello-pangea/dnd` (para el futuro Kanban) y `recharts` (para el futuro dashboard).
*   Se creó una estructura básica en `src/` (incluyendo un Sidebar y rutas básicas en `App.jsx`).
*   En `data/leads_tarragona.csv` están los datos crudos del usuario listos para ser importados.
*   En `docs/PLAN_ESTRATEGICO.md` está el plan arquitectónico detallado (usaremos Supabase para backend/DB).

## 3. Lo que toca hacer ahora (Próximos Pasos)
El usuario estaba decidiendo entre dos opciones antes de cambiar de ventana:
*   **Fase Visual (Opción A):** Empezar a programar los componentes visuales del Tablero Kanban (columnas de estados y tarjetas arrastrables con datos *mockeados*).
*   **Fase Backend (Opción B):** Configurar la conexión real con **Supabase** y programar el script importador inteligente para limpiar y subir los datos del CSV a la base de datos.

## Instrucción para ti:
Pregúntale al usuario cuál de las dos opciones (Visual o Backend) prefiere atacar primero ahora que tienes todo el contexto, o si prefiere empezar por otro lado. ¡Mucho éxito con el desarrollo del CRM!
