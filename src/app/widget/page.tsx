"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Leaf, ChevronRight, ArrowLeft, Calculator, Send, CheckCircle, AlertCircle } from "lucide-react";

interface ProductoZinc {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  precioPorM2: number;
  precioMinimo: number;
  anchoEstandarM: number;
}

interface ResultadoCotizacion {
  productoId: string;
  productoNombre: string;
  anchoM: number;
  largoM: number;
  m2: number;
  precioM2: number;
  precioCalculado: number;
  precioFinal: number;
  cantidad: number;
  totalSinIva: number;
  iva: number;
  totalConIva: number;
}

type Paso = "producto" | "medidas" | "resultado";

export default function WidgetPage() {
  const [paso, setPaso] = useState<Paso>("producto");
  const [productos, setProductos] = useState<ProductoZinc[]>([]);
  const [productoSel, setProductoSel] = useState<ProductoZinc | null>(null);
  const [anchoM, setAnchoM] = useState(0);
  const [largoM, setLargoM] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [resultado, setResultado] = useState<ResultadoCotizacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [mostrarContacto, setMostrarContacto] = useState(false);
  const [contacto, setContacto] = useState({ nombre: "", email: "", telefono: "", mensaje: "" });
  const [contactoEnviado, setContactoEnviado] = useState(false);

  useEffect(() => {
    fetch("/api/widget/cotizar")
      .then((r) => r.json())
      .then((data) => setProductos(data.productos ?? []))
      .catch(() => setError("No se pudieron cargar los productos"));
  }, []);

  const seleccionarProducto = (p: ProductoZinc) => {
    setProductoSel(p);
    setAnchoM(p.anchoEstandarM);
    setLargoM(0);
    setCantidad(1);
    setResultado(null);
    setPaso("medidas");
  };

  const cotizar = async () => {
    if (!productoSel || largoM <= 0) return;
    setCargando(true);
    setError("");

    const res = await fetch("/api/widget/cotizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productoId: productoSel.id,
        anchoM,
        largoM,
        cantidad,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResultado(data);
      setPaso("resultado");
    } else {
      setError("Error al calcular la cotización");
    }
    setCargando(false);
  };

  const enviarContacto = async () => {
    const res = await fetch("/api/contacto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contacto),
    });
    if (res.ok) setContactoEnviado(true);
  };

  const reiniciar = () => {
    setPaso("producto");
    setProductoSel(null);
    setResultado(null);
    setMostrarContacto(false);
    setContactoEnviado(false);
    setContacto({ nombre: "", email: "", telefono: "", mensaje: "" });
  };

  const formatCLP = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

  const pasos: Paso[] = ["producto", "medidas", "resultado"];

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Cotizador de Zinc</h1>
        <p className="text-sm text-muted-foreground mt-1">Calcula tu presupuesto al instante</p>
      </div>

      {/* Pasos */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {pasos.map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                paso === p
                  ? "bg-primary text-primary-foreground"
                  : pasos.indexOf(paso) > i
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-border" />}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ===== PASO 1: PRODUCTO ===== */}
      {paso === "producto" && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">1. Selecciona el tipo de plancha</h2>
          {productos.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
              onClick={() => seleccionarProducto(p)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium group-hover:text-primary transition-colors">{p.nombre}</div>
                    {p.descripcion && <div className="text-xs text-muted-foreground mt-1">{p.descripcion}</div>}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs capitalize">{p.tipo}</Badge>
                      <span className="text-sm font-semibold text-primary">{formatCLP(p.precioPorM2)}/m²</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ===== PASO 2: MEDIDAS ===== */}
      {paso === "medidas" && productoSel && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">2. Ingresa las medidas</CardTitle>
              <Button onClick={() => setPaso("producto")} variant="ghost" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Cambiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm">
              <span className="font-medium text-primary">{productoSel.nombre}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ancho (m)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={anchoM || ""}
                  onChange={(e) => setAnchoM(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Largo (m)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={largoM || ""}
                  onChange={(e) => setLargoM(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                className="mt-1.5"
              />
            </div>

            {anchoM > 0 && largoM > 0 && (
              <p className="text-xs text-muted-foreground">
                Superficie por unidad: {(anchoM * largoM).toFixed(2)} m² — Total: {(anchoM * largoM * cantidad).toFixed(2)} m²
              </p>
            )}

            <Button
              onClick={cotizar}
              disabled={cargando || largoM <= 0 || anchoM <= 0}
              className="w-full"
            >
              <Calculator className="h-4 w-4" />
              {cargando ? "Calculando..." : "Calcular Precio"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ===== PASO 3: RESULTADO ===== */}
      {paso === "resultado" && resultado && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">3. Tu cotización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Producto</span>
                <span className="font-medium">{resultado.productoNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medidas</span>
                <span>{resultado.anchoM}m × {resultado.largoM}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Superficie unitaria</span>
                <span>{resultado.m2.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cantidad</span>
                <span>{resultado.cantidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio unitario</span>
                <span>{formatCLP(resultado.precioFinal)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCLP(resultado.totalSinIva)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span>{formatCLP(resultado.iva)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary pt-2">
                <span>Total</span>
                <span>{formatCLP(resultado.totalConIva)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contacto */}
          {!mostrarContacto && !contactoEnviado && (
            <Button onClick={() => setMostrarContacto(true)} className="w-full">
              <Send className="h-4 w-4" />
              Solicitar Cotización Formal
            </Button>
          )}

          {mostrarContacto && !contactoEnviado && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Déjanos tus datos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Nombre"
                  value={contacto.nombre}
                  onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={contacto.email}
                  onChange={(e) => setContacto({ ...contacto, email: e.target.value })}
                />
                <Input
                  placeholder="Teléfono"
                  value={contacto.telefono}
                  onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })}
                />
                <Textarea
                  placeholder="Mensaje adicional..."
                  rows={3}
                  value={contacto.mensaje}
                  onChange={(e) => setContacto({ ...contacto, mensaje: e.target.value })}
                />
                <Button
                  onClick={enviarContacto}
                  disabled={!contacto.nombre || !contacto.email}
                  className="w-full"
                >
                  Enviar Solicitud
                </Button>
              </CardContent>
            </Card>
          )}

          {contactoEnviado && (
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">¡Solicitud enviada!</span><br />
                Nos pondremos en contacto contigo a la brevedad.
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={reiniciar} variant="ghost" className="w-full">
            Nueva cotización
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-muted-foreground">
        Powered by Zinc Industrial • Los precios son referenciales
      </div>
    </div>
  );
}
