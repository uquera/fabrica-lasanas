"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Falta el token de recuperación en la URL.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }

    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden.");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al restablecer la contraseña.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
      {success ? (
        <div className="text-center space-y-4 py-4">
          <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold">Contraseña actualizada</h2>
          <p className="text-sm text-zinc-400">
            Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.
          </p>
          <a 
            href="/login"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl transition-all mt-6 text-center"
          >
            Ir a Iniciar Sesión
          </a>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold">Crear nueva contraseña</h2>
            <p className="text-xs text-zinc-400 mt-1">Ingresa tu nueva clave de acceso.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                Nueva Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-orange-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                  tabIndex={-1}
                >
                  {/* ... SVG icon toggle ... */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></>
                    ) : (
                      <><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-orange-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
                  placeholder="Repetir nueva contraseña"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : (
                "Guardar Contraseña"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={<div className="text-center p-8 bg-zinc-900/60 rounded-3xl"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
