import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda CLP (pesos chilenos).
 */
export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto);
}

/**
 * Formatea una fecha ISO a formato legible en español.
 */
export function formatearFecha(fechaISO: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(fechaISO));
}

/**
 * Formatea una fecha ISO a formato corto.
 */
export function formatearFechaCorta(fechaISO: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fechaISO));
}

/**
 * Retorna la etiqueta de color CSS para un estado de presupuesto.
 */
export function colorEstado(
  estado: string
): string {
  const colores: Record<string, string> = {
    borrador: "bg-muted text-muted-foreground",
    emitido: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    aprobado: "bg-primary/10 text-primary",
    rechazado: "bg-destructive/10 text-destructive",
  };
  return colores[estado] ?? "bg-muted text-muted-foreground";
}

/**
 * Genera número de presupuesto formateado: PRE-000123
 */
export function formatearCorrelativo(correlativo: number): string {
  return `PRE-${String(correlativo).padStart(6, "0")}`;
}
