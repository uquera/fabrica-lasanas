"use client";

import { useState } from "react";
import { createEnvio, enviarGuia } from "@/actions/envios";
import { Package, User, Plus, Trash2, ArrowLeft, FileText, Loader2, Eye, CheckCircle, Mail, LayoutDashboard, Minus } from "lucide-react";
import Link from "next/link";

type Step = "form" | "preview";

export default function NuevoEnvio({ clientes, productos }: { clientes: any[], productos: any[] }) {
  const [step, setStep] = useState<Step>("form");
  const [selectedCliente, setSelectedCliente] = useState("");
  const [items, setItems] = useState<{ productoId: string, cantidad: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [envioId, setEnvioId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "no_email" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  const clienteSeleccionado = clientes.find((c) => c.id === selectedCliente);

  const addItem = () => {
    if (productos.length > 0) {
      setItems([...items, { productoId: productos[0].id, cantidad: 1 }]);
    }
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const incrementCantidad = (index: number) => {
    updateItem(index, "cantidad", items[index].cantidad + 1);
  };

  const decrementCantidad = (index: number) => {
    if (items[index].cantidad > 1) updateItem(index, "cantidad", items[index].cantidad - 1);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("clienteId", selectedCliente);
    const result = await createEnvio(formData, items);
    if (result.success && result.envioId) {
      setEnvioId(result.envioId);
      setStep("preview");
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleEnviarEmail = async () => {
    if (!envioId) return;
    setSending(true);
    const result = await enviarGuia(envioId) as any;
    if (result.success) {
      setEmailStatus(result.emailStatus ?? "sent");
      setEmailError(result.emailError ?? null);
    } else {
      setEmailStatus("error");
      setEmailError(result.error ?? null);
    }
    setSending(false);
  };

  const resetForm = () => {
    setStep("form");
    setSelectedCliente("");
    setItems([]);
    setEnvioId(null);
    setEmailStatus("idle");
    setEmailError(null);
  };

  // ── PASO 2: PREVIEW ────────────────────────────────────────────────────────
  if (step === "preview" && envioId) {
    const pdfUrl = `/api/guia?envioId=${envioId}`;
    const hasEmail = clienteSeleccionado?.email && !clienteSeleccionado.email.startsWith("AUTO-");

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 sm:p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
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
                {clienteSeleccionado?.razonSocial}
                {clienteSeleccionado?.sucursal ? ` - ${clienteSeleccionado.sucursal}` : ""}
              </p>
            </div>
            <Link href="/" className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-sm transition-colors shrink-0">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>

          {/* Acciones móvil (arriba del PDF) */}
          <div className="lg:hidden space-y-3 mb-5">
            {/* Ver / Descargar PDF */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-4 rounded-2xl transition-all text-sm active:scale-[0.98]"
            >
              <Eye className="w-4 h-4 text-orange-400" /> Ver / Descargar PDF
            </a>

            {/* Enviar email */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-sm">Enviar al cliente</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                {hasEmail ? `Se enviará a ${clienteSeleccionado.email}` : "Este cliente no tiene email configurado."}
              </p>

              {emailStatus === "idle" && (
                <button
                  onClick={handleEnviarEmail}
                  disabled={sending || !hasEmail}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-sm"
                >
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar por email"}
                </button>
              )}
              {emailStatus === "sent" && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Enviada correctamente
                </div>
              )}
              {emailStatus === "no_email" && (
                <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm">
                  Sin email configurado.
                </div>
              )}
              {emailStatus === "error" && (
                <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                  Error: {emailError}
                  <button onClick={handleEnviarEmail} className="block mt-2 text-xs underline hover:text-red-300">Reintentar</button>
                </div>
              )}
            </div>

            {/* Nuevo despacho */}
            <button
              onClick={resetForm}
              className="w-full text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 py-4 rounded-2xl transition-all text-sm active:scale-[0.98]"
            >
              + Nuevo despacho
            </button>
          </div>

          {/* Layout desktop */}
          <div className="hidden lg:grid grid-cols-3 gap-5">
            {/* PDF iframe */}
            <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <FileText className="w-4 h-4" /> Vista previa
                </div>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Abrir en nueva pestaña
                </a>
              </div>
              <iframe src={pdfUrl} className="w-full h-[620px] bg-white" title="Vista previa guía de despacho" />
            </div>

            {/* Acciones desktop */}
            <div className="space-y-3">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500" /> Enviar al cliente
                </h3>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  {hasEmail ? `Se enviará a ${clienteSeleccionado.email}` : "Este cliente no tiene email configurado."}
                </p>
                {emailStatus === "idle" && (
                  <button
                    onClick={handleEnviarEmail}
                    disabled={sending || !hasEmail}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-sm"
                  >
                    {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar por email"}
                  </button>
                )}
                {emailStatus === "sent" && (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Enviada correctamente
                  </div>
                )}
                {emailStatus === "no_email" && (
                  <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm">
                    Sin email configurado.
                  </div>
                )}
                {emailStatus === "error" && (
                  <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                    Error: {emailError}
                    <button onClick={handleEnviarEmail} className="block mt-2 text-xs underline hover:text-red-300">Reintentar</button>
                  </div>
                )}
              </div>
              <a
                href={pdfUrl}
                download
                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all text-sm"
              >
                <FileText className="w-4 h-4" /> Descargar PDF
              </a>
              <button
                onClick={resetForm}
                className="w-full text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 py-3 rounded-xl transition-all text-sm"
              >
                + Nuevo despacho
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PASO 1: FORMULARIO ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-4 sm:p-6 lg:p-12 pt-16 lg:pt-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </Link>

        <div className="mb-7">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Nuevo <span className="text-orange-500">Despacho</span>
          </h1>
          <p className="text-zinc-500 text-sm">Completa el formulario para generar la guía de despacho.</p>
        </div>

        <form onSubmit={handleCrear} className="space-y-5">
          {/* Cliente */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-base font-bold">Seleccionar Cliente</h2>
            </div>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial}{c.sucursal ? ` - ${c.sucursal}` : ""} ({c.rut})
                </option>
              ))}
            </select>
          </div>

          {/* Productos */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Package className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-base font-bold">Productos</h2>
              </div>
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-center py-8 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl text-sm">
                  Agrega productos para continuar.
                </p>
              )}

              {items.map((item, index) => (
                <div key={index} className="bg-black/40 border border-zinc-800 rounded-xl p-3">
                  {/* Selector producto */}
                  <select
                    value={item.productoId}
                    onChange={(e) => updateItem(index, "productoId", e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors mb-3"
                  >
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — ${p.precioBase.toLocaleString()} neto
                      </option>
                    ))}
                  </select>

                  {/* Cantidad + borrar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Cantidad</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => decrementCantidad(index)}
                        className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-lg">{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => incrementCantidad(index)}
                        className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all active:scale-95 ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón agregar producto */}
            <button
              type="button"
              onClick={addItem}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 border border-dashed border-zinc-700 hover:border-orange-500/50 hover:text-orange-400 rounded-xl text-sm text-zinc-500 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Agregar producto
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedCliente || items.length === 0}
            className="w-full bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 text-black font-bold py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando guía...</>
              : <><FileText className="w-5 h-5" /> Generar Guía de Despacho</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
