import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";
import { esquemaActualizarPresupuesto } from "@/lib/validaciones/esquemas";

// GET /api/presupuestos/[id] — Detalle de un presupuesto
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

  const { data: presupuesto, error } = await supabase
    .from("presupuestos")
    .select("*, perfiles(nombre)")
    .eq("id", id)
    .single();

  if (error || !presupuesto) {
    return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(presupuesto);
}

// PUT /api/presupuestos/[id] — Actualizar presupuesto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await crearClienteServidor();

  // Verificar que el presupuesto existe
  const { data: existente } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", id)
    .single();

  if (!existente) {
    return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
  }

  // Solo borradores editables (o admin puede editar cualquiera)
  if (existente.estado !== "borrador" && sesion.user.rol !== "admin") {
    return NextResponse.json(
      { error: "Solo se pueden editar presupuestos en estado borrador" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validacion = esquemaActualizarPresupuesto.safeParse(body);

  if (!validacion.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: validacion.error.flatten() },
      { status: 400 }
    );
  }

  const datos = validacion.data;

  // Mapear de camelCase a snake_case para Supabase
  const valoresActualizar: Record<string, unknown> = {};

  if (datos.clienteNombre !== undefined) valoresActualizar.cliente_nombre = datos.clienteNombre;
  if (datos.clienteRut !== undefined) valoresActualizar.cliente_rut = datos.clienteRut;
  if (datos.clienteEmail !== undefined) valoresActualizar.cliente_email = datos.clienteEmail;
  if (datos.clienteTelefono !== undefined) valoresActualizar.cliente_telefono = datos.clienteTelefono;
  if (datos.clienteDireccion !== undefined) valoresActualizar.cliente_direccion = datos.clienteDireccion;
  if (datos.descripcion !== undefined) valoresActualizar.descripcion = datos.descripcion;
  if (datos.tiempoEjecucion !== undefined) valoresActualizar.tiempo_ejecucion = datos.tiempoEjecucion;
  if (datos.condiciones !== undefined) valoresActualizar.condiciones = datos.condiciones;
  if (datos.estado !== undefined) valoresActualizar.estado = datos.estado;

  if (datos.items) {
    const items = datos.items;
    const subtotal = items.reduce((sum, item) => sum + item.precioTotal, 0);
    const ivaPorcentaje =
      existente.subtotal > 0
        ? (existente.iva / existente.subtotal) * 100
        : 19;
    const iva = Math.round(subtotal * (ivaPorcentaje / 100));
    const total = subtotal + iva;

    valoresActualizar.items = items;
    valoresActualizar.subtotal = subtotal;
    valoresActualizar.iva = iva;
    valoresActualizar.total = total;
  }

  const { data: actualizado, error } = await supabase
    .from("presupuestos")
    .update(valoresActualizar)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Registrar en historial
  const esEstado = datos.estado !== undefined && datos.estado !== existente.estado;
  await supabase.from("historial_presupuestos").insert({
    presupuesto_id: id,
    usuario_id: sesion.user.id,
    accion: esEstado ? "estado_cambiado" : "editado",
    estado_anterior: esEstado ? existente.estado : null,
    estado_nuevo: esEstado ? datos.estado : null,
    detalles: esEstado
      ? { de: existente.estado, a: datos.estado }
      : { campos: Object.keys(valoresActualizar) },
  });

  return NextResponse.json(actualizado);
}

// DELETE /api/presupuestos/[id] — Eliminar presupuesto (solo admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion?.user || sesion.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await crearClienteServidor();

  await supabase.from("presupuestos").delete().eq("id", id);

  return NextResponse.json({ mensaje: "Presupuesto eliminado" });
}
