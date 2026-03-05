"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { crearClienteNavegador } from "@/lib/db/cliente";
import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface HeaderProps {
  nombreUsuario: string;
  emailUsuario: string;
}

export function Header({ nombreUsuario, emailUsuario }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
    </header>
  );
}
