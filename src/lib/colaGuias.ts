import prisma from "@/lib/prisma";
import { generarYEnviarGuias, type EmailResult } from "@/actions/pdf";

/**
 * Cola en memoria para generar y enviar guías de despacho en el servidor.
 *
 * Antes el navegador pedía las guías una por una y esperaba cada una; en el
 * celular, al bloquear la pantalla o cambiar de app, Android congelaba la página
 * y las guías restantes nunca se pedían (pasó el 21 y el 23 de octubre de 2026).
 *
 * Ahora el navegador solo encola: el servidor procesa aunque se cierre la app.
 * Todo pasa por una sola cadena para que dos envíos simultáneos no tomen el
 * mismo folio, y el estado queda en Envio.emailEstado para poder retomarlo.
 */
// En globalThis: instrumentation.ts y las server actions pueden cargar copias
// distintas de este módulo, y la cola tiene que ser una sola.
const g = globalThis as unknown as { __colaGuias?: { cadena: Promise<unknown>; enCola: Set<string> } };
const estado = (g.__colaGuias ??= { cadena: Promise.resolve(), enCola: new Set<string>() });
const enCola = estado.enCola;

/**
 * Procesa las guías en orden. Salta las que ya se enviaron, salvo `forzar`
 * (reenvío manual desde la pantalla de la guía).
 */
export function procesarEnCola(envioIds: string[], { forzar = false } = {}): Promise<EmailResult[]> {
  envioIds.forEach((id) => enCola.add(id));
  const tarea = estado.cadena.then(async () => {
    const results: EmailResult[] = [];
    for (const id of envioIds) {
      try {
        const actual = await (prisma.envio as any).findUnique({ where: { id }, select: { emailEstado: true } });
        if (!actual || (actual.emailEstado === "sent" && !forzar)) continue;
        await (prisma.envio as any).update({ where: { id }, data: { emailEstado: "enviando", emailError: null } });
        results.push(...(await generarYEnviarGuias([id])));
      } finally {
        enCola.delete(id);
      }
    }
    return results;
  });
  // Un error no debe cortar la cadena para las tareas siguientes
  estado.cadena = tarea.catch((err) => console.error("[colaGuias] Error:", err?.message ?? err));
  return tarea;
}

/** Marca las guías como pendientes y las procesa sin que la petición espere. */
export async function encolarGuias(envioIds: string[]) {
  const nuevos = envioIds.filter((id) => !enCola.has(id));
  if (!nuevos.length) return;
  await (prisma.envio as any).updateMany({
    where: { id: { in: nuevos }, NOT: { emailEstado: "sent" } },
    data: { emailEstado: "pendiente", emailError: null },
  });
  void procesarEnCola(nuevos).catch(() => {});
}

/**
 * Retoma guías que quedaron "pendiente" o "enviando" sin estar en la cola
 * (el servidor se reinició a mitad de un reparto). Se llama al arrancar y cada
 * 5 minutos desde src/instrumentation.ts.
 */
export async function retomarPendientes() {
  const pendientes: { id: string }[] = await (prisma.envio as any).findMany({
    where: { emailEstado: { in: ["pendiente", "enviando"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const huerfanos = pendientes.map((p) => p.id).filter((id) => !enCola.has(id));
  if (!huerfanos.length) return;
  console.log(`[colaGuias] Retomando ${huerfanos.length} guía(s) pendiente(s)`);
  await encolarGuias(huerfanos);
}
