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
      },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    // Generate PDF and Send Email
    const emailResults = await generarYEnviarGuias([envio.id]);
    const emailResult = emailResults[0];

    revalidatePath("/");
    revalidatePath("/envios");
    revalidatePath("/guias");

    return { success: true, envioId: envio.id, emailStatus: emailResult?.status, emailError: emailResult?.error };
  } catch (error) {
    console.error("Error creating envio:", error);
    return { success: false, error: "Error al registrar el envío." };
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
