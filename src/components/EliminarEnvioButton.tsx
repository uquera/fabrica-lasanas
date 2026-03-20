"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteEnvio } from "@/actions/envios";

export default function EliminarEnvioButton({ envioId }: { envioId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handle() {
    if (!confirm("¿Eliminar este envío sin guía?")) return;
    setStatus("loading");
    const result = await deleteEnvio(envioId) as any;
    if (result.success) {
      setStatus("done");
    } else {
      setStatus("error");
      alert(result.error ?? "Error al eliminar");
    }
  }

  if (status === "done") return null;

  return (
    <button
      onClick={handle}
      disabled={status === "loading"}
      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all disabled:opacity-50"
      title="Eliminar envío"
    >
      {status === "loading"
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Trash2 className="w-3.5 h-3.5" />
      }
    </button>
  );
}
