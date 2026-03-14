"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex items-center justify-center p-6">
      {/* Glow background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] left-[30%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Doña Any"
            width={220}
            height={220}
            className="mx-auto mb-2 drop-shadow-2xl"
            style={{ maxWidth: "220px" }}
          />
          <p className="text-zinc-500 text-sm">Sistema de gestión de despachos</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-lg font-bold mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  spellCheck={false}
                  className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-orange-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                  tabIndex={-1}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </>
                    ) : (
                      <>
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
              ) : (
                "Ingresar"
              )}
            </button>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-600">
              <a
                href="https://wa.me/56958315506?text=Hola,%20tengo%20problemas%20para%20ingresar%20al%20sistema"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-400 transition-colors underline-offset-4 hover:underline"
              >
                ¿Problemas para ingresar?
              </a>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <a
                href="https://wa.me/56958315506?text=Hola,%20necesito%20ayuda%20con%20el%20sistema%20Doña%20Any"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-400 transition-colors underline-offset-4 hover:underline"
              >
                Ayuda
              </a>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-[-60px] left-0 right-0 text-center flex flex-col items-center justify-center gap-1 opacity-70">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
             Doña Any Management © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-2 text-zinc-600 text-[10px]">
            <span>Version 1.2</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
            <span>Comercializadora de Alimentos Ulises Querales E.I.R.L.</span>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/56958315506?text=Hola,%20necesito%20soporte%20con%20el%20sistema%20de%20despachos"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-lg shadow-green-900/20 transition-all hover:scale-110 flex items-center justify-center group"
        aria-label="Soporte por WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M11.42 21.815a10.033 10.033 0 0 0 4.984-1.328l.192-.114 3.2.839-.854-3.119.125-.197a9.966 9.966 0 0 0 1.545-5.364c0-5.505-4.48-9.985-9.985-9.985-5.503 0-9.985 4.48-9.985 9.986 0 1.944.536 3.84 1.56 5.5l.18.29-1.002 3.655 3.738-.981.28.17a9.99 9.99 0 0 0 5.432 1.58m0-18.257c4.568 0 8.286 3.717 8.286 8.285 0 4.567-3.718 8.285-8.286 8.285-1.464 0-2.883-.382-4.103-1.11l-.294-.175-2.618.687.697-2.552-.192-.308a8.216 8.216 0 0 1-1.272-4.425c0-4.568 3.718-8.286 8.287-8.286m4.444 11.21-.06-.037c-.167-.083-2.028-.962-2.316-1.06-.289-.098-.535-.157-.745.158-.21.314-.852 1.056-1.045 1.259-.193.204-.393.228-.718.064-.325-.164-1.44-.531-2.748-1.7-1.018-.91-1.704-2.035-1.9-2.36-.196-.325-.02-.501.144-.664.148-.146.326-.38.489-.57.163-.19.217-.326.326-.543.109-.217.054-.407-.027-.57-.082-.163-.761-1.836-1.043-2.513-.275-.66-.554-.57-.76-.581-.196-.01-.42-.01-.645-.01s-.58.082-.888.408c-.308.326-1.176 1.148-1.176 2.793 0 1.644 1.204 3.234 1.373 3.458.169.225 2.355 3.593 5.706 5.038 2.213.953 2.943.903 3.541.821.684-.093 2.028-.829 2.315-1.63.287-.801.287-1.488.201-1.63" />
        </svg>
        <span className="absolute right-full mr-4 bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Soporte Técnico
        </span>
      </a>
    </div>
  );
}
