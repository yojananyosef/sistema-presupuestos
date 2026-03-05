import type { ProductoZinc, ResultadoCotizacion } from "@/types";

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

  const precioTotal = precioUnitario * cantidad;

  return {
    productoNombre: producto.nombre,
    productoTipo: producto.tipo,
    anchoM,
    largoM,
    cantidad,
    m2Total,
    precioUnitario: Math.round(precioUnitario),
    precioTotal: Math.round(precioTotal),
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
  const iva = Math.round(subtotal * (ivaPorcentaje / 100));
  const total = subtotal + iva;

  return { subtotal, iva, total };
}
