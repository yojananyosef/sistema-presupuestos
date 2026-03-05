"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Download, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function ImportarExcel() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<{
    importados: number;
    presupuestos: { correlativo: number; cliente: string }[];
    errores?: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const subirArchivo = async (archivo: File) => {
    setSubiendo(true);
    setError("");
    setResultado(null);

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const res = await fetch("/api/presupuestos/importar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al importar");
      } else {
        setResultado(data);
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    }

    setSubiendo(false);
  };

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      subirArchivo(archivo);
    }
  };

  const cerrar = () => {
    setAbierto(false);
    setResultado(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  if (!abierto) {
    return (
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Upload className="h-4 w-4" />
        Importar Excel
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Importar desde Excel</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cerrar}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Suba un archivo Excel (.xlsx) con los datos de presupuestos. Cada fila con el mismo nombre de cliente se agrupa en un presupuesto.
          Los nombres de producto deben coincidir con los productos registrados.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/presupuestos/importar/plantilla" download>
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </a>
          </Button>

          <Button
            size="sm"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {subiendo ? "Importando..." : "Seleccionar Archivo"}
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={manejarCambio}
            className="hidden"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resultado && (
          <div className="space-y-3">
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Se importaron <strong>{resultado.importados}</strong> presupuesto(s) como borrador.
              </AlertDescription>
            </Alert>

            {resultado.presupuestos.length > 0 && (
              <div className="space-y-1">
                {resultado.presupuestos.map((p) => (
                  <div key={p.correlativo} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">PRE-{String(p.correlativo).padStart(6, "0")}</Badge>
                    <span>{p.cliente}</span>
                  </div>
                ))}
              </div>
            )}

            {resultado.errores && resultado.errores.length > 0 && (
              <div className="text-sm space-y-1">
                <p className="font-medium text-destructive">Advertencias:</p>
                {resultado.errores.map((err, i) => (
                  <p key={i} className="text-muted-foreground text-xs">• {err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
