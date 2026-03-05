# Sistema de Presupuestos y Cotizaciones Zinc

Sistema web completo para la gestión de presupuestos y cotizaciones de productos de zinc industrial. Permite crear, emitir, aprobar y exportar presupuestos en PDF, además de ofrecer un widget público de cotización embebible.

## Funcionalidades

### Autenticación y Autorización
- Login con email y contraseña vía Supabase Auth
- Roles de usuario: **admin** y **usuario**
- Protección de rutas por sesión (server-side)
- Row Level Security (RLS) en todas las tablas de Supabase

### Dashboard
- Vista resumen con KPIs: total presupuestos, facturación mensual, tasa de aprobación
- Comparativa porcentual con el mes anterior
- Distribución por estado (borrador, emitido, aprobado, rechazado) con barras de progreso
- Lista de los últimos presupuestos creados
- Tarjetas de resumen: total aprobado, pendientes, promedio por presupuesto

### Presupuestos
- **Listado** con búsqueda por nombre/correlativo, filtro por estado y paginación
- **Creación** de presupuestos con datos de cliente, ítems con productos, cálculo automático de m², precio unitario y total
- **Edición** de presupuestos existentes (en estado borrador)
- **Detalle** con toda la información del presupuesto, cliente, ítems y totales
- **Flujo de estados**: Borrador → Emitido → Aprobado/Rechazado (con posibilidad de reemitir rechazados)
- **Exportación a PDF** con plantilla profesional usando `@react-pdf/renderer`
- Correlativo automático secuencial (PRE-000001, PRE-000002...)

### Cálculo de Precios
- Cálculo automático de m² basado en ancho × largo × cantidad
- Precio por m² configurable por producto
- Precio mínimo por producto
- Subtotal, IVA (19%) y total

### Configuración (solo admin)
- **Empresa**: nombre, RUT, dirección, teléfono, email, IVA, moneda
- **Productos**: CRUD de productos zinc (nombre, tipo, precio/m², precio mínimo, ancho estándar)
- **Usuarios**: creación de usuarios con rol, activar/desactivar cuentas

### Widget Público de Cotización
- Cotizador embebible en 3 pasos: selección de producto → medidas → resultado
- Cálculo de precio en tiempo real
- Formulario de contacto para solicitar cotización formal
- Diseño responsive optimizado para móvil

## Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| PDF | @react-pdf/renderer |
| Iconos | Lucide React |
| Package Manager | Bun |

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/           # Login
│   ├── (dashboard)/      # Vistas protegidas
│   │   ├── page.tsx          # Dashboard resumen
│   │   ├── presupuestos/     # CRUD presupuestos
│   │   └── configuracion/    # Panel admin
│   ├── api/              # Route handlers
│   │   ├── auth/login/
│   │   ├── presupuestos/
│   │   ├── configuracion/
│   │   ├── widget/cotizar/
│   │   └── contacto/
│   └── widget/           # Cotizador público
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   ├── layout/           # Sidebar, Header
│   └── presupuestos/     # Formulario, CambiarEstado
├── lib/
│   ├── auth/             # Config Supabase Auth
│   ├── db/               # Clientes Supabase (navegador/servidor)
│   ├── calculos/         # Lógica de precios zinc
│   ├── pdf/              # Generación y plantilla PDF
│   └── validaciones/     # Esquemas Zod
└── types/                # TypeScript interfaces
```

## Instalación

```bash
# Clonar repositorio
git clone <url-del-repo>
cd sistema-presupuestos-zinc

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase

# Iniciar en desarrollo
bun dev
```

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Posibles Mejoras a Futuro

### Funcionalidad
- [x] Modo oscuro (dark mode) con next-themes
- [ ] Notificaciones por email al cambiar estado de un presupuesto
- [x] Historial de cambios / auditoría por presupuesto
- [ ] Duplicar presupuesto existente
- [x] Búsqueda avanzada con filtros por fecha, rango de montos, cliente
- [x] Exportación masiva de presupuestos (Excel/CSV) e importación desde Excel
- [x] Dashboard con gráficos interactivos (recharts)
- [ ] Firma digital del cliente en presupuestos aprobados

### Técnico
- [x] Proxy de Next.js para protección de rutas (proxy.ts)
- [x] Caché de datos con SWR
- [ ] Tests unitarios y de integración (Vitest + Testing Library)
- [ ] CI/CD con GitHub Actions
- [x] Paginación server-side en listado de presupuestos
- [x] Optimistic updates en cambios de estado
- [ ] Internacionalización (i18n) para múltiples idiomas
- [ ] PWA (Progressive Web App) para uso offline

### UX/UI
- [ ] Animaciones de transición entre vistas (Framer Motion)
- [x] Drag & drop para reordenar ítems en el formulario (@dnd-kit)
- [ ] Preview en vivo del PDF antes de descargar
- [ ] Onboarding / tour guiado para nuevos usuarios
- [x] Personalización de plantilla PDF (logo, colores, pie de página)

## Licencia

Proyecto privado — Todos los derechos reservados.
