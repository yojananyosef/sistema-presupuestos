import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";
import { esquemaCrearPresupuesto } from "@/lib/validaciones/esquemas";
import type { ItemPresupuesto } from "@/types";
import { redondearMoneda } from "@/lib/calculos/precios-zinc";

// GET /api/presupuestos — Listar presupuestos con filtros y paginación
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = await crearClienteServidor();
  const { searchParams } = new URL(request.url);
  const pagina = parseInt(searchParams.get("pagina") ?? "1");
  const porPagina = parseInt(searchParams.get("porPagina") ?? "10");
  const estado = searchParams.get("estado");
  const busqueda = searchParams.get("busqueda");

  let query = supabase
    .from("presupuestos")
    .select("*, perfiles(nombre)", { count: "exact" });

  // Usuarios normales solo ven sus propios presupuestos
  if (sesion.user.rol !== "admin") {
    query = query.eq("usuario_id", sesion.user.id);
  }

  if (estado) {
    query = query.eq("estado", estado);
  }
  if (busqueda) {
    query = query.ilike("cliente_nombre", `%${busqueda}%`);
  }

  const desde = (pagina - 1) * porPagina;
  const hasta = desde + porPagina - 1;

  const { data: datos, count, error } = await query
    .order("creado_en", { ascending: false })
    .range(desde, hasta);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    datos,
    paginacion: {
      pagina,
      porPagina,
      total: count ?? 0,
      totalPaginas: Math.ceil((count ?? 0) / porPagina),
    },
  });
}

// POST /api/presupuestos — Crear presupuesto con correlativo automático
export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const validacion = esquemaCrearPresupuesto.safeParse(body);

  if (!validacion.success) {
    console.log('[PRESUPUESTOS POST] Validation error:', JSON.stringify(validacion.error.flatten(), null, 2));
    return NextResponse.json(
      { error: "Datos inválidos", detalles: validacion.error.flatten() },
      { status: 400 }
    );
  }

  const datos = validacion.data;
  const supabase = await crearClienteServidor();

  // Obtener correlativo atómicamente usando la función SQL
  const { data: correlativoData, error: corrError } = await supabase
    .rpc("siguiente_correlativo");

  if (corrError) {
    return NextResponse.json({ error: "Error al generar correlativo" }, { status: 500 });
  }

  const correlativo = correlativoData as number;

  // Obtener IVA desde configuración
  const { data: configIva } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "iva_porcentaje")
    .single();

  const ivaPorcentaje = parseFloat(configIva?.valor ?? "19");

  // Obtener productos para recalcular precios server-side
  const productoIds = [...new Set(datos.items.map((item) => item.productoId))];
  const { data: productosDb } = await supabase
    .from("productos_zinc")
    .select("id, precio_por_m2, precio_minimo")
    .in("id", productoIds)
    .eq("activo", true);

  if (!productosDb || productosDb.length !== productoIds.length) {
    return NextResponse.json(
      { error: "Uno o más productos no encontrados o inactivos" },
      { status: 400 }
    );
  }

  const productosMap = new Map(productosDb.map((p) => [p.id, p]));

  // Recalcular precios server-side (no confiar en valores del cliente)
  const items: ItemPresupuesto[] = datos.items.map((item) => {
    const producto = productosMap.get(item.productoId)!;
    const m2PorUnidad = item.anchoM * item.largoM;
    let precioUnitario = producto.precio_por_m2 * m2PorUnidad;
    if (precioUnitario < producto.precio_minimo) {
      precioUnitario = producto.precio_minimo;
    }
    precioUnitario = redondearMoneda(precioUnitario);
    return {
      descripcion: item.descripcion,
      productoId: item.productoId,
      cantidad: item.cantidad,
      anchoM: item.anchoM,
      largoM: item.largoM,
      m2: redondearMoneda(m2PorUnidad * item.cantidad, 2),
      precioUnitario,
      precioTotal: redondearMoneda(precioUnitario * item.cantidad),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.precioTotal, 0);
  const iva = redondearMoneda(subtotal * (ivaPorcentaje / 100));
  const total = subtotal + iva;

  const { data: nuevoPresupuesto, error: insertError } = await supabase
    .from("presupuestos")
    .insert({
      correlativo,
      usuario_id: sesion.user.id,
      cliente_nombre: datos.clienteNombre,
      cliente_rut: datos.clienteRut ?? null,
      cliente_email: datos.clienteEmail ?? null,
      cliente_telefono: datos.clienteTelefono ?? null,
      cliente_direccion: datos.clienteDireccion ?? null,
      descripcion: datos.descripcion ?? null,
      items,
      subtotal,
      iva,
      total,
      tiempo_ejecucion: datos.tiempoEjecucion ?? null,
      condiciones: datos.condiciones ?? null,
      estado: datos.estado,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Registrar en historial
  await supabase.from("historial_presupuestos").insert({
    presupuesto_id: nuevoPresupuesto.id,
    usuario_id: sesion.user.id,
    accion: "creado",
    estado_nuevo: datos.estado,
    detalles: { cliente: datos.clienteNombre, total },
  });

  return NextResponse.json(nuevoPresupuesto, { status: 201 });
}
