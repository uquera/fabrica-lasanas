"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { LiquidacionPDF } from "@/components/PDF/LiquidacionPDF";
import path from "path";
import fs from "fs";

// ── Tipos ──────────────────────────────────────────────────────────────────

export type EnvioPendiente = {
  id: string;
  folio: number | null;
  fecha: string;
  cliente: { id: string; razonSocial: string; rut: string; sucursal: string | null; giro: string; direccion: string; email: string };
  detalles: { cantidad: number; producto: { nombre: string; precioBase: number; sku: string } }[];
};

export type MermaItem = {
  id: string;
  fecha: string;
  cantidad: number;
  motivo: string | null;
  envioId: string | null;
  producto: { nombre: string; precioBase: number };
};

export type ClientePendiente = {
  rut: string;
  razonSocial: string;
  email: string;
  totalGuias: number;
  totalDespachado: number;
  totalMerma: number;
  netoFacturable: number;
  totalConIva: number;
};

// ── Pendientes agrupados por RUT ───────────────────────────────────────────

export async function getLiquidacionesPendientes(): Promise<ClientePendiente[]> {
  const envios = await (prisma.envio as any).findMany({
    where: { facturado: false, folio: { not: null } },
    include: {
      cliente: true,
      detalles: { include: { producto: true } },
    },
    orderBy: { fecha: "desc" },
  });

  const mermas = await (prisma.merma as any).findMany({
    include: { cliente: true, producto: true },
  });

  const map = new Map<string, ClientePendiente>();

  for (const envio of envios) {
    const rut = envio.cliente.rut;
    if (!map.has(rut)) {
      map.set(rut, {
        rut,
        razonSocial: envio.cliente.razonSocial,
        email: envio.cliente.email,
        totalGuias: 0,
        totalDespachado: 0,
        totalMerma: 0,
        netoFacturable: 0,
        totalConIva: 0,
      });
    }
    const g = map.get(rut)!;
    g.totalGuias += 1;
    for (const d of envio.detalles) {
      g.totalDespachado += d.cantidad * d.producto.precioBase;
    }
  }

  for (const merma of mermas) {
    const rut = merma.cliente.rut;
    if (map.has(rut)) {
      map.get(rut)!.totalMerma += merma.cantidad * merma.producto.precioBase;
    }
  }

  for (const g of map.values()) {
    g.netoFacturable = Math.max(0, g.totalDespachado - g.totalMerma);
    g.totalConIva = Math.round(g.netoFacturable * 1.19);
  }

  return Array.from(map.values());
}

// ── Detalle de un cliente ──────────────────────────────────────────────────

export async function getLiquidacionDetalle(rut: string): Promise<{
  envios: EnvioPendiente[];
  mermas: MermaItem[];
  cliente: { razonSocial: string; rut: string; giro: string; direccion: string; email: string } | null;
}> {
  const clientes = await prisma.cliente.findMany({ where: { rut } });
  const clienteIds = clientes.map((c) => c.id);

  const envios = await (prisma.envio as any).findMany({
    where: { clienteId: { in: clienteIds }, facturado: false, folio: { not: null } },
    include: { cliente: true, detalles: { include: { producto: true } } },
    orderBy: { fecha: "asc" },
  });

  const mermas = await (prisma.merma as any).findMany({
    where: { clienteId: { in: clienteIds } },
    include: { producto: true },
    orderBy: { fecha: "asc" },
  });

  return {
    envios: envios.map((e: any) => ({ ...e, fecha: e.fecha.toISOString() })),
    mermas: mermas.map((m: any) => ({ ...m, fecha: m.fecha.toISOString() })),
    cliente: clientes[0] ?? null,
  };
}

// ── Confirmar liquidación ──────────────────────────────────────────────────

export async function confirmarLiquidacion(rut: string, facturaId: string, enviarEmail: boolean) {
  const clientes = await prisma.cliente.findMany({ where: { rut } });
  const clienteIds = clientes.map((c) => c.id);

  const { envios, mermas, cliente } = await getLiquidacionDetalle(rut);

  await (prisma.envio as any).updateMany({
    where: { clienteId: { in: clienteIds }, facturado: false },
    data: { facturado: true, facturaId },
  });

  let emailStatus: "sent" | "no_email" | "error" | "skipped" = "skipped";
  let emailError: string | null = null;

  if (enviarEmail && cliente?.email && !cliente.email.startsWith("AUTO-")) {
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      const logoSrc = fs.existsSync(logoPath)
        ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
        : undefined;

      let totalDespachado = 0;
      let totalMerma = 0;
      for (const e of envios) for (const d of e.detalles) totalDespachado += d.cantidad * d.producto.precioBase;
      for (const m of mermas) totalMerma += m.cantidad * m.producto.precioBase;
      const netoFacturable = Math.max(0, totalDespachado - totalMerma);

      const pdfBuffer = await renderToBuffer(
        createElement(LiquidacionPDF, {
          facturaId,
          fecha: new Date().toLocaleDateString("es-CL"),
          logoSrc,
          cliente: cliente as any,
          envios,
          mermas,
          totalDespachado,
          totalMerma,
          netoFacturable,
        })
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });

      await transporter.sendMail({
        from: `"Doña Any" <${process.env.GMAIL_USER}>`,
        to: cliente.email,
        subject: `Liquidación de ventas — Factura N° ${facturaId}`,
        html: `<p>Estimados,</p><p>Adjuntamos la liquidación de despachos correspondiente.</p><p><b>Factura N° ${facturaId}</b></p><p>Monto neto: $${netoFacturable.toLocaleString("es-CL")}<br>Total c/IVA: $${Math.round(netoFacturable * 1.19).toLocaleString("es-CL")}</p><p>Saludos,<br>Doña Any</p>`,
        attachments: [{ filename: `liquidacion-${facturaId}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
      });

      emailStatus = "sent";
    } catch (e: any) {
      emailStatus = "error";
      emailError = e.message;
    }
  } else if (enviarEmail) {
    emailStatus = "no_email";
  }

  revalidatePath("/liquidaciones");
  revalidatePath("/");
  return { success: true, emailStatus, emailError };
}
