"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { hoyChile } from "@/lib/timemarket";

export default function RangoFiltro({ desde, hasta }: { desde: string; hasta: string }) {
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const cls = "bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm";

  // Actualiza los campos y recalcula (refresh fuerza recálculo aunque la URL no cambie)
  const ir = (desde: string, hasta: string) => {
    setD(desde); setH(hasta);
    startTransition(() => {
      router.push(`/timemarket/resumen?desde=${desde}&hasta=${hasta}`);
      router.refresh();
    });
  };
  const mesActual = () => { const hoy = hoyChile(); ir(hoy.slice(0, 7) + "-01", hoy); };
  const mesAnterior = () => {
    const [y, m] = hoyChile().split("-").map(Number);
    const p = new Date(Date.UTC(y, m - 2, 1));
    const f = new Date(Date.UTC(y, m - 1, 0));
    ir(p.toISOString().slice(0, 10), f.toISOString().slice(0, 10));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!d || !h) return;
        if (d > h) ir(h, d); else ir(d, h);
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="text-xs text-zinc-500 flex flex-col gap-1">Desde<input type="date" value={d} onChange={(e) => setD(e.target.value)} className={cls} /></label>
      <label className="text-xs text-zinc-500 flex flex-col gap-1">Hasta<input type="date" value={h} onChange={(e) => setH(e.target.value)} className={cls} /></label>
      <button type="submit" disabled={pending} className="btn-tm-primary h-[38px]">
        {pending && <Loader2 size={16} className="animate-spin" />} Calcular
      </button>
      <button type="button" disabled={pending} onClick={mesActual} className="btn-tm-secondary h-[38px]">Este mes</button>
      <button type="button" disabled={pending} onClick={mesAnterior} className="btn-tm-secondary h-[38px]">Mes anterior</button>
    </form>
  );
}
