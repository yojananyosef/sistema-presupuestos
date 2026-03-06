"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface CambiarEstadoProps {
  presupuestoId: string;
  estadoActual: string;
  rolUsuario: string;
}

const transiciones: Record<string, string[]> = {
  borrador: ["emitido"],
  emitido: ["aprobado", "rechazado"],
  aprobado: [],
  rechazado: ["emitido"],
};

const etiquetaEstado: Record<string, string> = {
  emitido: "Emitir",
  aprobado: "Aprobar",
  rechazado: "Rechazar",
};

const iconoEstado: Record<string, React.ReactNode> = {
  emitido: <Send className="h-4 w-4" />,
  aprobado: <CheckCircle className="h-4 w-4" />,
  rechazado: <XCircle className="h-4 w-4" />,
};

const varianteEstado: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  emitido: "secondary",
  aprobado: "default",
  rechazado: "destructive",
};

export function CambiarEstado({ presupuestoId, estadoActual, rolUsuario }: CambiarEstadoProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [estadoOptimista, setEstadoOptimista] = useState(estadoActual);
  const [error, setError] = useState<string | null>(null);

  // Si no es admin, filtrar opciones que requieren admin (aprobar/rechazar)
  const todasOpciones = transiciones[estadoOptimista] ?? [];
  const opcionesDisponibles = rolUsuario === "admin"
    ? todasOpciones
    : todasOpciones.filter((e) => e !== "aprobado" && e !== "rechazado");

  if (opcionesDisponibles.length === 0) return null;

  const cambiar = async (nuevoEstado: string) => {
    const estadoPrevio = estadoOptimista;
    setEstadoOptimista(nuevoEstado);
    setError(null);

    try {
      const res = await fetch(`/api/presupuestos/${presupuestoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        throw new Error("Error al cambiar estado");
      }

      // Revalidar historial SWR
      mutate(`/api/presupuestos/${presupuestoId}/historial`);

      startTransition(() => {
        router.refresh();
      });
    } catch {
      // Rollback optimista
      setEstadoOptimista(estadoPrevio);
      setError("No se pudo cambiar el estado. Intenta de nuevo.");
    }
  };

  const todasOpcionesActuales = transiciones[estadoOptimista] ?? [];
  const opcionesActuales = rolUsuario === "admin"
    ? todasOpcionesActuales
    : todasOpcionesActuales.filter((e) => e !== "aprobado" && e !== "rechazado");

  return (
    <Card>
      <CardContent className="pt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Cambiar estado:</span>
        {opcionesActuales.map((estado) => (
          <Button
            key={estado}
            onClick={() => cambiar(estado)}
            disabled={isPending}
            variant={varianteEstado[estado]}
            size="sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : iconoEstado[estado]}
            {etiquetaEstado[estado]}
          </Button>
        ))}
        {estadoOptimista !== estadoActual && (
          <Badge variant="outline" className="text-xs animate-pulse">
            Actualizando...
          </Badge>
        )}
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </CardContent>
    </Card>
  );
}
