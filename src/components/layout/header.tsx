"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { crearClienteNavegador } from "@/lib/db/cliente";
import { LogOut, Moon, Sun, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface HeaderProps {
  nombreUsuario: string;
  emailUsuario: string;
}

export function Header({ nombreUsuario, emailUsuario }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mostrarCambio, setMostrarCambio] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [errorCambio, setErrorCambio] = useState("");
  const [exitoCambio, setExitoCambio] = useState(false);
  const [cargandoCambio, setCargandoCambio] = useState(false);

  const cambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCambio("");
    setCargandoCambio(true);

    try {
      const res = await fetch("/api/auth/cambiar-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contrasenaActual, nuevaContrasena }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorCambio(data.error || "Error al cambiar la contraseña");
        return;
      }

      setExitoCambio(true);
      setTimeout(() => {
        setMostrarCambio(false);
        setExitoCambio(false);
        setContrasenaActual("");
        setNuevaContrasena("");
      }, 2000);
    } catch {
      setErrorCambio("Error de conexión");
    } finally {
      setCargandoCambio(false);
    }
  };

  const cerrarSesion = async () => {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-[57px] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 flex items-center justify-end">
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{nombreUsuario}</p>
          <p className="text-xs text-muted-foreground">{emailUsuario}</p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {nombreUsuario.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMostrarCambio(!mostrarCambio)}
          title="Cambiar contraseña"
          className="text-muted-foreground hover:text-foreground"
        >
          <KeyRound className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Cambiar tema"
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={cerrarSesion}
          title="Cerrar sesión"
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {mostrarCambio && (
        <div className="absolute right-4 top-[57px] z-50 w-80 rounded-lg border bg-background p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-3">Cambiar contraseña</h3>
          {exitoCambio ? (
            <p className="text-sm text-green-600">¡Contraseña actualizada!</p>
          ) : (
            <form onSubmit={cambiarContrasena} className="space-y-3">
              {errorCambio && <p className="text-xs text-destructive">{errorCambio}</p>}
              <div className="space-y-1">
                <Label className="text-xs">Contraseña actual</Label>
                <Input
                  type="password"
                  value={contrasenaActual}
                  onChange={(e) => setContrasenaActual(e.target.value)}
                  required
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nueva contraseña</Label>
                <Input
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  required
                  minLength={6}
                  className="h-8 text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={cargandoCambio} className="flex-1">
                  {cargandoCambio ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setMostrarCambio(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </header>
  );
}
