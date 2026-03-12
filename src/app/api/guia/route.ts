import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { GuiaDespachoPDF } from "@/components/PDF/GuiaDespacho";
import React from "react";

export async function GET(req: NextRequest) {
  const envioId = req.nextUrl.searchParams.get("envioId");
  if (!envioId) return NextResponse.json({ error: "Missing envioId" }, { status: 400 });

  const envio = await (prisma.envio as any).findUnique({
    where: { id: envioId },
    include: { cliente: true, detalles: { include: { producto: true } } },
  });

  if (!envio) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });

  const folio = envio.guiaDespacho?.replace("GDE-", "") ?? envio.folio?.toString() ?? "S/N";
  const fechaStr = new Date(envio.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

  const pdfElement = React.createElement(GuiaDespachoPDF, {
    folio,
    fecha: fechaStr,
    cliente: {
      razonSocial: envio.cliente.razonSocial,
      rut: envio.cliente.rut,
      giro: envio.cliente.giro,
      direccion: envio.cliente.direccion,
    },
    items: envio.detalles.map((d: any) => ({
      codigo: d.producto.sku,
      descripcion: d.producto.nombre,
      cantidad: d.cantidad,
      precioUnitario: d.producto.precioBase,
      tasaIva: d.producto.tasaIva ?? 0.19,
    })),
  });

  const pdfBuffer = await renderToBuffer(pdfElement as any);

  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Guia_${folio}_${envio.cliente.razonSocial.replace(/\s/g, "_")}.pdf"`,
    },
  });
}
