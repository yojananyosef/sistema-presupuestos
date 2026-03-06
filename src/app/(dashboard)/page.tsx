import Link from "next/link";
import { crearClienteServidor } from "@/lib/db/cliente-servidor";
import { formatearMoneda, formatearFechaCorta, colorEstado, formatearCorrelativo } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, FileText, Clock, ArrowRight, BarChart3 } from "lucide-react";
import { SectionCards } from "@/components/dashboard/section-cards";
import { ChartPresupuestos } from "@/components/dashboard/chart-presupuestos";

const NOMBRE_MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function DashboardPage() {
  const supabase = await crearClienteServidor();

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);

  // Inicio para los últimos 6 meses (para el chart)
  const inicio6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
  const inicio12Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);

  const [totalRes, mesRes, mesAnteriorRes, ultimosRes, todosEstadosRes, productosRes, chartRes] = await Promise.all([
    supabase.from("presupuestos").select("*", { count: "exact", head: true }),
    supabase.from("presupuestos").select("total, estado").gte("creado_en", inicioMes.toISOString()).neq("estado", "rechazado"),
    supabase.from("presupuestos").select("total").gte("creado_en", inicioMesAnterior.toISOString()).lt("creado_en", inicioMes.toISOString()).neq("estado", "rechazado"),
    supabase.from("presupuestos").select("*").order("creado_en", { ascending: false }).limit(5),
    supabase.from("presupuestos").select("estado, total").gte("creado_en", inicio12Meses.toISOString()),
    supabase.from("productos_zinc").select("*", { count: "exact", head: true }).eq("activo", true),
    supabase.from("presupuestos").select("creado_en, total").gte("creado_en", inicio6Meses.toISOString()).order("creado_en", { ascending: true }),
  ]);

  const totalPresupuestos = totalRes.count ?? 0;
  const presupuestosMes = mesRes.data ?? [];
  const presupuestosMesAnterior = mesAnteriorRes.data ?? [];
  const totalMes = presupuestosMes.length;
  const montoMes = presupuestosMes.reduce((sum, p) => sum + (p.total ?? 0), 0);
  const montoMesAnterior = presupuestosMesAnterior.reduce((sum, p) => sum + (p.total ?? 0), 0);
  const ultimosPresupuestos = ultimosRes.data ?? [];
  const productosActivos = productosRes.count ?? 0;

  // Stats por estado
  const estadosMap: Record<string, number> = {};
  const montosPorEstado: Record<string, number> = {};
  (todosEstadosRes.data ?? []).forEach((p: { estado: string; total: number }) => {
    estadosMap[p.estado] = (estadosMap[p.estado] ?? 0) + 1;
    montosPorEstado[p.estado] = (montosPorEstado[p.estado] ?? 0) + (p.total ?? 0);
  });

  const totalConEstado = Object.values(estadosMap).reduce((a, b) => a + b, 0);

  const totalConDecision = (estadosMap.aprobado ?? 0) + (estadosMap.rechazado ?? 0);
  const tasaAprobacion = totalConDecision > 0 ? Math.round(((estadosMap.aprobado ?? 0) / totalConDecision) * 100) : 0;

  const variacionMonto = montoMesAnterior > 0
    ? Math.round(((montoMes - montoMesAnterior) / montoMesAnterior) * 100)
    : montoMes > 0 ? 100 : 0;

  const aprobadosMes = presupuestosMes.filter(p => p.estado === "aprobado").length;

  // Datos mensuales para el chart (últimos 6 meses)
  const datosMensuales: { mes: string; cantidad: number; monto: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    datosMensuales.push({ mes: NOMBRE_MESES[d.getMonth()], cantidad: 0, monto: 0 });
    (chartRes.data ?? []).forEach((p: { creado_en: string; total: number }) => {
      const pDate = new Date(p.creado_en);
      const pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
      if (pKey === mesKey) {
        datosMensuales[datosMensuales.length - 1].cantidad++;
        datosMensuales[datosMensuales.length - 1].monto += p.total ?? 0;
      }
    });
  }

  const mesActual = MESES_LARGO[ahora.getMonth()];

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de actividad — {mesActual} {ahora.getFullYear()}
          </p>
        </div>
        <Button asChild>
          <Link href="/presupuestos/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo Presupuesto
          </Link>
        </Button>
      </div>

      {/* KPI Section Cards */}
      <SectionCards
        totalPresupuestos={totalPresupuestos}
        totalMes={totalMes}
        montoMes={montoMes}
        variacionMonto={variacionMonto}
        tasaAprobacion={tasaAprobacion}
        aprobados={estadosMap.aprobado ?? 0}
        totalConDecision={totalConDecision}
        aprobadosMes={aprobadosMes}
        productosActivos={productosActivos}
      />

      {/* Chart + Estado breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Presupuestos Mensuales</CardTitle>
            <CardDescription>Últimos 6 meses de actividad</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPresupuestos data={datosMensuales} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Por Estado
            </CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["borrador", "emitido", "aprobado", "rechazado"] as const).map((estado) => {
              const cantidad = estadosMap[estado] ?? 0;
              const monto = montosPorEstado[estado] ?? 0;
              const porcentaje = totalConEstado > 0 ? Math.round((cantidad / totalConEstado) * 100) : 0;
              return (
                <div key={estado} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={colorEstado(estado)}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{cantidad}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatearMoneda(monto)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Últimos Presupuestos */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Últimos Presupuestos
            </CardTitle>
            <CardDescription>Actividad reciente</CardDescription>
          </div>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/presupuestos">
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {ultimosPresupuestos.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay presupuestos creados aún.</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/presupuestos/nuevo">Crear el primero</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {ultimosPresupuestos.map((p: Record<string, unknown>, i: number) => (
                <div key={p.id as string}>
                  <Link
                    href={`/presupuestos/${p.id}`}
                    className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">
                        {formatearCorrelativo(p.correlativo as number)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.cliente_nombre as string}</p>
                        <p className="text-xs text-muted-foreground">{formatearFechaCorta(p.creado_en as string)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={colorEstado(p.estado as string)}>
                        {p.estado as string}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums w-28 text-right">
                        {formatearMoneda(p.total as number)}
                      </span>
                    </div>
                  </Link>
                  {i < ultimosPresupuestos.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
