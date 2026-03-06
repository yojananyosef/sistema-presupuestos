import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";

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

  // Verificar propiedad del presupuesto
  if (sesion.user.rol !== "admin") {
    const { data: presupuesto } = await supabase
      .from("presupuestos")
      .select("usuario_id")
      .eq("id", id)
      .single();

    if (!presupuesto || presupuesto.usuario_id !== sesion.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("historial_presupuestos")
    .select("*, perfiles(nombre)")
    .eq("presupuesto_id", id)
    .order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
