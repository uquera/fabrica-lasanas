"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Lock, Clock } from "lucide-react";
import { deleteTmGuia } from "@/actions/timemarket";
import { fmtCLP, formatoFecha } from "@/lib/timemarket";
import { useToast } from "@/components/Toast";

type Fila = {
  id: string; fecha: string; cerrada: boolean;
  entrega: number; retiro: number; venta: number; neto: number; nota: string | null;
};

export default function GuiasLista({ filas }: { filas: Fila[] }) {
  const [confirm, setConfirm] = useState<Fila | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function eliminar() {
    if (!confirm) return;
    setBusy(true);
    await deleteTmGuia(confirm.id);
    setBusy(false);
    setConfirm(null);
    toast("Guía eliminada.");
    router.refresh();
  }

  if (filas.length === 0) return null;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
          <tr>
            <th className="text-left px-4 py-3">Guía</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Estado</th>
            <th className="text-right px-4 py-3">Entrega</th>
            <th className="text-right px-4 py-3">Retiro</th>
            <th className="text-right px-4 py-3">Venta</th>
            <th className="text-right px-4 py-3 hidden md:table-cell">Neto</th>
            <th className="px-2 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {filas.map((f) => (
            <tr key={f.id} className="hover:bg-zinc-800/30">
              <td className="px-4 py-3">
                <Link href={`/timemarket/${f.id}`} className="font-semibold text-white hover:text-orange-400">
                  {formatoFecha(f.fecha, true)}
                </Link>
                {f.nota && <p className="text-xs text-amber-400/80 truncate max-w-[220px]">{f.nota}</p>}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                {f.cerrada ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Lock size={12} /> Cerrada</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400"><Clock size={12} /> Abierta</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-zinc-300">{f.entrega}</td>
              <td className="px-4 py-3 text-right text-zinc-300">{f.cerrada ? f.retiro : "—"}</td>
              <td className="px-4 py-3 text-right font-bold text-white">{f.cerrada ? f.venta : "—"}</td>
              <td className="px-4 py-3 text-right text-zinc-300 hidden md:table-cell">{f.cerrada ? fmtCLP(f.neto) : "—"}</td>
              <td className="px-2 py-3 text-right whitespace-nowrap">
                <Link href={`/timemarket/${f.id}`} className="inline-flex p-2 text-zinc-600 hover:text-orange-400" title="Editar"><Pencil size={16} /></Link>
                <button onClick={() => setConfirm(f)} className="inline-flex p-2 text-zinc-600 hover:text-red-500" title="Eliminar"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-bold text-white mb-2">Eliminar guía {formatoFecha(confirm.fecha)}</h3>
            <p className="text-sm text-zinc-400 mb-6">Se borran sus entregas y retiros. La guía anterior quedará abierta.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={eliminar} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50">
                {busy ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
