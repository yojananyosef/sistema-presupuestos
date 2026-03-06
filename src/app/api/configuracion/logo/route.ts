import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth/config";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";

const MAX_SIZE = 512 * 1024; // 512KB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const BUCKET = "logos";
const FILE_PATH = "empresa-logo";

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

  const supabase = await crearClienteServidor();

  // Subir a Supabase Storage (upsert sobreescribe si ya existe)
  const { error: errorStorage } = await supabase.storage
    .from(BUCKET)
    .upload(FILE_PATH, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (errorStorage) {
    return NextResponse.json(
      { error: "Error al subir el archivo: " + errorStorage.message },
      { status: 500 }
    );
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(FILE_PATH);

  const publicUrl = urlData.publicUrl;

  // Guardar la referencia en configuración
  await supabase
    .from("configuracion")
    .upsert({ clave: "pdf_logo_url", valor: publicUrl }, { onConflict: "clave" });

  return NextResponse.json({ url: publicUrl });
}
