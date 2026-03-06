import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const rutasPublicas = ["/login", "/registro", "/widget"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas y assets estáticos — dejar pasar
  if (
    rutasPublicas.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/api/widget") ||
    pathname.startsWith("/api/contacto") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refrescar sesión (importante para mantener tokens válidos)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas de API protegidas (excepto las públicas ya filtradas arriba)
  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return response;
  }

  // Páginas protegidas — redirigir a login si no hay sesión
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Usuario autenticado intentando ir a /login o /registro — redirigir al dashboard
  if (pathname === "/login" || pathname === "/registro") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
