"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RangoFiltro({ desde, hasta }: { desde: string; hasta: string }) {
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);
  const router = useRouter();
  const cls = "bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm";

  const hoy = new Date();
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  const atajo = (desde: string, hasta: string) => router.push(`/timemarket/resumen?desde=${desde}&hasta=${hasta}`);
  const mesActual = () => atajo(iso(hoy).slice(0, 7) + "-01", iso(hoy));
  const mesAnterior = () => {
    const p = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 1, 1));
    const f = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 0));
    atajo(iso(p), iso(f));
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); atajo(d, h); }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="text-xs text-zinc-500 flex flex-col gap-1">Desde<input type="date" value={d} onChange={(e) => setD(e.target.value)} className={cls} /></label>
      <label className="text-xs text-zinc-500 flex flex-col gap-1">Hasta<input type="date" value={h} onChange={(e) => setH(e.target.value)} className={cls} /></label>
      <button type="submit" className="btn-tm-primary h-[38px]">Calcular</button>
      <button type="button" onClick={mesActual} className="btn-tm-secondary h-[38px]">Este mes</button>
      <button type="button" onClick={mesAnterior} className="btn-tm-secondary h-[38px]">Mes anterior</button>
    </form>
  );
}
