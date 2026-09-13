# Vestra CRM 🚀

Un Customer Relationship Management (CRM) ligero, rápido y moderno construido con **React, Vite, Tailwind CSS y Supabase**. Diseñado específicamente para optimizar la gestión de ventas, el seguimiento de clientes y el envío masivo de correos (Mailing/Newsletter).

---

## ✨ Características Principales

- **Tablero Kanban Interactivo**: Gestiona tus leads arrastrando y soltando tarjetas entre diferentes fases del embudo de ventas (Nuevo, Contactado, Demo, Ganado, Perdido).
- **Directorio Completo**: Vista de tabla estructurada para consultar todos tus clientes, con filtros potentes por nicho, oportunidad y estado.
- **Mailing y Newsletter Integrado**: 
  - Gestión de suscriptores independiente.
  - Creación y envío masivo de campañas usando **Resend** (vía Supabase Edge Functions).
  - Incluye un Widget HTML/JS embebible para capturar leads desde cualquier web externa.
- **Sincronización en Tiempo Real**: Desarrollado con Supabase Realtime, los cambios realizados por un usuario se reflejan instantáneamente en los dispositivos de todo el equipo.
- **Gestión de Asignaciones**: Asigna leads a diferentes vendedores (como John, Mario, etc.) y recibe notificaciones por correo de manera automática.
- **Interfaz Móvil (PWA)**: Diseño `mobile-first` con una barra de navegación inferior nativa para facilitar el uso en pantallas pequeñas.
- **Seguridad**: Autenticación manejada por Supabase Auth con políticas RLS (Row Level Security) que aseguran que solo usuarios autenticados puedan leer o editar información.

---

## 🛠️ Stack Tecnológico

- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Drag & Drop**: `@hello-pangea/dnd`
- **Backend & Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Edge Functions)
- **Motor de Correos (Mailing)**: [Resend](https://resend.com/)

---

## 📂 Estructura del Proyecto

```text
/src
 ├── components/       # Componentes reutilizables (Kanban, NavBars, Modales)
 ├── context/          # Contextos de React (AuthContext)
 ├── data/             # Datos mockeados y configuración (vendedores.js)
 ├── hooks/            # Custom hooks (useLeads) para manejar la lógica de negocio
 ├── lib/              # Configuración de librerías externas (Supabase, EmailJS)
 ├── pages/            # Vistas principales (Dashboard, Kanban, Directorio, Mailing)
 └── App.jsx           # Enrutamiento (React Router) y Auth Provider
/supabase
 └── functions/        # Supabase Edge Functions (ej. send-campaign)
```

---

## 🚀 Instalación y Desarrollo Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/vestra-crm.git
   cd vestra-crm
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto y añade tus claves de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Ejecutar en entorno de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

5. **Construir para producción**:
   ```bash
   npm run build
   ```

---

## ☁️ Despliegue (Edge Functions)

Para que el envío de correos masivos funcione, necesitas hacer deploy de la Edge Function en Supabase:

1. Asegúrate de tener el [Supabase CLI](https://supabase.com/docs/guides/cli) instalado.
2. Haz login en tu proyecto: `supabase login`
3. Despliega la función: 
   ```bash
   supabase functions deploy send-campaign
   ```
4. Configura tu API Key de Resend en los secretos de Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY="re_tu_api_key_aqui"
   ```

---

## 📝 Licencia

Propietario: **Vestra Solutions** - Todos los derechos reservados.
