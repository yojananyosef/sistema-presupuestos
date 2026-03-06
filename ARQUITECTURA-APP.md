# Arquitectura de la Aplicación — Sistema de Presupuestos

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase · Tailwind CSS v4 · Bun  
**Deploy:** Vercel  
**Supabase:** PostgreSQL 17

---

## Visión General

Plantilla white-label de presupuestos y cotizaciones adaptable a cualquier empresa. Tiene dos módulos:

- **Módulo A — Dashboard interno:** Gestión de presupuestos, usuarios, productos y configuración de la empresa. Protegido por autenticación.
- **Módulo B — Widget público:** Calculadora de precios embebible para clientes externos. Sin autenticación.

---

## Estructura de Carpetas

```
src/
├── app/                          # Rutas (App Router)
│   ├── layout.tsx                # Layout raíz (ThemeProvider, fuente Inter)
│   ├── globals.css               # Estilos globales Tailwind v4
│   ├── (auth)/                   # Grupo de rutas públicas de autenticación
│   │   ├── layout.tsx            # Layout centrado con fondo gradient
│   │   ├── login/page.tsx        # Inicio de sesión
│   │   ├── registro/page.tsx     # Registro de usuarios
│   │   ├── recuperar/page.tsx    # Solicitar recuperación de contraseña
│   │   └── nueva-contrasena/page.tsx  # Establecer nueva contraseña
│   ├── (dashboard)/              # Grupo de rutas protegidas
│   │   ├── layout.tsx            # Layout con Sidebar + Header (valida sesión)
│   │   ├── page.tsx              # Dashboard: KPIs + gráfico
│   │   ├── presupuestos/
│   │   │   ├── page.tsx          # Lista con filtros y paginación
│   │   │   ├── nuevo/page.tsx    # Crear presupuesto
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detalle + historial + PDF + cambiar estado
│   │   │       └── editar/page.tsx  # Editar presupuesto
│   │   └── configuracion/page.tsx  # Panel admin (empresa, productos, usuarios, PDF)
│   ├── widget/                   # Módulo público
│   │   ├── layout.tsx            # Layout standalone
│   │   └── page.tsx              # Cotizador 3 pasos
│   └── api/                      # Route Handlers
│       ├── auth/                 # Endpoints de autenticación
│       ├── presupuestos/         # CRUD presupuestos + PDF/historial/export/import
│       ├── configuracion/        # Config empresa + logo
│       ├── widget/cotizar/       # Cálculo público de precios
│       └── contacto/             # Formulario de contacto del widget
├── components/
│   ├── ui/                       # shadcn/ui (Button, Card, Input, Table, etc.)
│   ├── layout/                   # Header, Sidebar
│   ├── dashboard/                # SectionCards, ChartPresupuestos
│   └── presupuestos/             # FormularioPresupuesto, VistaPresupuesto, etc.
├── hooks/
│   └── use-nombre-empresa.ts     # Hook para obtener nombre empresa (con cache)
├── lib/
│   ├── auth/config.ts            # obtenerSesion() — validación de sesión
│   ├── calculos/precios-zinc.ts  # Lógica de cálculo de precios
│   ├── db/cliente.ts             # Supabase client (browser)
│   ├── db/cliente-servidor.ts    # Supabase client (server)
│   ├── pdf/                      # Generación PDF (@react-pdf/renderer)
│   ├── validaciones/esquemas.ts  # Schemas Zod
│   └── utils.ts                  # Helpers (formateo moneda, fechas, etc.)
├── types/index.ts                # Tipos TypeScript globales
└── proxy.ts                      # Middleware de autenticación y redirecciones
```

---

## Flujo de Autenticación

```
┌─────────────┐         ┌─────────────────┐         ┌──────────────┐
│   Browser    │ ──POST──▸ /api/auth/login  │ ──────▸ │ Supabase Auth│
│   (Login)    │         │ (route handler)  │         │ signIn()     │
└──────┬───────┘         └────────┬────────┘         └──────┬───────┘
       │                          │                          │
       │                  JWT en cookies ◂───────────────────┘
       │                          │
       ▼                          ▼
┌─────────────┐         ┌─────────────────┐
│  proxy.ts   │ ──────▸ │ obtenerSesion() │
│ (middleware) │         │  getUser() +    │
│ valida token │         │  consulta       │
│ redirecciona │         │  perfiles       │
└──────────────┘         └─────────────────┘
```

### Rutas públicas (sin autenticación):
- Páginas: `/login`, `/registro`, `/recuperar`, `/nueva-contrasena`, `/widget`
- APIs: `/api/auth/*`, `/api/widget/*`, `/api/contacto`, `/api/configuracion/publica`

### Rutas protegidas:
- Todo bajo `/(dashboard)/*` requiere sesión activa
- APIs sin prefijo público requieren sesión (verificada en `proxy.ts`)
- `/configuracion` y acciones admin requieren `rol = 'admin'`

### Flujos:

| Flujo | Pasos |
|-------|-------|
| **Registro** | POST `/api/auth/registro` → `supabase.auth.signUp()` → trigger `handle_new_user()` crea perfil |
| **Login** | POST `/api/auth/login` → `signInWithPassword()` → JWT en cookies → redirect `/presupuestos` |
| **Recuperar** | POST `/api/auth/recuperar` → `resetPasswordForEmail()` → email con link → `/nueva-contrasena` |
| **Nueva contraseña** | Supabase detecta `PASSWORD_RECOVERY` → `updateUser({ password })` |
| **Cambiar contraseña** | POST `/api/auth/cambiar-contrasena` → verifica actual → `updateUser()` |
| **Logout** | `supabase.auth.signOut()` → redirect `/login` |

---

## API Routes

### Autenticación (Públicas)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login con email/password |
| `/api/auth/registro` | POST | Registro (nombre, email, contraseña) |
| `/api/auth/recuperar` | POST | Enviar email de recuperación |
| `/api/auth/cambiar-contrasena` | POST | Cambiar contraseña (requiere sesión) |

### Presupuestos (Protegidas — filtradas por usuario)

> **Autorización:** Usuarios normales solo acceden a sus propios presupuestos. Admin ve y gestiona todos.

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/presupuestos` | GET | Listar **propios** (admin: todos) con paginación y filtros |
| `/api/presupuestos` | POST | Crear presupuesto (genera correlativo automático) |
| `/api/presupuestos/[id]` | GET | Detalle (valida propiedad, 403 si ajeno) |
| `/api/presupuestos/[id]` | PUT | Actualizar o cambiar estado (valida propiedad) |
| `/api/presupuestos/[id]` | DELETE | Eliminar (solo admin) |
| `/api/presupuestos/[id]/pdf` | GET | Generar y descargar PDF |
| `/api/presupuestos/[id]/historial` | GET | Historial de auditoría (valida propiedad) |
| `/api/presupuestos/exportar` | GET | Exportar **propios** a Excel/CSV (admin: todos) |
| `/api/presupuestos/importar` | POST | Importar desde Excel |
| `/api/presupuestos/importar/plantilla` | GET | Descargar plantilla Excel |

### Configuración (Solo Admin)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/configuracion` | GET | Obtener config + productos + usuarios |
| `/api/configuracion` | PUT | Actualizar (acciones: `configuracion`, `producto`, `usuario`, `toggleProducto`, `toggleUsuario`) |
| `/api/configuracion/logo` | POST | Subir logo → Supabase Storage (bucket `logos`) |
| `/api/configuracion/publica` | GET | Nombre empresa (pública, sin auth) |

### Widget (Públicas)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/widget/cotizar` | GET | Listar productos activos |
| `/api/widget/cotizar` | POST | Calcular precio (producto, dimensiones, cantidad) |
| `/api/contacto` | POST | Enviar solicitud de contacto/cotización |

---

## Componentes Principales

### Layout

```
┌─────────────────────────────────────────────────────┐
│                    Header                            │
│  [Logo] [Nombre Empresa]  [🔑 Cambiar pwd] [👤] [🌙]│
├────────────┬────────────────────────────────────────┤
│            │                                        │
│  Sidebar   │           Contenido                    │
│            │                                        │
│  📊 Dashboard                                       │
│  📋 Presupuestos                                    │
│  ⚙️ Config*                                         │
│            │                                        │
│  v1.0      │                                        │
└────────────┴────────────────────────────────────────┘
* Solo visible para admin
* En móvil: nav inferior fijo en vez de sidebar
```

### FormularioPresupuesto

Componente para crear y editar presupuestos.

```
┌─────────────────────────────────────────────┐
│  Datos del Cliente                          │
│  ├── Nombre* · RUT · Email · Teléfono       │
│  └── Dirección                              │
├─────────────────────────────────────────────┤
│  Descripción general                        │
├─────────────────────────────────────────────┤
│  Items (drag & drop con @dnd-kit)           │
│  ┌─────────────────────────────────────┐    │
│  │ ☰ Producto ▼ | Ancho | Largo | Cant │    │
│  │   M²: auto  | Precio: auto  | 🗑️   │    │
│  └─────────────────────────────────────┘    │
│  [+ Agregar ítem]                           │
├─────────────────────────────────────────────┤
│  Subtotal:    $XXX.XXX                      │
│  IVA (19%):   $XXX.XXX                      │
│  Total:       $XXX.XXX                      │
├─────────────────────────────────────────────┤
│  Tiempo ejecución · Condiciones             │
├─────────────────────────────────────────────┤
│  [Guardar borrador]  [Guardar y emitir]     │
└─────────────────────────────────────────────┘
```

**Cálculos automáticos por ítem:**
- M² = ancho × largo × cantidad
- Precio unitario = precio_por_m2 × ancho × largo (mínimo: `precio_minimo`)
- Precio total = precio unitario × cantidad

### VistaPresupuesto (Detalle)

```
┌─────────────────────────────────────────────┐
│  PRE-000001          Estado: [Borrador ▼]   │
│  Cliente: Juan Pérez                        │
│  Creado: 15 de marzo de 2026               │
├─────────────────────────────────────────────┤
│  Tabla de ítems                             │
│  │ Descripción │ Cant │ Medidas │ M² │ $   │
├─────────────────────────────────────────────┤
│  Subtotal / IVA / Total                     │
├─────────────────────────────────────────────┤
│  [📄 PDF] [✏️ Editar] [🗑️ Eliminar]         │
├─────────────────────────────────────────────┤
│  Historial de cambios (timeline)            │
│  ├── ✅ Creado por Admin — 15/03/26 10:00   │
│  ├── ✏️ Editado por Admin — 15/03/26 11:00  │
│  └── ↔️ Estado: borrador → emitido          │
└─────────────────────────────────────────────┘
```

### Dashboard

```
┌──────────┬──────────┬──────────┬──────────┐
│  Total   │Facturac. │  Tasa    │Aprobados │
│  Presup. │  Mes     │ Aprob.   │  Mes     │
│  12 (+3) │$2.5M(+8%)│  75%     │  4       │
└──────────┴──────────┴──────────┴──────────┘
┌────────────────────────────────────────────┐
│  📈 Gráfico área — Últimos 6 meses        │
│  (cantidad y monto por mes)                │
└────────────────────────────────────────────┘
┌────────────────────────────────────────────┐
│  Tabla: Presupuestos recientes             │
└────────────────────────────────────────────┘
```

---

## Flujo de Estados (Presupuestos)

```
                    ┌──────────┐
                    │ borrador │
                    └────┬─────┘
                         │ emitir (cualquier usuario)
                         ▼
                    ┌──────────┐
              ┌─────│  emitido │─────┐
              │     └──────────┘     │
              │ aprobar              │ rechazar
              │ (solo admin)         │ (solo admin)
              ▼                      ▼
        ┌──────────┐          ┌───────────┐
        │ aprobado │          │ rechazado │
        └──────────┘          └─────┬─────┘
                                    │ reemitir
                                    │ (cualquier usuario)
                                    ▼
                              ┌──────────┐
                              │  emitido │
                              └──────────┘
```

**Restricciones:**
- Usuarios solo ven/editan/exportan **sus propios** presupuestos (admin ve todo)
- Solo admin puede aprobar o rechazar
- Los presupuestos aprobados/rechazados no se pueden editar
- Solo borradores se pueden editar (o admin para cualquiera)
- Solo admin puede eliminar presupuestos
- Cada cambio de estado se registra en `historial_presupuestos`
- Acceder a presupuesto ajeno retorna 403 Forbidden

---

## Widget Público

Calculadora de precios embebible en 3 pasos, sin autenticación:

```
PASO 1                    PASO 2                    PASO 3
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Seleccionar  │         │ Dimensiones  │         │  Resultado   │
│ producto     │  ────▸  │              │  ────▸  │              │
│              │         │ Ancho: ___ m │         │ M²: 8.75     │
│ [Acanalada]  │         │ Largo: ___ m │         │ Unit: $4.500 │
│ [Lisa]       │         │ Cant:  ___   │         │ Total: $45K  │
│ [Ondulada]   │         │              │         │ +IVA: $53K   │
│              │         │ [Cotizar]    │         │              │
│              │         │              │         │ [Contactar]  │
│              │         │              │         │ [Nueva cotiz]│
└──────────────┘         └──────────────┘         └──────────────┘
                                                         │
                                                  ┌──────▼──────┐
                                                  │ Formulario  │
                                                  │ de contacto │
                                                  │ Nombre/Email│
                                                  │ Tel/Mensaje │
                                                  │ [Enviar]    │
                                                  └─────────────┘
```

**Cálculo de precios** (`calcularPrecioZinc()`):
```
precio_unitario = precio_por_m2 × ancho × largo
si precio_unitario < precio_minimo → precio_unitario = precio_minimo
precio_total = precio_unitario × cantidad
iva = subtotal × (iva_porcentaje / 100)
total = subtotal + iva
```

---

## Generación de PDF

```
┌─────────────────────────────────────────────┐
│  [Logo]  NOMBRE EMPRESA                     │  ← config: pdf_logo_url
│          RUT · Dir · Tel · Email             │     + datos empresa
│─────────────────────────────────────────────│
│  PRESUPUESTO N° PRE-000001                  │
│  Fecha: 15/03/2026                          │
│─────────────────────────────────────────────│
│  Cliente: ...  RUT: ...  Tel: ...           │
│─────────────────────────────────────────────│
│  │ Descripción │ Cant │ Med │ M² │ P.U │ T │  ← tabla ítems
│─────────────────────────────────────────────│
│                     Subtotal: $XXX.XXX      │
│                     IVA 19%: $XXX.XXX       │
│                     TOTAL:   $XXX.XXX       │
│─────────────────────────────────────────────│
│  Tiempo ejecución: ...                      │
│  Condiciones: ...                           │
│─────────────────────────────────────────────│
│  [Pie izquierdo]          [Pie derecho]     │  ← config: pdf_pie_*
└─────────────────────────────────────────────┘

Colores configurables:
- Primario: pdf_color_primario (default #0284c7)
- Cabecera: pdf_color_cabecera (default #0f172a)
```

**Tecnología:** `@react-pdf/renderer` — genera PDF server-side en el route handler.

---

## Configuración Admin

Panel de administración con 4 pestañas:

| Pestaña | Funciones |
|---------|-----------|
| **Empresa** | Editar nombre, RUT, dirección, teléfono, email, IVA%, moneda. Subir logo (→ Supabase Storage). |
| **Productos** | CRUD de productos zinc (nombre, tipo, precio/m², precio mínimo, ancho estándar). Activar/desactivar. |
| **Usuarios** | Crear usuarios (nombre, email, contraseña, rol). Activar/desactivar (no permite desactivar admins). |
| **Plantilla PDF** | Colores primario/cabecera, textos pie de página. Vista previa del presupuesto en PDF. |

---

## Importar/Exportar Excel

### Exportar
- Descarga CSV/Excel con presupuestos filtrados
- Campos: correlativo, cliente, estado, subtotal, iva, total, fecha

### Importar
- Sube archivo Excel con plantilla predefinida
- Descarga plantilla desde `/api/presupuestos/importar/plantilla`
- Agrupa filas por `cliente_nombre` para crear presupuestos
- Retorna resumen: presupuestos creados + advertencias

---

## Seguridad

| Capa | Implementación |
|------|----------------|
| **Middleware** | `proxy.ts` valida sesión Supabase en cada request |
| **RLS** | Todas las tablas tienen Row Level Security habilitado |
| **Auth** | Supabase Auth (JWT en cookies, bcrypt passwords) |
| **Admin check** | Route handlers validan `rol = 'admin'` para acciones sensibles |
| **Validación** | Zod schemas en todas las APIs (input sanitization) |
| **Storage** | Supabase Storage con políticas RLS por bucket |
| **CORS** | Manejado por Vercel/Next.js |

---

## Dependencias Principales

| Paquete | Uso |
|---------|-----|
| `next` 16+ | Framework full-stack |
| `@supabase/ssr` | Client Supabase (browser + server) |
| `@react-pdf/renderer` | Generación PDF server-side |
| `tailwindcss` v4 | Estilos |
| `zod` | Validación de schemas |
| `swr` | Data fetching client-side |
| `@dnd-kit/*` | Drag & drop en formulario de items |
| `recharts` | Gráficos del dashboard |
| `next-themes` | Modo claro/oscuro |
| `lucide-react` | Iconos |

---

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase |

---

## Tipos Principales

```typescript
ItemPresupuesto {
  descripcion, productoId, cantidad,
  anchoM, largoM, m2,
  precioUnitario, precioTotal
}

Presupuesto {
  id, correlativo, usuarioId,
  cliente: { nombre, rut, email, telefono, direccion },
  descripcion, items[],
  subtotal, iva, total,
  tiempoEjecucion, condiciones,
  estado: "borrador" | "emitido" | "aprobado" | "rechazado",
  creadoEn, actualizadoEn,
  usuario?: { id, nombre, email }
}

ProductoZinc {
  id, nombre, tipo, descripcion,
  precioPorM2, anchoEstandarM, precioMinimo,
  activo, creadoEn
}

Usuario {
  id, nombre, email,
  rol: "admin" | "usuario",
  activo, creadoEn
}

ConfiguracionEmpresa {
  nombreEmpresa, rutEmpresa, direccionEmpresa,
  telefonoEmpresa, emailEmpresa,
  ivaPorcentaje, moneda, correlativoSiguiente,
  pdfColorPrimario, pdfColorCabecera, pdfLogoUrl,
  pdfPieIzquierdo, pdfPieDerecho
}
```

---

## Formateos Útiles (`src/lib/utils.ts`)

| Función | Ejemplo de salida |
|---------|-------------------|
| `formatearMoneda(45000)` | `$45.000` |
| `formatearFecha("2026-03-15")` | `15 de marzo de 2026` |
| `formatearFechaCorta("2026-03-15")` | `15/03/2026` |
| `formatearCorrelativo(1)` | `PRE-000001` |
| `colorEstado("aprobado")` | Clase CSS para Badge verde |
