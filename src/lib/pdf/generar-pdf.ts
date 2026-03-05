import { renderToBuffer } from "@react-pdf/renderer";
import { PlantillaPresupuesto } from "./plantilla-presupuesto";
import type { ConfiguracionEmpresa, ItemPresupuesto } from "@/types";

interface PresupuestoParaPdf {
  correlativo: number;
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
  estado: string;
  creadoEn: string;
}

export async function generarPdfPresupuesto(
  presupuesto: PresupuestoParaPdf,
  configuracionEmpresa: ConfiguracionEmpresa
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    PlantillaPresupuesto({ presupuesto, configuracionEmpresa })
  );

  return Buffer.from(buffer);
}
