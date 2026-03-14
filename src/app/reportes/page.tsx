"use client";

import { useState, useEffect, useCallback } from "react";
import { getReporteByRange, type ReporteData } from "@/actions/reportes";
import Link from "next/link";
import { ArrowLeft, TrendingUp, DollarSign, Package, Truck, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type FilterMode = "dia" | "semana" | "mes";

function getRange(mode: FilterMode, refDate: Date): { inicio: string; fin: string; label: string } {
  const d = new Date(refDate);
  
  if (mode === "dia") {
    const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    const label = d.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return { inicio: inicio.toISOString(), fin: fin.toISOString(), label };
  }

  if (mode === "semana") {
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const label = `${monday.toLocaleDateString("es-CL", { day: "numeric", month: "short" })} — ${sunday.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}`;
    return { inicio: monday.toISOString(), fin: sunday.toISOString(), label };
  }

  // mes
  const inicio = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  const label = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return { inicio: inicio.toISOString(), fin: fin.toISOString(), label };
}

function navigate(mode: FilterMode, refDate: Date, direction: number): Date {
  const d = new Date(refDate);
  if (mode === "dia") d.setDate(d.getDate() + direction);
  else if (mode === "semana") d.setDate(d.getDate() + 7 * direction);
  else d.setMonth(d.getMonth() + direction);
  return d;
}

export default function ReportesPage() {
  const [mode, setMode] = useState<FilterMode>("mes");
  const [refDate, setRefDate] = useState(new Date());
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const { inicio, fin, label } = getRange(mode, refDate);
    const data = await getReporteByRange(inicio, fin, label);
    setReporte(data);
    setLoading(false);
  }, [mode, refDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const goToday = () => setRefDate(new Date());

  const cards = reporte ? [
    { label: "Venta Bruta", value: `$${reporte.ventaBruta.toLocaleString("es-CL")}`, sub: `${reporte.totalUnidadesEnviadas} unidades`, icon: <DollarSign className="w-5 h-5" />, color: "orange" },
    { label: "Valor Mermas", value: `-$${reporte.valorMermas.toLocaleString("es-CL")}`, sub: `${reporte.totalMermas} unidades`, icon: <AlertTriangle className="w-5 h-5" />, color: "red" },
    { label: "Venta Efectiva", value: `$${reporte.ventaEfectiva.toLocaleString("es-CL")}`, sub: "Ingreso neto", icon: <TrendingUp className="w-5 h-5" />, color: "emerald" },
  ] : [];

  const modeLabels: Record<FilterMode, string> = { dia: "Día", semana: "Semana", mes: "Mes" };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute bottom-[-5%] left-[30%] w-[30%] h-[30%] bg-emerald-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Reporte de <span className="text-emerald-500">Ventas</span></h1>
            <p className="text-zinc-500">Filtra por día, semana o mes para analizar tu rendimiento.</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 mb-10 flex flex-col md:flex-row items-center gap-4">
          {/* Mode Selector */}
          <div className="flex bg-black rounded-2xl p-1 gap-1">
            {(["dia", "semana", "mes"] as FilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setRefDate(new Date()); }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === m
                    ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 flex-grow justify-center flex-wrap">
            <button onClick={() => setRefDate(navigate(mode, refDate, -1))} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-bold capitalize text-white">{reporte?.label ?? "..."}</p>
              <input
                type="date"
                value={refDate.toISOString().split("T")[0]}
                onChange={(e) => { if (e.target.value) setRefDate(new Date(e.target.value + "T12:00:00")); }}
                className="bg-black border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500 [color-scheme:dark] cursor-pointer"
              />
            </div>

            <button onClick={() => setRefDate(navigate(mode, refDate, 1))} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Today shortcut */}
          <button
            onClick={goToday}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors text-zinc-400 hover:text-white"
          >
            <Calendar className="w-4 h-4" /> Hoy
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reporte && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {cards.map((card, i) => (
                <div key={i} className="relative p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 overflow-hidden group transition-all">
                  <div className="relative">
                    <div className={`p-2 rounded-xl inline-block mb-4 ${
                      card.color === "orange" ? "bg-orange-500/10 text-orange-500" :
                      card.color === "red" ? "bg-red-500/10 text-red-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {card.icon}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2">{card.label}</p>
                    <p className={`text-3xl font-black ${
                      card.color === "orange" ? "text-orange-500" :
                      card.color === "red" ? "text-red-500" :
                      "text-emerald-500"
                    }`}>{card.value}</p>
                    <p className="text-xs text-zinc-500 mt-2">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-xl font-bold mb-6">Resumen de Operaciones</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left">
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Concepto</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-zinc-600 text-right">Cantidad</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-zinc-600 text-right">Valor (CLP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3"><Truck className="w-4 h-4 text-orange-500" /><span>Envíos</span></td>
                      <td className="py-4 px-4 text-right font-mono">{reporte.totalEnvios}</td>
                      <td className="py-4 px-4 text-right font-mono text-orange-500">${reporte.ventaBruta.toLocaleString("es-CL")}</td>
                    </tr>
                    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3"><Package className="w-4 h-4 text-zinc-500" /><span>Unidades Enviadas</span></td>
                      <td className="py-4 px-4 text-right font-mono">{reporte.totalUnidadesEnviadas}</td>
                      <td className="py-4 px-4 text-right font-mono text-zinc-500">—</td>
                    </tr>
                    <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3"><AlertTriangle className="w-4 h-4 text-red-500" /><span>Mermas</span></td>
                      <td className="py-4 px-4 text-right font-mono text-red-400">{reporte.totalMermas}</td>
                      <td className="py-4 px-4 text-right font-mono text-red-500">-${reporte.valorMermas.toLocaleString("es-CL")}</td>
                    </tr>
                    <tr className="hover:bg-emerald-500/5 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="font-bold text-emerald-500">Venta Efectiva</span></td>
                      <td className="py-4 px-4 text-right font-mono">{reporte.totalUnidadesEnviadas - reporte.totalMermas}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-emerald-500 text-lg">${reporte.ventaEfectiva.toLocaleString("es-CL")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-Client Breakdown */}
            {reporte.detalleClientes.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 mt-8">
                <h2 className="text-xl font-bold mb-2">Detalle por Cliente</h2>
                <p className="text-zinc-500 text-sm mb-6">Desglose individual de cada cliente en el período seleccionado.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left">
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-widest text-zinc-600">Cliente</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-widest text-zinc-600">RUT</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-widest text-zinc-600 text-right">Unid. Enviadas</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-widest text-zinc-600 text-right">Venta Bruta</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-widest text-zinc-600 text-right">Mermas</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-widest text-zinc-600 text-right">Venta Efectiva</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.detalleClientes.map((c) => (
                        <tr key={c.clienteId} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                          <td className="py-4 px-3 font-semibold text-white">{c.razonSocial}</td>
                          <td className="py-4 px-3">
                            <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-bold text-zinc-400">{c.rut}</span>
                          </td>
                          <td className="py-4 px-3 text-right font-mono">{c.unidadesEnviadas}</td>
                          <td className="py-4 px-3 text-right font-mono text-orange-500">${c.ventaBruta.toLocaleString("es-CL")}</td>
                          <td className="py-4 px-3 text-right font-mono text-red-400">
                            {c.unidadesMerma > 0 ? `-${c.unidadesMerma} ($${c.valorMerma.toLocaleString("es-CL")})` : "—"}
                          </td>
                          <td className="py-4 px-3 text-right font-mono font-bold text-emerald-500">${c.ventaEfectiva.toLocaleString("es-CL")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reporte.detalleClientes.length === 0 && (
              <div className="mt-8 p-10 rounded-3xl border-2 border-dashed border-zinc-800 text-center">
                <p className="text-zinc-600 font-medium">No hay movimientos de clientes en este período.</p>
              </div>
            )}

            <div className="mt-8 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 text-center">
              <p className="text-xs text-zinc-600">
                Fórmula: <span className="text-zinc-400 font-mono">Venta Efectiva = Venta Bruta − Valor Mermas</span> · Todos los montos incluyen IVA
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
