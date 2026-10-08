"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { importarTmHistorico, type TmImportJson } from "@/actions/timemarket";
import { useToast } from "@/components/Toast";

export default function ImportarPage() {
  const [json, setJson] = useState<TmImportJson | null>(null);
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function leer(f: File) {
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.guias)) throw new Error();
      setJson(data); setNombre(f.name);
    } catch { toast("El archivo no tiene el formato esperado.", "error"); }
  }

  async function importar() {
    if (!json) return;
    setBusy(true);
    const r = await importarTmHistorico(json);
    setBusy(false);
    toast(`Importadas ${r.creadas} guías. Omitidas ${r.omitidas} (ya existían).`);
    router.push("/timemarket"); router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/timemarket" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 mb-6 text-sm"><ArrowLeft size={16} /> Volver a Time Market</Link>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Importar <span className="text-orange-500">histórico</span></h1>
        <p className="text-zinc-500 text-sm mb-8">Sube el archivo JSON exportado desde la planilla. Las guías con fecha ya existente se omiten; no se borra nada.</p>

        <label className="block border-2 border-dashed border-zinc-700 hover:border-orange-500/60 rounded-2xl p-10 text-center cursor-pointer transition-colors">
          <Upload className="mx-auto mb-3 text-zinc-500" />
          <span className="text-sm text-zinc-400">{nombre || "Elegir archivo .json"}</span>
          <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && leer(e.target.files[0])} />
        </label>

        {json && (
          <div className="mt-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-300 mb-1"><b className="text-white">{json.guias.length}</b> guías · <b className="text-white">{json.tiendas?.length ?? "—"}</b> tiendas</p>
            <p className="text-xs text-zinc-500 mb-4">Desde {json.guias[0]?.fecha} hasta {json.guias[json.guias.length - 1]?.fecha}. Se usarán los precios actuales de configuración.</p>
            <button onClick={importar} disabled={busy} className="btn-tm-primary">{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Importar</button>
          </div>
        )}
      </div>
    </div>
  );
}
