# Sistema de Presupuestos y Cotizaciones Zinc

## Proyecto
Aplicación full-stack monolítica en Next.js (App Router) con TypeScript. Dos módulos: (A) Generador de presupuestos interno y (B) Widget calculadora pública embebible.

## Stack
- Next.js 15+ con App Router y TypeScript
- Turso (libSQL) + Drizzle ORM
- Auth.js v5 (Credentials Provider + bcrypt)
- Tailwind CSS v4
- @react-pdf/renderer para PDFs
- Zod para validación

## Convenciones
- Todo el código (variables, funciones, comentarios, UI) en **español**
- Usar `src/` directory con import alias `@/*`
- Esquema de DB en `src/lib/db/esquema.ts` con Drizzle ORM
- Validaciones con Zod en `src/lib/validaciones/esquemas.ts`
- Lógica de cálculos en `src/lib/calculos/precios-zinc.ts`
- Componentes en `src/components/` organizados por módulo
- Rutas API en `src/app/api/`
- Rutas protegidas bajo `(dashboard)/` con middleware Auth.js
- Widget público en `/widget` sin autenticación

## Base de Datos
4 tablas: `usuarios`, `presupuestos`, `configuracion`, `productos_zinc`
- IDs con cuid2
- Fechas como TEXT ISO 8601
- Booleans como INTEGER (0/1)

## Seguridad
- Todas las rutas `/(dashboard)/*` protegidas por middleware
- API routes verifican sesión Auth.js (excepto widget/público)
- Contraseñas hasheadas con bcrypt
- Rol 'admin' requerido para `/configuracion`
