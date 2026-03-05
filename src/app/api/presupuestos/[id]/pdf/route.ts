import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";
import { generarPdfPresupuesto } from "@/lib/pdf/generar-pdf";
import type { ConfiguracionEmpresa, ItemPresupuesto } from "@/types";

// GET /api/presupuestos/[id]/pdf — Generar y descargar PDF
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: presupuesto } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", id)
    .single();

  if (!presupuesto) {
    return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
  }

  // Obtener configuración de empresa
  const { data: configs } = await supabase
    .from("configuracion")
    .select("clave, valor");

  const configMap = Object.fromEntries(
    (configs ?? []).map((c: { clave: string; valor: string }) => [c.clave, c.valor])
  );

  const configEmpresa: ConfiguracionEmpresa = {
    nombreEmpresa: configMap.empresa_nombre ?? "Empresa",
    rutEmpresa: configMap.empresa_rut ?? "",
    direccionEmpresa: configMap.empresa_direccion ?? "",
    telefonoEmpresa: configMap.empresa_telefono ?? "",
    emailEmpresa: configMap.empresa_email ?? "",
    ivaPorcentaje: parseFloat(configMap.iva_porcentaje ?? "19"),
    moneda: configMap.moneda ?? "CLP",
    correlativoSiguiente: parseInt(configMap.correlativo_siguiente ?? "1"),
    pdfColorPrimario: configMap.pdf_color_primario || undefined,
    pdfColorCabecera: configMap.pdf_color_cabecera || undefined,
    pdfLogoUrl: configMap.pdf_logo_url || undefined,
    pdfPieIzquierdo: configMap.pdf_pie_izquierdo || undefined,
    pdfPieDerecho: configMap.pdf_pie_derecho || undefined,
  };

  const items: ItemPresupuesto[] = presupuesto.items as ItemPresupuesto[];

  // Mapear snake_case de Supabase a camelCase para la plantilla PDF
  const presupuestoParaPdf = {
    correlativo: presupuesto.correlativo,
    clienteNombre: presupuesto.cliente_nombre,
    clienteRut: presupuesto.cliente_rut,
    clienteEmail: presupuesto.cliente_email,
    clienteTelefono: presupuesto.cliente_telefono,
    clienteDireccion: presupuesto.cliente_direccion,
    descripcion: presupuesto.descripcion,
    items,
    subtotal: presupuesto.subtotal,
    iva: presupuesto.iva,
    total: presupuesto.total,
    tiempoEjecucion: presupuesto.tiempo_ejecucion,
    condiciones: presupuesto.condiciones,
    estado: presupuesto.estado,
    creadoEn: presupuesto.creado_en,
  };

  const pdfBuffer = await generarPdfPresupuesto(presupuestoParaPdf, configEmpresa);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${presupuesto.correlativo}.pdf"`,
    },
  });
}
