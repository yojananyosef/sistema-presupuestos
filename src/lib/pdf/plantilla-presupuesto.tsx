import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ConfiguracionEmpresa, ItemPresupuesto } from "@/types";

// Colores por defecto
const DEFAULTS = {
  colorPrimario: "#0284c7",
  colorCabecera: "#0f172a",
};

function crearEstilos(colorPrimario: string, colorCabecera: string) {
  return StyleSheet.create({
  pagina: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: colorPrimario,
    paddingBottom: 20,
  },
  logoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImg: {
    width: 60,
    height: 60,
    objectFit: "contain" as const,
  },
  empresaNombre: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colorCabecera,
  },
  empresaDato: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  presupuestoInfo: {
    textAlign: "right" as const,
  },
  presupuestoNumero: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colorPrimario,
  },
  presupuestoFecha: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 4,
  },
  seccion: {
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colorCabecera,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  clienteGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
  },
  clienteCampo: {
    width: "50%",
    marginBottom: 4,
  },
  clienteLabel: {
    fontSize: 8,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
  },
  clienteValor: {
    fontSize: 10,
    color: "#1e293b",
  },
  tabla: {
    marginTop: 4,
  },
  tablaCabecera: {
    flexDirection: "row" as const,
    backgroundColor: colorCabecera,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tablaCabeceraTexto: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase" as const,
  },
  tablaFila: {
    flexDirection: "row" as const,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tablaFilaPar: {
    backgroundColor: "#f8fafc",
  },
  tablaTexto: {
    fontSize: 9,
    color: "#334155",
  },
  colDescripcion: { width: "35%" },
  colCantidad: { width: "10%", textAlign: "center" as const },
  colMedidas: { width: "15%", textAlign: "center" as const },
  colM2: { width: "10%", textAlign: "right" as const },
  colPrecioUnit: { width: "15%", textAlign: "right" as const },
  colPrecioTotal: { width: "15%", textAlign: "right" as const },
  totalesContenedor: {
    marginTop: 16,
    alignItems: "flex-end" as const,
  },
  totalesBox: {
    width: 220,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
  },
  totalFila: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  totalValor: {
    fontSize: 9,
    color: "#1e293b",
    fontFamily: "Helvetica-Bold",
  },
  totalGrandeFila: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: colorPrimario,
  },
  totalGrandeLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colorCabecera,
  },
  totalGrandeValor: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colorPrimario,
  },
  condicionesBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    marginTop: 4,
  },
  condicionesTexto: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },
  pie: {
    position: "absolute" as const,
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  pieTexto: {
    fontSize: 7,
    color: "#94a3b8",
  },
  });
}

function formatearMonedaPdf(monto: number): string {
  return "$" + monto.toLocaleString("es-CL");
}

function formatearFechaPdf(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface PlantillaPresupuestoProps {
  presupuesto: {
    correlativo: number;
    clienteNombre: string;
    clienteRut: string | null;
    clienteEmail: string | null;
    clienteTelefono: string | null;
    clienteDireccion: string | null;
    descripcion: string | null;
    items: ItemPresupuesto[];
    subtotal: number;
    iva: number;
    total: number;
    tiempoEjecucion: string | null;
    condiciones: string | null;
    estado: string;
    creadoEn: string;
  };
  configuracionEmpresa: ConfiguracionEmpresa;
}

export function PlantillaPresupuesto({
  presupuesto,
  configuracionEmpresa: config,
}: PlantillaPresupuestoProps) {
  const correlativoFormateado = `PRE-${String(presupuesto.correlativo).padStart(6, "0")}`;
  const colorPrimario = config.pdfColorPrimario || DEFAULTS.colorPrimario;
  const colorCabecera = config.pdfColorCabecera || DEFAULTS.colorCabecera;
  const estilos = crearEstilos(colorPrimario, colorCabecera);

  const pieIzquierdo = config.pdfPieIzquierdo || `Presupuesto generado por ${config.nombreEmpresa}`;
  const pieDerecho = config.pdfPieDerecho || `${config.telefonoEmpresa} · ${config.emailEmpresa}`;

  return (
    <Document>
      <Page size="LETTER" style={estilos.pagina}>
        {/* Cabecera */}
        <View style={estilos.cabecera}>
          <View style={estilos.logoArea}>
            {config.pdfLogoUrl && (
              <Image src={config.pdfLogoUrl} style={estilos.logoImg} />
            )}
            <View>
              <Text style={estilos.empresaNombre}>{config.nombreEmpresa}</Text>
              <Text style={estilos.empresaDato}>RUT: {config.rutEmpresa}</Text>
              <Text style={estilos.empresaDato}>{config.direccionEmpresa}</Text>
              <Text style={estilos.empresaDato}>Tel: {config.telefonoEmpresa}</Text>
              <Text style={estilos.empresaDato}>{config.emailEmpresa}</Text>
            </View>
          </View>
          <View style={estilos.presupuestoInfo}>
            <Text style={estilos.presupuestoNumero}>{correlativoFormateado}</Text>
            <Text style={estilos.presupuestoFecha}>
              Fecha: {formatearFechaPdf(presupuesto.creadoEn)}
            </Text>
            <Text style={estilos.presupuestoFecha}>
              Estado: {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
            </Text>
          </View>
        </View>

        {/* Datos del Cliente */}
        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Datos del Cliente</Text>
          <View style={estilos.clienteGrid}>
            <View style={estilos.clienteCampo}>
              <Text style={estilos.clienteLabel}>Nombre / Razón Social</Text>
              <Text style={estilos.clienteValor}>{presupuesto.clienteNombre}</Text>
            </View>
            {presupuesto.clienteRut && (
              <View style={estilos.clienteCampo}>
                <Text style={estilos.clienteLabel}>RUT</Text>
                <Text style={estilos.clienteValor}>{presupuesto.clienteRut}</Text>
              </View>
            )}
            {presupuesto.clienteEmail && (
              <View style={estilos.clienteCampo}>
                <Text style={estilos.clienteLabel}>Email</Text>
                <Text style={estilos.clienteValor}>{presupuesto.clienteEmail}</Text>
              </View>
            )}
            {presupuesto.clienteTelefono && (
              <View style={estilos.clienteCampo}>
                <Text style={estilos.clienteLabel}>Teléfono</Text>
                <Text style={estilos.clienteValor}>{presupuesto.clienteTelefono}</Text>
              </View>
            )}
            {presupuesto.clienteDireccion && (
              <View style={estilos.clienteCampo}>
                <Text style={estilos.clienteLabel}>Dirección</Text>
                <Text style={estilos.clienteValor}>{presupuesto.clienteDireccion}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Descripción */}
        {presupuesto.descripcion && (
          <View style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>Descripción</Text>
            <Text style={estilos.condicionesTexto}>{presupuesto.descripcion}</Text>
          </View>
        )}

        {/* Tabla de Ítems */}
        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Detalle de Ítems</Text>
          <View style={estilos.tabla}>
            <View style={estilos.tablaCabecera}>
              <Text style={[estilos.tablaCabeceraTexto, estilos.colDescripcion]}>Descripción</Text>
              <Text style={[estilos.tablaCabeceraTexto, estilos.colCantidad]}>Cant.</Text>
              <Text style={[estilos.tablaCabeceraTexto, estilos.colMedidas]}>Medidas</Text>
              <Text style={[estilos.tablaCabeceraTexto, estilos.colM2]}>M²</Text>
              <Text style={[estilos.tablaCabeceraTexto, estilos.colPrecioUnit]}>P. Unit.</Text>
              <Text style={[estilos.tablaCabeceraTexto, estilos.colPrecioTotal]}>Total</Text>
            </View>
            {presupuesto.items.map((item, i) => (
              <View
                key={i}
                style={[estilos.tablaFila, i % 2 === 0 ? estilos.tablaFilaPar : {}]}
              >
                <Text style={[estilos.tablaTexto, estilos.colDescripcion]}>
                  {item.descripcion}
                </Text>
                <Text style={[estilos.tablaTexto, estilos.colCantidad]}>{item.cantidad}</Text>
                <Text style={[estilos.tablaTexto, estilos.colMedidas]}>
                  {item.anchoM}×{item.largoM}m
                </Text>
                <Text style={[estilos.tablaTexto, estilos.colM2]}>{item.m2.toFixed(1)}</Text>
                <Text style={[estilos.tablaTexto, estilos.colPrecioUnit]}>
                  {formatearMonedaPdf(item.precioUnitario)}
                </Text>
                <Text style={[estilos.tablaTexto, estilos.colPrecioTotal]}>
                  {formatearMonedaPdf(item.precioTotal)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={estilos.totalesContenedor}>
          <View style={estilos.totalesBox}>
            <View style={estilos.totalFila}>
              <Text style={estilos.totalLabel}>Subtotal</Text>
              <Text style={estilos.totalValor}>
                {formatearMonedaPdf(presupuesto.subtotal)}
              </Text>
            </View>
            <View style={estilos.totalFila}>
              <Text style={estilos.totalLabel}>IVA ({config.ivaPorcentaje}%)</Text>
              <Text style={estilos.totalValor}>{formatearMonedaPdf(presupuesto.iva)}</Text>
            </View>
            <View style={estilos.totalGrandeFila}>
              <Text style={estilos.totalGrandeLabel}>TOTAL</Text>
              <Text style={estilos.totalGrandeValor}>
                {formatearMonedaPdf(presupuesto.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tiempo de ejecución */}
        {presupuesto.tiempoEjecucion && (
          <View style={[estilos.seccion, { marginTop: 16 }]}>
            <Text style={estilos.seccionTitulo}>Tiempo de Ejecución</Text>
            <Text style={estilos.condicionesTexto}>{presupuesto.tiempoEjecucion}</Text>
          </View>
        )}

        {/* Condiciones */}
        {presupuesto.condiciones && (
          <View style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>Condiciones Comerciales</Text>
            <View style={estilos.condicionesBox}>
              <Text style={estilos.condicionesTexto}>{presupuesto.condiciones}</Text>
            </View>
          </View>
        )}

        {/* Pie de página */}
        <View style={estilos.pie} fixed>
          <Text style={estilos.pieTexto}>
            {pieIzquierdo}
          </Text>
          <Text style={estilos.pieTexto}>
            {pieDerecho}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
