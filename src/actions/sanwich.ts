"use server";

import prisma from "@/lib/prisma";

const REWARD = "2x1 en churrascos";
const CODE_POOL = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeCode() {
  let code = "DA-";
  for (let i = 0; i < 4; i++) {
    code += CODE_POOL[Math.floor(Math.random() * CODE_POOL.length)];
  }
  return code;
}

/** Normaliza un teléfono chileno a +569XXXXXXXX cuando es posible. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("569") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("56") && digits.length === 11) return `+${digits}`;
  if (digits.length === 9 && digits.startsWith("9")) return `+56${digits}`;
  if (digits.length === 8) return `+569${digits}`;
  return `+${digits}`;
}

export type ClaimResult =
  | { ok: true; code: string; name: string; reward: string }
  | { ok: false; error: string };

/** Registra un lead de la campaña sándwich y devuelve su cupón. Idempotente por teléfono. */
export async function claimSanwich(input: { name: string; phone: string }): Promise<ClaimResult> {
  const cleanName = (input?.name ?? "").trim();
  const normalizedPhone = normalizePhone(input?.phone ?? "");

  if (cleanName.length < 2 || cleanName.length > 60) {
    return { ok: false, error: "Ingresa tu nombre" };
  }
  if (!normalizedPhone) {
    return { ok: false, error: "Ingresa un WhatsApp válido" };
  }

  try {
    // Si el mismo teléfono ya reclamó, devolvemos su cupón (no duplicamos).
    const existing = await prisma.sanwichLead.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return { ok: true, code: existing.code, name: existing.name, reward: existing.reward };
    }

    // Genera un código único (reintenta ante colisión improbable).
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const lead = await prisma.sanwichLead.create({
          data: { name: cleanName, phone: normalizedPhone, code: makeCode(), reward: REWARD },
        });
        return { ok: true, code: lead.code, name: lead.name, reward: lead.reward };
      } catch {
        // code duplicado → reintenta
      }
    }
    return { ok: false, error: "No se pudo generar tu cupón, intenta de nuevo" };
  } catch (error) {
    console.error("Error al registrar lead sándwich:", error);
    return { ok: false, error: "Sin conexión con el servidor, intenta de nuevo" };
  }
}

/** Todos los leads de la campaña (para el panel admin). */
export async function getSanwichLeads() {
  try {
    return await prisma.sanwichLead.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    console.error("Error al obtener leads sándwich:", error);
    return [];
  }
}
