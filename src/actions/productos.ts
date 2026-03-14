"use strict";
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Obtiene todos los productos. 
 * Si no hay productos, crea el producto base solicitado por el usuario.
 */
export async function getProductos() {
  try {
    let productos = await prisma.producto.findMany({
      orderBy: { nombre: "asc" },
    });

    if (productos.length === 0) {
      // Auto-seeds the requested product if empty
      const baseProduct = await prisma.producto.create({
        data: {
          sku: "LAS-TRAD-IND",
          nombre: "Lasaña individual tradicional",
          precioBase: 5042,
          tasaIva: 0.19,
        },
      });
      productos = [baseProduct];
    }

    return productos;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
}

export async function createProducto(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const sku = formData.get("sku") as string;
  const precioBase = parseFloat(formData.get("precioBase") as string);
  const tasaIva = parseFloat(formData.get("tasaIva") as string) / 100;

  try {
    await prisma.producto.create({
      data: { nombre, sku, precioBase, tasaIva },
    });
    revalidatePath("/productos");
    return { success: true };
  } catch (error) {
    console.error("Error al crear producto:", error);
    return { success: false, error: "Error al crear el producto. Verifica que el SKU no esté duplicado." };
  }
}

export async function updateProducto(id: string, data: { precioBase: number; tasaIva: number; nombre: string; sku: string }) {
  try {
    await prisma.producto.update({ where: { id }, data });
    revalidatePath("/productos");
    revalidatePath("/envios/nuevo");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return { success: false, error: "Error al actualizar el producto. Verifica que el SKU no esté duplicado." };
  }
}

export async function deleteProducto(id: string) {
  try {
    await prisma.producto.delete({ where: { id } });
    revalidatePath("/productos");
    revalidatePath("/envios/nuevo");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar producto:", error);
    if (error.code === "P2003" || error.code === "P2014" || error.message?.includes("Foreign key")) {
      return { success: false, error: "No se puede eliminar: el producto tiene despachos o mermas asociadas." };
    }
    return { success: false, error: "Error al eliminar el producto." };
  }
}
