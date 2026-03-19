"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      // Siempre mostramos éxito para no filtrar si el usuario existe o no
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex items-center justify-center p-6">
      {/* Glow background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] left-[30%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Doña Any"
            width={180}
            height={180}
            className="mx-auto mb-2 drop-shadow-2xl opacity-80"
            style={{ maxWidth: "180px" }}
          />
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/20">
                <MailCheck className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">Revisa tu correo</h2>
              <p className="text-sm text-zinc-400">
                Si el usuario <strong>{username}</strong> existe, hemos enviado un enlace para restablecer la contraseña.
              </p>
              <a 
                href="/login"
                className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all mt-6 text-center"
              >
                Volver al inicio de sesión
              </a>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <a href="/login" className="inline-flex items-center text-xs text-zinc-500 hover:text-orange-400 transition-colors mb-4 group">
                  <ArrowLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" />
                  Volver
                </a>
                <h2 className="text-xl font-bold">Recuperar contraseña</h2>
                <p className="text-xs text-zinc-400 mt-1">Ingresa tu usuario para recibir un enlace de recuperación.</p>
              </div>

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
                      onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                      required
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
                      placeholder="Ej: admin"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !username}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    "Enviar enlace"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
