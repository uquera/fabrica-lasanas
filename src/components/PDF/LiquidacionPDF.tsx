import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { EnvioPendiente, MermaItem } from "@/actions/liquidacionesFinal";

const orange = "#e86c00";
const green = "#16a34a";
const red = "#c41e1e";

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#333" },
  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  companyBlock: { width: "55%", flexDirection: "row", alignItems: "flex-start", gap: 8 },
  logoImg: { width: 48, height: 48 },
  companyText: { flex: 1 },
  companyName: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  companyDetail: { fontSize: 8, color: "#555", marginBottom: 1 },
  docBox: { width: "40%", borderWidth: 2, borderColor: orange, padding: 10, textAlign: "center" },
  docRut: { fontSize: 10, fontWeight: "bold", color: orange, marginBottom: 3 },
  docTitle: { fontSize: 11, fontWeight: "bold", color: orange, marginBottom: 3 },
  docFactura: { fontSize: 14, fontWeight: "bold", color: orange },
  // Client
  clientBox: { borderWidth: 1, borderColor: "#ddd", padding: 8, marginBottom: 12, backgroundColor: "#fafafa" },
  clientRow: { flexDirection: "row", marginBottom: 2 },
  clientLabel: { fontWeight: "bold", width: 80, fontSize: 8 },
  clientValue: { fontSize: 8 },
  // Section title
  sectionTitle: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase", color: "#666", marginBottom: 6, marginTop: 10, borderBottomWidth: 1, borderColor: "#eee", paddingBottom: 3 },
  // Table
  tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 4 },
  tableRowAlt: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 4, backgroundColor: "#fafafa" },
  headerText: { fontWeight: "bold", fontSize: 7, textTransform: "uppercase" },
  colFecha: { width: "14%", paddingHorizontal: 4 },
  colFolio: { width: "10%", paddingHorizontal: 4, textAlign: "center" },
  colSucursal: { width: "22%", paddingHorizontal: 4 },
  colProducto: { width: "26%", paddingHorizontal: 4 },
  colCant: { width: "10%", paddingHorizontal: 4, textAlign: "center" },
  colNeto: { width: "18%", paddingHorizontal: 4, textAlign: "right" },
  // Merma table
  colFechaMerma: { width: "16%", paddingHorizontal: 4 },
  colProductoMerma: { width: "34%", paddingHorizontal: 4 },
  colCantMerma: { width: "12%", paddingHorizontal: 4, textAlign: "center" },
  colMotivoMerma: { width: "22%", paddingHorizontal: 4 },
  colNetoMerma: { width: "16%", paddingHorizontal: 4, textAlign: "right" },
  // Totals
  totalsBlock: { alignItems: "flex-end", marginTop: 14 },
  totalRow: { flexDirection: "row", width: 260, paddingVertical: 3 },
  totalLabel: { flex: 1, textAlign: "right", paddingRight: 10, fontSize: 9 },
  totalValue: { width: 100, textAlign: "right", fontSize: 9, fontWeight: "bold" },
  totalFinal: { borderTopWidth: 2, borderColor: orange, paddingTop: 5, marginTop: 3 },
  totalMermaRow: { color: red },
  // Footer
  footer: { marginTop: 24, borderTopWidth: 1, borderColor: "#ccc", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
});

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

interface LiquidacionProps {
  facturaId: string;
  fecha: string;
  logoSrc?: string;
  cliente: { razonSocial: string; rut: string; giro: string; direccion: string; email: string };
  envios: EnvioPendiente[];
  mermas: MermaItem[];
  totalDespachado: number;
  totalMerma: number;
  netoFacturable: number;
}

export const LiquidacionPDF = ({
  facturaId, fecha, logoSrc, cliente, envios, mermas,
  totalDespachado, totalMerma, netoFacturable,
}: LiquidacionProps) => {
  const iva = Math.round(netoFacturable * 0.19);
  const total = netoFacturable + iva;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.companyBlock}>
            {logoSrc && <Image src={logoSrc} style={s.logoImg} />}
            <View style={s.companyText}>
              <Text style={s.companyName}>COMERCIALIZADORA DE ALIMENTOS ULISES QUERALES E.I.R.L.</Text>
              <Text style={s.companyDetail}>Giro: ACTIVIDADES DE RESTAURANTES.</Text>
              <Text style={s.companyDetail}>AVENIDA PADRE HURTADO 2245 - IQUIQUE</Text>
              <Text style={s.companyDetail}>Email: Uquera.uq@gmail.com  Tel: 948588365</Text>
              <Text style={s.companyDetail}>Fecha: {fecha}</Text>
            </View>
          </View>
          <View style={s.docBox}>
            <Text style={s.docRut}>R.U.T.: 77.172.854-5</Text>
            <Text style={s.docTitle}>LIQUIDACIÓN DE{"\n"}VENTAS</Text>
            <Text style={s.docFactura}>N° {facturaId}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={s.clientBox}>
          {[
            ["SEÑOR(ES):", cliente.razonSocial],
            ["R.U.T.:", cliente.rut],
            ["GIRO:", cliente.giro],
            ["DIRECCIÓN:", cliente.direccion],
            ["EMAIL:", cliente.email],
          ].map(([label, val], i) => (
            <View key={i} style={s.clientRow}>
              <Text style={s.clientLabel}>{label}</Text>
              <Text style={s.clientValue}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Guías */}
        <Text style={s.sectionTitle}>Guías de Despacho incluidas ({envios.length})</Text>
        <View style={s.tableHeader}>
          <Text style={[s.colFecha, s.headerText]}>Fecha</Text>
          <Text style={[s.colFolio, s.headerText]}>Folio</Text>
          <Text style={[s.colSucursal, s.headerText]}>Sucursal</Text>
          <Text style={[s.colProducto, s.headerText]}>Producto</Text>
          <Text style={[s.colCant, s.headerText]}>Cant.</Text>
          <Text style={[s.colNeto, s.headerText]}>Neto</Text>
        </View>
        {envios.map((envio, i) => {
          const netoEnvio = envio.detalles.reduce((s, d) => s + d.cantidad * d.producto.precioBase, 0);
          const unidades = envio.detalles.reduce((s, d) => s + d.cantidad, 0);
          const prod = envio.detalles[0]?.producto.nombre ?? "—";
          return (
            <View key={envio.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <Text style={s.colFecha}>{new Date(envio.fecha).toLocaleDateString("es-CL")}</Text>
              <Text style={s.colFolio}>#{envio.folio}</Text>
              <Text style={s.colSucursal}>{envio.cliente.sucursal ?? envio.cliente.razonSocial}</Text>
              <Text style={s.colProducto}>{prod}{envio.detalles.length > 1 ? ` +${envio.detalles.length - 1}` : ""}</Text>
              <Text style={s.colCant}>{unidades}</Text>
              <Text style={s.colNeto}>{fmt(netoEnvio)}</Text>
            </View>
          );
        })}

        {/* Mermas */}
        {mermas.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Mermas / Devoluciones ({mermas.length})</Text>
            <View style={s.tableHeader}>
              <Text style={[s.colFechaMerma, s.headerText]}>Fecha</Text>
              <Text style={[s.colProductoMerma, s.headerText]}>Producto</Text>
              <Text style={[s.colCantMerma, s.headerText]}>Cant.</Text>
              <Text style={[s.colMotivoMerma, s.headerText]}>Motivo</Text>
              <Text style={[s.colNetoMerma, s.headerText]}>Descuento</Text>
            </View>
            {mermas.map((m, i) => (
              <View key={m.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={s.colFechaMerma}>{new Date(m.fecha).toLocaleDateString("es-CL")}</Text>
                <Text style={s.colProductoMerma}>{m.producto.nombre}</Text>
                <Text style={s.colCantMerma}>{m.cantidad}</Text>
                <Text style={s.colMotivoMerma}>{m.motivo ?? "—"}</Text>
                <Text style={[s.colNetoMerma, { color: red }]}>-{fmt(m.cantidad * m.producto.precioBase)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Totals */}
        <View style={s.totalsBlock}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL DESPACHADO</Text>
            <Text style={s.totalValue}>{fmt(totalDespachado)}</Text>
          </View>
          {totalMerma > 0 && (
            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: red }]}>DEVOLUCIONES</Text>
              <Text style={[s.totalValue, { color: red }]}>-{fmt(totalMerma)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>MONTO NETO FACTURABLE</Text>
            <Text style={s.totalValue}>{fmt(netoFacturable)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>I.V.A. 19%</Text>
            <Text style={s.totalValue}>{fmt(iva)}</Text>
          </View>
          <View style={[s.totalRow, s.totalFinal]}>
            <Text style={[s.totalLabel, { fontSize: 11 }]}>TOTAL A FACTURAR</Text>
            <Text style={[s.totalValue, { fontSize: 11, color: orange }]}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={{ fontSize: 7, color: "#888" }}>Documento generado el {fecha} — Doña Any</Text>
          <View style={{ width: 180, borderTopWidth: 1, borderColor: "#ccc", paddingTop: 8, marginTop: 30 }}>
            <Text style={{ textAlign: "center", fontSize: 8 }}>Firma Conformidad</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
