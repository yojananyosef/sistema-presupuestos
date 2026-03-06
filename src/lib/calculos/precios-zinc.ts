import type { ProductoZinc, ResultadoCotizacion } from "@/types";

/**
 * Redondea un valor monetario evitando acumulación de errores de punto flotante.
 * Para CLP (sin centavos), decimales por defecto es 0.
 */
export function redondearMoneda(valor: number, decimales: number = 0): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

/**
 * Calcula el precio de un producto zinc según dimensiones y cantidad.
 * Lógica: precio_por_m2 × ancho × largo × cantidad
 * Si el resultado por unidad es menor al precio mínimo, se usa el precio mínimo.
 */
export function calcularPrecioZinc(
  producto: Pick<ProductoZinc, "precioPorM2" | "precioMinimo" | "nombre" | "tipo">,
  anchoM: number,
  largoM: number,
  cantidad: number
): ResultadoCotizacion {
  const m2PorUnidad = anchoM * largoM;
  const m2Total = m2PorUnidad * cantidad;

  let precioUnitario = producto.precioPorM2 * m2PorUnidad;

  // Aplicar precio mínimo si corresponde
  if (precioUnitario < producto.precioMinimo) {
    precioUnitario = producto.precioMinimo;
  }

  // Redondear unitario ANTES de multiplicar para evitar acumulación de error
  precioUnitario = redondearMoneda(precioUnitario);
  const precioTotal = redondearMoneda(precioUnitario * cantidad);

  return {
    productoNombre: producto.nombre,
    productoTipo: producto.tipo,
    anchoM,
    largoM,
    cantidad,
    m2Total,
    precioUnitario,
    precioTotal,
  };
}

/**
 * Calcula subtotal, IVA y total a partir de un array de precios de ítems.
 */
export function calcularTotales(
  preciosItems: number[],
  ivaPorcentaje: number
): { subtotal: number; iva: number; total: number } {
  const subtotal = preciosItems.reduce((sum, precio) => sum + precio, 0);
  const iva = redondearMoneda(subtotal * (ivaPorcentaje / 100));
  const total = subtotal + iva;

  return { subtotal, iva, total };
}
