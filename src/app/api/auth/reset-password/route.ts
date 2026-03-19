import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || typeof token !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    // Buscar token
    const resetToken = await (prisma as any).passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Token inválido o no encontrado." }, { status: 400 });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: "Este link ya fue utilizado." }, { status: 400 });
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      return NextResponse.json({ error: "El link ha expirado. Solicita uno nuevo." }, { status: 400 });
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Actualizar/crear el registro del usuario con la nueva contraseña
    await (prisma as any).usuario.upsert({
      where:  { username: resetToken.username },
      update: { passwordHash },
      create: { username: resetToken.username, email: "", passwordHash },
    });

    // Marcar token como usado
    await (prisma as any).passwordResetToken.update({
      where: { token },
      data:  { usedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
