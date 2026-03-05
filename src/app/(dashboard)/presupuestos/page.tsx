import Link from "next/link";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { formatearMoneda, formatearFechaCorta, colorEstado, formatearCorrelativo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Download, Pencil, X, SlidersHorizontal, FileDown } from "lucide-react";
import { ImportarExcel } from "@/components/presupuestos/importar-excel";

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function PresupuestosPage({ searchParams }: Props) {
  const params = await searchParams;
  const pagina = parseInt(params.pagina ?? "1");
  const porPagina = 10;
  const estado = params.estado;
  const busqueda = params.busqueda;
  const fechaDesde = params.fecha_desde;
  const fechaHasta = params.fecha_hasta;
  const montoMin = params.monto_min;
  const montoMax = params.monto_max;

  const supabase = await crearClienteServidor();

  let query = supabase
    .from("presupuestos")
    .select("id, correlativo, cliente_nombre, total, estado, creado_en, usuario_id", { count: "exact" });

  if (estado) {
    query = query.eq("estado", estado);
  }
  if (busqueda) {
    query = query.ilike("cliente_nombre", `%${busqueda}%`);
  }
  if (fechaDesde) {
    query = query.gte("creado_en", `${fechaDesde}T00:00:00`);
  }
  if (fechaHasta) {
    query = query.lte("creado_en", `${fechaHasta}T23:59:59`);
  }
  if (montoMin) {
    query = query.gte("total", parseInt(montoMin));
  }
  if (montoMax) {
    query = query.lte("total", parseInt(montoMax));
  }

  const desde = (pagina - 1) * porPagina;
  const hasta = desde + porPagina - 1;

  const { data: datos, count } = await query
    .order("creado_en", { ascending: false })
    .range(desde, hasta);

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / porPagina);
  const hayFiltros = busqueda || estado || fechaDesde || fechaHasta || montoMin || montoMax;

  // Construir query string para paginación
  const filtrosURL = new URLSearchParams();
  if (estado) filtrosURL.set("estado", estado);
  if (busqueda) filtrosURL.set("busqueda", busqueda);
  if (fechaDesde) filtrosURL.set("fecha_desde", fechaDesde);
  if (fechaHasta) filtrosURL.set("fecha_hasta", fechaHasta);
  if (montoMin) filtrosURL.set("monto_min", montoMin);
  if (montoMax) filtrosURL.set("monto_max", montoMax);
  const filtrosStr = filtrosURL.toString();
  const qFiltros = filtrosStr ? `&${filtrosStr}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-muted-foreground text-sm">{total} presupuestos en total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/presupuestos/exportar?formato=xlsx${filtrosStr ? `&${filtrosStr}` : ""}`} download>
              <FileDown className="h-4 w-4" />
              Excel
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/presupuestos/exportar?formato=csv${filtrosStr ? `&${filtrosStr}` : ""}`} download>
              <FileDown className="h-4 w-4" />
              CSV
            </a>
          </Button>
          <Button asChild>
            <Link href="/presupuestos/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo Presupuesto
            </Link>
          </Button>
        </div>
      </div>

      {/* Importar Excel */}
      <ImportarExcel />

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  name="busqueda"
                  defaultValue={busqueda}
                  placeholder="Buscar por nombre de cliente..."
                  className="pl-9"
                />
              </div>
              <FormSelect
                name="estado"
                defaultValue={estado}
                placeholder="Todos los estados"
                options={[
                  { value: "", label: "Todos los estados" },
                  { value: "borrador", label: "Borrador" },
                  { value: "emitido", label: "Emitido" },
                  { value: "aprobado", label: "Aprobado" },
                  { value: "rechazado", label: "Rechazado" },
                ]}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Fecha desde</Label>
                  <DatePicker name="fecha_desde" defaultValue={fechaDesde} placeholder="Desde" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Fecha hasta</Label>
                  <DatePicker name="fecha_hasta" defaultValue={fechaHasta} placeholder="Hasta" />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Monto mín.</Label>
                  <Input type="number" name="monto_min" defaultValue={montoMin ?? ""} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Monto máx.</Label>
                  <Input type="number" name="monto_max" defaultValue={montoMax ?? ""} placeholder="∞" />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button type="submit" variant="secondary">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrar
                </Button>
                {hayFiltros && (
                  <Button variant="ghost" asChild>
                    <Link href="/presupuestos">
                      <X className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabla / Cards */}
      {(datos ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No se encontraron presupuestos.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(datos ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {formatearCorrelativo(p.correlativo)}
                    </TableCell>
                    <TableCell className="font-medium">{p.cliente_nombre}</TableCell>
                    <TableCell className="text-right font-semibold">{formatearMoneda(p.total)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={colorEstado(p.estado)}>
                        {p.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatearFechaCorta(p.creado_en)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/presupuestos/${p.id}`}>Ver</Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-primary">
                          <Link href={`/api/presupuestos/${p.id}/pdf`} target="_blank">
                            <Download className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        {p.estado === "borrador" && (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link href={`/presupuestos/${p.id}/editar`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {(datos ?? []).map((p) => (
              <Link key={p.id} href={`/presupuestos/${p.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatearCorrelativo(p.correlativo)}
                      </span>
                      <Badge className={colorEstado(p.estado)}>
                        {p.estado}
                      </Badge>
                    </div>
                    <p className="font-medium">{p.cliente_nombre}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{formatearFechaCorta(p.creado_en)}</span>
                      <span className="font-semibold">{formatearMoneda(p.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              {pagina > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/presupuestos?pagina=${pagina - 1}${qFiltros}`}>
                    ← Anterior
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </span>
              {pagina < totalPaginas && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/presupuestos?pagina=${pagina + 1}${qFiltros}`}>
                    Siguiente →
                  </Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
