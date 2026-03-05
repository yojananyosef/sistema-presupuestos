import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth/config";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE = 512 * 1024; // 512KB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const FILE_NAME = "logo.png";

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user || sesion.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Use PNG, JPG, WebP o SVG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `El archivo excede el límite de ${MAX_SIZE / 1024}KB` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const destPath = path.join(process.cwd(), "public", FILE_NAME);

  await writeFile(destPath, buffer);

  // Guardar la referencia en configuración
  const supabase = await crearClienteServidor();
  await supabase
    .from("configuracion")
    .upsert({ clave: "pdf_logo_url", valor: `/${FILE_NAME}` }, { onConflict: "clave" });

  return NextResponse.json({ url: `/${FILE_NAME}` });
}
