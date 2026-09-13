# Vestra CRM - Plan Estratégico y Arquitectura

## 1. Visión General
El objetivo de este proyecto es construir un CRM personalizado estilo "Salesforce" ultra-rápido para gestionar los leads locales (scrappeados) de Vestra Solutions en la zona de Tarragona (Reus, Calafell, etc.).

## 2. Stack Tecnológico Elegido
*   **Frontend**: React + Vite + Tailwind CSS.
*   **UI/UX**: `Shadcn UI` (componentes corporativos), `@hello-pangea/dnd` (para el Kanban drag & drop), y `Recharts` (para el dashboard).
*   **Backend & Base de Datos**: Supabase (PostgreSQL + Auth + Storage). Permite consultas ultra-rápidas y seguridad a nivel de fila (RLS).
*   **Hosting**: Hostinger (subdominio `crm.vestrasolutions.org`). Solo requiere subir los estáticos compilados (`dist`).

## 3. Módulos Principales
1.  **Dashboard Analytics**: Vista principal con KPIs (nuevos leads, tasas de conversión por ciudad, tareas de hoy).
2.  **Kanban / Pipeline**: Tablero interactivo con las fases de venta (Ej: Lead Nuevo -> Contacto Inicial -> Demo Agendada -> Cierre).
3.  **Directorio (Data Table)**: Tabla avanzada de leads con filtros potentes (filtrar por zona: "Reus", "Calafell"; por estado de web: "Tiene Sitio Web: Sí").
4.  **Importador Smart**: Script que lee archivos como `leads_tarragona.csv`, normaliza los datos (extrae enlaces de redes sociales de la columna web) y los inserta en Supabase.

## 4. Estructura de la Base de Datos (Supabase)
**Tabla `leads`**
*   `id` (UUID)
*   `zona` (Texto: Reus, Calafell, etc.)
*   `nombre` (Texto)
*   `direccion` (Texto)
*   `telefono` (Texto)
*   `website_url` (Texto)
*   `social_url` (Texto - extraído automáticamente si es IG/FB)
*   `status` (Enum: 'nuevo', 'contactado', 'demo', 'ganado', 'perdido')
*   `created_at` (Timestamp)

## 5. Próximos Pasos para Iniciar el Desarrollo
1.  Ejecutar `npm create vite@latest . -- --template react` en la raíz de esta carpeta.
2.  Crear el proyecto en Supabase y obtener las claves API.
3.  Desarrollar el script de importación del CSV `data/leads_tarragona.csv`.
4.  Construir el Frontend (Kanban y Dashboard).
