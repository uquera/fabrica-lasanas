"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Pencil, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { updateTmConfig, upsertTmTienda, type TmConfig, type TmTienda } from "@/actions/timemarket";
import { useToast } from "@/components/Toast";

export default function ConfigView({ config, tiendas }: { config: TmConfig; tiendas: TmTienda[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [c, setC] = useState({ precioIndividual: String(config.precioIndividual), tasaIva: String(Math.round(config.tasaIva * 100)) });
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<{ id?: string; nombre: string; direccion: string; activa: boolean } | null>(null);
  const inp = "bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm w-full focus:border-orange-500 outline-none";

  async function guardarConfig() {
    const pi = parseFloat(c.precioIndividual), iva = parseFloat(c.tasaIva) / 100;
    if (isNaN(pi) || pi < 0 || isNaN(iva)) { toast("Revisa los valores.", "error"); return; }
    setSaving(true);
    await updateTmConfig({ precioIndividual: pi, tasaIva: iva });
    setSaving(false);
    toast("Precios guardados.");
    router.refresh();
  }

  async function guardarTienda() {
    if (!edit) return;
    setSaving(true);
    const r = await upsertTmTienda(edit);
    setSaving(false);
    if (!r.success) { toast(r.error ?? "Error", "error"); return; }
    toast("Tienda guardada.");
    setEdit(null);
    router.refresh();
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-6">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4 h-fit">
        <h2 className="font-bold text-white">Precios (netos)</h2>
        <label className="text-xs text-zinc-500 block">Lasaña<input type="number" className={inp} value={c.precioIndividual} onChange={(e) => setC({ ...c, precioIndividual: e.target.value })} /></label>
        <label className="text-xs text-zinc-500 block">IVA %<input type="number" className={inp} value={c.tasaIva} onChange={(e) => setC({ ...c, tasaIva: e.target.value })} /></label>
        <button onClick={guardarConfig} disabled={saving} className="btn-tm-primary w-full justify-center">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar precios</button>
        <Link href="/timemarket/importar" className="btn-tm-secondary w-full justify-center"><Upload size={16} /> Importar histórico</Link>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Tiendas</h2>
          <button onClick={() => setEdit({ nombre: "", direccion: "", activa: true })} className="btn-tm-secondary"><Plus size={16} /> Nueva</button>
        </div>
        <ul className="divide-y divide-zinc-800/60">
          {tiendas.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className={`font-medium ${t.activa ? "text-white" : "text-zinc-500 line-through"}`}>{t.nombre}</p>
                <p className="text-xs text-zinc-500">{t.direccion || "—"}</p>
              </div>
              <button onClick={() => setEdit({ id: t.id, nombre: t.nombre, direccion: t.direccion, activa: t.activa })} className="p-2 text-zinc-600 hover:text-orange-400"><Pencil size={16} /></button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-600 mt-3">Las tiendas inactivas no aparecen en guías nuevas, pero conservan su historial.</p>
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-96 shadow-2xl space-y-3">
            <h3 className="font-bold text-white">{edit.id ? "Editar tienda" : "Nueva tienda"}</h3>
            <label className="text-xs text-zinc-500 block">Nombre<input className={inp} value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} /></label>
            <label className="text-xs text-zinc-500 block">Dirección<input className={inp} value={edit.direccion} onChange={(e) => setEdit({ ...edit, direccion: e.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={edit.activa} onChange={(e) => setEdit({ ...edit, activa: e.target.checked })} /> Activa</label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEdit(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={guardarTienda} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold disabled:opacity-50">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
