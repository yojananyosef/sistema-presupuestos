import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";
import * as XLSX from "xlsx";
import { redondearMoneda } from "@/lib/calculos/precios-zinc";

interface FilaExcel {
  cliente_nombre?: string;
  Cliente?: string;
  cliente_rut?: string;
  RUT?: string;
  cliente_email?: string;
  Email?: string;
  cliente_telefono?: string;
  "Teléfono"?: string;
  cliente_direccion?: string;
  "Dirección"?: string;
  descripcion?: string;
  "Descripción"?: string;
  producto?: string;
  Producto?: string;
  cantidad?: number;
  Cantidad?: number;
  ancho_m?: number;
  "Ancho (m)"?: number;
  largo_m?: number;
  "Largo (m)"?: number;
  tiempo_ejecucion?: string;
  "Tiempo Ejecución"?: string;
  condiciones?: string;
  Condiciones?: string;
}

// POST /api/presupuestos/importar — Importar presupuestos desde Excel
export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const archivo = formData.get("archivo") as File | null;

  if (!archivo) {
    return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
  }

  const bytes = await archivo.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(bytes), { type: "array" });
  const hoja = wb.Sheets[wb.SheetNames[0]];

  if (!hoja) {
    return NextResponse.json({ error: "El archivo no contiene hojas" }, { status: 400 });
  }

  const filas = XLSX.utils.sheet_to_json<FilaExcel>(hoja);

  if (filas.length === 0) {
    return NextResponse.json({ error: "El archivo no contiene datos" }, { status: 400 });
  }

  const supabase = await crearClienteServidor();

  // Obtener productos disponibles
  const { data: productosDb } = await supabase
    .from("productos_zinc")
    .select("id, nombre, precio_por_m2, precio_minimo, ancho_estandar_m")
    .eq("activo", true);

  const productos = productosDb ?? [];

  // Obtener IVA
  const { data: configIva } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "iva_porcentaje")
    .single();
  const ivaPorcentaje = parseFloat(configIva?.valor ?? "19");

  // Agrupar filas por cliente (cada cliente distinto genera un presupuesto)
  const porCliente = new Map<string, FilaExcel[]>();

  for (const fila of filas) {
    const nombre = String(fila.cliente_nombre ?? fila.Cliente ?? "").trim();
    if (!nombre) continue;
    if (!porCliente.has(nombre)) {
      porCliente.set(nombre, []);
    }
    porCliente.get(nombre)!.push(fila);
  }

  if (porCliente.size === 0) {
    return NextResponse.json(
      { error: "No se encontraron filas con nombre de cliente. Asegúrese de tener una columna 'Cliente' o 'cliente_nombre'." },
      { status: 400 }
    );
  }

  const resultados: { correlativo: number; cliente: string }[] = [];
  const errores: string[] = [];

  for (const [clienteNombre, filasCliente] of porCliente) {
    const primeraFila = filasCliente[0];

    // Datos del cliente (tomados de la primera fila del grupo)
    const clienteRut = String(primeraFila.cliente_rut ?? primeraFila.RUT ?? "").trim() || null;
    const clienteEmail = String(primeraFila.cliente_email ?? primeraFila.Email ?? "").trim() || null;
    const clienteTelefono = String(primeraFila.cliente_telefono ?? primeraFila["Teléfono"] ?? "").trim() || null;
    const clienteDireccion = String(primeraFila.cliente_direccion ?? primeraFila["Dirección"] ?? "").trim() || null;
    const descripcion = String(primeraFila.descripcion ?? primeraFila["Descripción"] ?? "").trim() || null;
    const tiempoEjecucion = String(primeraFila.tiempo_ejecucion ?? primeraFila["Tiempo Ejecución"] ?? "").trim() || null;
    const condiciones = String(primeraFila.condiciones ?? primeraFila.Condiciones ?? "").trim() || null;

    // Construir ítems
    const items = [];
    for (const fila of filasCliente) {
      const productoNombre = String(fila.producto ?? fila.Producto ?? "").trim();
      const cantidad = Number(fila.cantidad ?? fila.Cantidad) || 1;
      const largoM = Number(fila.largo_m ?? fila["Largo (m)"]) || 0;

      if (!productoNombre) {
        errores.push(`Fila de ${clienteNombre}: producto vacío, omitida`);
        continue;
      }

      // Buscar producto por nombre (case-insensitive)
      const producto = productos.find(
        (p) => p.nombre.toLowerCase() === productoNombre.toLowerCase()
      );

      if (!producto) {
        errores.push(`Producto "${productoNombre}" no encontrado para ${clienteNombre}`);
        continue;
      }

      const anchoM = Number(fila.ancho_m ?? fila["Ancho (m)"]) || producto.ancho_estandar_m;
      const m2PorUnidad = anchoM * largoM;
      const m2 = m2PorUnidad * cantidad;
      let precioUnitario = producto.precio_por_m2 * m2PorUnidad;
      if (precioUnitario < producto.precio_minimo) {
        precioUnitario = producto.precio_minimo;
      }
      precioUnitario = redondearMoneda(precioUnitario);
      const precioTotal = redondearMoneda(precioUnitario * cantidad);

      items.push({
        descripcion: producto.nombre,
        productoId: producto.id,
        cantidad,
        anchoM,
        largoM,
        m2: redondearMoneda(m2, 2),
        precioUnitario,
        precioTotal,
      });
    }

    if (items.length === 0) {
      errores.push(`${clienteNombre}: sin ítems válidos, presupuesto omitido`);
      continue;
    }

    const subtotal = items.reduce((sum, it) => sum + it.precioTotal, 0);
    const iva = redondearMoneda(subtotal * (ivaPorcentaje / 100));
    const total = subtotal + iva;

    // Obtener correlativo
    const { data: correlativoData, error: corrError } = await supabase.rpc("siguiente_correlativo");
    if (corrError) {
      errores.push(`${clienteNombre}: error al generar correlativo`);
      continue;
    }

    const { data: nuevo, error: insertError } = await supabase
      .from("presupuestos")
      .insert({
        correlativo: correlativoData as number,
        usuario_id: sesion.user.id,
        cliente_nombre: clienteNombre,
        cliente_rut: clienteRut,
        cliente_email: clienteEmail,
        cliente_telefono: clienteTelefono,
        cliente_direccion: clienteDireccion,
        descripcion,
        items,
        subtotal,
        iva,
        total,
        tiempo_ejecucion: tiempoEjecucion,
        condiciones,
        estado: "borrador",
      })
      .select("id, correlativo")
      .single();

    if (insertError) {
      errores.push(`${clienteNombre}: ${insertError.message}`);
      continue;
    }

    // Registrar en historial
    await supabase.from("historial_presupuestos").insert({
      presupuesto_id: nuevo.id,
      usuario_id: sesion.user.id,
      accion: "creado",
      estado_nuevo: "borrador",
      detalles: { cliente: clienteNombre, total, origen: "importación Excel" },
    });

    resultados.push({ correlativo: correlativoData as number, cliente: clienteNombre });
  }

  return NextResponse.json({
    importados: resultados.length,
    presupuestos: resultados,
    errores: errores.length > 0 ? errores : undefined,
  });
}
