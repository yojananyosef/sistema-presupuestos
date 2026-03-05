"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ItemPresupuesto, ProductoZinc } from "@/types";
import { calcularPrecioZinc, calcularTotales } from "@/lib/calculos/precios-zinc";
import { formatearMoneda } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Send, AlertCircle, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

interface DatosCliente {
  clienteNombre: string;
  clienteRut: string;
  clienteEmail: string;
  clienteTelefono: string;
  clienteDireccion: string;
}

interface FormularioPresupuestoProps {
  presupuestoId?: string;
  datosIniciales?: {
    clienteNombre: string;
    clienteRut: string | null;
    clienteEmail: string | null;
    clienteTelefono: string | null;
    clienteDireccion: string | null;
    descripcion: string | null;
    items: ItemPresupuesto[];
    tiempoEjecucion: string | null;
    condiciones: string | null;
    estado: string;
  };
}

const itemVacio: ItemPresupuesto = {
  descripcion: "",
  productoId: "",
  cantidad: 1,
  anchoM: 0,
  largoM: 0,
  m2: 0,
  precioUnitario: 0,
  precioTotal: 0,
};

let nextItemId = 1;
function generarId() {
  return `item-${nextItemId++}-${Date.now()}`;
}

interface ItemConId extends ItemPresupuesto {
  _id: string;
}

function agregarIds(items: ItemPresupuesto[]): ItemConId[] {
  return items.map((item) => ({ ...item, _id: generarId() }));
}

function SortableItem({
  item,
  index,
  productos,
  onActualizar,
  onEliminar,
  puedeBorrar,
}: {
  item: ItemConId;
  index: number;
  productos: ProductoZinc[];
  onActualizar: (index: number, campo: string, valor: string | number) => void;
  onEliminar: (index: number) => void;
  puedeBorrar: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Ítem {index + 1}</span>
        </div>
        {puedeBorrar && (
          <Button
            type="button"
            onClick={() => onEliminar(index)}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-2 lg:col-span-4">
          <Label className="text-xs">Producto</Label>
          <Select
            value={item.productoId || undefined}
            onValueChange={(v) => onActualizar(index, "productoId", v)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Seleccionar producto..." />
            </SelectTrigger>
            <SelectContent>
              {productos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre} — {formatearMoneda(p.precioPorM2)}/m²
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Ancho (m)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.anchoM || ""}
            onChange={(e) => onActualizar(index, "anchoM", parseFloat(e.target.value) || 0)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs">Largo (m)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.largoM || ""}
            onChange={(e) => onActualizar(index, "largoM", parseFloat(e.target.value) || 0)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            min="1"
            value={item.cantidad}
            onChange={(e) => onActualizar(index, "cantidad", parseInt(e.target.value) || 1)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs">M² Total</Label>
          <p className="mt-1.5 px-3 py-2 bg-muted rounded-md text-sm">
            {item.m2.toFixed(2)} m²
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-4 mt-3 text-sm">
        <span className="text-muted-foreground">
          Unitario: <strong>{formatearMoneda(item.precioUnitario)}</strong>
        </span>
        <span className="font-semibold">
          Total: {formatearMoneda(item.precioTotal)}
        </span>
      </div>
    </div>
  );
}

export function FormularioPresupuesto({ presupuestoId, datosIniciales }: FormularioPresupuestoProps) {
  const router = useRouter();
  const [productos, setProductos] = useState<ProductoZinc[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [datosCliente, setDatosCliente] = useState<DatosCliente>({
    clienteNombre: datosIniciales?.clienteNombre ?? "",
    clienteRut: datosIniciales?.clienteRut ?? "",
    clienteEmail: datosIniciales?.clienteEmail ?? "",
    clienteTelefono: datosIniciales?.clienteTelefono ?? "",
    clienteDireccion: datosIniciales?.clienteDireccion ?? "",
  });

  const [items, setItems] = useState<ItemConId[]>(
    datosIniciales?.items.length ? agregarIds(datosIniciales.items) : agregarIds([{ ...itemVacio }])
  );

  const [descripcion, setDescripcion] = useState(datosIniciales?.descripcion ?? "");
  const [tiempoEjecucion, setTiempoEjecucion] = useState(datosIniciales?.tiempoEjecucion ?? "");
  const [condiciones, setCondiciones] = useState(datosIniciales?.condiciones ?? "");

  useEffect(() => {
    fetch("/api/widget/cotizar")
      .then((res) => res.json())
      .then((data) => setProductos(data.productos ?? []))
      .catch(console.error);
  }, []);

  const actualizarItem = useCallback((index: number, campo: string, valor: string | number) => {
    setItems((prev) => {
      const nuevos = [...prev];
      const item = { ...nuevos[index], [campo]: valor };

      if (campo === "productoId") {
        const producto = productosRef.current.find((p) => p.id === valor);
        if (producto) {
          item.descripcion = producto.nombre;
          item.anchoM = producto.anchoEstandarM;
        }
      }

      if (item.productoId && item.anchoM > 0 && item.largoM > 0 && item.cantidad > 0) {
        const producto = productosRef.current.find((p) => p.id === item.productoId);
        if (producto) {
          const resultado = calcularPrecioZinc(producto, item.anchoM, item.largoM, item.cantidad);
          item.m2 = resultado.m2Total;
          item.precioUnitario = resultado.precioUnitario;
          item.precioTotal = resultado.precioTotal;
        }
      }

      nuevos[index] = item;
      return nuevos;
    });
  }, []);

  const productosRef = useRef(productos);
  productosRef.current = productos;

  const agregarItem = () => setItems((prev) => [...prev, { ...itemVacio, _id: generarId() }]);
  const eliminarItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const manejarFinDrag = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i._id === active.id);
        const newIndex = prev.findIndex((i) => i._id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const totales = calcularTotales(items.map((i) => i.precioTotal), 19);

  const guardar = async (estado: "borrador" | "emitido") => {
    setError("");
    setCargando(true);

    const payload = {
      ...datosCliente,
      descripcion: descripcion || null,
      items: items.map(({ _id, ...rest }) => rest),
      tiempoEjecucion: tiempoEjecucion || null,
      condiciones: condiciones || null,
      estado,
    };

    try {
      const url = presupuestoId ? `/api/presupuestos/${presupuestoId}` : "/api/presupuestos";
      const method = presupuestoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const detalles = data.detalles?.fieldErrors;
        let msg = data.error || "Error al guardar";
        if (detalles) {
          const campos = Object.entries(detalles)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join("; ");
          if (campos) msg += " — " + campos;
        }
        setError(msg);
        setCargando(false);
        return;
      }

      const data = await res.json();
      router.push(`/presupuestos/${data.id}`);
      router.refresh();
    } catch {
      setError("Error de conexión");
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Datos del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nombre / Razón Social *</Label>
              <Input
                type="text"
                value={datosCliente.clienteNombre}
                onChange={(e) => setDatosCliente({ ...datosCliente, clienteNombre: e.target.value })}
                spellCheck={true}
                required
                placeholder="Nombre del cliente"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>RUT</Label>
              <Input
                type="text"
                value={datosCliente.clienteRut}
                onChange={(e) => setDatosCliente({ ...datosCliente, clienteRut: e.target.value })}
                placeholder="12.345.678-9"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={datosCliente.clienteEmail}
                onChange={(e) => setDatosCliente({ ...datosCliente, clienteEmail: e.target.value })}
                placeholder="cliente@empresa.cl"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                type="tel"
                value={datosCliente.clienteTelefono}
                onChange={(e) => setDatosCliente({ ...datosCliente, clienteTelefono: e.target.value })}
                placeholder="+56 9 1234 5678"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                type="text"
                value={datosCliente.clienteDireccion}
                onChange={(e) => setDatosCliente({ ...datosCliente, clienteDireccion: e.target.value })}
                spellCheck={true}
                placeholder="Av. Principal 123, Santiago"
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descripción */}
      <Card>
        <CardHeader>
          <CardTitle>Descripción General</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            spellCheck={true}
            rows={3}
            placeholder="Descripción general del presupuesto..."
          />
        </CardContent>
      </Card>

      {/* Ítems */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Ítems</CardTitle>
          <Button type="button" onClick={agregarItem} variant="ghost" size="sm">
            <Plus className="h-4 w-4" />
            Agregar ítem
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={manejarFinDrag}
          >
            <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
              {items.map((item, index) => (
                <SortableItem
                  key={item._id}
                  item={item}
                  index={index}
                  productos={productos}
                  onActualizar={actualizarItem}
                  onEliminar={eliminarItem}
                  puedeBorrar={items.length > 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Resumen de Totales */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatearMoneda(totales.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span className="font-medium">{formatearMoneda(totales.iva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold pt-1">
                <span>Total</span>
                <span className="text-primary">{formatearMoneda(totales.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiempo y Condiciones */}
      <Card>
        <CardHeader>
          <CardTitle>Tiempo y Condiciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tiempo de Ejecución</Label>
            <Input
              type="text"
              value={tiempoEjecucion}
              onChange={(e) => setTiempoEjecucion(e.target.value)}
              spellCheck={true}
              placeholder="Ej: 15 días hábiles desde la aprobación"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Condiciones Comerciales</Label>
            <Textarea
              value={condiciones}
              onChange={(e) => setCondiciones(e.target.value)}
              spellCheck={true}
              rows={4}
              placeholder="Condiciones de pago, validez de la oferta, etc."
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pb-20 md:pb-0">
        <Button type="button" onClick={() => router.back()} variant="outline">
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => guardar("borrador")}
          disabled={cargando}
          variant="secondary"
        >
          <Save className="h-4 w-4" />
          {cargando ? "Guardando..." : "Guardar Borrador"}
        </Button>
        <Button
          type="button"
          onClick={() => guardar("emitido")}
          disabled={cargando}
        >
          <Send className="h-4 w-4" />
          {cargando ? "Emitiendo..." : "Emitir Presupuesto"}
        </Button>
      </div>
    </div>
  );
}
