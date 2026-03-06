import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// POST /api/auth/recuperar — Enviar email de recuperación de contraseña
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  // Determinar la URL base para el redirect
  const origin = request.headers.get("origin") || request.nextUrl.origin;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/nueva-contrasena`,
  });

  if (error) {
    console.log("[RECUPERAR] Error:", error.message);
    // No revelar si el email existe o no (seguridad)
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
