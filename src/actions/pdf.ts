"use server";

import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { GuiaDespachoPDF } from "@/components/PDF/GuiaDespacho";
import { sendMail } from "@/lib/mail";
import React from "react";
import { revalidatePath } from "next/cache";

interface EnvioConDetalles {
  id: string;
  fecha: Date;
  cliente: { razonSocial: string; rut: string; giro: string; direccion: string; email: string };
  detalles: { cantidad: number; producto: { sku: string; nombre: string; precioBase: number } }[];
}

export interface EmailResult {
  tienda: string;
  email: string;
  status: "sent" | "no_email" | "error";
  error?: string;
}

async function asignarFolio(envioId: string): Promise<number> {
  // Get max folio using Prisma native query (avoids $queryRaw BigInt issues)
  const last = await (prisma.envio as any).findFirst({
    where: { folio: { not: null } },
    orderBy: { folio: "desc" },
    select: { folio: true },
  });
  const nextFolio = ((last?.folio as number) ?? 0) + 1;

  // Use $executeRaw to bypass Prisma runtime validation for new field
  await prisma.$executeRaw`UPDATE Envio SET folio = ${nextFolio} WHERE id = ${envioId}`;
  return nextFolio;
}

/**
 * For a list of envío IDs, generate PDFs and email them to each client.
 */
export async function generarYEnviarGuias(envioIds: string[]): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const envioId of envioIds) {
    const envio = await (prisma.envio as any).findUnique({
      where: { id: envioId },
      include: { cliente: true, detalles: { include: { producto: true } } },
    }) as EnvioConDetalles & { folio: number | null } | null;

    if (!envio) continue;

    const clienteEmail = envio.cliente.email?.trim();

    // Check email
    if (!clienteEmail || clienteEmail.length === 0) {
      console.log(`[PDF] Sin email: ${envio.cliente.razonSocial}`);
      results.push({ tienda: envio.cliente.razonSocial, email: "", status: "no_email" });
      continue;
    }

    try {
      // Assign folio if not set
      let folioNum = envio.folio;
      if (!folioNum) {
        folioNum = await asignarFolio(envio.id);
      }
      const folio = String(folioNum);
      const fechaStr = new Date(envio.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

      console.log(`[PDF] Generando guía Nº${folio} para ${envio.cliente.razonSocial} → ${clienteEmail}`);

      // Generate PDF
      const pdfElement = React.createElement(GuiaDespachoPDF, {
        folio,
        fecha: fechaStr,
        cliente: {
          razonSocial: envio.cliente.razonSocial,
          rut: envio.cliente.rut,
          giro: envio.cliente.giro,
          direccion: envio.cliente.direccion,
        },
        items: (envio as any).detalles.map((d: any) => ({
          codigo: d.producto.sku,
          descripcion: d.producto.nombre,
          cantidad: d.cantidad,
          precioUnitario: d.producto.precioBase,  // precio neto
          tasaIva: d.producto.tasaIva ?? 0.19,
        })),
      });

      const pdfBuffer = await renderToBuffer(pdfElement as any);
      console.log(`[PDF] PDF generado (${pdfBuffer.byteLength} bytes)`);

      // Send email
      const emailResult = await sendMail({
        to: clienteEmail,
        subject: `Guía de Despacho Nº${folio} - Doña Any`,
        text: `Estimado/a ${envio.cliente.razonSocial},\n\nAdjunto encontrará su guía de despacho correspondiente al envío del ${fechaStr}.\n\nSaludos cordiales,\nComercializadora de Alimentos Ulises Querales E.I.R.L.`,
        attachments: [{
          filename: `Guia_Despacho_N${folio}_${envio.cliente.razonSocial.replace(/\s/g, "_")}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: "application/pdf",
        }],
      });

      if (emailResult.success) {
        console.log(`[PDF] ✓ Email enviado a ${clienteEmail}`);
        await prisma.envio.update({
          where: { id: envio.id },
          data: { guiaDespacho: `GDE-${folio}` },
        });
        revalidatePath("/guias");
        results.push({ tienda: envio.cliente.razonSocial, email: clienteEmail, status: "sent" });
      } else {
        console.error(`[PDF] ✗ Error enviando email: ${emailResult.error}`);
        results.push({ tienda: envio.cliente.razonSocial, email: clienteEmail, status: "error", error: emailResult.error });
      }
    } catch (err: any) {
      console.error(`[PDF] ✗ Error para ${envio.cliente.razonSocial}:`, err.message);
      results.push({ tienda: envio.cliente.razonSocial, email: clienteEmail, status: "error", error: err.message });
    }
  }

  return results;
}
