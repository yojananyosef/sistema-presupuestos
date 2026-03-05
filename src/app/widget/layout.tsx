import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cotizador Zinc — Widget",
  description: "Calcula el precio de planchas de zinc de forma rápida",
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      {children}
    </div>
  );
}
