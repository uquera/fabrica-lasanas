import prisma from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, Users, Truck, AlertTriangle, FileText, ArrowRight, Clock, ShoppingCart } from "lucide-react";
import { Suspense } from "react";
import DashboardDateFilter from "@/components/DashboardDateFilter";
import DashboardChart from "@/components/DashboardChart";
import ClientRanking from "@/components/ClientRanking";
import { getSolicitudesPendientes } from "@/actions/solicitudes";
import SolicitudActions from "@/components/SolicitudActions";

// ── TM Store IDs ──────────────────────────────────────────────────────────
const TM_STORES = [
  { tienda: "Vivar",       clienteId: "cmmnmfpkv0001r4kyrfgs13z9" },
  { tienda: "Terranova",   clienteId: "cmmnmh1mf0002r4kysf9yc5xo" },
  { tienda: "Chipana",     clienteId: "cmmnmjxy60003r4kymk3ikkub" },
  { tienda: "Playa Brava", clienteId: "cmmnm03e800007qkymmpexyb1" },
  { tienda: "Anibal Pinto",clienteId: "cmmnmoo4m0005r4ky04fyw48a" },
  { tienda: "Tarapaca",    clienteId: "cmmnmqbom0006r4kyudp2r4qa" },
  { tienda: "Los Molles",  clienteId: "cmmnmrlqz0007r4kyudp2r4qa" },
  { tienda: "Bilbao 2",    clienteId: "cmmnmlph80004r4kyvhrm0777" },
  { tienda: "Peninsula",   clienteId: "cmmnmdjfr0000r4kyba7mwu1j" },
];

async function getTMData() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const allClienteIds = TM_STORES.map((s) => s.clienteId);
  const [envios, mermas] = await Promise.all([
    (prisma.envio as any).findMany({
      where: { clienteId: { in: allClienteIds }, fecha: { gte: start } },
      include: { detalles: { include: { producto: true } } },
    }),
    prisma.merma.groupBy({
      by: ["clienteId"],
      where: { clienteId: { in: allClienteIds }, fecha: { gte: start } },
      _sum: { cantidad: true },
    }),
  ]);
  const mermaMap: Record<string, number> = {};
  for (const m of mermas) mermaMap[m.clienteId] = (m._sum as any).cantidad ?? 0;
  return TM_STORES.map(({ tienda, clienteId }) => {
    const storeEnvios = envios.filter((e: any) => e.clienteId === clienteId);
    const unidades = storeEnvios.reduce((s: number, e: any) =>
      s + e.detalles.reduce((ss: number, d: any) => ss + d.cantidad, 0), 0);
    const pendiente = storeEnvios
      .filter((e: any) => !e.pagado)
      .reduce((s: number, e: any) =>
        s + e.detalles.reduce((ss: number, d: any) =>
          ss + d.cantidad * d.producto.precioBase * (1 + (d.producto.tasaIva ?? 0.19)), 0), 0);
    return { tienda, unidades, pendiente, mermas: mermaMap[clienteId] ?? 0, despachos: storeEnvios.length };
  });
}

// ── Sparkline SVG ──────────────────────────────────────────────────────────
function Sparkline({ data, color = "#f97316" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const W = 72, H = 24;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (v / max) * (H - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0 opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Sparkline data (últimos 7 días, independiente del filtro) ──────────────
async function getSparklineData() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
  const [sparkEnvios, sparkMermas] = await Promise.all([
    (prisma.envio as any).findMany({
      where: { fecha: { gte: sevenDaysAgo } },
      include: { detalles: { include: { producto: true } } },
    }),
    prisma.merma.findMany({
      where: { fecha: { gte: sevenDaysAgo } },
      select: { fecha: true, cantidad: true },
    }),
  ]);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    const dayEnvios = sparkEnvios.filter((e: any) => new Date(e.fecha).toISOString().split("T")[0] === ds);
    const dayMermas = sparkMermas.filter((m: any) => new Date(m.fecha).toISOString().split("T")[0] === ds);
    const revenue = dayEnvios.reduce((s: number, e: any) =>
      s + e.detalles.reduce((ss: number, d: any) =>
        ss + d.cantidad * d.producto.precioBase * (1 + (d.producto.tasaIva ?? 0.19)), 0), 0);
    return {
      revenue,
      dispatches: dayEnvios.length,
      clients: new Set(dayEnvios.map((e: any) => e.clienteId)).size,
      mermas: dayMermas.reduce((s: number, m: any) => s + m.cantidad, 0),
    };
  });
}

async function getDashboardData(range: string = "month", fromParam?: string, toParam?: string) {
  const now = new Date();
  let start: Date, end: Date, prevStart: Date, prevEnd: Date;
  let label = "";

  // Custom date range takes priority
  if (fromParam && toParam) {
    start = new Date(fromParam + "T00:00:00");
    end   = new Date(toParam   + "T23:59:59");
    const diff = end.getTime() - start.getTime();
    prevEnd   = new Date(start.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - diff);
    const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
    label = `${fmt(start)} – ${fmt(end)}`;
  } else {
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
      case "yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end.setMilliseconds(-1);
        prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - 1);
        prevEnd = new Date(start);
        prevEnd.setMilliseconds(-1);
        label = "ayer";
        break;
      case "week":
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        end = now;
        prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd = new Date(start);
        prevEnd.setMilliseconds(-1);
        label = "últimos 7 días";
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
  }

  try {
    const [
      enviosActual,
      enviosAnterior,
      mermasActual,
      mermasPorCliente,
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
      prisma.merma.groupBy({
        by: ["clienteId"],
        where: { fecha: { gte: start, lte: end } },
        _count: { id: true },
      }),
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

    // Chart data: group by day
    const dayMap: Record<string, { count: number; revenue: number }> = {};
    for (const envio of enviosActual) {
      const day = new Date(envio.fecha).toISOString().split("T")[0];
      if (!dayMap[day]) dayMap[day] = { count: 0, revenue: 0 };
      dayMap[day].count++;
      dayMap[day].revenue += envio.detalles.reduce((s: number, d: any) =>
        s + d.cantidad * d.producto.precioBase * (1 + (d.producto.tasaIva ?? 0.19)), 0);
    }
    const chartData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    // Ranking: group by client
    const mermaMap: Record<string, number> = {};
    for (const m of mermasPorCliente) mermaMap[m.clienteId] = m._count.id;

    const clientMap: Record<string, { id: string; razonSocial: string; revenue: number; despachos: number; mermas: number }> = {};
    for (const envio of enviosActual) {
      const id = envio.clienteId;
      if (!clientMap[id]) clientMap[id] = { id, razonSocial: envio.cliente.razonSocial, revenue: 0, despachos: 0, mermas: mermaMap[id] ?? 0 };
      clientMap[id].despachos++;
      clientMap[id].revenue += envio.detalles.reduce((s: number, d: any) =>
        s + d.cantidad * d.producto.precioBase * (1 + (d.producto.tasaIva ?? 0.19)), 0);
    }
    const rankingData = Object.values(clientMap);

    return {
      revenue: Math.round(revenueActual),
      revenueChange,
      despachos: enviosActual.length,
      clientesActivos,
      clientesTotal,
      mermas: mermasActual,
      recentEnvios,
      guiasPendientes,
      chartData,
      rankingData,
      label,
    };
  } catch (e) {
    console.error("Dashboard data error:", e);
    return null;
  }
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export default async function DashboardPage(props: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const searchParams = await props.searchParams;
  const range = searchParams.range || "month";
  const fromParam = searchParams.from;
  const toParam   = searchParams.to;
  const [data, solicitudes, sparkDays, tmData] = await Promise.all([
    getDashboardData(range, fromParam, toParam),
    getSolicitudesPendientes(),
    getSparklineData(),
    getTMData(),
  ]);
  type SparkDay = { revenue: number; dispatches: number; clients: number; mermas: number };
  const spark = {
    revenue:    (sparkDays as SparkDay[]).map((d) => d.revenue),
    dispatches: (sparkDays as SparkDay[]).map((d) => d.dispatches),
    clients:    (sparkDays as SparkDay[]).map((d) => d.clients),
    mermas:     (sparkDays as SparkDay[]).map((d) => d.mermas),
  };

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
          <Suspense fallback={<div className="h-9 w-64 bg-zinc-900/80 border border-zinc-800 rounded-xl animate-pulse" />}>
            <DashboardDateFilter />
          </Suspense>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Revenue */}
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
            <div className="flex items-end justify-between mt-2">
              <p className="text-[10px] text-zinc-600">CLP con IVA / {data?.label}</p>
              <Sparkline data={spark.revenue} color="#f97316" />
            </div>
          </div>

          {/* Despachos */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all">
            <div className="p-2 bg-blue-500/10 rounded-xl w-fit mb-3">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Despachos</p>
            <p className="text-2xl font-black text-white">{data?.despachos ?? "—"}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[10px] text-zinc-600">{data?.label}</p>
              <Sparkline data={spark.dispatches} color="#60a5fa" />
            </div>
          </div>

          {/* Clientes activos */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
            <div className="p-2 bg-emerald-500/10 rounded-xl w-fit mb-3">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Clientes activos</p>
            <p className="text-2xl font-black text-white">{data?.clientesActivos ?? "—"}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[10px] text-zinc-600">de {data?.clientesTotal ?? "—"} totales</p>
              <Sparkline data={spark.clients} color="#34d399" />
            </div>
          </div>

          {/* Mermas */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-red-500/30 transition-all">
            <div className="p-2 bg-red-500/10 rounded-xl w-fit mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Mermas</p>
            <p className="text-2xl font-black text-white">{data?.mermas ?? "—"}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-[10px] text-zinc-600">{data?.label}</p>
              <Sparkline data={spark.mermas} color="#f87171" />
            </div>
          </div>
        </div>

        {/* Chart + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DashboardChart data={data?.chartData ?? []} />
          </div>

          {/* Quick actions + alerts */}
          <div className="space-y-4">
            {solicitudes.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-bold text-orange-400">
                    {solicitudes.length} pedido{solicitudes.length > 1 ? "s" : ""} pendiente{solicitudes.length > 1 ? "s" : ""}
                  </span>
                </div>
                {solicitudes.map((s: { id: string; tienda: string; cantidad: number; fechaEntrega: Date; nota: string | null; responsable: string | null }) => (
                  <div key={s.id} className="bg-black/30 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{s.tienda}</span>
                      <span className="text-orange-400 font-bold">{s.cantidad} unid.</span>
                    </div>
                    {s.responsable && (
                      <p className="text-zinc-500 flex items-center gap-1">
                        <Users className="w-3 h-3 shrink-0" />
                        <span className="text-zinc-300 font-medium">{s.responsable}</span>
                      </p>
                    )}
                    <p className="text-zinc-500">
                      Entrega: <span className="text-zinc-300">
                        {new Date(s.fechaEntrega).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" })}
                      </span>
                    </p>
                    {s.nota && <p className="text-zinc-600 italic">"{s.nota}"</p>}
                    <SolicitudActions id={s.id} />
                  </div>
                ))}
              </div>
            )}
            {data && data.guiasPendientes > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Guías pendientes</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  {data.guiasPendientes} despacho{data.guiasPendientes > 1 ? "s" : ""} sin guía generada.
                </p>
                <Link href="/guias" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  Ir a Guías <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <p className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600 border-b border-zinc-800">
                Acciones rápidas
              </p>
              {[
                { label: "Nuevo despacho",  href: "/envios/nuevo", color: "text-orange-400" },
                { label: "Registrar merma", href: "/mermas",       color: "text-red-400" },
                { label: "Ver clientes",    href: "/clientes",     color: "text-emerald-400" },
                { label: "Ver guías",       href: "/guias",        color: "text-blue-400" },
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

        {/* Ranking + Recent dispatches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientRanking clients={data?.rankingData ?? []} />

          {/* Recent dispatches */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
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
        </div>

        {/* Time Market — comparativo de tiendas */}
        {tmData.some((s) => s.despachos > 0) && (
          <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Time Market — Comparativo de Tiendas
                <span className="text-zinc-600 font-normal text-xs ml-1">este mes</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                    <th className="px-6 py-3">Tienda</th>
                    <th className="px-4 py-3 text-right">Despachos</th>
                    <th className="px-4 py-3 text-right">Unidades</th>
                    <th className="px-4 py-3 text-right">Pendiente</th>
                    <th className="px-4 py-3 text-right">Mermas</th>
                    <th className="px-6 py-3">Actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const maxUnidades = Math.max(...tmData.map((s) => s.unidades), 1);
                    return tmData
                      .sort((a, b) => b.unidades - a.unidades)
                      .map((store) => (
                        <tr key={store.tienda} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-3 font-medium text-white">{store.tienda}</td>
                          <td className="px-4 py-3 text-right text-zinc-400">{store.despachos}</td>
                          <td className="px-4 py-3 text-right font-bold text-white">{store.unidades}</td>
                          <td className={`px-4 py-3 text-right font-bold text-xs ${store.pendiente > 0 ? "text-red-400" : "text-zinc-600"}`}>
                            {store.pendiente > 0 ? fmt(store.pendiente) : "—"}
                          </td>
                          <td className={`px-4 py-3 text-right text-xs ${store.mermas > 0 ? "text-amber-400 font-bold" : "text-zinc-600"}`}>
                            {store.mermas > 0 ? `-${store.mermas}` : "—"}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-[120px]">
                                <div
                                  className="h-1.5 rounded-full bg-blue-500"
                                  style={{ width: `${(store.unidades / maxUnidades) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-600">{Math.round((store.unidades / maxUnidades) * 100)}%</span>
                            </div>
                          </td>
                        </tr>
                      ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
