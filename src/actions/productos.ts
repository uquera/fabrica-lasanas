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
          precioBase: 6000,
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

  try {
    await prisma.producto.create({
      data: { nombre, sku, precioBase },
    });
    revalidatePath("/productos");
    return { success: true };
  } catch (error) {
    console.error("Error al crear producto:", error);
    return { success: false, error: "Error al crear el producto. Verifica que el SKU no esté duplicado." };
  }
}
