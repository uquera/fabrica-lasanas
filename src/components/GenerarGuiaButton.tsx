"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { enviarGuia } from "@/actions/envios";

type Status = "idle" | "loading" | "sent" | "pdf_only" | "error";

export default function GenerarGuiaButton({ envioId }: { envioId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handle() {
    setStatus("loading");
    try {
      const result = await enviarGuia(envioId) as any;
      if (!result.success) {
        setStatus("error");
        setMessage(result.error ?? "Error desconocido");
        return;
      }
      router.refresh();
      if (result.emailStatus === "sent") {
        setStatus("sent");
      } else if (result.emailStatus === "no_email") {
        setStatus("pdf_only");
        setMessage("Guía generada (sin email registrado)");
      } else {
        // email error but PDF was generated
        setStatus("pdf_only");
        setMessage(result.emailError ?? "Guía generada, email no enviado");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Error inesperado");
    }
  }

  if (status === "sent") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
        <CheckCircle className="w-3.5 h-3.5" /> Guía enviada
      </span>
    );
  }
  if (status === "pdf_only") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold" title={message ?? ""}>
        <FileText className="w-3.5 h-3.5" /> PDF generado
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400" title={message ?? ""}>
        <AlertCircle className="w-3.5 h-3.5" /> {message ?? "Error"}
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
