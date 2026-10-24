"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { encolarGuias, procesarEnCola } from "@/lib/colaGuias";

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
    // Congelar el precio actual de cada producto en el detalle (precio histórico)
    const productos = await prisma.producto.findMany({
      where: { id: { in: items.map((i) => i.productoId) } },
      select: { id: true, precioBase: true },
    });
    const precioPorId = new Map(productos.map((p) => [p.id, p.precioBase]));

    const envio = await prisma.envio.create({
      data: {
        clienteId,
        fecha: fecha ? new Date(fecha + "T12:00:00") : new Date(),
        detalles: {
          create: items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: precioPorId.get(item.productoId) ?? null,
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

  // Congelar el precio actual de cada producto en el detalle (precio histórico)
  const productoIds = [...new Set(envios.flatMap((e) => e.items.map((i) => i.productoId)))];
  const productos = await prisma.producto.findMany({
    where: { id: { in: productoIds } },
    select: { id: true, precioBase: true },
  });
  const precioPorId = new Map(productos.map((p) => [p.id, p.precioBase]));

  for (const e of envios) {
    try {
      const envio = await prisma.envio.create({
        data: {
          clienteId: e.clienteId,
          fecha: new Date(fecha + "T12:00:00"),
          detalles: { create: e.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: precioPorId.get(i.productoId) ?? null })) },
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

/**
 * Encola las guías del reparto masivo y responde al instante: el servidor las
 * genera y envía aunque el celular bloquee la pantalla. La pantalla consulta
 * el avance con estadoGuias().
 */
export async function enviarGuiasEnSegundoPlano(envioIds: string[]) {
  await encolarGuias(envioIds);
  return { success: true };
}

export async function estadoGuias(envioIds: string[]) {
  const envios = await (prisma.envio as any).findMany({
    where: { id: { in: envioIds } },
    select: { id: true, folio: true, emailEstado: true, emailError: true },
  });
  if (envios.every((e: any) => !["pendiente", "enviando"].includes(e.emailEstado))) {
    revalidatePath("/guias");
    revalidatePath("/");
  }
  return envios as { id: string; folio: number | null; emailEstado: string | null; emailError: string | null }[];
}

// Envío o reenvío manual de una guía (modo individual y botón del historial).
// Pasa por la misma cola para no repetir folios; si el celular corta la
// conexión, la guía queda "enviando" y la retoma retomarPendientes().
export async function enviarGuia(envioId: string) {
  try {
    const results = await procesarEnCola([envioId], { forzar: true });
    const result = results[0];
    revalidatePath("/guias");
    revalidatePath("/");
    if (!result) return { success: false, error: "No se encontró el envío." };
    // PDF/folio always generated; email may or may not have sent
    return {
      success: true,
      emailStatus: result.status,           // "sent" | "no_email" | "error"
      emailError: result.error ?? null,
    };
  } catch (error: any) {
    console.error("Error sending guia:", error);
    return { success: false, error: error?.message ?? "Error al generar la guía." };
  }
}

export async function deleteEnvio(envioId: string) {
  try {
    await prisma.detalleEnvio.deleteMany({ where: { envioId } });
    await prisma.envio.delete({ where: { id: envioId } });
    revalidatePath("/guias");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting envio:", error);
    return { success: false, error: error?.message ?? "Error al eliminar el envío." };
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
