import { notFound } from "next/navigation";
import Link from "next/link";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { formatearMoneda, formatearFecha, colorEstado, formatearCorrelativo } from "@/lib/utils";
import type { ItemPresupuesto } from "@/types";
import { CambiarEstado } from "@/components/presupuestos/vista-presupuesto";
import { HistorialPresupuesto } from "@/components/presupuestos/historial-presupuesto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Pencil, ArrowLeft, User, MapPin, Mail, Phone, Clock, FileText } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetallePresupuestoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: presupuesto } = await supabase
    .from("presupuestos")
    .select("*, perfiles(nombre, email)")
    .eq("id", id)
    .single();

  if (!presupuesto) {
    notFound();
  }

  const usuario = presupuesto.perfiles as { nombre: string; email: string } | null;
  const items: ItemPresupuesto[] = presupuesto.items as ItemPresupuesto[];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {formatearCorrelativo(presupuesto.correlativo)}
            </h1>
            <Badge className={colorEstado(presupuesto.estado)}>
              {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Creado el {formatearFecha(presupuesto.creado_en)} por {usuario?.nombre ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="default">
            <Link href={`/api/presupuestos/${id}/pdf`} target="_blank">
              <Download className="h-4 w-4" />
              Descargar PDF
            </Link>
          </Button>
          {presupuesto.estado === "borrador" && (
            <Button asChild variant="outline">
              <Link href={`/presupuestos/${id}/editar`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Cambiar Estado */}
      <CambiarEstado presupuestoId={id} estadoActual={presupuesto.estado} />

      {/* Datos del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">Nombre</span>
                <p className="font-medium">{presupuesto.cliente_nombre}</p>
              </div>
            </div>
            {presupuesto.cliente_rut && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">RUT</span>
                  <p className="font-medium">{presupuesto.cliente_rut}</p>
                </div>
              </div>
            )}
            {presupuesto.cliente_email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">Email</span>
                  <p className="font-medium">{presupuesto.cliente_email}</p>
                </div>
              </div>
            )}
            {presupuesto.cliente_telefono && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">Teléfono</span>
                  <p className="font-medium">{presupuesto.cliente_telefono}</p>
                </div>
              </div>
            )}
            {presupuesto.cliente_direccion && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-xs">Dirección</span>
                  <p className="font-medium">{presupuesto.cliente_direccion}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Descripción */}
      {presupuesto.descripcion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{presupuesto.descripcion}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Ítems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de Ítems</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-center">Medidas</TableHead>
                  <TableHead className="text-right">M²</TableHead>
                  <TableHead className="text-right">P. Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell className="text-center">{item.cantidad}</TableCell>
                    <TableCell className="text-center">{item.anchoM}m × {item.largoM}m</TableCell>
                    <TableCell className="text-right">{item.m2.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{formatearMoneda(item.precioUnitario)}</TableCell>
                    <TableCell className="text-right font-medium">{formatearMoneda(item.precioTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {items.map((item, i) => (
              <div key={i} className="border rounded-lg p-3 text-sm">
                <p className="font-medium">{item.descripcion}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Cantidad: {item.cantidad}</span>
                  <span>Medidas: {item.anchoM}×{item.largoM}m</span>
                  <span>M²: {item.m2.toFixed(1)}</span>
                  <span className="font-semibold text-foreground">Total: {formatearMoneda(item.precioTotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totales */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatearMoneda(presupuesto.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span className="font-medium">{formatearMoneda(presupuesto.iva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatearMoneda(presupuesto.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempo y Condiciones */}
      {(presupuesto.tiempo_ejecucion || presupuesto.condiciones) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {presupuesto.tiempo_ejecucion && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold">Tiempo de Ejecución</h3>
                  <p className="text-sm text-muted-foreground">{presupuesto.tiempo_ejecucion}</p>
                </div>
              </div>
            )}
            {presupuesto.condiciones && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Condiciones Comerciales</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{presupuesto.condiciones}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial de Cambios */}
      <HistorialPresupuesto presupuestoId={id} />

      <div className="pb-20 md:pb-0">
        <Button variant="ghost" asChild>
          <Link href="/presupuestos">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>
        </Button>
      </div>
    </div>
  );
}
