import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const orange = "#e86c00";
const red = "#c41e1e";

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#333" },
  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  companyBlock: { width: "55%" },
  companyName: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  companyDetail: { fontSize: 8, color: "#555", marginBottom: 1 },
  guiaBox: { width: "40%", borderWidth: 2, borderColor: red, padding: 10, textAlign: "center" },
  guiaRut: { fontSize: 12, fontWeight: "bold", color: red, marginBottom: 4 },
  guiaTitle: { fontSize: 11, fontWeight: "bold", color: red, marginBottom: 4 },
  guiaFolio: { fontSize: 14, fontWeight: "bold", color: red },
  // Client
  clientBox: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15 },
  clientRow: { flexDirection: "row", marginBottom: 2 },
  clientLabel: { fontWeight: "bold", width: 80, fontSize: 8 },
  clientValue: { fontSize: 8 },
  // Date & SII
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  siiText: { color: "#0066cc", fontWeight: "bold", fontSize: 9 },
  dateText: { fontSize: 9 },
  // Table
  table: { marginTop: 5 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f5", borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 5 },
  colCod: { width: "10%", paddingHorizontal: 4 },
  colDesc: { width: "35%", paddingHorizontal: 4 },
  colCant: { width: "12%", paddingHorizontal: 4, textAlign: "center" },
  colPrecio: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  colImp: { width: "8%", paddingHorizontal: 4, textAlign: "center" },
  colDesc2: { width: "8%", paddingHorizontal: 4, textAlign: "center" },
  colValor: { width: "12%", paddingHorizontal: 4, textAlign: "right" },
  headerText: { fontWeight: "bold", fontSize: 7, textTransform: "uppercase" },
  // Totals
  totalsBlock: { alignItems: "flex-end", marginTop: 10 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", width: 250, paddingVertical: 3 },
  totalLabel: { width: 150, textAlign: "right", paddingRight: 10, fontSize: 9 },
  totalValue: { width: 100, textAlign: "right", fontSize: 9, fontWeight: "bold" },
  totalFinal: { borderTopWidth: 2, borderColor: orange, paddingTop: 5, marginTop: 3 },
  // Footer
  footer: { marginTop: 30, borderTopWidth: 1, borderColor: "#ccc", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  tipoTraslado: { marginBottom: 10, fontSize: 8, color: "#666" },
});

const fmt = (n: number) => "$" + n.toLocaleString("es-CL");

interface GuiaProps {
  folio: string;
  fecha: string;
  cliente: {
    razonSocial: string;
    rut: string;
    giro: string;
    direccion: string;
  };
  items: {
    codigo: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }[];
}

export const GuiaDespachoPDF = ({ folio, fecha, cliente, items }: GuiaProps) => {
  const montoNeto = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  const iva = Math.round(montoNeto * 0.19);
  const total = montoNeto + iva;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.companyBlock}>
            <Text style={s.companyName}>COMERCIALIZADORA DE ALIMENTOS ULISES QUERALES E.I.R.L.</Text>
            <Text style={s.companyDetail}>Giro: ACTIVIDADES DE RESTAURANTES.</Text>
            <Text style={s.companyDetail}>AVENIDA PADRE HURTADO 2245 - IQUIQUE</Text>
            <Text style={s.companyDetail}>eMail: Uquera.uq@gmail.com  Teléfono: 948588365</Text>
          </View>
          <View style={s.guiaBox}>
            <Text style={s.guiaRut}>R.U.T.: 77.172.854-5</Text>
            <Text style={s.guiaTitle}>GUIA DE DESPACHO{"\n"}ELECTRONICA</Text>
            <Text style={s.guiaFolio}>Nº{folio}</Text>
          </View>
        </View>

        {/* Date & SII */}
        <View style={s.dateRow}>
          <Text style={s.siiText}>S.I.I. - IQUIQUE</Text>
          <Text style={s.dateText}>Fecha Emisión: {fecha}</Text>
        </View>

        {/* Client */}
        <View style={s.clientBox}>
          {[
            ["SEÑOR(ES):", cliente.razonSocial],
            ["R.U.T.:", cliente.rut],
            ["GIRO:", cliente.giro],
            ["DIRECCION:", cliente.direccion],
            ["COMUNA:", "IQUIQUE"],
            ["CIUDAD:", "Iquique"],
          ].map(([label, val], i) => (
            <View key={i} style={s.clientRow}>
              <Text style={s.clientLabel}>{label}</Text>
              <Text style={s.clientValue}>{val}</Text>
            </View>
          ))}
        </View>

        <Text style={s.tipoTraslado}>Tipo Traslado: Operacion Constituye Venta</Text>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.colCod, s.headerText]}>Código</Text>
            <Text style={[s.colDesc, s.headerText]}>Descripción</Text>
            <Text style={[s.colCant, s.headerText]}>Cantidad</Text>
            <Text style={[s.colPrecio, s.headerText]}>Precio</Text>
            <Text style={[s.colImp, s.headerText]}>%Impto</Text>
            <Text style={[s.colDesc2, s.headerText]}>%Desc.</Text>
            <Text style={[s.colValor, s.headerText]}>Valor</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.colCod}>{item.codigo || "-"}</Text>
              <Text style={s.colDesc}>{item.descripcion}</Text>
              <Text style={s.colCant}>{item.cantidad} und</Text>
              <Text style={s.colPrecio}>{fmt(item.precioUnitario)}</Text>
              <Text style={s.colImp}></Text>
              <Text style={s.colDesc2}></Text>
              <Text style={s.colValor}>{fmt(item.cantidad * item.precioUnitario)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsBlock}>
          <View style={s.totalRow}><Text style={s.totalLabel}>MONTO NETO</Text><Text style={s.totalValue}>{fmt(montoNeto)}</Text></View>
          <View style={s.totalRow}><Text style={s.totalLabel}>I.V.A. 19%</Text><Text style={s.totalValue}>{fmt(iva)}</Text></View>
          <View style={s.totalRow}><Text style={s.totalLabel}>IMPUESTO ADICIONAL</Text><Text style={s.totalValue}>$0</Text></View>
          <View style={[s.totalRow, s.totalFinal]}><Text style={[s.totalLabel, { fontSize: 11 }]}>TOTAL</Text><Text style={[s.totalValue, { fontSize: 11, color: orange }]}>{fmt(total)}</Text></View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={{ fontSize: 7, color: "#888" }}>Res.99 de 2014  Verifique documento: www.sii.cl</Text>
          <View style={{ width: 180, borderTopWidth: 1, borderColor: "#ccc", paddingTop: 8, marginTop: 30 }}>
            <Text style={{ textAlign: "center", fontSize: 8 }}>Firma Recepción</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
