import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";
import * as XLSX from "xlsx";

// GET /api/presupuestos/exportar?formato=xlsx|csv&estado=...&busqueda=...&fecha_desde=...&fecha_hasta=...&monto_min=...&monto_max=...
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get("formato") ?? "xlsx";
  const estado = searchParams.get("estado");
  const busqueda = searchParams.get("busqueda");
  const fechaDesde = searchParams.get("fecha_desde");
  const fechaHasta = searchParams.get("fecha_hasta");
  const montoMin = searchParams.get("monto_min");
  const montoMax = searchParams.get("monto_max");

  const supabase = await crearClienteServidor();

  let query = supabase
    .from("presupuestos")
    .select("correlativo, cliente_nombre, cliente_rut, cliente_email, cliente_telefono, descripcion, items, subtotal, iva, total, estado, creado_en");

  if (estado) query = query.eq("estado", estado);
  if (busqueda) query = query.ilike("cliente_nombre", `%${busqueda}%`);
  if (fechaDesde) query = query.gte("creado_en", `${fechaDesde}T00:00:00`);
  if (fechaHasta) query = query.lte("creado_en", `${fechaHasta}T23:59:59`);
  if (montoMin) query = query.gte("total", parseInt(montoMin));
  if (montoMax) query = query.lte("total", parseInt(montoMax));

  const { data, error } = await query.order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filas = (data ?? []).map((p) => ({
    Correlativo: `PRE-${String(p.correlativo).padStart(6, "0")}`,
    Cliente: p.cliente_nombre,
    RUT: p.cliente_rut ?? "",
    Email: p.cliente_email ?? "",
    Teléfono: p.cliente_telefono ?? "",
    Descripción: p.descripcion ?? "",
    "Cant. Ítems": Array.isArray(p.items) ? p.items.length : 0,
    Subtotal: p.subtotal,
    IVA: p.iva,
    Total: p.total,
    Estado: p.estado,
    Fecha: new Date(p.creado_en).toLocaleDateString("es-CL"),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filas);

  // Ajustar ancho de columnas
  ws["!cols"] = [
    { wch: 14 }, // Correlativo
    { wch: 30 }, // Cliente
    { wch: 14 }, // RUT
    { wch: 25 }, // Email
    { wch: 15 }, // Teléfono
    { wch: 30 }, // Descripción
    { wch: 12 }, // Cant. Ítems
    { wch: 12 }, // Subtotal
    { wch: 12 }, // IVA
    { wch: 12 }, // Total
    { wch: 12 }, // Estado
    { wch: 12 }, // Fecha
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Presupuestos");

  if (formato === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="presupuestos.csv"`,
      },
    });
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="presupuestos.xlsx"`,
    },
  });
}
