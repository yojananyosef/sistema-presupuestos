"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/db/cliente";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Save, Building2, Package, Users, CheckCircle, FileText, Upload, Trash2 } from "lucide-react";

interface ProductoZinc {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  precioPorM2: number;
  precioMinimo: number;
  anchoEstandarM: number;
  activo: boolean;
}

interface UsuarioLista {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tabActiva, setTabActiva] = useState<"empresa" | "productos" | "usuarios" | "pdf">("empresa");

  const [config, setConfig] = useState<Record<string, string>>({});
  const [productos, setProductos] = useState<ProductoZinc[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);

  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    tipo: "acanalada",
    descripcion: "",
    precioPorM2: 0,
    precioMinimo: 0,
    anchoEstandarM: 0,
  });

  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    contrasena: "",
    rol: "usuario" as "admin" | "usuario",
  });

  const cargarDatos = useCallback(async (signal?: AbortSignal) => {
    const supabase = crearClienteNavegador();
    const { data: { user } } = await supabase.auth.getUser();
    if (signal?.aborted) return;
    if (user) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();
      if (signal?.aborted) return;
      if (perfil?.rol !== "admin") {
        router.push("/presupuestos");
        return;
      }
    }

    const res = await fetch("/api/configuracion", { signal });
    if (signal?.aborted) return;
    if (res.ok) {
      const data = await res.json();
      setConfig(data.configuracion);
      setProductos(data.productos);
      setUsuarios(data.usuarios);
    }
    setCargando(false);
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos(controller.signal);
    return () => controller.abort();
  }, [cargarDatos]);

  const mostrarExito = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(""), 3000);
  };

  const guardarConfiguracion = async () => {
    setGuardando(true);
    const datos = Object.entries(config).map(([clave, valor]) => ({ clave, valor }));
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "configuracion", datos }),
    });
    if (res.ok) {
      router.refresh();
      mostrarExito("Configuración guardada");
    }
    setGuardando(false);
  };

  const crearProducto = async () => {
    setGuardando(true);
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "producto", datos: nuevoProducto }),
    });
    if (res.ok) {
      setMostrarFormProducto(false);
      setNuevoProducto({ nombre: "", tipo: "acanalada", descripcion: "", precioPorM2: 0, precioMinimo: 0, anchoEstandarM: 0 });
      await cargarDatos();
      mostrarExito("Producto creado");
    }
    setGuardando(false);
  };

  const toggleProducto = async (id: string, activo: boolean) => {
    await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "toggleProducto", id, activo: !activo }),
    });
    await cargarDatos();
  };

  const crearUsuario = async () => {
    setGuardando(true);
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "usuario", datos: nuevoUsuario }),
    });
    if (res.ok) {
      setMostrarFormUsuario(false);
      setNuevoUsuario({ nombre: "", email: "", contrasena: "", rol: "usuario" });
      await cargarDatos();
      mostrarExito("Usuario creado");
    }
    setGuardando(false);
  };

  const toggleUsuario = async (id: string, activo: boolean) => {
    await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "toggleUsuario", id, activo: !activo }),
    });
    await cargarDatos();
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const tabs = [
    { key: "empresa" as const, label: "Empresa", icon: Building2 },
    { key: "productos" as const, label: "Productos", icon: Package },
    { key: "usuarios" as const, label: "Usuarios", icon: Users },
    { key: "pdf" as const, label: "Plantilla PDF", icon: FileText },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Configuración</h1>

      {mensaje && (
        <Alert variant="success" className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{mensaje}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTabActiva(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tabActiva === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== TAB EMPRESA ===== */}
      {tabActiva === "empresa" && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { clave: "empresa_nombre", label: "Nombre" },
              { clave: "empresa_rut", label: "RUT" },
              { clave: "empresa_direccion", label: "Dirección" },
              { clave: "empresa_telefono", label: "Teléfono" },
              { clave: "empresa_email", label: "Email" },
            ].map(({ clave, label }) => (
              <div key={clave}>
                <Label>{label}</Label>
                <Input
                  value={config[clave] ?? ""}
                  onChange={(e) => setConfig({ ...config, [clave]: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            ))}

            <Separator />

            <div>
              <Label>Logo de la empresa</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                PNG, JPG, WebP o SVG. Máximo 512KB. Se usa en el sidebar y en los PDF.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={subiendoLogo}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/png,image/jpeg,image/webp,image/svg+xml";
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      if (file.size > 512 * 1024) {
                        setMensaje("El archivo excede 512KB");
                        return;
                      }
                      setSubiendoLogo(true);
                      const fd = new FormData();
                      fd.append("logo", file);
                      const res = await fetch("/api/configuracion/logo", { method: "POST", body: fd });
                      if (res.ok) {
                        const { url } = await res.json();
                        setConfig({ ...config, pdf_logo_url: url + "?t=" + Date.now() });
                        mostrarExito("Logo actualizado");
                      } else {
                        const err = await res.json();
                        setMensaje(err.error || "Error al subir logo");
                      }
                      setSubiendoLogo(false);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {subiendoLogo ? "Subiendo..." : "Subir logo"}
                </Button>
                {config["pdf_logo_url"] && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfig({ ...config, pdf_logo_url: "" })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {config["pdf_logo_url"] && (
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config["pdf_logo_url"]}
                    alt="Logo preview"
                    className="h-12 w-auto max-w-[200px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Vista previa del logo</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>IVA (%)</Label>
                <Input
                  type="number"
                  value={config["iva_porcentaje"] ?? "19"}
                  onChange={(e) => setConfig({ ...config, iva_porcentaje: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Moneda</Label>
                <Input
                  value={config["moneda"] ?? "CLP"}
                  onChange={(e) => setConfig({ ...config, moneda: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={guardarConfiguracion} disabled={guardando}>
                <Save className="h-4 w-4" />
                {guardando ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== TAB PRODUCTOS ===== */}
      {tabActiva === "productos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Productos Zinc</h2>
            <Button
              onClick={() => setMostrarFormProducto(!mostrarFormProducto)}
              variant={mostrarFormProducto ? "outline" : "default"}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {mostrarFormProducto ? "Cancelar" : "Nuevo Producto"}
            </Button>
          </div>

          {mostrarFormProducto && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={nuevoProducto.nombre}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={nuevoProducto.tipo}
                      onValueChange={(v) => setNuevoProducto({ ...nuevoProducto, tipo: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acanalada">Acanalada</SelectItem>
                        <SelectItem value="lisa">Lisa</SelectItem>
                        <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Precio por m²</Label>
                    <Input
                      type="number"
                      value={nuevoProducto.precioPorM2}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioPorM2: Number(e.target.value) })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Precio mínimo</Label>
                    <Input
                      type="number"
                      value={nuevoProducto.precioMinimo}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioMinimo: Number(e.target.value) })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Ancho estándar (m)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={nuevoProducto.anchoEstandarM}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, anchoEstandarM: Number(e.target.value) })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Input
                      value={nuevoProducto.descripcion}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <Button onClick={crearProducto} disabled={guardando}>
                  {guardando ? "Creando..." : "Crear Producto"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">$/m²</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell className="capitalize">{p.tipo}</TableCell>
                      <TableCell className="text-right">${p.precioPorM2.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${p.precioMinimo.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={p.activo ? "default" : "destructive"}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => toggleProducto(p.id, p.activo)}
                          variant="ghost"
                          size="sm"
                        >
                          {p.activo ? "Desactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB USUARIOS ===== */}
      {tabActiva === "usuarios" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Usuarios</h2>
            <Button
              onClick={() => setMostrarFormUsuario(!mostrarFormUsuario)}
              variant={mostrarFormUsuario ? "outline" : "default"}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {mostrarFormUsuario ? "Cancelar" : "Nuevo Usuario"}
            </Button>
          </div>

          {mostrarFormUsuario && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={nuevoUsuario.nombre}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={nuevoUsuario.email}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={nuevoUsuario.contrasena}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contrasena: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Rol</Label>
                    <Select
                      value={nuevoUsuario.rol}
                      onValueChange={(v) => setNuevoUsuario({ ...nuevoUsuario, rol: v as "admin" | "usuario" })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usuario">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={crearUsuario} disabled={guardando}>
                  {guardando ? "Creando..." : "Crear Usuario"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Rol</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nombre}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.rol === "admin" ? "default" : "secondary"}>
                          {u.rol === "admin" ? "Admin" : "Usuario"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.activo ? "default" : "destructive"}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => toggleUsuario(u.id, u.activo)}
                          variant="ghost"
                          size="sm"
                        >
                          {u.activo ? "Desactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAB PLANTILLA PDF ===== */}
      {tabActiva === "pdf" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalización de Plantilla PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure el aspecto visual de los presupuestos exportados en PDF.
              </p>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Color Primario (cabecera, acentos)</Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <input
                      type="color"
                      value={config["pdf_color_primario"] ?? "#0284c7"}
                      onChange={(e) => setConfig({ ...config, pdf_color_primario: e.target.value })}
                      className="h-10 w-14 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={config["pdf_color_primario"] ?? "#0284c7"}
                      onChange={(e) => setConfig({ ...config, pdf_color_primario: e.target.value })}
                      placeholder="#0284c7"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Color Texto Cabecera</Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <input
                      type="color"
                      value={config["pdf_color_cabecera"] ?? "#0f172a"}
                      onChange={(e) => setConfig({ ...config, pdf_color_cabecera: e.target.value })}
                      className="h-10 w-14 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={config["pdf_color_cabecera"] ?? "#0f172a"}
                      onChange={(e) => setConfig({ ...config, pdf_color_cabecera: e.target.value })}
                      placeholder="#0f172a"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-medium">Texto del pie de página</h3>
              <div>
                <Label>Pie de página izquierdo</Label>
                <Input
                  value={config["pdf_pie_izquierdo"] ?? ""}
                  onChange={(e) => setConfig({ ...config, pdf_pie_izquierdo: e.target.value })}
                  placeholder="Texto personalizado (dejar vacío para usar el nombre de empresa)"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Pie de página derecho</Label>
                <Input
                  value={config["pdf_pie_derecho"] ?? ""}
                  onChange={(e) => setConfig({ ...config, pdf_pie_derecho: e.target.value })}
                  placeholder="Texto personalizado (dejar vacío para usar teléfono · email)"
                  className="mt-1.5"
                />
              </div>

              <Separator />

              {/* Vista previa de colores */}
              <h3 className="text-sm font-medium">Vista previa de colores</h3>
              <div className="border rounded-lg overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between"
                  style={{
                    borderBottom: `3px solid ${config["pdf_color_primario"] ?? "#0284c7"}`,
                  }}
                >
                  <div>
                    <p
                      className="font-bold text-lg"
                      style={{ color: config["pdf_color_cabecera"] ?? "#0f172a" }}
                    >
                      {config["empresa_nombre"] ?? "Nombre Empresa"}
                    </p>
                    <p className="text-xs text-muted-foreground">RUT · Dirección · Teléfono</p>
                  </div>
                  <p
                    className="font-bold text-xl"
                    style={{ color: config["pdf_color_primario"] ?? "#0284c7" }}
                  >
                    PRE-000001
                  </p>
                </div>
                <div className="p-4">
                  <div
                    className="p-2 rounded text-white text-xs font-bold"
                    style={{ backgroundColor: config["pdf_color_cabecera"] ?? "#0f172a" }}
                  >
                    DESCRIPCIÓN · CANT. · MEDIDAS · M² · P. UNIT. · TOTAL
                  </div>
                  <div className="p-2 text-xs text-muted-foreground border-b">
                    Producto ejemplo · 10 · 0.85×3.0m · 25.5 · $5.000 · $50.000
                  </div>
                  <div className="flex justify-end mt-2">
                    <p
                      className="font-bold"
                      style={{ color: config["pdf_color_primario"] ?? "#0284c7" }}
                    >
                      TOTAL: $59.500
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={guardarConfiguracion} disabled={guardando}>
                  <Save className="h-4 w-4" />
                  {guardando ? "Guardando..." : "Guardar Configuración PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
