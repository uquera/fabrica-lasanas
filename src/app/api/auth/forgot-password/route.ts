import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

// Mapeo de username → email
const USER_EMAILS: Record<string, string> = {
  admin:           "donna.any.cl@gmail.com",
  uquera:          "donna.any.cl@gmail.com",
  susana:          "donna.any.cl@gmail.com",
  timemarket:      "donna.any.cl@gmail.com",
  "tm.vivar":      "donna.any.cl@gmail.com",
  "tm.terranova":  "donna.any.cl@gmail.com",
  "tm.chipana":    "donna.any.cl@gmail.com",
  "tm.playabrava": "donna.any.cl@gmail.com",
  "tm.anibalpinto":"donna.any.cl@gmail.com",
  "tm.tarapaca":   "donna.any.cl@gmail.com",
  "tm.losmolles":  "donna.any.cl@gmail.com",
  "tm.bilbao2":    "donna.any.cl@gmail.com",
  "tm.peninsula":  "donna.any.cl@gmail.com",
};

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== "string") {
      // Responder 200 siempre para no revelar información
      return NextResponse.json({ ok: true });
    }

    const email = USER_EMAILS[username.trim().toLowerCase()];

    // Si el usuario no existe, igual respondemos 200
    if (!email) {
      return NextResponse.json({ ok: true });
    }

    // Asegurar que el Usuario exista en la tabla
    await (prisma as any).usuario.upsert({
      where:  { username },
      update: {},
      create: { username, email },
    });

    // Invalidar tokens anteriores del mismo usuario (seguridad)
    await (prisma as any).passwordResetToken.updateMany({
      where: { username, usedAt: null },
      data:  { usedAt: new Date() },
    });

    // Generar token seguro
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hora

    await (prisma as any).passwordResetToken.create({
      data: { token, username, expiresAt },
    });

    const baseUrl = process.env.AUTH_URL ?? "https://www.donnaany.com";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: "Recuperación de contraseña — Doña Any",
      text: `Hola ${username},\n\nRecibiste este email porque solicitaste restablecer tu contraseña.\n\nHaz click en el siguiente enlace para crear una nueva contraseña (válido por 1 hora):\n\n${resetLink}\n\nSi no solicitaste esto, ignora este email.\n\nDoña Any Management`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ ok: true }); // Nunca revelar errores al cliente
  }
}
