"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { saveTmGuia, type TmConfig, type TmTienda } from "@/actions/timemarket";
import { fmtCLP, formatoFecha } from "@/lib/timemarket";
import { useToast } from "@/components/Toast";

export type LineaForm = {
  tiendaId: string;
  entregaIndividual: number;
  entregaMini: number;
  devolucionIndividual: number;
  devolucionMini: number;
};

type Props = {
  modo: "nueva" | "editar";
  guiaId?: string;
  fechaInicial: string;
  notaInicial?: string;
  lineasIniciales: LineaForm[];
  tiendas: TmTienda[];
  config: TmConfig;
  /** Entregas de la guía anterior: el retiro de hoy se resta a eso. */
  anterior?: { fecha: string; lineas: LineaForm[] } | null;
  /** Retiros ya registrados en la guía siguiente (solo al editar una guía cerrada). */
  siguiente?: { fecha: string; lineas: LineaForm[] } | null;
};

const precioLinea = (n: number, p: number) => n * p;

export default function GuiaForm({ modo, guiaId, fechaInicial, notaInicial, lineasIniciales, tiendas, config, anterior, siguiente }: Props) {
  const [fecha, setFecha] = useState(fechaInicial);
  const [nota, setNota] = useState(notaInicial ?? "");
  const [lineas, setLineas] = useState<LineaForm[]>(lineasIniciales);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const usarMini = config.usarMini || lineas.some((l) => l.entregaMini || l.devolucionMini);

  const set = (tiendaId: string, campo: keyof Omit<LineaForm, "tiendaId">, v: string) =>
    setLineas((prev) => prev.map((l) => (l.tiendaId === tiendaId ? { ...l, [campo]: Math.max(0, parseInt(v) || 0) } : l)));

  // Venta que se CIERRA con esta guía: entregas de la guía anterior − retiros de hoy
  const cierre = useMemo(() => {
    if (!anterior) return null;
    let vi = 0, vm = 0;
    const porTienda = new Map<string, { vi: number; vm: number }>();
    for (const l of lineas) {
      const a = anterior.lineas.find((x) => x.tiendaId === l.tiendaId);
      const ti = (a?.entregaIndividual ?? 0) - l.devolucionIndividual;
      const tm = (a?.entregaMini ?? 0) - l.devolucionMini;
      porTienda.set(l.tiendaId, { vi: ti, vm: tm });
      vi += ti; vm += tm;
    }
    const neto = precioLinea(vi, config.precioIndividual) + precioLinea(vm, config.precioMini);
    return { porTienda, vi, vm, neto, iva: Math.round(neto * config.tasaIva) };
  }, [lineas, anterior, config]);

  // Venta de ESTA guía (solo si ya existe la siguiente con retiros)
  const ventaPropia = useMemo(() => {
    if (!siguiente) return null;
    const porTienda = new Map<string, { vi: number; vm: number }>();
    for (const l of lineas) {
      const s = siguiente.lineas.find((x) => x.tiendaId === l.tiendaId);
      porTienda.set(l.tiendaId, { vi: l.entregaIndividual - (s?.devolucionIndividual ?? 0), vm: l.entregaMini - (s?.devolucionMini ?? 0) });
    }
    return porTienda;
  }, [lineas, siguiente]);

  const totEntrega = lineas.reduce((s, l) => s + l.entregaIndividual + l.entregaMini, 0);
  const totRetiro = lineas.reduce((s, l) => s + l.devolucionIndividual + l.devolucionMini, 0);

  async function guardar() {
    setSaving(true);
    const r = await saveTmGuia({ id: guiaId, fecha, nota, lineas });
    setSaving(false);
    if (!r.success) { toast(r.error ?? "Error al guardar", "error"); return; }
    toast(modo === "nueva" ? "Guía creada." : "Guía actualizada.");
    router.push("/timemarket");
    router.refresh();
  }

  const nombre = (id: string) => tiendas.find((t) => t.id === id)?.nombre ?? id;
  const inputCls = "w-16 sm:w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-center text-white focus:border-orange-500 outline-none";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/timemarket" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 mb-6 text-sm"><ArrowLeft size={16} /> Volver a Time Market</Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{modo === "nueva" ? "Nueva guía" : "Editar guía"} <span className="text-orange-500">{formatoFecha(fecha, true)}</span></h1>
            <p className="text-zinc-500 text-sm mt-1">
              Anota lo que <b className="text-zinc-300">entregas hoy</b> y lo que <b className="text-zinc-300">retiras</b> de la visita anterior
              {anterior ? ` (${formatoFecha(anterior.fecha)})` : ""}.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <label className="text-xs text-zinc-500 flex flex-col gap-1">
              Fecha de visita
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
            </label>
            <button onClick={guardar} disabled={saving} className="btn-tm-primary h-[42px]">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3">Tienda</th>
                <th className="text-center px-2 py-3 text-orange-400/90" colSpan={usarMini ? 2 : 1}>Entrega hoy</th>
                <th className="text-center px-2 py-3 text-red-400/90" colSpan={usarMini ? 2 : 1}>Retiro (de {anterior ? formatoFecha(anterior.fecha) : "guía anterior"})</th>
                <th className="text-right px-4 py-3 text-emerald-400/90">Venta cerrada</th>
                {ventaPropia && <th className="text-right px-4 py-3 text-zinc-400">Venta de esta guía</th>}
              </tr>
              {usarMini && (
                <tr className="text-[10px]">
                  <th></th><th className="text-center pb-2">Indiv.</th><th className="text-center pb-2">Mini</th>
                  <th className="text-center pb-2">Indiv.</th><th className="text-center pb-2">Mini</th><th></th>{ventaPropia && <th></th>}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {lineas.map((l) => {
                const c = cierre?.porTienda.get(l.tiendaId);
                const ant = anterior?.lineas.find((x) => x.tiendaId === l.tiendaId);
                const vp = ventaPropia?.get(l.tiendaId);
                const neg = c && (c.vi < 0 || c.vm < 0);
                return (
                  <tr key={l.tiendaId} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-2">
                      <p className="font-medium text-white">{nombre(l.tiendaId)}</p>
                      {ant && <p className="text-[11px] text-zinc-500">entregado antes: {ant.entregaIndividual}{usarMini ? ` + ${ant.entregaMini} mini` : ""}</p>}
                    </td>
                    <td className="px-2 py-2 text-center"><input type="number" min={0} className={inputCls} value={l.entregaIndividual} onChange={(e) => set(l.tiendaId, "entregaIndividual", e.target.value)} /></td>
                    {usarMini && <td className="px-2 py-2 text-center"><input type="number" min={0} className={inputCls} value={l.entregaMini} onChange={(e) => set(l.tiendaId, "entregaMini", e.target.value)} /></td>}
                    <td className="px-2 py-2 text-center"><input type="number" min={0} className={inputCls} value={l.devolucionIndividual} onChange={(e) => set(l.tiendaId, "devolucionIndividual", e.target.value)} /></td>
                    {usarMini && <td className="px-2 py-2 text-center"><input type="number" min={0} className={inputCls} value={l.devolucionMini} onChange={(e) => set(l.tiendaId, "devolucionMini", e.target.value)} /></td>}
                    <td className={`px-4 py-2 text-right font-bold ${neg ? "text-red-400" : "text-emerald-400"}`}>
                      {c ? (usarMini ? `${c.vi} + ${c.vm}` : c.vi) : "—"}
                    </td>
                    {ventaPropia && <td className="px-4 py-2 text-right text-zinc-300">{vp ? (usarMini ? `${vp.vi} + ${vp.vm}` : vp.vi) : "—"}</td>}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-zinc-700 text-sm font-bold">
              <tr>
                <td className="px-4 py-3 text-zinc-400">Totales</td>
                <td className="px-2 py-3 text-center text-orange-300" colSpan={usarMini ? 2 : 1}>{totEntrega}</td>
                <td className="px-2 py-3 text-center text-red-300" colSpan={usarMini ? 2 : 1}>{totRetiro}</td>
                <td className="px-4 py-3 text-right text-emerald-300">{cierre ? cierre.vi + cierre.vm : "—"}</td>
                {ventaPropia && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-4 mt-6">
          <label className="text-xs text-zinc-500 flex flex-col gap-1">
            Nota (opcional)
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm" placeholder="Ej: Bilbao 1 cerrado, no se entregó." />
          </label>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">Venta cerrada {anterior ? `· guía ${formatoFecha(anterior.fecha)}` : ""}</p>
            {cierre ? (
              <>
                <Row k={`${cierre.vi} individuales × ${fmtCLP(config.precioIndividual)}`} v={fmtCLP(cierre.vi * config.precioIndividual)} />
                {usarMini && <Row k={`${cierre.vm} mini × ${fmtCLP(config.precioMini)}`} v={fmtCLP(cierre.vm * config.precioMini)} />}
                <Row k="Neto" v={fmtCLP(cierre.neto)} strong />
                <Row k={`IVA ${Math.round(config.tasaIva * 100)}%`} v={fmtCLP(cierre.iva)} />
                <Row k="Total" v={fmtCLP(Math.round(cierre.neto) + cierre.iva)} strong />
                {(cierre.vi < 0 || cierre.vm < 0) && <p className="text-xs text-red-400 mt-2">Hay tiendas con retiro mayor a la entrega anterior. Revisa los números.</p>}
              </>
            ) : (
              <p className="text-sm text-zinc-500 flex gap-2"><Info size={16} className="shrink-0" /> Es la primera guía: no hay visita anterior que cerrar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${strong ? "text-white font-bold border-t border-zinc-800 mt-1 pt-2" : "text-zinc-400"}`}>
      <span>{k}</span><span>{v}</span>
    </div>
  );
}
