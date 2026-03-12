"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Ensures all given store names exist as Clientes.
 * Returns a map of tiendaName -> clienteId.
 */
export async function ensureTiendas(nombres: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  for (const tienda of nombres) {
    let cliente = await prisma.cliente.findFirst({
      where: { razonSocial: tienda },
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          rut: `AUTO-${tienda.slice(0, 10).toUpperCase().replace(/\s/g, "")}`,
          razonSocial: tienda,
          giro: "Minimarket",
          direccion: tienda,
          email: "",
        },
      });
    }

    map[tienda] = cliente.id;
  }

  return map;
}

interface PlanillaRowInput {
  tienda: string;
  entregaIndividual: number;
  entregaMini: number;
  devolucionIndividual: number;
  devolucionMini: number;
}

import { generarYEnviarGuias, type EmailResult } from "@/actions/pdf";

/**
 * Receives the confirmed planilla data and creates Envios + Mermas in batch.
 */
export async function procesarPlanilla(rows: PlanillaRowInput[], fechaISO: string): Promise<{ success: boolean; enviosCreados?: number; mermasCreadas?: number; envioIds?: string[]; emailResults?: EmailResult[]; error?: string }> {
  try {
    const tiendaMap = await ensureTiendas(rows.map((r) => r.tienda));
    const fecha = new Date(fechaISO);

    // Get or create the "Lasaña individual tradicional" product
    let productoIndividual = await prisma.producto.findFirst({ where: { sku: "LAS-TRAD-IND" } });
    if (!productoIndividual) {
      productoIndividual = await prisma.producto.create({
        data: { sku: "LAS-TRAD-IND", nombre: "Lasaña individual tradicional", precioBase: 6000 },
      });
    }

    let enviosCreados = 0;
    let mermasCreadas = 0;
    const envioIds: string[] = [];

    for (const row of rows) {
      const clienteId = tiendaMap[row.tienda];
      if (!clienteId) continue;

      const totalEntrega = row.entregaIndividual + row.entregaMini;
      const totalDevolucion = row.devolucionIndividual + row.devolucionMini;

      // Create envío if there are deliveries
      if (totalEntrega > 0) {
        const envio = await prisma.envio.create({
          data: {
            clienteId,
            fecha,
            detalles: {
              create: { productoId: productoIndividual.id, cantidad: totalEntrega },
            },
          },
        });
        envioIds.push(envio.id);
        enviosCreados++;
      }

      // Create merma if there are returns
      if (totalDevolucion > 0) {
        await prisma.merma.create({
          data: {
            clienteId,
            productoId: productoIndividual.id,
            cantidad: totalDevolucion,
            motivo: "Devolución registrada vía planilla",
            fecha,
          },
        });
        mermasCreadas++;
      }
    }

    // Trigger automatic email dispatch
    let emailResults: EmailResult[] = [];
    if (envioIds.length > 0) {
      emailResults = await generarYEnviarGuias(envioIds);
    }

    revalidatePath("/");
    revalidatePath("/reportes");
    revalidatePath("/mermas");

    return { success: true, enviosCreados, mermasCreadas, envioIds, emailResults };
  } catch (error) {
    console.error("Error al procesar planilla:", error);
    return { success: false, error: "Error al procesar la planilla." };
  }
}
