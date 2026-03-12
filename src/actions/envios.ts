"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generarYEnviarGuias } from "@/actions/pdf";

export async function createEnvio(formData: FormData, items: { productoId: string, cantidad: number }[]) {
  const clienteId = formData.get("clienteId") as string;

  if (!clienteId || items.length === 0) {
    return { success: false, error: "Debes seleccionar un cliente y al menos un producto." };
  }

  try {
    const envio = await prisma.envio.create({
      data: {
        clienteId,
        detalles: {
          create: items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad
          }))
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/guias");

    return { success: true, envioId: envio.id };
  } catch (error) {
    console.error("Error creating envio:", error);
    return { success: false, error: "Error al registrar el envío." };
  }
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
