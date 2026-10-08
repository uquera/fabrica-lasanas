import Link from "next/link";
import { Plus, Settings, BarChart2, Store, Upload } from "lucide-react";
import { getTmGuiasCalculadas, getTmTiendas } from "@/actions/timemarket";
import { fmtCLP, formatoFecha } from "@/lib/timemarket";
import GuiasLista from "./GuiasLista";

export const dynamic = "force-dynamic";

export default async function TimeMarketPage() {
  const [calculadas, tiendas] = await Promise.all([getTmGuiasCalculadas(), getTmTiendas()]);
  const ultima = calculadas[calculadas.length - 1] ?? null;
  const cerradas = calculadas.filter((g) => g.cerrada);
  const mes = new Date().toISOString().slice(0, 7);
  const delMes = cerradas.filter((g) => g.guia.fecha.startsWith(mes));
  const netoMes = delMes.reduce((s, g) => s + g.totales.neto, 0);
  const ventaMes = delMes.reduce((s, g) => s + g.totales.ventaIndividual + g.totales.ventaMini, 0);

  const filas = [...calculadas].reverse().map((g) => ({
    id: g.guia.id,
    fecha: g.guia.fecha,
    cerrada: g.cerrada,
    entrega: g.totales.entregaIndividual + g.totales.entregaMini,
    retiro: g.totales.retiroIndividual + g.totales.retiroMini,
    venta: g.totales.ventaIndividual + g.totales.ventaMini,
    neto: g.totales.neto,
    nota: g.guia.nota,
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Time <span className="text-orange-500">Market</span>
            </h1>
            <p className="text-zinc-500">
              Guías de despacho y retiro por tienda. La venta de cada guía se cierra con el retiro de la visita siguiente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/timemarket/resumen" className="btn-tm-secondary"><BarChart2 size={16} /> Resumen</Link>
            <Link href="/timemarket/config" className="btn-tm-secondary"><Settings size={16} /> Precios y tiendas</Link>
            <Link href="/timemarket/nueva" className="btn-tm-primary"><Plus size={16} /> Nueva guía</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Kpi label="Última guía" value={ultima ? formatoFecha(ultima.guia.fecha, true) : "—"} sub={ultima ? (ultima.cerrada ? "cerrada" : "abierta · falta retiro") : "sin guías"} />
          <Kpi label="Vendidas este mes" value={String(ventaMes)} sub={`${delMes.length} guías cerradas`} />
          <Kpi label="Neto este mes" value={fmtCLP(netoMes)} sub={`+ IVA ${fmtCLP(delMes.reduce((s, g) => s + g.totales.iva, 0))}`} />
          <Kpi label="Tiendas activas" value={String(tiendas.filter((t) => t.activa).length)} sub={<span className="inline-flex items-center gap-1"><Store size={12} /> de {tiendas.length}</span>} />
        </div>

        {calculadas.length === 0 && (
          <div className="mb-8 p-5 rounded-2xl border border-dashed border-zinc-700 text-sm text-zinc-400 flex items-center justify-between gap-4">
            <span>Aún no hay guías. Puedes crear la primera o importar el histórico de la planilla.</span>
            <Link href="/timemarket/importar" className="btn-tm-secondary"><Upload size={16} /> Importar histórico</Link>
          </div>
        )}

        <GuiasLista filas={filas} />
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white truncate">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
