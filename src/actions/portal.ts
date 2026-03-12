"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function marcarPagado(envioId: string, comprobante: string | null) {
  await (prisma.envio as any).update({
    where: { id: envioId },
    data: {
      pagado: true,
      fechaPago: new Date(),
      comprobantePago: comprobante,
    },
  });
  revalidatePath("/portal");
}
