// Esta ruta ya no se usa con Supabase Auth.
// Supabase maneja la autenticación del lado del cliente.
// Se mantiene el archivo vacío para evitar 404 en posibles llamadas legacy.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Usar Supabase Auth" }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Usar Supabase Auth" }, { status: 410 });
}
