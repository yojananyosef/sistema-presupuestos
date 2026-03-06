import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// GET /api/configuracion/publica — Datos públicos de la empresa (sin auth)
export async function GET() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  const { data } = await supabase
    .from("configuracion")
    .select("clave, valor")
    .in("clave", ["empresa_nombre"]);

  const config = Object.fromEntries(
    (data ?? []).map((c: { clave: string; valor: string }) => [c.clave, c.valor])
  );

  return NextResponse.json({
    empresaNombre: config.empresa_nombre || "Zinc Industrial",
  });
}
