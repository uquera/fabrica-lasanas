import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const users = [
          {
            id: "1",
            username: process.env.APP_USERNAME ?? "admin",
            password: process.env.APP_PASSWORD ?? "lasanas2025",
          },
          {
            id: "2",
            username: process.env.APP_USERNAME_2 ?? "uquera",
            password: process.env.APP_PASSWORD_2 ?? "1234uquera",
          },
        ];

        const user = users.find(
          (u) =>
            u.username === credentials?.username &&
            u.password === credentials?.password
        );

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
