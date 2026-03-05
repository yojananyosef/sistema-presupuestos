import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes del lado del cliente (browser)
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
