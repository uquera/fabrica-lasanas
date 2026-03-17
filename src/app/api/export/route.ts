import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fin = searchParams.get("fin");
  const label = searchParams.get("label") ?? "reporte";

  if (!inicio || !fin) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const start = new Date(inicio);
  const end = new Date(fin);

  const [envios, mermas] = await Promise.all([
    (prisma.envio as any).findMany({
      where: { fecha: { gte: start, lte: end } },
      include: {
        cliente: { select: { razonSocial: true, rut: true, sucursal: true } },
        detalles: { include: { producto: { select: { nombre: true, precioBase: true, tasaIva: true } } } },
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.merma.findMany({
      where: { fecha: { gte: start, lte: end } },
      include: {
        cliente: { select: { razonSocial: true } },
        producto: { select: { nombre: true, precioBase: true, tasaIva: true } },
      },
      orderBy: { fecha: "asc" },
    }),
  ]);

  const rows: string[] = [];

  // ── Envíos ──────────────────────────────────────────────────────────────
  rows.push("DESPACHOS");
  rows.push("Fecha,Folio,Cliente,Sucursal,Producto,Cantidad,Neto,IVA,Total c/IVA,Pagado");

  for (const e of envios) {
    const fecha = new Date(e.fecha).toLocaleDateString("es-CL");
    const folio = e.folio ?? "";
    const cliente = `"${e.cliente.razonSocial}"`;
    const sucursal = `"${e.cliente.sucursal ?? ""}"`;
    const pagado = e.pagado ? "Sí" : "No";
    for (const d of e.detalles) {
      const neto = d.cantidad * d.producto.precioBase;
      const iva = neto * (d.producto.tasaIva ?? 0.19);
      const total = neto + iva;
      rows.push([
        fecha, folio, cliente, sucursal,
        `"${d.producto.nombre}"`, d.cantidad,
        Math.round(neto), Math.round(iva), Math.round(total), pagado,
      ].join(","));
    }
  }

  rows.push("");
  rows.push("MERMAS");
  rows.push("Fecha,Cliente,Producto,Cantidad,Costo c/IVA,Motivo,Responsable");

  for (const m of mermas as any[]) {
    const fecha = new Date(m.fecha).toLocaleDateString("es-CL");
    const costo = Math.round(m.cantidad * m.producto.precioBase * (1 + (m.producto.tasaIva ?? 0.19)));
    rows.push([
      fecha,
      `"${m.cliente.razonSocial}"`,
      `"${m.producto.nombre}"`,
      m.cantidad,
      costo,
      `"${m.motivo ?? ""}"`,
      `"${m.responsable ?? ""}"`,
    ].join(","));
  }

  const csv = "\uFEFF" + rows.join("\r\n"); // BOM for Excel UTF-8
  const filename = `reporte_${label.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
