"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { crearClienteNavegador } from "@/lib/db/cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [sesionValida, setSesionValida] = useState(false);

  useEffect(() => {
    // Supabase redirige con un hash que contiene el token de recovery
    // El cliente Supabase lo detecta automáticamente y establece la sesión
    const supabase = crearClienteNavegador();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSesionValida(true);
      }
    });
  }, []);

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nuevaContrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.updateUser({
      password: nuevaContrasena,
    });

    if (error) {
      setError(error.message);
      setCargando(false);
      return;
    }

    setExito(true);
    setTimeout(() => {
      router.push("/presupuestos");
    }, 2000);
  };

  if (exito) {
    return (
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white">
              <Leaf className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">¡Contraseña actualizada!</CardTitle>
            <CardDescription>
              Tu contraseña ha sido cambiada exitosamente. Redirigiendo...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!sesionValida) {
    return (
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Leaf className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Verificando enlace...</CardTitle>
            <CardDescription>
              Estamos validando tu enlace de recuperación. Si el enlace expiró o es inválido,{" "}
              <a href="/recuperar" className="text-primary hover:underline font-medium">
                solicita uno nuevo
              </a>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Nueva Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nueva">Nueva contraseña</Label>
              <Input
                id="nueva"
                type="password"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <Input
                id="confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repita la contraseña"
              />
            </div>

            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Guardando..." : "Guardar nueva contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
