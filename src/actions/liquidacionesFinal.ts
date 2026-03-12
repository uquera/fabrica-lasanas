"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface LiquidacionPendiente {
  envioId: string;
  fecha: Date;
  cliente: {
    id: string;
    razonSocial: string;
    rut: string;
    giro: string;
    direccion: string;
  };
  unidadesEnviadas: number;
  unidadesMerma: number;
  mermas: {
    id: string;
    cantidad: number;
    motivo: string | null;
  }[];
}

/**
 * Returns deliveries that are not yet invoiced, along with their linked mermas.
 */
export async function getLiquidacionesPendientes(): Promise<LiquidacionPendiente[]> {
  const envios = await prisma.envio.findMany({
    where: { facturado: false },
    include: {
      cliente: true,
      detalles: true,
      mermas: true,
    },
    orderBy: { fecha: "desc" },
  });

  return envios.map((envio) => ({
    envioId: envio.id,
    fecha: envio.fecha,
    cliente: {
      id: envio.cliente.id,
      razonSocial: envio.cliente.razonSocial,
      rut: envio.cliente.rut,
      giro: envio.cliente.giro,
      direccion: envio.cliente.direccion,
    },
    unidadesEnviadas: envio.detalles.reduce((acc, det) => acc + det.cantidad, 0),
    mermas: envio.mermas.map(m => ({ id: m.id, cantidad: m.cantidad, motivo: m.motivo })),
    unidadesMerma: envio.mermas.reduce((acc, m) => acc + m.cantidad, 0),
  }));
}

/**
 * Registers a return (merma) associated with an Envio and marks it as invoiced.
 */
export async function registrarLiquidacion(envioId: string, cantidadMerma: number) {
  try {
    const envio = await prisma.envio.findUnique({
      where: { id: envioId },
      include: { detalles: true },
    });

    if (!envio) throw new Error("Envío no encontrado");

    // Create Merma linked to Envio, distributed across products
    if (cantidadMerma > 0) {
      const totalEnviado = envio.detalles.reduce((acc, d) => acc + d.cantidad, 0);

      if (envio.detalles.length <= 1 || totalEnviado === 0) {
        // Single product: straightforward
        await prisma.merma.create({
          data: {
            envioId,
            clienteId: envio.clienteId,
            productoId: envio.detalles[0].productoId,
            cantidad: cantidadMerma,
            motivo: "Liquidación de ventas",
            fecha: new Date(),
          },
        });
      } else {
        // Multiple products: distribute merma proportionally by quantity
        let remaining = cantidadMerma;
        for (let i = 0; i < envio.detalles.length; i++) {
          const detalle = envio.detalles[i];
          const isLast = i === envio.detalles.length - 1;
          const cantidad = isLast
            ? remaining
            : Math.round((detalle.cantidad / totalEnviado) * cantidadMerma);
          remaining -= cantidad;

          if (cantidad > 0) {
            await prisma.merma.create({
              data: {
                envioId,
                clienteId: envio.clienteId,
                productoId: detalle.productoId,
                cantidad,
                motivo: "Liquidación de ventas",
                fecha: new Date(),
              },
            });
          }
        }
      }
    }

    // Mark as invoiced
    await prisma.envio.update({
      where: { id: envioId },
      data: { facturado: true },
    });

    revalidatePath("/liquidaciones");
    revalidatePath("/reportes");
    return { success: true };
  } catch (error: any) {
    console.error("Error al registrar liquidación:", error);
    return { success: false, error: error.message };
  }
}
