import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { obtenerSesion } from "@/lib/auth/config";

// POST /api/auth/cambiar-contrasena — Cambiar contraseña (usuario logueado)
export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { contrasenaActual, nuevaContrasena } = await request.json();

  if (!nuevaContrasena || nuevaContrasena.length < 6) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const supabase = await crearClienteServidor();

  // Verificar contraseña actual intentando login
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: sesion.user.email,
    password: contrasenaActual,
  });

  if (loginError) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
  }

  // Actualizar contraseña
  const { error } = await supabase.auth.updateUser({
    password: nuevaContrasena,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
