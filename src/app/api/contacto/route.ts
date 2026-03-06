import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { esquemaContactoWidget } from "@/lib/validaciones/esquemas";

// Cliente público para ruta sin auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/contacto — Enviar solicitud de cotización desde el widget (ruta pública)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validacion = esquemaContactoWidget.safeParse(body);

  if (!validacion.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: validacion.error.flatten() },
      { status: 400 }
    );
  }

  const datos = validacion.data;

  const { error } = await supabase.from("solicitudes_contacto").insert({
    nombre: datos.nombre,
    email: datos.email,
    telefono: datos.telefono ?? null,
    producto_tipo: datos.productoTipo,
    ancho_m: datos.anchoM,
    largo_m: datos.largoM,
    cantidad: datos.cantidad,
    precio_estimado: datos.precioEstimado,
    mensaje: datos.mensaje ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Error al registrar la solicitud" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    mensaje: "Solicitud de cotización recibida. Nos comunicaremos con usted a la brevedad.",
    exito: true,
  });
}
