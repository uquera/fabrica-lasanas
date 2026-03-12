"use client";

import { useState } from "react";
import { updateCliente, deleteCliente } from "@/actions/clientes";
import { Mail, MapPin, Trash2, Pencil, X, Check, AlertCircle, Store } from "lucide-react";
import { useRouter } from "next/navigation";

interface Cliente {
  id: string;
  rut: string;
  razonSocial: string;
  sucursal?: string | null;
  giro: string;
  direccion: string;
  email: string;
}

export default function ClienteCard({ cliente }: { cliente: Cliente }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...cliente, sucursal: cliente.sucursal ?? "" as string });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const hasEmail = cliente.email && cliente.email.length > 0 && !cliente.email.startsWith("AUTO-");

  const handleSave = async () => {
    setSaving(true);
    const res = await updateCliente(cliente.id, {
      rut: form.rut,
      razonSocial: form.razonSocial,
      sucursal: form.sucursal || null,
      giro: form.giro,
      direccion: form.direccion,
      email: form.email,
    });
    if (res.success) {
      setEditing(false);
      router.refresh();
    } else {
      alert(res.error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${cliente.razonSocial}${cliente.sucursal ? ` — ${cliente.sucursal}` : ""}"?`)) return;
    await deleteCliente(cliente.id);
    router.refresh();
  };

  if (editing) {
    return (
      <div className="bg-zinc-900/50 border border-orange-500/30 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Editando Cliente</p>
          <button onClick={() => { setEditing(false); setForm({ ...cliente, sucursal: cliente.sucursal ?? "" }); }} className="p-1 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "RUT", key: "rut" },
            { label: "Razón Social", key: "razonSocial" },
            { label: "Sucursal / Tienda (opcional)", key: "sucursal" },
            { label: "Giro", key: "giro" },
            { label: "Dirección", key: "direccion" },
          ].map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{f.label}</label>
              <input
                value={(form as any)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Email (para envío de guías)
          </label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            placeholder="tienda@ejemplo.cl"
            className="w-full bg-black border border-orange-500/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {saving ? "Guardando..." : <><Check className="w-4 h-4" /> Guardar Cambios</>}
        </button>
      </div>
    );
  }

  return (
    <div className="group bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800/20 transition-all flex items-start justify-between gap-4">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl shrink-0 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
          {cliente.razonSocial.charAt(0)}
        </div>
        <div className="space-y-1">
          <div>
            <h3 className="font-bold text-lg group-hover:text-orange-500 transition-colors leading-tight">{cliente.razonSocial}</h3>
            {cliente.sucursal && (
              <p className="text-sm text-orange-400/80 flex items-center gap-1 mt-0.5">
                <Store className="w-3 h-3" /> {cliente.sucursal}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
            <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-400">{cliente.rut}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cliente.direccion}</span>
            {hasEmail ? (
              <span className="flex items-center gap-1 text-emerald-500"><Mail className="w-3 h-3" /> {cliente.email}</span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="w-3 h-3" /> Sin email configurado</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)} className="p-2 text-zinc-700 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all" title="Editar">
          <Pencil className="w-5 h-5" />
        </button>
        <button onClick={handleDelete} className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
