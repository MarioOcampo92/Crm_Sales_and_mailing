# Vestra CRM - Módulo de Gestión y Suscripciones

Desarrollado por **Vestra Solutions LLC**.

## Descripción General
Vestra CRM es un sistema centralizado diseñado para la gestión de clientes, leads (pipeline de ventas) y un potente motor de suscripciones recurrentes. El sistema automatiza la facturación y seguimiento tanto de pagos manuales como de cobros automáticos sincronizados en tiempo real con Stripe.

---

## 🗺️ Mapa Conceptual de Funcionamiento

```text
+---------------------+       +------------------------+       +-------------------------+
|   CLIENTE (PAGA)    |       |       STRIPE           |       |      VESTRA CRM         |
|                     | ----> | (Procesa tarjeta,      | ----> | (Dashboard, Pipelines,  |
| 1. Automático (Web) |       |  emite factura,        |       |  Suscripciones)         |
| 2. Manual (SEO/Mto) |       |  gestiona reintentos)  |       |                         |
+---------------------+       +------------------------+       +-------------------------+
                                        |                               ^
                                        | Webhooks (Edge Functions)     |
                                        v                               |
                              +------------------------+                |
                              | SUPABASE (Backend)     |                |
                              | - Base de Datos SQL    |                |
                              | - Edge Functions (API) |----------------+
                              | - Autenticación        |
                              +------------------------+
```

### Flujo de Datos
1. **Cobros Automáticos (Stripe):** Cuando un cliente paga o se renueva su suscripción en Stripe, Stripe dispara un Webhook. Este webhook es recibido por nuestras Edge Functions en Supabase, procesado, y el estado del cliente se actualiza automáticamente en el CRM (estado, monto, ciclo, fecha de próximo cobro, teléfono).
2. **Cobros Manuales:** Gestionados directamente en la interfaz del CRM. El administrador programa la fecha y ciclo. El sistema calcula inteligentemente las proyecciones y levanta alertas visuales cuando un pago está vencido.

---

## ✨ Funcionalidades Principales

### 1. Panel de Suscripciones Híbrido
- **Sincronización Stripe:** Lectura en tiempo real de clientes automáticos. Evita duplicidad y sobrescritura.
- **Cobros Manuales:** Gestión de servicios que se cobran por transferencia o métodos externos (Mantenimientos SEO, etc.).
- **Ciclos Dinámicos:** Soporte para suscripciones Mensuales, 4 Meses (Cuatrimestrales), 6 Meses (Semestrales) y Anuales.

### 2. Motor de Proyecciones (Forecasting)
- **Stripe (Mes):** Cálculo del MRR (Monthly Recurring Revenue) normalizado de suscripciones automáticas.
- **Estimado Manual:** Cálculo del ARR (Anual) de todos los cobros manuales.
- **Calendario Desplegable:** Sistema dinámico que agrupa los próximos cobros manuales por mes/año, listando los clientes exactos que deben ser contactados y el monto estimado en juego.

### 3. Alertas y Automatización
- **Filtro de Atención (⚠️):** Muestra de inmediato clientes de Stripe cuyo cobro falló (Impago/Cancelado) y clientes manuales cuya fecha de pago ya expiró.
- **Renovación a Un Clic:** Botón de confirmación rápida que suma automáticamente el ciclo correspondiente a la fecha de cobro de clientes manuales.
- **Historial de Facturas:** Integración directa con la API de Stripe para descargar las últimas facturas pagadas en PDF sin salir del CRM.

### 4. Pipeline de Ventas (Kanban)
- Gestión de leads por etapas (Contacto, Negociación, Cierre).
- Notas, recordatorios y trazabilidad comercial.

---

## 🛠️ Stack Tecnológico

**Frontend (Interfaz de Usuario)**
- React.js + Vite
- Tailwind CSS (Estilos y Diseño UI/UX)
- Lucide React (Iconografía)
- React Hot Toast (Notificaciones)

**Backend & Base de Datos**
- Supabase (PostgreSQL)
- Supabase Edge Functions (Deno / TypeScript) para Webhooks e integración API.

**Integraciones de Terceros**
- Stripe API (Billing, Subscriptions, Invoices, Webhooks).
- Hostinger (Despliegue y Hosting del Frontend).

---

## 🔒 Seguridad y Buenas Prácticas
- Las claves privadas de Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) residen cifradas exclusivamente en los *Secrets* del servidor de Supabase.
- Configuración de exclusiones de Git (`.gitignore`) para credenciales de despliegue (`_deploy.js`) y variables de entorno (`.env`).
- Restricción de edición de registros automáticos en frontend para mantener a Stripe como *Single Source of Truth*.

---
*© 2026 Vestra Solutions LLC. Todos los derechos reservados.*
