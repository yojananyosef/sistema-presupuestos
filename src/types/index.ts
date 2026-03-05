// Tipos globales del sistema de presupuestos

export interface ItemPresupuesto {
  descripcion: string;
  productoId: string;
  cantidad: number;
  anchoM: number;
  largoM: number;
  m2: number;
  precioUnitario: number;
  precioTotal: number;
}

export interface Presupuesto {
  id: string;
  correlativo: number;
  usuarioId: string;
  clienteNombre: string;
  clienteRut: string | null;
  clienteEmail: string | null;
  clienteTelefono: string | null;
  clienteDireccion: string | null;
  descripcion: string | null;
  items: ItemPresupuesto[];
  subtotal: number;
  iva: number;
  total: number;
  tiempoEjecucion: string | null;
  condiciones: string | null;
  estado: "borrador" | "emitido" | "aprobado" | "rechazado";
  creadoEn: string;
  actualizadoEn: string;
  // Relaciones opcionales
  usuario?: {
    id: string;
    nombre: string;
    email: string;
  };
}

export interface ProductoZinc {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  precioPorM2: number;
  anchoEstandarM: number;
  precioMinimo: number;
  activo: boolean;
  creadoEn: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "usuario";
  activo: boolean;
  creadoEn: string;
}

export interface ConfiguracionEmpresa {
  nombreEmpresa: string;
  rutEmpresa: string;
  direccionEmpresa: string;
  telefonoEmpresa: string;
  emailEmpresa: string;
  ivaPorcentaje: number;
  moneda: string;
  correlativoSiguiente: number;
  pdfColorPrimario?: string;
  pdfColorCabecera?: string;
  pdfLogoUrl?: string;
  pdfPieIzquierdo?: string;
  pdfPieDerecho?: string;
}

export interface ResultadoCotizacion {
  productoNombre: string;
  productoTipo: string;
  anchoM: number;
  largoM: number;
  cantidad: number;
  m2Total: number;
  precioUnitario: number;
  precioTotal: number;
}
