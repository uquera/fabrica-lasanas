"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generarYEnviarGuias } from "@/actions/pdf";

export async function createEnvio(
  formData: FormData,
  items: { productoId: string; cantidad: number }[],
  fecha?: string,
) {
  const clienteId = formData.get("clienteId") as string;

  if (!clienteId || items.length === 0) {
    return { success: false, error: "Debes seleccionar un cliente y al menos un producto." };
  }

  try {
    const envio = await prisma.envio.create({
      data: {
        clienteId,
        fecha: fecha ? new Date(fecha + "T12:00:00") : new Date(),
        detalles: {
          create: items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
          })),
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/guias");
    return { success: true, envioId: envio.id };
  } catch (error) {
    console.error("Error creating envio:", error);
    return { success: false, error: "Error al registrar el envío." };
  }
}

export async function createEnviosBulk(
  fecha: string,
  envios: { clienteId: string; items: { productoId: string; cantidad: number }[] }[],
) {
  const results: { clienteId: string; envioId: string | null; error: string | null }[] = [];

  for (const e of envios) {
    try {
      const envio = await prisma.envio.create({
        data: {
          clienteId: e.clienteId,
          fecha: new Date(fecha + "T12:00:00"),
          detalles: { create: e.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })) },
        },
      });
      results.push({ clienteId: e.clienteId, envioId: envio.id, error: null });
    } catch (err: any) {
      results.push({ clienteId: e.clienteId, envioId: null, error: err.message });
    }
  }

  revalidatePath("/");
  revalidatePath("/guias");
  return results;
}

export async function getUltimoReparto() {
  const last = await prisma.envio.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return [];

  const dayStart = new Date(last.createdAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const envios = await (prisma.envio as any).findMany({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
    include: { detalles: { select: { productoId: true, cantidad: true } } },
  });

  return envios.map((e: any) => ({
    clienteId: e.clienteId as string,
    items: e.detalles.map((d: any) => ({ productoId: d.productoId as string, cantidad: d.cantidad as number })),
  }));
}

export async function enviarGuia(envioId: string) {
  try {
    const results = await generarYEnviarGuias([envioId]);
    const result = results[0];
    revalidatePath("/guias");
    revalidatePath("/");
    return { success: true, emailStatus: result?.status, emailError: result?.error };
  } catch (error) {
    console.error("Error sending guia:", error);
    return { success: false, error: "Error al enviar la guía." };
  }
}

export async function getEnviosRecientes() {
  return await prisma.envio.findMany({
    take: 10,
    orderBy: { fecha: "desc" },
    include: {
      cliente: true,
      detalles: {
        include: {
          producto: true
        }
      }
    }
  });
}
