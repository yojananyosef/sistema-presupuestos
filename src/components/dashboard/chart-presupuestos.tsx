"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DatoMensual {
  mes: string
  cantidad: number
  monto: number
}

const chartConfig = {
  cantidad: {
    label: "Presupuestos",
    color: "var(--primary)",
  },
  monto: {
    label: "Monto (miles)",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartPresupuestos({ data }: { data: DatoMensual[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[250px] w-full"
    >
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillCantidad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Area
          dataKey="cantidad"
          type="natural"
          fill="url(#fillCantidad)"
          stroke="var(--primary)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
