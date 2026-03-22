import type { NextAuthConfig } from "next-auth";

// Configuración liviana — compatible con Edge Runtime (middleware)
// No importa bcrypt ni prisma
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
