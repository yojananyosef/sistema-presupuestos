import { TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatearMoneda } from "@/lib/utils"

interface SectionCardsProps {
  totalPresupuestos: number
  totalMes: number
  montoMes: number
  variacionMonto: number
  tasaAprobacion: number
  aprobados: number
  totalConDecision: number
  aprobadosMes: number
  montoAprobadoMes: number
  productosActivos: number
}

export function SectionCards({
  totalPresupuestos,
  totalMes,
  montoMes,
  variacionMonto,
  tasaAprobacion,
  aprobados,
  totalConDecision,
  aprobadosMes,
  montoAprobadoMes,
  productosActivos,
}: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Presupuestos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalPresupuestos}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-3" />
              +{totalMes} este mes
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalMes} nuevos este mes <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total acumulado en el sistema
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Facturación del Mes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatearMoneda(montoMes)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {variacionMonto >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {variacionMonto >= 0 ? "+" : ""}
              {variacionMonto}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {variacionMonto >= 0 ? "Tendencia al alza" : "Tendencia a la baja"}{" "}
            {variacionMonto >= 0 ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Comparado con el mes anterior
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tasa de Aprobación</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {tasaAprobacion}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {tasaAprobacion >= 50 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {aprobados}/{totalConDecision}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {tasaAprobacion >= 50 ? "Buena tasa de conversión" : "Necesita atención"}{" "}
            {tasaAprobacion >= 50 ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Presupuestos aprobados vs rechazados
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Aprobados del Mes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {aprobadosMes}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-3" />
              {formatearMoneda(montoAprobadoMes)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {formatearMoneda(montoAprobadoMes)} aprobados este mes <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {productosActivos} productos activos en catálogo
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
