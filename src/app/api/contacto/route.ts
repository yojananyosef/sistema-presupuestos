import { NextRequest, NextResponse } from "next/server";
import { esquemaContactoWidget } from "@/lib/validaciones/esquemas";

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

  // TODO: Implementar envío de email cuando se configure el servicio de correo
  // Por ahora, logueamos la solicitud y respondemos éxito
  console.log("📧 Nueva solicitud de cotización:", {
    nombre: datos.nombre,
    email: datos.email,
    telefono: datos.telefono,
    producto: datos.productoTipo,
    dimensiones: `${datos.anchoM}m × ${datos.largoM}m × ${datos.cantidad} uds`,
    precioEstimado: datos.precioEstimado,
    mensaje: datos.mensaje,
  });

  return NextResponse.json({
    mensaje: "Solicitud de cotización recibida. Nos comunicaremos con usted a la brevedad.",
    exito: true,
  });
}
