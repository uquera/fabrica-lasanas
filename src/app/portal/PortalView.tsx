"use client";

import { useState, useMemo, useRef } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Package, ChevronDown, Eye, Search, X, CheckCircle, Upload, Loader2, ExternalLink, CreditCard, Clock, TrendingUp, AlertCircle } from "lucide-react";
import Image from "next/image";
import { marcarPagado } from "@/actions/portal";

type Detalle = {
  cantidad: number;
  producto: { nombre: string; precioBase: number; tasaIva: number };
};

type Envio = {
  id: string;
  folio: number | null;
  fecha: string;
  pagado: boolean;
  fechaPago: string | null;
  comprobantePago: string | null;
  cliente: { razonSocial: string; sucursal: string | null };
  detalles: Detalle[];
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type PagoModal = { envioId: string; folio: number | null };

export default function PortalView({ envios, razonSocial }: { envios: Envio[]; razonSocial: string }) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth());
  const [año, setAño] = useState(now.getFullYear());
  const [busqueda, setBusqueda] = useState("");
  const [logoError, setLogoError] = useState(false);

  // Estado de pago
  const [pagoModal, setPagoModal] = useState<PagoModal | null>(null);
  const [pagoFile, setPagoFile] = useState<File | null>(null);
  const [pagando, setPagando] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Copia local para actualizar UI sin recargar
  const [pagosLocales, setPagosLocales] = useState<Record<string, { fechaPago: string; comprobantePago: string | null }>>({});

  const añosDisponibles = useMemo(() => {
    const set = new Set(envios.map((e) => new Date(e.fecha).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [envios]);

  const enviosPeriodo = useMemo(() => {
    return envios.filter((e) => {
      const d = new Date(e.fecha);
      return d.getMonth() === mes && d.getFullYear() === año;
    });
  }, [envios, mes, año]);

  const enviosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return enviosPeriodo;
    const q = busqueda.toLowerCase();
    return enviosPeriodo.filter((e) => {
      const sucursal = (e.cliente.sucursal ?? e.cliente.razonSocial).toLowerCase();
      const folio = String(e.folio ?? "");
      return sucursal.includes(q) || folio.includes(q);
    });
  }, [enviosPeriodo, busqueda]);

  const totales = useMemo(() => {
    let unidades = 0, neto = 0;
    for (const e of enviosPeriodo)
      for (const d of e.detalles) { unidades += d.cantidad; neto += d.cantidad * d.producto.precioBase; }
    return { unidades, neto, iva: neto * 0.19, total: neto * 1.19 };
  }, [enviosPeriodo]);

  const totalesFiltrados = useMemo(() => {
    let unidades = 0, neto = 0;
    for (const e of enviosFiltrados)
      for (const d of e.detalles) { unidades += d.cantidad; neto += d.cantidad * d.producto.precioBase; }
    return { unidades, neto, total: neto * 1.19 };
  }, [enviosFiltrados]);

  const hayBusqueda = busqueda.trim().length > 0;

  const fmt = (n: number) =>
    n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  // Cuenta corriente: totales históricos sobre TODOS los envíos
  const cuentaCorriente = useMemo(() => {
    let totalHistorico = 0, totalPagado = 0, totalPendiente = 0;
    let countPendiente = 0;
    let ultimaFecha: string | null = null;

    for (const e of envios) {
      const neto = e.detalles.reduce((s, d) => s + d.cantidad * d.producto.precioBase, 0);
      const total = neto * (1 + (e.detalles[0]?.producto.tasaIva ?? 0.19));
      totalHistorico += total;
      const pagado = e.pagado || !!pagosLocales[e.id];
      if (pagado) {
        totalPagado += total;
      } else {
        totalPendiente += total;
        countPendiente++;
      }
      if (!ultimaFecha || e.fecha > ultimaFecha) ultimaFecha = e.fecha;
    }
    return { totalHistorico, totalPagado, totalPendiente, countPendiente, ultimaFecha };
  }, [envios, pagosLocales]);

  const isPagado = (envio: Envio) => envio.pagado || !!pagosLocales[envio.id];

  async function confirmarPago() {
    if (!pagoModal) return;
    setPagando(true);
    setPagoError(null);

    try {
      let filename: string | null = null;

      if (pagoFile) {
        const fd = new FormData();
        fd.append("file", pagoFile);
        const res = await fetch("/api/comprobante", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Error al subir comprobante");
        const data = await res.json();
        filename = data.filename;
      }

      await marcarPagado(pagoModal.envioId, filename);

      setPagosLocales((prev) => ({
        ...prev,
        [pagoModal.envioId]: { fechaPago: new Date().toISOString(), comprobantePago: filename },
      }));

      setPagoModal(null);
      setPagoFile(null);
    } catch (e: any) {
      setPagoError(e.message ?? "Error al registrar pago");
    } finally {
      setPagando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Modal de pago */}
      {pagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar pago</h3>
              <button onClick={() => { setPagoModal(null); setPagoFile(null); setPagoError(null); }}
                className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-400">
              Guía <span className="font-mono text-white">#{pagoModal.folio ?? "—"}</span>
            </p>

            {/* Subir comprobante */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">
                Comprobante de pago <span className="normal-case font-normal">(opcional)</span>
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setPagoFile(e.target.files?.[0] ?? null)}
              />
              {pagoFile ? (
                <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2.5 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate text-zinc-200">{pagoFile.name}</span>
                  <button onClick={() => { setPagoFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="ml-auto text-zinc-500 hover:text-zinc-300 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-600 hover:border-orange-500/50 rounded-xl py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Subir imagen o PDF
                </button>
              )}
            </div>

            {pagoError && <p className="text-xs text-red-400">{pagoError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setPagoModal(null); setPagoFile(null); setPagoError(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPago}
                disabled={pagando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
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
          <div className="w-10 h-10 relative shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            {!logoError ? (
              <Image src="/logo.png" alt="Doña Any" fill className="object-contain p-0.5"
                unoptimized onError={() => setLogoError(true)} />
            ) : (
              <span className="text-orange-500 font-black text-lg">A</span>
            )}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{razonSocial}</p>
            <p className="text-zinc-500 text-xs">Doña Any — Resumen de despachos</p>
          </div>
        </div>
        <button
          onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Cuenta corriente */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Total histórico</p>
            </div>
            <p className="text-xl font-black text-orange-400">{fmt(cuentaCorriente.totalHistorico)}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{envios.length} guías en total</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Pagado</p>
            </div>
            <p className="text-xl font-black text-emerald-400">{fmt(cuentaCorriente.totalPagado)}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {envios.length - cuentaCorriente.countPendiente} guías
            </p>
          </div>
          <div className={`rounded-2xl p-4 border ${
            cuentaCorriente.countPendiente > 0
              ? "bg-red-500/10 border-red-500/30"
              : "bg-zinc-900/50 border-zinc-800"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`w-3.5 h-3.5 ${cuentaCorriente.countPendiente > 0 ? "text-red-400" : "text-zinc-500"}`} />
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Pendiente</p>
            </div>
            <p className={`text-xl font-black ${cuentaCorriente.countPendiente > 0 ? "text-red-400" : "text-zinc-400"}`}>
              {fmt(cuentaCorriente.totalPendiente)}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {cuentaCorriente.countPendiente} guía{cuentaCorriente.countPendiente !== 1 ? "s" : ""} por pagar
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Último pedido</p>
            </div>
            <p className="text-sm font-bold text-white">
              {cuentaCorriente.ultimaFecha
                ? new Date(cuentaCorriente.ultimaFecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
                : "—"}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">fecha de despacho</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Mes</label>
            <div className="relative">
              <select value={mes} onChange={(e) => { setMes(Number(e.target.value)); setBusqueda(""); }}
                className="appearance-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-orange-500/50">
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Año</label>
            <div className="relative">
              <select value={año} onChange={(e) => { setAño(Number(e.target.value)); setBusqueda(""); }}
                className="appearance-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-orange-500/50">
                {añosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Buscar sucursal / folio</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej: Bilbao, 1234..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 placeholder:text-zinc-600" />
              {hayBusqueda && (
                <button onClick={() => setBusqueda("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resumen cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Guías</p>
            <p className="text-2xl font-black">{enviosPeriodo.length}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{MESES[mes]} {año}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Unidades</p>
            <p className="text-2xl font-black">{totales.unidades}</p>
            <p className="text-xs text-zinc-600 mt-0.5">lasañas despachadas</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Neto período</p>
            <p className="text-xl font-black text-white">{fmt(totales.neto)}</p>
            <p className="text-xs text-zinc-600 mt-0.5">IVA {fmt(totales.iva)}</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <p className="text-xs text-orange-400 mb-1">Total c/IVA</p>
            <p className="text-xl font-black text-orange-400">{fmt(totales.total)}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{MESES[mes]} {año}</p>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-sm">Detalle de guías — {MESES[mes]} {año}</h2>
            </div>
            {hayBusqueda && (
              <span className="text-xs text-zinc-500">{enviosFiltrados.length} de {enviosPeriodo.length} resultados</span>
            )}
          </div>

          {enviosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-zinc-600 text-sm">
              {hayBusqueda ? "Sin resultados para esa búsqueda." : "Sin guías para este período."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Folio</th>
                    <th className="px-5 py-3">Sucursal</th>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3 text-right">Cant.</th>
                    <th className="px-5 py-3 text-right">Total c/IVA</th>
                    <th className="px-5 py-3 text-center">Pago</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {enviosFiltrados.map((envio) => {
                    const neto = envio.detalles.reduce((s, d) => s + d.cantidad * d.producto.precioBase, 0);
                    const total = neto * 1.19;
                    const unidades = envio.detalles.reduce((s, d) => s + d.cantidad, 0);
                    const producto = envio.detalles[0]?.producto.nombre ?? "—";
                    const pagado = isPagado(envio);
                    const comprobante = pagosLocales[envio.id]?.comprobantePago ?? envio.comprobantePago;

                    return (
                      <tr key={envio.id} className={`border-b border-zinc-800/50 transition-colors ${pagado ? "bg-emerald-950/10" : "hover:bg-zinc-800/20"}`}>
                        <td className="px-5 py-3.5 text-zinc-300">
                          {new Date(envio.fecha).toLocaleDateString("es-CL")}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">
                            #{envio.folio ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300 max-w-[130px] truncate">
                          {envio.cliente.sucursal ?? envio.cliente.razonSocial}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400 text-xs max-w-[140px] truncate">
                          {producto}{envio.detalles.length > 1 ? ` +${envio.detalles.length - 1}` : ""}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold">{unidades}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-orange-400">{fmt(total)}</td>
                        <td className="px-5 py-3.5 text-center">
                          {pagado ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold">
                                <CheckCircle className="w-3.5 h-3.5" /> Pagado
                              </span>
                              {comprobante && (
                                <a href={`/api/comprobante?file=${comprobante}`} target="_blank" rel="noopener noreferrer"
                                  className="text-zinc-500 hover:text-orange-400 transition-colors" title="Ver comprobante">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setPagoModal({ envioId: envio.id, folio: envio.folio })}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-zinc-600 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
                            >
                              <Upload className="w-3 h-3" /> Pagar
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <a href={`/api/guia?envioId=${envio.id}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-800/30 font-bold">
                    <td colSpan={4} className="px-5 py-3.5 text-zinc-400 text-xs uppercase tracking-wider">
                      {hayBusqueda ? "Subtotal búsqueda" : `Total ${MESES[mes]} ${año}`}
                    </td>
                    <td className="px-5 py-3.5 text-right">{hayBusqueda ? totalesFiltrados.unidades : totales.unidades}</td>
                    <td className="px-5 py-3.5 text-right text-orange-400">{hayBusqueda ? fmt(totalesFiltrados.total) : fmt(totales.total)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-zinc-700 text-xs pb-4">
          Comercializadora de Alimentos Ulises Querales E.I.R.L. · Doña Any
        </p>
      </div>
    </div>
  );
}
