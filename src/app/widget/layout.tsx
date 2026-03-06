import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cotizador — Widget",
  description: "Calcula el precio de productos de forma rápida",
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      {children}
    </div>
  );
}
