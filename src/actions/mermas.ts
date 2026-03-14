"use strict";
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMermas() {
  try {
    return await prisma.merma.findMany({
      orderBy: { fecha: "desc" },
      include: {
        cliente: true,
        producto: true,
      },
    });
  } catch (error) {
    console.error("Error al obtener mermas:", error);
    return [];
  }
}

export async function createMerma(formData: FormData) {
  const clienteId = formData.get("clienteId") as string;
  const productoId = formData.get("productoId") as string;
  const cantidad = parseInt(formData.get("cantidad") as string);
  const motivo = formData.get("motivo") as string;
  const fechaStr = formData.get("fecha") as string;
  const envioId = formData.get("envioId") as string | null;

  try {
    await prisma.merma.create({
      data: {
        clienteId,
        productoId,
        cantidad,
        motivo: motivo || null,
        fecha: fechaStr ? new Date(fechaStr + "T12:00:00") : new Date(),
        envioId: envioId || null,
      },
    });
    revalidatePath("/mermas");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al crear merma:", error);
    return { success: false, error: "Error al registrar la merma." };
  }
}

export async function deleteMerma(id: string) {
  try {
    await prisma.merma.delete({
      where: { id },
    });
    revalidatePath("/mermas");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar merma:", error);
    return { success: false, error: "Error al eliminar el registro." };
  }
}
