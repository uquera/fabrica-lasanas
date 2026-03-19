import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

// Mapeo de username → email
const USER_EMAILS: Record<string, string> = {
  admin:           "donna.any.cl@gmail.com",
  uquera:          "uquera.uq@gmail.com",
  susana:          "donna.any.cl@gmail.com",
  timemarket:      "elisa.martinez@timemarket.cl",
  "tm.vivar":      "vivar@timemarket.cl",
  "tm.terranova":  "bilbao@timemarket.cl",
  "tm.chipana":    "chipana@timemarket.cl",
  "tm.playabrava": "playabrava@timemarket.cl",
  "tm.anibalpinto":"anibalpinto@timemarket.cl",
  "tm.tarapaca":   "tarapaca@timemarket.cl",
  "tm.losmolles":  "losmolles@timemarket.cl",
  "tm.bilbao2":    "bilbao2@timemarket.cl",
  "tm.peninsula":  "peninsula@timemarket.cl",
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
    await prisma.usuario.upsert({
      where:  { username },
      update: {},
      create: { username, email },
    });

    // Invalidar tokens anteriores del mismo usuario (seguridad)
    await prisma.passwordResetToken.updateMany({
      where: { username, usedAt: null },
      data:  { usedAt: new Date() },
    });

    // Generar token seguro
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // +30 minutos

    await prisma.passwordResetToken.create({
      data: { token, username, expiresAt },
    });

    const baseUrl = process.env.AUTH_URL ?? "https://www.donnaany.com";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: "Recuperación de contraseña — Doña Any",
      text: `Hola ${username},\n\nRecibiste este email porque solicitaste restablecer tu contraseña.\n\nHaz click en el siguiente enlace para crear una nueva contraseña (válido por 30 minutos):\n\n${resetLink}\n\nSi no solicitaste esto, ignora este email.\n\nDoña Any Management`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ ok: true }); // Nunca revelar errores al cliente
  }
}
