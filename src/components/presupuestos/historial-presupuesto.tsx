"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Plus, Pencil, ArrowRightLeft } from "lucide-react";

interface EntradaHistorial {
  id: string;
  accion: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  detalles: Record<string, unknown>;
  creado_en: string;
  perfiles: { nombre: string } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const iconoAccion: Record<string, React.ReactNode> = {
  creado: <Plus className="h-3.5 w-3.5" />,
  editado: <Pencil className="h-3.5 w-3.5" />,
  estado_cambiado: <ArrowRightLeft className="h-3.5 w-3.5" />,
};

const colorAccion: Record<string, string> = {
  creado: "bg-primary/10 text-primary",
  editado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  estado_cambiado: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function formatearTiempo(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

function descripcionAccion(entrada: EntradaHistorial): string {
  switch (entrada.accion) {
    case "creado":
      return "Presupuesto creado";
    case "editado":
      return "Presupuesto editado";
    case "estado_cambiado":
      return `Estado: ${entrada.estado_anterior} → ${entrada.estado_nuevo}`;
    default:
      return entrada.accion;
  }
}

export function HistorialPresupuesto({ presupuestoId }: { presupuestoId: string }) {
  const { data, isLoading } = useSWR<EntradaHistorial[]>(
    `/api/presupuestos/${presupuestoId}/historial`,
    fetcher
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Historial de Cambios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">Sin registros de historial.</p>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
            {data.map((entrada) => (
              <div key={entrada.id} className="relative flex gap-3 pb-4 last:pb-0">
                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background ${colorAccion[entrada.accion] ?? ""}`}>
                  {iconoAccion[entrada.accion] ?? <History className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {descripcionAccion(entrada)}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {entrada.accion}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entrada.perfiles?.nombre ?? "Sistema"} · {formatearTiempo(entrada.creado_en)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
