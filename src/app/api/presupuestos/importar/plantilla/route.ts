import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth/config";
import * as XLSX from "xlsx";

// GET /api/presupuestos/importar/plantilla — Descargar plantilla Excel para importación
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const filaEjemplo = [
    {
      Cliente: "Juan Pérez",
      RUT: "12.345.678-9",
      Email: "juan@empresa.cl",
      "Teléfono": "+56 9 1234 5678",
      "Dirección": "Av. Principal 123, Santiago",
      "Descripción": "Presupuesto techumbre bodega",
      Producto: "Zinc Acanalada 0.35mm",
      Cantidad: 10,
      "Ancho (m)": 0.85,
      "Largo (m)": 3.0,
      "Tiempo Ejecución": "15 días hábiles",
      Condiciones: "50% anticipo, 50% contra entrega",
    },
    {
      Cliente: "Juan Pérez",
      RUT: "12.345.678-9",
      Email: "juan@empresa.cl",
      "Teléfono": "",
      "Dirección": "",
      "Descripción": "",
      Producto: "Zinc Lisa 0.5mm",
      Cantidad: 5,
      "Ancho (m)": 1.0,
      "Largo (m)": 2.5,
      "Tiempo Ejecución": "",
      Condiciones: "",
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filaEjemplo);

  ws["!cols"] = [
    { wch: 25 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 30 },
    { wch: 30 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 20 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Presupuestos");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="plantilla-presupuestos.xlsx"`,
    },
  });
}
