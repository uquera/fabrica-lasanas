"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClientes() {
  try {
    return await prisma.cliente.findMany({
      orderBy: { razonSocial: "asc" },
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
}

export async function createCliente(formData: FormData) {
  const rut = formData.get("rut") as string;
  const razonSocial = formData.get("razonSocial") as string;
  const direccion = formData.get("direccion") as string;
  const giro = formData.get("giro") as string;
  const email = formData.get("email") as string;

  try {
    await prisma.cliente.create({
      data: { rut, razonSocial, direccion, giro, email },
    });
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return { success: false, error: "Error al crear el cliente. Verifica que el RUT no esté duplicado." };
  }
}

export async function updateCliente(id: string, data: { rut?: string; razonSocial?: string; giro?: string; direccion?: string; email?: string }) {
  try {
    await prisma.cliente.update({
      where: { id },
      data,
    });
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return { success: false, error: "Error al actualizar el cliente." };
  }
}

export async function deleteCliente(id: string) {
  try {
    await prisma.cliente.delete({
      where: { id },
    });
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return { success: false, error: "No se puede eliminar un cliente con registros asociados." };
  }
}
