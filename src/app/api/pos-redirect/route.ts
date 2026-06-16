import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { SignJWT } from "jose"

// Mapeo de emails de fabrica-lasanas → emails del POS restaurante
const EMAIL_TO_POS_EMAIL: Record<string, string> = {
  "uquera@donnaany.com": "admin@donaany.com",
}

const DEFAULT_POS_EMAIL = "admin@donaany.com"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", "https://donnaany.com"))
  }

  const userEmail = session.user.email ?? ""
  const posEmail = EMAIL_TO_POS_EMAIL[userEmail] ?? DEFAULT_POS_EMAIL

  const secret = new TextEncoder().encode(process.env.SHARED_AUTH_SECRET!)
  const token = await new SignJWT({ posEmail })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret)

  return NextResponse.redirect(
    `https://donnaany.com/pos/auto-login?token=${encodeURIComponent(token)}`
  )
}
