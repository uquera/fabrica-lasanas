import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { LiquidacionPDF } from "@/components/PDF/LiquidacionPDF";
import { getLiquidacionDetalle } from "@/actions/liquidacionesFinal";
import React from "react";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(req: NextRequest) {
  const rut = req.nextUrl.searchParams.get("rut");
  if (!rut) return NextResponse.json({ error: "Missing rut" }, { status: 400 });

  const { envios, mermas, cliente } = await getLiquidacionDetalle(rut);
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  let logoSrc: string | undefined;
  try {
    const buf = readFileSync(join(process.cwd(), "public", "logo.png"));
    logoSrc = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { logoSrc = undefined; }

  let totalDespachado = 0;
  let totalMerma = 0;
  for (const e of envios) for (const d of e.detalles) totalDespachado += d.cantidad * d.producto.precioBase;
  for (const m of mermas) totalMerma += m.cantidad * m.producto.precioBase;
  const netoFacturable = Math.max(0, totalDespachado - totalMerma);

  const fecha = new Date().toLocaleDateString("es-CL");
  const facturaId = req.nextUrl.searchParams.get("facturaId") ?? "PREVIEW";

  const pdfBuffer = await renderToBuffer(
    React.createElement(LiquidacionPDF, {
      facturaId,
      fecha,
      logoSrc,
      cliente,
      envios,
      mermas,
      totalDespachado,
      totalMerma,
      netoFacturable,
    }) as any
  );

  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="liquidacion-${rut}.pdf"`,
    },
  });
}
