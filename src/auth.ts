import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username as string;
        const password = credentials.password as string;

        // 1. Verificar si tiene contraseña reseteada en BD
        const dbUser = await (prisma as any).usuario.findUnique({
          where: { username }
        });

        if (dbUser && dbUser.passwordHash) {
          const match = await bcrypt.compare(password, dbUser.passwordHash);
          if (match) {
            return { id: dbUser.id, name: dbUser.username };
          }
          return null; // Si tiene hash pero fallo, no hacemos fallback
        }

        // 2. Fallback a contraseñas en variables de entorno (por defecto)
        const users = [
          { id: "1",  username: process.env.APP_USERNAME   ?? "admin",        password: process.env.APP_PASSWORD   ?? "lasanas2025" },
          { id: "2",  username: process.env.APP_USERNAME_2 ?? "uquera",        password: process.env.APP_PASSWORD_2 ?? "1234uquera" },
          { id: "3",  username: process.env.APP_USERNAME_3 ?? "timemarket",    password: process.env.APP_PASSWORD_3 ?? "1234time" },
          { id: "4",  username: process.env.APP_USERNAME_4 ?? "susana",        password: process.env.APP_PASSWORD_4 ?? "susana2025" },
          { id: "tm1", username: "tm.vivar",       password: process.env.TM_VIVAR_PASS       ?? "vivar2025" },
          { id: "tm2", username: "tm.terranova",   password: process.env.TM_TERRANOVA_PASS   ?? "terranova2025" },
          { id: "tm3", username: "tm.chipana",     password: process.env.TM_CHIPANA_PASS     ?? "chipana2025" },
          { id: "tm4", username: "tm.playabrava",  password: process.env.TM_PLAYABRAVA_PASS  ?? "playabrava2025" },
          { id: "tm5", username: "tm.anibalpinto", password: process.env.TM_ANIBALPINTO_PASS ?? "anibalpinto2025" },
          { id: "tm6", username: "tm.tarapaca",    password: process.env.TM_TARAPACA_PASS    ?? "tarapaca2025" },
          { id: "tm7", username: "tm.losmolles",   password: process.env.TM_LOSMOLLES_PASS   ?? "losmolles2025" },
          { id: "tm8", username: "tm.bilbao2",     password: process.env.TM_BILBAO2_PASS     ?? "bilbao22025" },
          { id: "tm9", username: "tm.peninsula",   password: process.env.TM_PENINSULA_PASS   ?? "peninsula2025" },
        ];

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
          return { id: user.id, name: user.username };
        }
        
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
