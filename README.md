# Vestra CRM y Portal de Clientes

Sistema integral de gestion de ventas, control de facturacion y portal de auto-servicio para clientes.

## Mapa Conceptual de Arquitectura

```mermaid
flowchart TD
    Client[Navegador del Usuario] --> Router{React Router}
    
    Router -->|/ (Rutas CRM)| Admin[Admin CRM]
    Router -->|/portal/*| Portal[Portal de Clientes]

    subgraph Backend [Supabase Cloud]
        DB[(PostgreSQL)]
        Auth[Supabase Auth]
        RLS{Row Level Security}
    end

    Admin -->|Acceso Privilegiado| DB
    Portal -->|Magic Link| Auth
    Auth --> RLS
    RLS -->|Restringido por Email| DB

    subgraph Integraciones Externas
        Stripe[Stripe API]
        Resend[Resend SMTP]
    end

    subgraph Deno Edge Functions
        Webhooks[stripe-webhook]
        Invoices[stripe-invoices]
        ValidateEmail[validate-portal-email]
        Sync[sync-history]
    end

    DB -.->|Cron: Recordatorios 30 dias| Resend
    Stripe -.->|Eventos de Pago| Webhooks
    Webhooks -.-> DB
    Portal -.-> ValidateEmail
    Portal -.-> Invoices
    Invoices -.-> Stripe
```

## Modulos Principales

### CRM Interno (Administracion)
- Autenticacion estandar para administradores y equipo de ventas.
- Dashboard de metricas financieras (MRR activo, estimaciones manuales, tasa de fuga y cobros pendientes).
- Kanban interactivo para seguimiento de embudo de ventas y prospectos.
- Directorio de clientes centralizado.
- Gestion de suscripciones hibrida (Sincronizacion bidireccional con Stripe y control manual para transferencias bancarias).
- Sistema de Mailing masivo integrado con el servidor SMTP.

### Portal de Clientes
- Acceso sin contrasenas (Passwordless) mediante Magic Links.
- Validacion de seguridad en el backend para emitir accesos unicamente a correos con servicios activos.
- Panel de control aislado por cliente.
- Consulta del estado del servicio, fecha de renovacion e importes.
- Descarga directa de facturas (generadas por Stripe) y recibos adjuntos manuales.

## Tecnologias Utilizadas

- Frontend: React 19, Vite, Tailwind CSS, React Router v7, Recharts.
- Backend y Base de Datos: Supabase (PostgreSQL).
- Autenticacion: GoTrue (Supabase Auth).
- Funciones Serverless: Supabase Edge Functions (Deno Runtime).
- Despliegue: Hostinger VPS (Frontend) y Supabase Cloud (Backend).
- Integraciones: Stripe Billing, Resend SMTP.

## Medidas de Seguridad Implementadas

1. Row Level Security (RLS): Las consultas a la base de datos estan protegidas a nivel de fila en el nucleo de PostgreSQL. Un cliente logueado en el portal unicamente tiene permisos para extraer los registros donde el correo de su token JWT coincida exactamente con la columna de facturacion.
2. Edge Functions: La validacion de correos del portal se ejecuta en entornos Deno cerrados, evitando exponer la lista de clientes al frontend publico.
3. Magic Links: Autenticacion delegada, eliminando almacenamiento de contrasenas de clientes y bloqueando ataques de fuerza bruta.
4. Cifrado de Secretos: Las claves API de Stripe y Resend residen exclusivamente en el Vault encriptado de Supabase.

---
Desarrollado y mantenido de forma exclusiva por Vestra Solutions LLC.
