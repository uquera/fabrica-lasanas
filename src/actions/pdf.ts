"use server";

import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { GuiaDespachoPDF } from "@/components/PDF/GuiaDespacho";
import { sendMail } from "@/lib/mail";
import React from "react";

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

/**
 * For a list of envío IDs, generate PDFs and email them to each client.
 */
export async function generarYEnviarGuias(envioIds: string[]): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  // Get folio counter (simple: count all envios)
  const totalEnvios = await prisma.envio.count();

  for (let i = 0; i < envioIds.length; i++) {
    const envio = await prisma.envio.findUnique({
      where: { id: envioIds[i] },
      include: { cliente: true, detalles: { include: { producto: true } } },
    }) as EnvioConDetalles | null;

    if (!envio) continue;

    const folio = String(totalEnvios - envioIds.length + i + 1);
    const fechaStr = new Date(envio.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

    // Check email
    if (!envio.cliente.email || envio.cliente.email.length === 0 || envio.cliente.email.startsWith("AUTO-")) {
      results.push({ tienda: envio.cliente.razonSocial, email: "", status: "no_email" });
      continue;
    }

    try {
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
        items: envio.detalles.map(d => ({
          codigo: d.producto.sku,
          descripcion: d.producto.nombre,
          cantidad: d.cantidad,
          precioUnitario: d.producto.precioBase,
        })),
      });

      const pdfBuffer = await renderToBuffer(pdfElement as any);

      // Send email
      const emailResult = await sendMail({
        to: envio.cliente.email,
        subject: `Guía de Despacho Nº${folio} - Doña Any`,
        text: `Estimado/a ${envio.cliente.razonSocial},\n\nAdjunto encontrará su guía de despacho correspondiente al envío del ${fechaStr}.\n\nSaludos cordiales,\nComercializadora de Alimentos Ulises Querales E.I.R.L.`,
        attachments: [{
          filename: `Guia_Despacho_N${folio}_${envio.cliente.razonSocial.replace(/\s/g, "_")}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: "application/pdf",
        }],
      });

      if (emailResult.success) {
        // Update envio with guía reference
        await prisma.envio.update({
          where: { id: envio.id },
          data: { guiaDespacho: `GDE-${folio}` },
        });
        results.push({ tienda: envio.cliente.razonSocial, email: envio.cliente.email, status: "sent" });
      } else {
        results.push({ tienda: envio.cliente.razonSocial, email: envio.cliente.email, status: "error", error: emailResult.error });
      }
    } catch (err: any) {
      console.error(`Error generating/sending PDF for ${envio.cliente.razonSocial}:`, err);
      results.push({ tienda: envio.cliente.razonSocial, email: envio.cliente.email, status: "error", error: err.message });
    }
  }

  return results;
}
