import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { esquemaRegistro } from "@/lib/validaciones/esquemas";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validacion = esquemaRegistro.safeParse(body);
  if (!validacion.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: validacion.error.flatten() },
      { status: 400 }
    );
  }

  const { nombre, email, contrasena } = validacion.data;

  const response = NextResponse.json({ ok: true }, { status: 201 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password: contrasena,
    options: {
      data: { nombre, rol: "usuario" },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Supabase retorna user con identities vacías si el email ya existe (para evitar enumeración)
  if (data.user && data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "Este email ya está registrado" },
      { status: 409 }
    );
  }

  return response;
}
