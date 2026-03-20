"use client";

import { useState, useMemo } from "react";
import { createEnvio, createEnviosBulk, enviarGuia, getUltimoReparto } from "@/actions/envios";
import { generarYEnviarGuias } from "@/actions/pdf";
import {
  Package, User, Plus, Trash2, ArrowLeft, FileText, Loader2, Eye,
  CheckCircle, Mail, LayoutDashboard, Minus, Layers, RotateCcw,
  Calendar, ChevronDown, Send, AlertCircle,
} from "lucide-react";
import Link from "next/link";

type Mode = "individual" | "masivo";
type Step = "form" | "preview" | "results";

type FilaMasivo = {
  clienteId: string;
  productoId: string;
  cantidad: number;
  activo: boolean;
};

type BulkResult = {
  clienteId: string;
  razonSocial: string;
  envioId: string | null;
  error: string | null;
  emailStatus: "idle" | "sending" | "sent" | "no_email" | "error";
  emailError: string | null;
};

const fmt = (n: number) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const today = () => new Date().toISOString().split("T")[0];

export default function NuevoEnvio({ clientes, productos }: { clientes: any[]; productos: any[] }) {
  const defaultProductoId = productos[0]?.id ?? "";

  // ── Shared ──────────────────────────────────────────────────────────────────
  const [mode, setMode]   = useState<Mode>("masivo");
  const [fecha, setFecha] = useState(today());
  const [step, setStep]   = useState<Step>("form");
  const [loading, setLoading] = useState(false);

  // ── Individual ──────────────────────────────────────────────────────────────
  const [selectedCliente, setSelectedCliente] = useState("");
  const [items, setItems] = useState<{ productoId: string; cantidad: number }[]>([]);
  const [envioId, setEnvioId]         = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "no_email" | "error">("idle");
  const [emailError, setEmailError]   = useState<string | null>(null);
  const [sending, setSending]         = useState(false);

  // ── Masivo ──────────────────────────────────────────────────────────────────
  const [filas, setFilas] = useState<FilaMasivo[]>(
    clientes.map((c) => ({ clienteId: c.id, productoId: defaultProductoId, cantidad: 1, activo: false })),
  );
  const [bulkResults, setBulkResults]         = useState<BulkResult[]>([]);
  const [sendingAll, setSendingAll]           = useState(false);
  const [repetirLoading, setRepetirLoading]   = useState(false);

  // ── Live totals ──────────────────────────────────────────────────────────────
  const totalIndividual = useMemo(() => {
    return items.reduce((s, item) => {
      const p = productos.find((x) => x.id === item.productoId);
      return s + (p ? item.cantidad * p.precioBase * (1 + (p.tasaIva ?? 0.19)) : 0);
    }, 0);
  }, [items, productos]);

  const filasActivas = filas.filter((f) => f.activo);

  const totalMasivo = useMemo(() => {
    return filasActivas.reduce((s, f) => {
      const p = productos.find((x) => x.id === f.productoId);
      return s + (p ? f.cantidad * p.precioBase * (1 + (p.tasaIva ?? 0.19)) : 0);
    }, 0);
  }, [filasActivas, productos]);

  // ── Helpers individual ───────────────────────────────────────────────────────
  const addItem = () => setItems([...items, { productoId: defaultProductoId, cantidad: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const next = [...items];
    (next[i] as any)[field] = value;
    setItems(next);
  };

  // ── Helpers masivo ───────────────────────────────────────────────────────────
  const toggleFila = (clienteId: string) =>
    setFilas((prev) => prev.map((f) => f.clienteId === clienteId ? { ...f, activo: !f.activo } : f));

  const updateFila = (clienteId: string, field: keyof FilaMasivo, value: any) =>
    setFilas((prev) => prev.map((f) => f.clienteId === clienteId ? { ...f, [field]: value } : f));

  const toggleAll = () => {
    const allOn = filas.every((f) => f.activo);
    setFilas((prev) => prev.map((f) => ({ ...f, activo: !allOn })));
  };

  async function handleRepetirUltimo() {
    setRepetirLoading(true);
    try {
      const ultimo = await getUltimoReparto();
      if (!ultimo.length) { alert("No hay repartos anteriores registrados."); return; }
      setFilas((prev) =>
        prev.map((fila) => {
          const match = ultimo.find((u: any) => u.clienteId === fila.clienteId);
          if (match && match.items.length > 0) {
            return { ...fila, productoId: match.items[0].productoId, cantidad: match.items[0].cantidad, activo: true };
          }
          return { ...fila, activo: false };
        }),
      );
    } finally {
      setRepetirLoading(false);
    }
  }

  // ── Submit individual ────────────────────────────────────────────────────────
  async function handleCrearIndividual(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append("clienteId", selectedCliente);
    const result = await createEnvio(fd, items, fecha);
    if (result.success && result.envioId) {
      setEnvioId(result.envioId);
      setStep("preview");
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  async function handleEnviarEmail() {
    if (!envioId) return;
    setSending(true);
    const result = await enviarGuia(envioId) as any;
    setEmailStatus(result.success ? (result.emailStatus ?? "sent") : "error");
    setEmailError(result.emailError ?? result.error ?? null);
    setSending(false);
  }

  // ── Submit masivo ────────────────────────────────────────────────────────────
  async function handleCrearMasivo(e: React.FormEvent) {
    e.preventDefault();
    if (!filasActivas.length) return;
    setLoading(true);
    const raw = await createEnviosBulk(
      fecha,
      filasActivas.map((f) => ({ clienteId: f.clienteId, items: [{ productoId: f.productoId, cantidad: f.cantidad }] })),
    );
    const clienteMap = Object.fromEntries(clientes.map((c) => [c.id, c]));
    setBulkResults(
      raw.map((r) => ({
        ...r,
        razonSocial: clienteMap[r.clienteId]?.razonSocial ?? r.clienteId,
        emailStatus: "idle" as const,
        emailError: null,
      })),
    );
    setStep("results");
    setLoading(false);
  }

  async function handleEnviarTodas() {
    const pendientes = bulkResults.filter((r) => r.envioId && r.emailStatus === "idle");
    if (!pendientes.length) return;
    setSendingAll(true);

    for (const pendiente of pendientes) {
      // Marcar como enviando
      setBulkResults((prev) =>
        prev.map((r) => r.clienteId === pendiente.clienteId ? { ...r, emailStatus: "sending" } : r),
      );

      try {
        const results = await generarYEnviarGuias([pendiente.envioId!]);
        const match = results[0];
        setBulkResults((prev) =>
          prev.map((r) =>
            r.clienteId === pendiente.clienteId
              ? {
                  ...r,
                  emailStatus: match?.status === "sent" ? "sent" : match?.status === "no_email" ? "no_email" : "error",
                  emailError: match?.error ?? null,
                }
              : r,
          ),
        );
      } catch (err: any) {
        setBulkResults((prev) =>
          prev.map((r) =>
            r.clienteId === pendiente.clienteId
              ? { ...r, emailStatus: "error", emailError: err.message ?? "Error inesperado" }
              : r,
          ),
        );
      }
    }

    setSendingAll(false);
  }

  const resetForm = () => {
    setStep("form");
    setSelectedCliente("");
    setItems([]);
    setEnvioId(null);
    setEmailStatus("idle");
    setEmailError(null);
    setBulkResults([]);
    setFilas((prev) => prev.map((f) => ({ ...f, activo: false, cantidad: 1, productoId: defaultProductoId })));
  };

  const clienteSeleccionado = clientes.find((c) => c.id === selectedCliente);

  // ══════════════════════════════════════════════════════════════════════════
  // PREVIEW INDIVIDUAL
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "preview" && envioId) {
    const pdfUrl   = `/api/guia?envioId=${envioId}`;
    const hasEmail = clienteSeleccionado?.email && !clienteSeleccionado.email.startsWith("AUTO-");

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 sm:p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-semibold text-sm">Despacho registrado</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Guía de <span className="text-orange-500">Despacho</span>
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {clienteSeleccionado?.razonSocial}{clienteSeleccionado?.sucursal ? ` - ${clienteSeleccionado.sucursal}` : ""}
              </p>
            </div>
            <Link href="/" className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-sm transition-colors shrink-0">
              <LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>

          <div className="lg:hidden space-y-3 mb-5">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-4 rounded-2xl transition-all text-sm">
              <Eye className="w-4 h-4 text-orange-400" /> Ver / Descargar PDF
            </a>
            <EmailBlock hasEmail={hasEmail} email={clienteSeleccionado?.email} status={emailStatus}
              error={emailError} sending={sending} onSend={handleEnviarEmail} onRetry={handleEnviarEmail} />
            <button onClick={resetForm}
              className="w-full text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 py-4 rounded-2xl transition-all text-sm">
              + Nuevo despacho
            </button>
          </div>

          <div className="hidden lg:grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-400"><FileText className="w-4 h-4" /> Vista previa</div>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium">
                  <Eye className="w-3.5 h-3.5" /> Abrir en nueva pestaña
                </a>
              </div>
              <iframe src={pdfUrl} className="w-full h-[620px] bg-white" title="Vista previa guía de despacho" />
            </div>
            <div className="space-y-3">
              <EmailBlock hasEmail={hasEmail} email={clienteSeleccionado?.email} status={emailStatus}
                error={emailError} sending={sending} onSend={handleEnviarEmail} onRetry={handleEnviarEmail} />
              <a href={pdfUrl} download
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all text-sm">
                <FileText className="w-4 h-4" /> Descargar PDF
              </a>
              <button onClick={resetForm}
                className="w-full text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 py-3 rounded-xl transition-all text-sm">
                + Nuevo despacho
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS MASIVO
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "results") {
    const ok       = bulkResults.filter((r) => r.envioId).length;
    const errors   = bulkResults.filter((r) => r.error).length;
    const enviadas = bulkResults.filter((r) => r.emailStatus === "sent").length;

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 sm:p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500 font-semibold text-sm">Reparto registrado</span>
            </div>
            <h1 className="text-2xl font-bold">
              {ok} guía{ok !== 1 ? "s" : ""} <span className="text-orange-500">generadas</span>
            </h1>
            {errors > 0 && <p className="text-red-400 text-sm mt-1">{errors} con error</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-white">{ok}</p>
              <p className="text-xs text-zinc-500 mt-1">Creadas</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-emerald-400">{enviadas}</p>
              <p className="text-xs text-zinc-500 mt-1">Emails enviados</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center">
              <p className="text-xl font-black text-orange-400">{fmt(totalMasivo)}</p>
              <p className="text-xs text-zinc-500 mt-1">Total c/IVA</p>
            </div>
          </div>

          {/* Enviar todas */}
          {bulkResults.some((r) => r.envioId && r.emailStatus === "idle") && (
            <button
              onClick={handleEnviarTodas}
              disabled={sendingAll}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-3.5 rounded-2xl transition-all mb-4 text-sm"
            >
              {sendingAll
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando emails...</>
                : <><Send className="w-4 h-4" /> Enviar todas por email</>}
            </button>
          )}

          {/* Results table */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mb-4">
            <div className="divide-y divide-zinc-800/50">
              {bulkResults.map((r) => (
                <div key={r.clienteId} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${r.envioId ? "bg-emerald-500" : "bg-red-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.razonSocial}</p>
                    {r.error && <p className="text-xs text-red-400">{r.error}</p>}
                    {r.emailError && <p className="text-xs text-red-400 truncate">{r.emailError}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.envioId && (
                      <a href={`/api/guia?envioId=${r.envioId}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> PDF
                      </a>
                    )}
                    {r.emailStatus === "sending" && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />}
                    {r.emailStatus === "sent"    && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Enviado</span>}
                    {r.emailStatus === "no_email"&& <span className="text-xs text-zinc-600">Sin email</span>}
                    {r.emailStatus === "error"   && (
                      <span className="text-xs text-red-400 flex items-center gap-1" title={r.emailError ?? ""}>
                        <AlertCircle className="w-3 h-3" /> Error
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={resetForm}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-2xl transition-all text-sm">
              + Nuevo reparto
            </button>
            <Link href="/"
              className="flex items-center justify-center gap-2 px-6 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white rounded-2xl transition-all text-sm">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FORMULARIO
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-4 sm:p-6 lg:p-10 pt-16 lg:pt-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">
              Nuevo <span className="text-orange-500">Despacho</span>
            </h1>
            <p className="text-zinc-500 text-sm">Genera guías de despacho para tus clientes.</p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setMode("individual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === "individual" ? "bg-orange-500 text-black" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <User className="w-4 h-4" /> Individual
            </button>
            <button
              onClick={() => setMode("masivo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === "masivo" ? "bg-orange-500 text-black" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="w-4 h-4" /> Masivo
            </button>
          </div>
        </div>

        {/* ── Fecha ──────────────────────────────────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-base font-bold">Fecha de despacho</h2>
          </div>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODO INDIVIDUAL                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {mode === "individual" && (
          <form onSubmit={handleCrearIndividual} className="space-y-5">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-xl"><User className="w-5 h-5 text-orange-500" /></div>
                <h2 className="text-base font-bold">Seleccionar Cliente</h2>
              </div>
              <div className="relative">
                <select value={selectedCliente} onChange={(e) => setSelectedCliente(e.target.value)} required
                  className="w-full appearance-none bg-black border border-zinc-800 rounded-xl px-4 py-4 pr-10 text-sm focus:outline-none focus:border-orange-500/50 transition-colors">
                  <option value="">Selecciona un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial}{c.sucursal ? ` - ${c.sucursal}` : ""} ({c.rut})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-xl"><Package className="w-5 h-5 text-orange-500" /></div>
                <h2 className="text-base font-bold">Productos</h2>
              </div>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-center py-8 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl text-sm">
                    Agrega productos para continuar.
                  </p>
                )}
                {items.map((item, i) => (
                  <div key={i} className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                    <div className="relative mb-3">
                      <select value={item.productoId} onChange={(e) => updateItem(i, "productoId", e.target.value)}
                        className="w-full appearance-none bg-black border border-zinc-800 rounded-lg px-3 py-3 pr-8 text-sm focus:outline-none focus:border-orange-500/50">
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre} — ${p.precioBase.toLocaleString()} neto</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Cantidad</span>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => item.cantidad > 1 && updateItem(i, "cantidad", item.cantidad - 1)}
                          className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all active:scale-95">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-lg">{item.cantidad}</span>
                        <button type="button" onClick={() => updateItem(i, "cantidad", item.cantidad + 1)}
                          className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all active:scale-95">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => removeItem(i)}
                          className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all active:scale-95 ml-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 border border-dashed border-zinc-700 hover:border-orange-500/50 hover:text-orange-400 rounded-xl text-sm text-zinc-500 transition-all">
                <Plus className="w-4 h-4" /> Agregar producto
              </button>
            </div>

            {/* Live totals individual */}
            {items.length > 0 && (
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
                {items.map((item, i) => {
                  const p = productos.find((x) => x.id === item.productoId);
                  if (!p) return null;
                  const subtotal = item.cantidad * p.precioBase * (1 + (p.tasaIva ?? 0.19));
                  return (
                    <div key={i} className="text-zinc-400">
                      <span className="text-white font-medium">{item.cantidad}×</span> {p.nombre}
                      <span className="text-orange-400 ml-2 font-bold">{fmt(subtotal)}</span>
                    </div>
                  );
                })}
                <div className="ml-auto text-right">
                  <span className="text-zinc-500 text-xs">Total c/IVA </span>
                  <span className="text-orange-400 font-black text-lg">{fmt(totalIndividual)}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || !selectedCliente || items.length === 0}
              className="w-full bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 text-black font-bold py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3 text-lg active:scale-[0.98]">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando guía...</>
                : <><FileText className="w-5 h-5" /> Generar Guía de Despacho</>}
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MODO MASIVO                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {mode === "masivo" && (
          <form onSubmit={handleCrearMasivo} className="space-y-5">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl"><Layers className="w-5 h-5 text-orange-500" /></div>
                  <div>
                    <h2 className="text-base font-bold">Clientes</h2>
                    <p className="text-xs text-zinc-500">{filasActivas.length} seleccionados de {clientes.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Repetir último */}
                  <button type="button" onClick={handleRepetirUltimo} disabled={repetirLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-zinc-700 hover:border-blue-500/50 text-zinc-400 hover:text-blue-400 rounded-xl transition-all">
                    {repetirLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Repetir último
                  </button>
                  {/* Toggle all */}
                  <button type="button" onClick={toggleAll}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-zinc-700 hover:border-orange-500/50 text-zinc-400 hover:text-orange-400 rounded-xl transition-all">
                    {filas.every((f) => f.activo) ? "Ninguno" : "Todos"}
                  </button>
                </div>
              </div>

              {/* Client rows */}
              <div className="divide-y divide-zinc-800/50">
                {filas.map((fila, idx) => {
                  const cliente = clientes.find((c) => c.id === fila.clienteId);
                  const prod    = productos.find((p) => p.id === fila.productoId);
                  const subtotal = fila.activo && prod ? fila.cantidad * prod.precioBase * (1 + (prod.tasaIva ?? 0.19)) : 0;

                  return (
                    <div key={fila.clienteId}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${fila.activo ? "bg-zinc-800/20" : "opacity-50 hover:opacity-70"}`}>
                      {/* Checkbox */}
                      <button type="button" onClick={() => toggleFila(fila.clienteId)}
                        className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
                          fila.activo ? "bg-orange-500 border-orange-500" : "border-zinc-600 hover:border-orange-500/50"
                        }`}>
                        {fila.activo && <CheckCircle className="w-3 h-3 text-black" />}
                      </button>

                      {/* Client name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {cliente?.razonSocial}
                          {cliente?.sucursal ? <span className="text-zinc-500 font-normal"> · {cliente.sucursal}</span> : ""}
                        </p>
                        <p className="text-[10px] text-zinc-600">{cliente?.rut}</p>
                      </div>

                      {/* Product */}
                      <div className="relative hidden sm:block">
                        <select value={fila.productoId} onChange={(e) => updateFila(fila.clienteId, "productoId", e.target.value)}
                          disabled={!fila.activo}
                          className="appearance-none bg-black border border-zinc-800 rounded-lg px-3 py-2 pr-7 text-xs focus:outline-none focus:border-orange-500/50 disabled:cursor-not-allowed max-w-[160px]">
                          {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button type="button" onClick={() => fila.cantidad > 1 && updateFila(fila.clienteId, "cantidad", fila.cantidad - 1)}
                          disabled={!fila.activo}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all disabled:opacity-30">
                          <Minus className="w-3 h-3" />
                        </button>
                        <input type="number" min={1} max={999} value={fila.cantidad}
                          onChange={(e) => updateFila(fila.clienteId, "cantidad", Math.max(1, parseInt(e.target.value) || 1))}
                          disabled={!fila.activo}
                          className="w-10 text-center bg-black border border-zinc-800 rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:border-orange-500/50 disabled:opacity-30" />
                        <button type="button" onClick={() => updateFila(fila.clienteId, "cantidad", fila.cantidad + 1)}
                          disabled={!fila.activo}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all disabled:opacity-30">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="w-24 text-right shrink-0">
                        {fila.activo && subtotal > 0
                          ? <span className="text-xs font-bold text-orange-400">{fmt(subtotal)}</span>
                          : <span className="text-xs text-zinc-700">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live totals masivo */}
            {filasActivas.length > 0 && (
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  <span className="text-white font-bold">{filasActivas.length}</span> cliente{filasActivas.length !== 1 ? "s" : ""}
                  {" · "}
                  <span className="text-white font-bold">{filasActivas.reduce((s, f) => s + f.cantidad, 0)}</span> unidades
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500">Total c/IVA </span>
                  <span className="text-orange-400 font-black text-xl">{fmt(totalMasivo)}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || filasActivas.length === 0}
              className="w-full bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 text-black font-bold py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3 text-lg active:scale-[0.98]">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando guías...</>
                : <><FileText className="w-5 h-5" /> Generar {filasActivas.length || ""} Guía{filasActivas.length !== 1 ? "s" : ""}</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: Email block ──────────────────────────────────────────────
function EmailBlock({ hasEmail, email, status, error, sending, onSend, onRetry }: {
  hasEmail: boolean; email: string; status: string; error: string | null;
  sending: boolean; onSend: () => void; onRetry: () => void;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4 text-orange-500" /> Enviar al cliente
      </h3>
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        {hasEmail ? `Se enviará a ${email}` : "Este cliente no tiene email configurado."}
      </p>
      {status === "idle" && (
        <button onClick={onSend} disabled={sending || !hasEmail}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all text-sm">
          {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar por email"}
        </button>
      )}
      {status === "sent" && (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Enviada correctamente
        </div>
      )}
      {status === "no_email" && (
        <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm">Sin email configurado.</div>
      )}
      {status === "error" && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          Error: {error}
          <button onClick={onRetry} className="block mt-2 text-xs underline hover:text-red-300">Reintentar</button>
        </div>
      )}
    </div>
  );
}
