"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  LogOut, Package, Eye, CheckCircle, Upload, Loader2, X,
  ExternalLink, AlertTriangle, ShieldAlert, Plus, Minus,
  TrendingUp, Clock, CreditCard, ChevronDown, ShoppingCart, CalendarCheck, User,
} from "lucide-react";
import Image from "next/image";
import { marcarPagado } from "@/actions/portal";
import { createMerma } from "@/actions/mermas";
import { createSolicitudPedido } from "@/actions/solicitudes";

type Detalle = { cantidad: number; producto: { nombre: string; precioBase: number; tasaIva: number } };
type Envio = {
  id: string; folio: number | null; fecha: string; pagado: boolean;
  fechaPago: string | null; comprobantePago: string | null; detalles: Detalle[];
};
type Merma = { id: string; fecha: string; cantidad: number; motivo: string | null; producto: { nombre: string } };
type Producto = { id: string; nombre: string };

const fmt = (n: number) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const fmtDate = (s: string) => new Date(s).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });

// ── SVG Donut Chart ────────────────────────────────────────────────────────
function DonutChart({ pagado, pendiente }: { pagado: number; pendiente: number }) {
  const total = pagado + pendiente || 1;
  const r = 36, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const pagPct = pagado / total;
  const pendPct = pendiente / total;

  return (
    <div className="flex flex-col items-center">
      <svg width={88} height={88} viewBox="0 0 88 88">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={10} />
        {/* Pagado */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth={10}
          strokeDasharray={`${pagPct * circ} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
        {/* Pendiente */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={10}
          strokeDasharray={`${pendPct * circ} ${circ}`}
          strokeDashoffset={circ * (0.25 - pagPct)}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fill="#e4e4e7" fontWeight="bold">
          {Math.round(pagPct * 100)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#71717a">pagado</text>
      </svg>
      <div className="flex gap-4 mt-1 text-[10px]">
        <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Pagado</span>
        <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Pendiente</span>
      </div>
    </div>
  );
}

// ── SVG Bar Chart (últimos 6 meses) ──────────────────────────────────────
function BarChart({ envios }: { envios: Envio[] }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("es-CL", { month: "short" }) };
  });

  const data = months.map(({ year, month, label }) => {
    const mes = envios.filter((e) => {
      const d = new Date(e.fecha);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const unidades = mes.reduce((s, e) => s + e.detalles.reduce((ss, d) => ss + d.cantidad, 0), 0);
    return { label, unidades };
  });

  const maxVal = Math.max(...data.map((d) => d.unidades), 1);
  const W = 240, H = 80, barW = 28, gap = 12;

  return (
    <div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Unidades últimos 6 meses</p>
      <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.unidades / maxVal) * H : 0;
          const x = i * (barW + gap);
          const y = H - barH;
          const isLast = i === data.length - 1;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH}
                fill={isLast ? "#f97316" : "#3f3f46"}
                rx={4} style={{ transition: "height 0.4s ease, y 0.4s ease" }} />
              {d.unidades > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fill={isLast ? "#f97316" : "#71717a"}>
                  {d.unidades}
                </text>
              )}
              <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={9} fill="#52525b">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function SubUserView({
  envios, mermas, productos, clienteId, tienda, brand = "Time Market",
}: {
  envios: Envio[]; mermas: Merma[]; productos: Producto[]; clienteId: string; tienda: string; brand?: string;
}) {
  const [tab, setTab] = useState<"pedidos" | "mermas" | "pedido">("pedidos");

  // ─── Fechas de despacho disponibles (martes y viernes) ──────────────────
  const hoyBase = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const diaSemanaHoy = hoyBase.getDay();
  const esDespachoHoy = diaSemanaHoy === 2 || diaSemanaHoy === 5; // martes=2, viernes=5

  function proximoDiaSiguiente(dia: number): Date { // siempre el próximo, nunca hoy
    const diff = ((dia - diaSemanaHoy + 7) % 7) || 7;
    const d = new Date(hoyBase);
    d.setDate(hoyBase.getDate() + diff);
    return d;
  }
  const proximoMartes  = proximoDiaSiguiente(2);
  const proximoViernes = proximoDiaSiguiente(5);

  const fechasDisponibles: Date[] = [
    ...(esDespachoHoy ? [hoyBase] : []),
    ...[proximoMartes, proximoViernes].sort((a, b) => a.getTime() - b.getTime()),
  ];

  const [fechaEntrega, setFechaEntrega] = useState<Date>(fechasDisponibles[0]);
  const [pedidoCantidad, setPedidoCantidad] = useState(10);
  const [pedidoNota, setPedidoNota] = useState("");
  const [pedidoSending, setPedidoSending] = useState(false);
  const [pedidoOk, setPedidoOk] = useState(false);

  async function handlePedido(e: React.FormEvent) {
    e.preventDefault();
    setPedidoSending(true);
    await createSolicitudPedido({
      clienteId,
      tienda,
      cantidad: pedidoCantidad,
      nota: pedidoNota,
      fechaEntrega: fechaEntrega.toISOString(),
      responsable: responsable || undefined,
    });
    setPedidoSending(false);
    setPedidoOk(true);
    setPedidoCantidad(10);
    setPedidoNota("");
    setTimeout(() => setPedidoOk(false), 5000);
  }
  const [expanded, setExpanded] = useState<string | null>(null);
  const [responsable, setResponsable] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem(`responsable_${clienteId}`);
    if (saved) setResponsable(saved);
  }, [clienteId]);
  const saveResponsable = (name: string) => {
    setResponsable(name);
    localStorage.setItem(`responsable_${clienteId}`, name);
  };
  const [pagoModal, setPagoModal] = useState<{ envioId: string; folio: number | null } | null>(null);
  const [pagoFile, setPagoFile] = useState<File | null>(null);
  const [pagando, setPagando] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [pagosLocales, setPagosLocales] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);
  const [mermaQty, setMermaQty] = useState(1);
  const [mermaSending, setMermaSending] = useState(false);
  const [mermaOk, setMermaOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mermaFormRef = useRef<HTMLFormElement>(null);

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth());
  const [año, setAño] = useState(now.getFullYear());

  const enviosPeriodo = useMemo(() =>
    envios.filter((e) => { const d = new Date(e.fecha); return d.getMonth() === mes && d.getFullYear() === año; }),
    [envios, mes, año]);

  const añosDisponibles = useMemo(() => {
    const s = new Set(envios.map((e) => new Date(e.fecha).getFullYear()));
    s.add(now.getFullYear());
    return Array.from(s).sort((a, b) => b - a);
  }, [envios]);

  const kpis = useMemo(() => {
    let pagado = 0, pendiente = 0, unidades = 0;
    for (const e of envios) {
      const neto = e.detalles.reduce((s, d) => s + d.cantidad * d.producto.precioBase, 0);
      const total = neto * (1 + (e.detalles[0]?.producto.tasaIva ?? 0.19));
      if (e.pagado || pagosLocales[e.id]) pagado += total; else pendiente += total;
    }
    for (const e of enviosPeriodo)
      for (const d of e.detalles) unidades += d.cantidad;
    return { pagado, pendiente, unidades, totalEnvios: enviosPeriodo.length };
  }, [envios, enviosPeriodo, pagosLocales]);

  const isPagado = (e: Envio) => e.pagado || !!pagosLocales[e.id];

  async function confirmarPago() {
    if (!pagoModal) return;
    setPagando(true); setPagoError(null);
    try {
      let filename: string | null = null;
      if (pagoFile) {
        const fd = new FormData();
        fd.append("file", pagoFile);
        const res = await fetch("/api/comprobante", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Error al subir comprobante");
        filename = (await res.json()).filename;
      }
      await marcarPagado(pagoModal.envioId, filename);
      setPagosLocales((p) => ({ ...p, [pagoModal.envioId]: true }));
      setPagoModal(null); setPagoFile(null);
    } catch (e: any) {
      setPagoError(e.message ?? "Error");
    } finally {
      setPagando(false);
    }
  }

  async function handleMerma(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMermaSending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("clienteId", clienteId);
    fd.set("cantidad", String(mermaQty));
    await createMerma(fd);
    setMermaSending(false);
    setMermaOk(true);
    setMermaQty(1);
    mermaFormRef.current?.reset();
    setTimeout(() => setMermaOk(false), 3000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Modal pago */}
      {pagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Registrar pago — Guía #{pagoModal.folio ?? "—"}</h3>
              <button onClick={() => { setPagoModal(null); setPagoFile(null); setPagoError(null); }}>
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => setPagoFile(e.target.files?.[0] ?? null)} />
            {pagoFile ? (
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{pagoFile.name}</span>
                <button onClick={() => setPagoFile(null)} className="ml-auto text-zinc-500"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-600 hover:border-orange-500/50 rounded-xl py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                <Upload className="w-4 h-4" /> Subir comprobante (opcional)
              </button>
            )}
            {pagoError && <p className="text-xs text-red-400">{pagoError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setPagoModal(null); setPagoFile(null); setPagoError(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarPago} disabled={pagando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                {pagando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 relative shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            {!logoError ? (
              <Image src="/logo.png" alt="Doña Any" fill className="object-contain p-0.5" unoptimized onError={() => setLogoError(true)} />
            ) : <span className="text-orange-500 font-black">A</span>}
          </div>
          <div>
            <p className="font-bold text-sm">{brand} — {tienda}</p>
            <p className="text-zinc-500 text-xs">Portal de tienda · Doña Any</p>
          </div>
        </div>
        <button onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* KPI + Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-3.5 h-3.5 text-orange-400" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Este mes</p>
              </div>
              <p className="text-2xl font-black text-white">{kpis.totalEnvios}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">pedidos recibidos</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Unidades</p>
              </div>
              <p className="text-2xl font-black text-white">{kpis.unidades}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">lasañas recibidas</p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Pagado</p>
              </div>
              <p className="text-lg font-black text-emerald-400">{fmt(kpis.pagado)}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">total histórico</p>
            </div>
            <div className={`rounded-2xl p-4 border ${kpis.pendiente > 0 ? "bg-red-950/30 border-red-800/30" : "bg-zinc-900/60 border-zinc-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className={`w-3.5 h-3.5 ${kpis.pendiente > 0 ? "text-red-400" : "text-zinc-500"}`} />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Pendiente</p>
              </div>
              <p className={`text-lg font-black ${kpis.pendiente > 0 ? "text-red-400" : "text-zinc-400"}`}>{fmt(kpis.pendiente)}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">por pagar</p>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
            <DonutChart pagado={kpis.pagado} pendiente={kpis.pendiente} />
            <div className="border-l border-zinc-800 hidden sm:block self-stretch" />
            <BarChart envios={envios} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-2xl p-1 gap-1 w-fit flex-wrap">
          {([
            { id: "pedidos", label: "Mis Pedidos" },
            { id: "pedido",  label: "Hacer Pedido" },
            { id: "mermas",  label: "Reportar Merma" },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.id ? "bg-orange-500 text-black" : "text-zinc-500 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Pedidos tab */}
        {tab === "pedidos" && (
          <>
            {/* Filtro mes/año */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
                  className="appearance-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 pr-8 text-sm focus:outline-none focus:border-orange-500/50">
                  {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={año} onChange={(e) => setAño(Number(e.target.value))}
                  className="appearance-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 pr-8 text-sm focus:outline-none focus:border-orange-500/50">
                  {añosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                <h2 className="font-bold text-sm">Pedidos — {MESES[mes]} {año}</h2>
                <span className="ml-auto text-xs text-zinc-500">{enviosPeriodo.length} guías</span>
              </div>
              {enviosPeriodo.length === 0 ? (
                <div className="py-14 text-center text-zinc-600 text-sm">Sin pedidos para este período.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                        <th className="px-5 py-3">Fecha</th>
                        <th className="px-5 py-3">Folio</th>
                        <th className="px-5 py-3 text-right">Unid.</th>
                        <th className="px-5 py-3 text-right">Total c/IVA</th>
                        <th className="px-5 py-3 text-center">Pago</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {enviosPeriodo.map((envio) => {
                        const neto = envio.detalles.reduce((s, d) => s + d.cantidad * d.producto.precioBase, 0);
                        const total = neto * 1.19;
                        const unidades = envio.detalles.reduce((s, d) => s + d.cantidad, 0);
                        const pagado = isPagado(envio);
                        const isExpanded = expanded === envio.id;
                        return (
                          <>
                            <tr
                              key={envio.id}
                              onClick={() => setExpanded(isExpanded ? null : envio.id)}
                              className={`border-b border-zinc-800/50 transition-colors cursor-pointer select-none ${
                                isExpanded ? "bg-zinc-800/40" : pagado ? "bg-emerald-950/10 hover:bg-emerald-950/20" : "hover:bg-zinc-800/20"
                              }`}
                            >
                              <td className="px-5 py-3.5 text-zinc-300">{fmtDate(envio.fecha)}</td>
                              <td className="px-5 py-3.5">
                                <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">#{envio.folio ?? "—"}</span>
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold">{unidades}</td>
                              <td className="px-5 py-3.5 text-right font-bold text-orange-400">{fmt(total)}</td>
                              <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                {pagado ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    {envio.comprobantePago && (
                                      <a href={`/api/comprobante?file=${envio.comprobantePago}`} target="_blank" rel="noopener noreferrer"
                                        className="text-zinc-500 hover:text-orange-400">
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <button onClick={() => setPagoModal({ envioId: envio.id, folio: envio.folio })}
                                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-zinc-600 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors">
                                    <Upload className="w-3 h-3" /> Pagar
                                  </button>
                                )}
                              </td>
                              <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                <a href={`/api/guia?envioId=${envio.id}`} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">PDF</span>
                                </a>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${envio.id}-detail`} className="bg-zinc-800/20 border-b border-zinc-800/50">
                                <td colSpan={6} className="px-5 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {envio.detalles.map((d, i) => (
                                      <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5">
                                        <Package className="w-3 h-3 text-orange-400" />
                                        <span className="font-bold text-white">{d.cantidad}×</span>
                                        <span className="text-zinc-400">{d.producto.nombre}</span>
                                        <span className="text-zinc-600 ml-1">{fmt(d.cantidad * d.producto.precioBase * 1.19)}</span>
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Hacer Pedido tab */}
        {tab === "pedido" && (
          <div className="max-w-md">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <ShoppingCart className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h2 className="font-bold">Solicitar Pedido</h2>
                  <p className="text-xs text-zinc-500">Despachos los martes y viernes</p>
                </div>
              </div>

              {pedidoOk && (
                <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  Pedido enviado. Doña Any lo confirmará pronto.
                </div>
              )}

              <form onSubmit={handlePedido} className="space-y-5">
                {/* Responsable */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tu nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                    <input
                      type="text"
                      value={responsable}
                      onChange={(e) => saveResponsable(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      required
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600">Tu nombre queda registrado con el pedido</p>
                </div>

                {/* Fecha de entrega */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fecha de entrega</label>
                  <div className={`grid gap-2 ${fechasDisponibles.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                    {fechasDisponibles.map((fecha) => {
                      const esHoy = fecha.toDateString() === hoyBase.toDateString();
                      const label = fecha.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" });
                      const isSelected = fechaEntrega.toDateString() === fecha.toDateString();
                      return (
                        <button
                          key={fecha.toISOString()}
                          type="button"
                          onClick={() => setFechaEntrega(fecha)}
                          className={`p-3 rounded-xl border text-sm font-medium text-left transition-all capitalize ${
                            isSelected
                              ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                              : "bg-black border-zinc-700 text-zinc-400 hover:border-zinc-500"
                          }`}
                        >
                          <CalendarCheck className={`w-4 h-4 mb-1 ${isSelected ? "text-orange-400" : "text-zinc-600"}`} />
                          {label}
                          {esHoy && (
                            <span className="block text-[10px] font-bold uppercase tracking-wider mt-0.5 text-emerald-400">
                              Hoy
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cantidad */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cantidad de unidades</label>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setPedidoCantidad(Math.max(1, pedidoCantidad - 1))}
                      className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-3xl font-black w-16 text-center text-white">{pedidoCantidad}</span>
                    <button type="button" onClick={() => setPedidoCantidad(pedidoCantidad + 1)}
                      className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600">lasañas individuales tradicionales</p>
                </div>

                {/* Nota */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nota adicional <span className="text-zinc-700 font-normal normal-case">(opcional)</span></label>
                  <textarea
                    value={pedidoNota}
                    onChange={(e) => setPedidoNota(e.target.value)}
                    placeholder="Ej: urgente, entregar antes del mediodía..."
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 min-h-[70px]"
                  />
                </div>

                <button type="submit" disabled={pedidoSending}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  {pedidoSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {pedidoSending ? "Enviando..." : `Solicitar ${pedidoCantidad} unidades`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mermas tab */}
        {tab === "mermas" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <h2 className="font-bold">Reportar Merma</h2>
              </div>

              {/* Responsable para merma */}
              {!responsable && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                  <p className="text-xs text-amber-400 font-bold">Identifícate antes de reportar</p>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tu nombre..."
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
                      onChange={(e) => saveResponsable(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {responsable && (
                <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500">
                  <User className="w-3.5 h-3.5 text-zinc-600" />
                  Registrando como <span className="text-white font-bold">{responsable}</span>
                  <button type="button" onClick={() => saveResponsable("")} className="text-zinc-700 hover:text-zinc-400 ml-1">cambiar</button>
                </div>
              )}

              {mermaOk && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Merma registrada correctamente.
                </div>
              )}

              <form ref={mermaFormRef} onSubmit={handleMerma} className="space-y-4">
                <input type="hidden" name="clienteId" value={clienteId} />
                <input type="hidden" name="responsable" value={responsable} />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Producto</label>
                  <select name="productoId" required
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50">
                    <option value="">Selecciona...</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cantidad</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setMermaQty(Math.max(1, mermaQty - 1))}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-2xl font-black w-12 text-center">{mermaQty}</span>
                    <button type="button" onClick={() => setMermaQty(mermaQty + 1)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fecha</label>
                  <input name="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Motivo</label>
                  <textarea name="motivo" placeholder="Ej: producto vencido, empaque dañado..."
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50 min-h-[70px]" />
                </div>

                <button type="submit" disabled={mermaSending}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  {mermaSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {mermaSending ? "Registrando..." : "Confirmar Merma"}
                </button>
              </form>
            </div>

            {/* Historial mermas */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" /> Historial reciente
                </h2>
              </div>
              {mermas.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-10">Sin mermas registradas.</p>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {mermas.slice(0, 10).map((m) => (
                    <div key={m.id} className="px-5 py-3 flex items-start gap-3">
                      <div className="p-1.5 bg-red-500/10 rounded-lg mt-0.5 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{m.producto.nombre}</p>
                        <p className="text-xs text-zinc-500">{fmtDate(m.fecha)} · <span className="text-red-400 font-bold">-{m.cantidad} unid.</span></p>
                        {m.motivo && <p className="text-[10px] text-zinc-600 italic mt-0.5 truncate">"{m.motivo}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-zinc-700 text-xs pb-4">
          Comercializadora de Alimentos Ulises Querales E.I.R.L. · Doña Any
        </p>
      </div>
    </div>
  );
}
