"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const navegacionBase = [
  { nombre: "Dashboard", href: "/", icono: LayoutDashboard },
  { nombre: "Presupuestos", href: "/presupuestos", icono: FileText },
];

const navegacionAdmin = [
  { nombre: "Configuración", href: "/configuracion", icono: Settings },
];

interface SidebarProps {
  rol: string;
  nombreEmpresa?: string;
  logoUrl?: string;
}

export function Sidebar({ rol, nombreEmpresa = "Mi Empresa", logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const items = rol === "admin" ? [...navegacionBase, ...navegacionAdmin] : navegacionBase;

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="h-[57px] flex items-center px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nombreEmpresa}
                className="h-9 w-9 rounded-lg object-contain shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Leaf className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-semibold text-sm truncate block">{nombreEmpresa}</span>
              <p className="text-xs text-muted-foreground">Presupuestos</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const activo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icono = item.icono;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activo
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icono className="h-4 w-4" />
                {item.nombre}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">
            Sistema v1.0 — © {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 flex justify-around py-2 px-1">
        {items.map((item) => {
          const activo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-[64px]",
                activo ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icono className="h-5 w-5" />
              <span>{item.nombre}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
