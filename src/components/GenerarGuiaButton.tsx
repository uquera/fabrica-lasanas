"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { enviarGuia } from "@/actions/envios";

export default function GenerarGuiaButton({ envioId }: { envioId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handle() {
    setStatus("loading");
    const result = await enviarGuia(envioId) as any;
    if (result.success) {
      setStatus("ok");
      router.refresh();
    } else {
      setStatus("error");
      setError(result.error ?? "Error desconocido");
    }
  }

  if (status === "ok") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
        <CheckCircle className="w-3.5 h-3.5" /> Guía enviada
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertCircle className="w-3.5 h-3.5" /> {error}
      </span>
    );
  }

  return (
    <button
      onClick={handle}
      disabled={status === "loading"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all disabled:opacity-50"
    >
      {status === "loading" ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando...</>
      ) : (
        <><Send className="w-3.5 h-3.5" /> Generar Guía</>
      )}
    </button>
  );
}
