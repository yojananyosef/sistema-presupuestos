import { z } from "zod";

// ── Esquemas de items ────────────────────────────────────────────────────
export const esquemaItem = z.object({
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  productoId: z.string().min(1, "Seleccione un producto"),
  cantidad: z.number().int().min(1, "Mínimo 1 unidad"),
  anchoM: z.number().positive("El ancho debe ser mayor a 0"),
  largoM: z.number().positive("El largo debe ser mayor a 0"),
  m2: z.number().nonnegative(),
  precioUnitario: z.number().nonnegative(),
  precioTotal: z.number().nonnegative(),
});

// ── Esquema para crear presupuesto ───────────────────────────────────────
export const esquemaCrearPresupuesto = z.object({
  clienteNombre: z.string().min(1, "El nombre del cliente es obligatorio"),
  clienteRut: z.string().optional().nullable(),
  clienteEmail: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  clienteTelefono: z.string().optional().nullable(),
  clienteDireccion: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  items: z.array(esquemaItem).min(1, "Debe agregar al menos un ítem"),
  tiempoEjecucion: z.string().optional().nullable(),
  condiciones: z.string().optional().nullable(),
  estado: z.enum(["borrador", "emitido"]).default("borrador"),
});

// ── Esquema para actualizar presupuesto ──────────────────────────────────
export const esquemaActualizarPresupuesto = esquemaCrearPresupuesto.partial().extend({
  estado: z.enum(["borrador", "emitido", "aprobado", "rechazado"]).optional(),
});

// ── Esquema de login ─────────────────────────────────────────────────────
export const esquemaLogin = z.object({
  email: z.string().email("Email inválido"),
  contrasena: z.string().min(1, "La contraseña es obligatoria"),
});

// ── Esquema de configuración ─────────────────────────────────────────────
export const esquemaConfiguracion = z.object({
  clave: z.string().min(1),
  valor: z.string().min(1),
});

export const esquemaConfiguracionMultiple = z.array(esquemaConfiguracion);

// ── Esquema de producto zinc ─────────────────────────────────────────────
export const esquemaProductoZinc = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.string().min(1, "El tipo es obligatorio"),
  descripcion: z.string().optional().nullable(),
  precioPorM2: z.number().positive("El precio debe ser mayor a 0"),
  anchoEstandarM: z.number().positive("El ancho debe ser mayor a 0"),
  precioMinimo: z.number().nonnegative("El precio mínimo no puede ser negativo"),
});

// ── Esquema de usuario ───────────────────────────────────────────────────
export const esquemaCrearUsuario = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
  rol: z.enum(["admin", "usuario"]).default("usuario"),
});

// ── Esquema de contacto widget ───────────────────────────────────────────
export const esquemaContactoWidget = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  productoTipo: z.string().min(1),
  anchoM: z.number().positive(),
  largoM: z.number().positive(),
  cantidad: z.number().int().positive(),
  precioEstimado: z.number().nonnegative(),
  mensaje: z.string().optional(),
});

// Tipos inferidos
export type CrearPresupuestoInput = z.infer<typeof esquemaCrearPresupuesto>;
export type ActualizarPresupuestoInput = z.infer<typeof esquemaActualizarPresupuesto>;
export type LoginInput = z.infer<typeof esquemaLogin>;
export type ProductoZincInput = z.infer<typeof esquemaProductoZinc>;
export type CrearUsuarioInput = z.infer<typeof esquemaCrearUsuario>;
export type ContactoWidgetInput = z.infer<typeof esquemaContactoWidget>;
