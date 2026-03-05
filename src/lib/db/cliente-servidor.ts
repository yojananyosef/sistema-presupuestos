import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para server components, server actions y route handlers
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const all = cookieStore.getAll();
          console.log('[SERVER] getAll cookies:', all.map(c => c.name));
          return all;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll puede fallar en Server Components si se llama desde un contexto estático
          }
        },
      },
    }
  );
}
