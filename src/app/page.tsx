import prisma from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, Users, Truck, AlertTriangle, FileText, ArrowRight, Clock } from "lucide-react";

async function getDashboardData(range: string = "month") {
  const now = new Date();
  let start: Date, end: Date, prevStart: Date, prevEnd: Date;
  let label = "";

  switch (range) {
    case "day":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = now;
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      label = "hoy";
      break;
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      end = now;
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      label = "esta semana";
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear(), 0, 0, 23, 59, 59);
      label = "este año";
      break;
    case "month":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      label = "este mes";
      break;
  }

  try {
    const [
      enviosActual,
      enviosAnterior,
      mermasActual,
      clientesTotal,
      recentEnvios,
      guiasPendientes,
    ] = await Promise.all([
      (prisma.envio as any).findMany({
        where: { fecha: { gte: start, lte: end } },
        include: { detalles: { include: { producto: true } }, cliente: { select: { razonSocial: true } } },
      }),
      (prisma.envio as any).findMany({
        where: { fecha: { gte: prevStart, lte: prevEnd } },
        include: { detalles: { include: { producto: true } } },
      }),
      prisma.merma.count({ where: { fecha: { gte: start, lte: end } } }),
      prisma.cliente.count(),
      (prisma.envio as any).findMany({
        orderBy: { fecha: "desc" },
        take: 6,
        include: { cliente: { select: { razonSocial: true } }, detalles: { include: { producto: true } } },
      }),
      (prisma.envio as any).count({ where: { guiaDespacho: null } }),
    ]);

    const calcRevenue = (envios: any[]) =>
      envios.reduce((total: number, envio: any) =>
        total + envio.detalles.reduce((s: number, d: any) =>
          s + d.cantidad * d.producto.precioBase * (1 + (d.producto.tasaIva ?? 0.19)), 0), 0);

    const revenueActual = calcRevenue(enviosActual);
    const revenueAnterior = calcRevenue(enviosAnterior);
    const revenueChange = revenueAnterior > 0
      ? ((revenueActual - revenueAnterior) / revenueAnterior) * 100
      : null;

    const clientesActivos = new Set(enviosActual.map((e: any) => e.clienteId)).size;

    return {
      revenue: Math.round(revenueActual),
      revenueChange,
      despachos: enviosActual.length,
      clientesActivos,
      clientesTotal,
      mermas: mermasActual,
      recentEnvios,
      guiasPendientes,
      label,
    };
  } catch (e) {
    console.error("Dashboard data error:", e);
    return null;
  }
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export default async function DashboardPage(props: { searchParams: Promise<{ range?: string }> }) {
  const searchParams = await props.searchParams;
  const range = searchParams.range || "month";
  const data = await getDashboardData(range);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[35%] h-[35%] bg-orange-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1 capitalize">
              Resumen de {data?.label ?? "este mes"}
            </p>
          </div>

          {/* Date Filter */}
          <div className="flex bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl">
            {[
              { id: "day", label: "Hoy" },
              { id: "week", label: "Semana" },
              { id: "month", label: "Mes" },
              { id: "year", label: "Año" },
            ].map((r) => (
              <Link
                key={r.id}
                href={`/?range=${r.id}`}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === r.id
                    ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Revenue */}
          <div className="col-span-2 lg:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-orange-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <div className="w-4 h-4 text-orange-500"><TrendingUp size={16} /></div>
              </div>
              {data?.revenueChange !== null && data?.revenueChange !== undefined && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  data.revenueChange >= 0
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {data.revenueChange >= 0 ? "+" : ""}{data.revenueChange.toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Ingresos</p>
            <p className="text-2xl font-black text-orange-500">
              {data ? fmt(data.revenue) : "—"}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">CLP con IVA / {data?.label}</p>
          </div>

          {/* Despachos */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all">
            <div className="p-2 bg-blue-500/10 rounded-xl w-fit mb-3">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Despachos</p>
            <p className="text-2xl font-black text-white">{data?.despachos ?? "—"}</p>
            <p className="text-[10px] text-zinc-600 mt-1">{data?.label}</p>
          </div>

          {/* Clientes activos */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
            <div className="p-2 bg-emerald-500/10 rounded-xl w-fit mb-3">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Clientes activos</p>
            <p className="text-2xl font-black text-white">{data?.clientesActivos ?? "—"}</p>
            <p className="text-[10px] text-zinc-600 mt-1">de {data?.clientesTotal ?? "—"} totales</p>
          </div>

          {/* Mermas */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-red-500/30 transition-all">
            <div className="p-2 bg-red-500/10 rounded-xl w-fit mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Mermas</p>
            <p className="text-2xl font-black text-white">{data?.mermas ?? "—"}</p>
            <p className="text-[10px] text-zinc-600 mt-1">{data?.label}</p>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent dispatches */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Últimos Despachos
              </h2>
              <Link href="/guias" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {(!data || data.recentEnvios.length === 0) && (
                <p className="text-zinc-600 text-sm text-center py-10">Sin despachos aún</p>
              )}
              {data?.recentEnvios.map((envio: any) => {
                const revenue = envio.detalles.reduce((s: number, d: any) =>
                  s + d.cantidad * d.producto.precioBase * (1 + (d.producto.tasaIva ?? 0.19)), 0);
                const items = envio.detalles.map((d: any) => `${d.cantidad}× ${d.producto.nombre}`).join(", ");
                return (
                  <div key={envio.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-800/20 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${envio.guiaDespacho ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{envio.cliente.razonSocial}</p>
                      <p className="text-xs text-zinc-500 truncate">{items}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-orange-400">{fmt(revenue)}</p>
                      <p className="text-[10px] text-zinc-600">
                        {new Date(envio.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            {/* Guías pendientes alert */}
            {data && data.guiasPendientes > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Guías pendientes</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  {data.guiasPendientes} despacho{data.guiasPendientes > 1 ? "s" : ""} sin guía de despacho generada.
                </p>
                <Link href="/guias" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  Ir a Guías <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <p className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600 border-b border-zinc-800">
                Acciones rápidas
              </p>
              {[
                { label: "Nuevo despacho",   href: "/envios/nuevo",    color: "text-orange-400" },
                { label: "Cargar planilla",  href: "/cargar-planilla", color: "text-blue-400" },
                { label: "Registrar merma",  href: "/mermas",          color: "text-red-400" },
                { label: "Ver clientes",     href: "/clientes",        color: "text-emerald-400" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50 last:border-0"
                >
                  <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
