"use client";

import { useState } from "react";
import { Check, X, Loader2, Send } from "lucide-react";
import { confirmarSolicitud, descartarSolicitud } from "@/actions/solicitudes";

export default function SolicitudActions({ id }: { id: string }) {
  const [loading, setLoading] = useState<"confirmar" | "descartar" | null>(null);
  const [result, setResult] = useState<"confirmado" | "descartado" | null>(null);

  if (result === "descartado") return null;
  if (result === "confirmado") {
    return (
      <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-400 font-bold">
        <Send className="w-3 h-3" /> Despacho generado — guía en camino
      </div>
    );
  }

  async function handle(action: "confirmar" | "descartar") {
    setLoading(action);
    if (action === "confirmar") await confirmarSolicitud(id);
    else await descartarSolicitud(id);
    setResult(action === "confirmar" ? "confirmado" : "descartado");
    setLoading(null);
  }

  return (
    <div className="flex gap-2 pt-1">
      <button
        onClick={() => handle("confirmar")}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-bold transition-colors disabled:opacity-50"
      >
        {loading === "confirmar" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        {loading === "confirmar" ? "Generando..." : "Confirmar"}
      </button>
      <button
        onClick={() => handle("descartar")}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold transition-colors disabled:opacity-50"
      >
        {loading === "descartar" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
        Descartar
      </button>
    </div>
  );
}
