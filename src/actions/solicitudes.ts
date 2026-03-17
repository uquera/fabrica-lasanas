"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendSolicitudEmail } from "@/lib/mailer";
import { generarYEnviarGuias } from "@/actions/pdf";

export async function createSolicitudPedido(data: {
  clienteId: string;
  tienda: string;
  cantidad: number;
  nota: string;
  fechaEntrega: string; // ISO date string
  responsable?: string;
}) {
  await prisma.solicitudPedido.create({
    data: {
      clienteId: data.clienteId,
      tienda: data.tienda,
      cantidad: data.cantidad,
      nota: data.nota || null,
      responsable: data.responsable || null,
      fechaEntrega: new Date(data.fechaEntrega),
      estado: "pendiente",
    },
  });
  // Send email notification (fire-and-forget, don't block the response)
  sendSolicitudEmail({
    tienda: data.tienda,
    cantidad: data.cantidad,
    fechaEntrega: new Date(data.fechaEntrega),
    nota: data.nota || null,
    responsable: data.responsable || null,
  }).catch((e) => console.error("Email error:", e));

  revalidatePath("/");
  revalidatePath("/portal");
  return { success: true };
}

export async function getSolicitudesPendientes() {
  return prisma.solicitudPedido.findMany({
    where: { estado: "pendiente" },
    orderBy: { fechaEntrega: "asc" },
    include: { cliente: { select: { razonSocial: true } } },
  });
}

export async function confirmarSolicitud(id: string) {
  const solicitud = await prisma.solicitudPedido.findUnique({ where: { id } });
  if (!solicitud) return;

  // Obtener el producto por defecto (el primero disponible)
  const producto = await (prisma.producto as any).findFirst({ orderBy: { createdAt: "asc" } });

  if (producto) {
    // Crear el Envio como si lo hubiera hecho el admin desde "Nuevo Despacho"
    const envio = await prisma.envio.create({
      data: {
        clienteId: solicitud.clienteId,
        fecha: new Date(solicitud.fechaEntrega.toISOString().split("T")[0] + "T12:00:00"),
        detalles: {
          create: [{ productoId: producto.id, cantidad: solicitud.cantidad }],
        },
      },
    });

    // Disparar protocolo de guía de despacho (folio + PDF + email) en background
    generarYEnviarGuias([envio.id]).catch((e) =>
      console.error("[confirmarSolicitud] Error al generar guía:", e)
    );
  }

  await prisma.solicitudPedido.update({
    where: { id },
    data: { estado: "confirmada" },
  });

  revalidatePath("/");
  revalidatePath("/guias");
  revalidatePath("/envios");
  revalidatePath("/portal");
}

export async function descartarSolicitud(id: string) {
  await prisma.solicitudPedido.update({
    where: { id },
    data: { estado: "descartada" },
  });
  revalidatePath("/");
}
