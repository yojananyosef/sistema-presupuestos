import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";
import { esquemaConfiguracionMultiple, esquemaProductoZinc, esquemaCrearUsuario } from "@/lib/validaciones/esquemas";

// GET /api/configuracion — Obtener toda la configuración
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = await crearClienteServidor();

  const [configRes, productosRes, usuariosRes] = await Promise.all([
    supabase.from("configuracion").select("clave, valor"),
    supabase.from("productos_zinc").select("*"),
    sesion.user.rol === "admin"
      ? supabase.from("perfiles").select("id, nombre, email, rol, activo, creado_en")
      : Promise.resolve({ data: [] }),
  ]);

  const configMap = Object.fromEntries(
    (configRes.data ?? []).map((c: { clave: string; valor: string }) => [c.clave, c.valor])
  );

  // Mapear productos a camelCase para el frontend
  const productosCamel = (productosRes.data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    descripcion: p.descripcion,
    precioPorM2: p.precio_por_m2,
    precioMinimo: p.precio_minimo,
    anchoEstandarM: p.ancho_estandar_m,
    activo: p.activo,
  }));

  return NextResponse.json({
    configuracion: configMap,
    productos: productosCamel,
    usuarios: usuariosRes.data ?? [],
  });
}

// PUT /api/configuracion — Actualizar configuración (solo admin)
export async function PUT(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user || sesion.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = await crearClienteServidor();
  const body = await request.json();
  const { accion } = body;

  // Actualizar configuraciones clave/valor
  if (accion === "configuracion") {
    const validacion = esquemaConfiguracionMultiple.safeParse(body.datos);
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    for (const config of validacion.data) {
      await supabase
        .from("configuracion")
        .update({ valor: config.valor })
        .eq("clave", config.clave);
    }

    return NextResponse.json({ mensaje: "Configuración actualizada" });
  }

  // Crear/actualizar producto zinc
  if (accion === "producto") {
    const validacion = esquemaProductoZinc.safeParse(body.datos);
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.flatten() }, { status: 400 });
    }

    // Mapear camelCase → snake_case para Supabase
    const datosDb = {
      nombre: validacion.data.nombre,
      tipo: validacion.data.tipo,
      descripcion: validacion.data.descripcion ?? null,
      precio_por_m2: validacion.data.precioPorM2,
      precio_minimo: validacion.data.precioMinimo,
      ancho_estandar_m: validacion.data.anchoEstandarM,
    };

    if (body.id) {
      const { data } = await supabase
        .from("productos_zinc")
        .update(datosDb)
        .eq("id", body.id)
        .select()
        .single();
      return NextResponse.json(data);
    } else {
      const { data } = await supabase
        .from("productos_zinc")
        .insert(datosDb)
        .select()
        .single();
      return NextResponse.json(data, { status: 201 });
    }
  }

  // Crear usuario via Supabase Auth
  if (accion === "usuario") {
    const validacion = esquemaCrearUsuario.safeParse(body.datos);
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.flatten() }, { status: 400 });
    }

    const { contrasena, nombre, email, rol } = validacion.data;

    // Crear usuario en Supabase Auth (el trigger handle_new_user crea el perfil)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: contrasena,
      options: {
        data: { nombre, rol },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({
      id: authData.user?.id,
      nombre,
      email,
      rol,
      activo: true,
    }, { status: 201 });
  }

  // Activar/desactivar usuario
  if (accion === "toggleUsuario") {
    const { id, activo } = body;
    await supabase
      .from("perfiles")
      .update({ activo })
      .eq("id", id);
    return NextResponse.json({ mensaje: "Usuario actualizado" });
  }

  // Activar/desactivar producto
  if (accion === "toggleProducto") {
    const { id, activo } = body;
    await supabase
      .from("productos_zinc")
      .update({ activo })
      .eq("id", id);
    return NextResponse.json({ mensaje: "Producto actualizado" });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
