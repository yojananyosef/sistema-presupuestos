import { crearClienteServidor } from "@/lib/db/cliente-servidor";

export interface SesionUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

/**
 * Obtiene la sesión del usuario actual (server-side).
 * Retorna el usuario con su perfil de la tabla `perfiles`, o null si no hay sesión.
 */
export async function obtenerSesion(): Promise<{ user: SesionUsuario } | null> {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil, error: perfilError } = await supabase
    .from("perfiles")
    .select("nombre, email, rol")
    .eq("id", user.id)
    .single();

  if (!perfil) return null;

  return {
    user: {
      id: user.id,
      nombre: perfil.nombre,
      email: perfil.email,
      rol: perfil.rol,
    },
  };
}
