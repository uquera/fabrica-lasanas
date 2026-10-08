import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTmGuiasCalculadas, getTmTiendas } from "@/actions/timemarket";
import { fmtCLP, formatoFecha, resumenPorRango } from "@/lib/timemarket";
import RangoFiltro from "./RangoFiltro";

export const dynamic = "force-dynamic";

function primerDiaMes() {
  return new Date().toISOString().slice(0, 7) + "-01";
}

export default async function ResumenPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const sp = await searchParams;
  const desde = sp.desde && /^\d{4}-\d{2}-\d{2}$/.test(sp.desde) ? sp.desde : primerDiaMes();
  const hasta = sp.hasta && /^\d{4}-\d{2}-\d{2}$/.test(sp.hasta) ? sp.hasta : new Date().toISOString().slice(0, 10);

  const [calculadas, tiendas] = await Promise.all([getTmGuiasCalculadas(), getTmTiendas()]);
  const r = resumenPorRango(calculadas, desde, hasta);
  const nombre = (id: string) => tiendas.find((t) => t.id === id)?.nombre ?? id;
  const ordenadas = [...r.tiendas].sort((a, b) => b.ventaIndividual - a.ventaIndividual);
  const guiasRango = calculadas.filter((g) => g.guia.fecha >= desde && g.guia.fecha <= hasta);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/timemarket" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 mb-6 text-sm"><ArrowLeft size={16} /> Volver a Time Market</Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resumen por <span className="text-orange-500">rango de fechas</span></h1>
            <p className="text-zinc-500 text-sm mt-1">Suma la venta efectiva de las guías cerradas entre {formatoFecha(desde)} y {formatoFecha(hasta)}.</p>
          </div>
          <RangoFiltro desde={desde} hasta={hasta} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Kpi label="Guías cerradas" value={String(r.guias)} sub={r.pendientes ? `${r.pendientes} abierta(s) sin contar` : undefined} />
          <Kpi label="Unidades vendidas" value={String(r.ventaIndividual)} />
          <Kpi label="Neto" value={fmtCLP(r.neto)} />
          <Kpi label="Total con IVA" value={fmtCLP(r.total)} sub={`IVA ${fmtCLP(r.iva)}`} />
        </div>

        <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">Por tienda</h2>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-x-auto mb-8">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3">Tienda</th>
                <th className="text-right px-4 py-3">Entregado</th>
                <th className="text-right px-4 py-3">Retirado</th>
                <th className="text-right px-4 py-3">Vendido</th>
                <th className="text-right px-4 py-3">% venta</th>
                <th className="text-right px-4 py-3">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {ordenadas.map((t) => {
                const ent = t.entregaIndividual;
                const ven = t.ventaIndividual;
                return (
                  <tr key={t.tiendaId}>
                    <td className="px-4 py-3 font-medium text-white">{nombre(t.tiendaId)}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{ent}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{t.retiroIndividual}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">{ven}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{ent ? Math.round((ven / ent) * 100) + "%" : "—"}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{fmtCLP(t.neto)}</td>
                  </tr>
                );
              })}
              {ordenadas.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No hay guías cerradas en este rango.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">Guías en el rango</h2>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <tr><th className="text-left px-4 py-3">Guía</th><th className="text-right px-4 py-3">Entrega</th><th className="text-right px-4 py-3">Retiro</th><th className="text-right px-4 py-3">Venta</th><th className="text-right px-4 py-3">Neto</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {guiasRango.map((g) => (
                <tr key={g.guia.id}>
                  <td className="px-4 py-2"><Link href={`/timemarket/${g.guia.id}`} className="text-white hover:text-orange-400">{formatoFecha(g.guia.fecha, true)}</Link>{!g.cerrada && <span className="ml-2 text-xs text-amber-400">abierta</span>}</td>
                  <td className="px-4 py-2 text-right text-zinc-300">{g.totales.entregaIndividual}</td>
                  <td className="px-4 py-2 text-right text-zinc-300">{g.cerrada ? g.totales.retiroIndividual : "—"}</td>
                  <td className="px-4 py-2 text-right font-bold text-white">{g.cerrada ? g.totales.ventaIndividual : "—"}</td>
                  <td className="px-4 py-2 text-right text-zinc-300">{g.cerrada ? fmtCLP(g.totales.neto) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white truncate">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
