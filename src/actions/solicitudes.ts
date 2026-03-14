"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSolicitudPedido(data: {
  clienteId: string;
  tienda: string;
  cantidad: number;
  nota: string;
  fechaEntrega: string; // ISO date string
}) {
  await prisma.solicitudPedido.create({
    data: {
      clienteId: data.clienteId,
      tienda: data.tienda,
      cantidad: data.cantidad,
      nota: data.nota || null,
      fechaEntrega: new Date(data.fechaEntrega),
      estado: "pendiente",
    },
  });
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
  await prisma.solicitudPedido.update({
    where: { id },
    data: { estado: "confirmada" },
  });
  revalidatePath("/");
}

export async function descartarSolicitud(id: string) {
  await prisma.solicitudPedido.update({
    where: { id },
    data: { estado: "descartada" },
  });
  revalidatePath("/");
}
