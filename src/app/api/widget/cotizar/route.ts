import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcularPrecioZinc } from "@/lib/calculos/precios-zinc";

// Cliente público para rutas sin auth (usa anon key directamente)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/widget/cotizar — Calcular precio (ruta pública, sin auth)
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { productoId, anchoM, largoM, cantidad } = body;

  if (!productoId || !anchoM || !largoM || !cantidad) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios: productoId, anchoM, largoM, cantidad" },
      { status: 400 }
    );
  }

  const ancho = parseFloat(anchoM);
  const largo = parseFloat(largoM);
  const cant = parseInt(cantidad);

  if (isNaN(ancho) || isNaN(largo) || isNaN(cant) || ancho <= 0 || largo <= 0 || cant <= 0) {
    return NextResponse.json(
      { error: "Las dimensiones y cantidad deben ser números positivos" },
      { status: 400 }
    );
  }

  const { data: producto } = await supabase
    .from("productos_zinc")
    .select("*")
    .eq("id", productoId)
    .eq("activo", true)
    .single();

  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado o inactivo" }, { status: 404 });
  }

  const resultado = calcularPrecioZinc(
    {
      precioPorM2: producto.precio_por_m2,
      precioMinimo: producto.precio_minimo,
      nombre: producto.nombre,
      tipo: producto.tipo,
    },
    ancho,
    largo,
    cant
  );

  return NextResponse.json(resultado);
}

// GET /api/widget/cotizar — Obtener productos disponibles (ruta pública)
export async function GET() {
  const { data: productos } = await supabase
    .from("productos_zinc")
    .select("id, nombre, tipo, descripcion, precio_por_m2, ancho_estandar_m, precio_minimo")
    .eq("activo", true);

  // Mapear a camelCase para el frontend
  const productosCamel = (productos ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    descripcion: p.descripcion,
    precioPorM2: p.precio_por_m2,
    anchoEstandarM: p.ancho_estandar_m,
    precioMinimo: p.precio_minimo,
  }));

  return NextResponse.json({ productos: productosCamel });
}
