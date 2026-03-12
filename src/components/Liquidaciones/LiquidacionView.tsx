"use client";

import { useState } from "react";
import { confirmarLiquidacion, getLiquidacionDetalle } from "@/actions/liquidacionesFinal";
import type { ClientePendiente, EnvioPendiente, MermaItem } from "@/actions/liquidacionesFinal";
import {
  CheckCircle, ChevronRight, Eye, FileText, Loader2,
  AlertTriangle, X, Receipt,
} from "lucide-react";

const fmt = (n: number) =>
  "$" + Math.round(n).toLocaleString("es-CL", { maximumFractionDigits: 0 });

// ── Panel de detalle/liquidación ───────────────────────────────────────────

function PanelLiquidacion({
  rut,
  onClose,
  onConfirmado,
}: {
  rut: string;
  onClose: () => void;
  onConfirmado: () => void;
}) {
  const [data, setData] = useState<{
    envios: EnvioPendiente[];
    mermas: MermaItem[];
    cliente: { razonSocial: string; rut: string; giro: string; direccion: string; email: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [facturaId, setFacturaId] = useState("");
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ emailStatus: string; emailError: string | null } | null>(null);

  useState(() => {
    getLiquidacionDetalle(rut).then((d) => { setData(d); setLoading(false); });
  });

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const { envios, mermas, cliente } = data;
  let totalDespachado = 0;
  let totalMerma = 0;
  for (const e of envios) for (const d of e.detalles) totalDespachado += d.cantidad * d.producto.precioBase;
  for (const m of mermas) totalMerma += m.cantidad * m.producto.precioBase;
  const netoFacturable = Math.max(0, totalDespachado - totalMerma);
  const iva = Math.round(netoFacturable * 0.19);
  const totalFinal = netoFacturable + iva;
  const unidadesTotales = envios.reduce((s, e) => s + e.detalles.reduce((ss, d) => ss + d.cantidad, 0), 0);
  const pdfUrl = `/api/liquidacion?rut=${encodeURIComponent(rut)}`;

  const handleConfirmar = async () => {
    if (!facturaId.trim()) { alert("Ingresa el N° de factura."); return; }
    setConfirming(true);
    const res = await confirmarLiquidacion(rut, facturaId.trim(), enviarEmail);
    setResult({ emailStatus: res.emailStatus, emailError: res.emailError ?? null });
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-4xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div>
              <h2 className="font-bold text-lg">{cliente?.razonSocial ?? rut}</h2>
              <p className="text-xs text-zinc-500">RUT {rut} · {envios.length} guías pendientes</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Resumen rápido */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Unidades", value: unidadesTotales.toString(), orange: false, red: false },
                { label: "Total despachado", value: fmt(totalDespachado), orange: false, red: false },
                { label: "Mermas", value: mermas.length > 0 ? `-${fmt(totalMerma)}` : "$0", red: mermas.length > 0, orange: false },
                { label: "Neto facturable", value: fmt(netoFacturable), orange: true, red: false },
              ].map((c) => (
                <div key={c.label} className="bg-zinc-800/50 rounded-2xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{c.label}</p>
                  <p className={`font-black text-lg ${c.orange ? "text-orange-400" : c.red ? "text-red-400" : "text-white"}`}>
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabla de guías */}
            <div className="bg-zinc-800/30 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-700 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                <FileText className="w-3.5 h-3.5" /> Guías incluidas
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-700">
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Folio</th>
                      <th className="px-4 py-2 text-left">Sucursal</th>
                      <th className="px-4 py-2 text-right">Unid.</th>
                      <th className="px-4 py-2 text-right">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envios.map((e) => {
                      const neto = e.detalles.reduce((s, d) => s + d.cantidad * d.producto.precioBase, 0);
                      const unid = e.detalles.reduce((s, d) => s + d.cantidad, 0);
                      return (
                        <tr key={e.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                          <td className="px-4 py-2.5 text-zinc-300">{new Date(e.fecha).toLocaleDateString("es-CL")}</td>
                          <td className="px-4 py-2.5"><span className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">#{e.folio}</span></td>
                          <td className="px-4 py-2.5 text-zinc-400">{e.cliente.sucursal ?? e.cliente.razonSocial}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{unid}</td>
                          <td className="px-4 py-2.5 text-right">{fmt(neto)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mermas */}
            {mermas.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-red-500/20 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Mermas / Devoluciones
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-red-500/20">
                        <th className="px-4 py-2 text-left">Fecha</th>
                        <th className="px-4 py-2 text-left">Producto</th>
                        <th className="px-4 py-2 text-right">Cant.</th>
                        <th className="px-4 py-2 text-left">Motivo</th>
                        <th className="px-4 py-2 text-right">Descuento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mermas.map((m) => (
                        <tr key={m.id} className="border-b border-red-500/10">
                          <td className="px-4 py-2.5 text-zinc-300">{new Date(m.fecha).toLocaleDateString("es-CL")}</td>
                          <td className="px-4 py-2.5 text-zinc-400">{m.producto.nombre}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{m.cantidad}</td>
                          <td className="px-4 py-2.5 text-zinc-500 text-xs">{m.motivo ?? "—"}</td>
                          <td className="px-4 py-2.5 text-right text-red-400">-{fmt(m.cantidad * m.producto.precioBase)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total final */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 space-y-2">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Neto facturable</span><span>{fmt(netoFacturable)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>IVA 19%</span><span>{fmt(iva)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-orange-500/20 text-orange-400">
                <span>Total a facturar</span><span>{fmt(totalFinal)}</span>
              </div>
            </div>

            {/* Acciones */}
            {!result ? (
              <div className="space-y-4">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all text-sm"
                >
                  <Eye className="w-4 h-4 text-orange-400" /> Previsualizar PDF de liquidación
                </a>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">
                      N° de Factura <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={facturaId}
                      onChange={(e) => setFacturaId(e.target.value)}
                      placeholder="Ej: 001234"
                      className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enviarEmail}
                      onChange={(e) => setEnviarEmail(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span className="text-sm text-zinc-300">
                      Enviar PDF por email a {cliente?.email ?? "—"}
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleConfirmar}
                  disabled={confirming || !facturaId.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] text-base"
                >
                  {confirming
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                    : <><Receipt className="w-5 h-5" /> Confirmar Liquidación</>}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-4">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold">Liquidación confirmada — Factura N° {facturaId}</p>
                    {result.emailStatus === "sent" && <p className="text-xs text-emerald-300 mt-0.5">Email enviado correctamente</p>}
                    {result.emailStatus === "no_email" && <p className="text-xs text-amber-400 mt-0.5">Sin email configurado</p>}
                    {result.emailStatus === "error" && <p className="text-xs text-red-400 mt-0.5">Error al enviar email: {result.emailError}</p>}
                    {result.emailStatus === "skipped" && <p className="text-xs text-zinc-400 mt-0.5">Email no solicitado</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`/api/liquidacion?rut=${encodeURIComponent(rut)}&facturaId=${encodeURIComponent(facturaId)}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl text-sm transition-all"
                  >
                    <Eye className="w-4 h-4" /> Ver PDF
                  </a>
                  <button
                    onClick={() => { onConfirmado(); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl text-sm transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vista principal ────────────────────────────────────────────────────────

export default function LiquidacionView({ pendienties }: { pendienties: ClientePendiente[] }) {
  const [rutSeleccionado, setRutSeleccionado] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState(pendienties);

  const handleConfirmado = () => {
    setPendientes((prev) => prev.filter((p) => p.rut !== rutSeleccionado));
  };

  return (
    <>
      {rutSeleccionado && (
        <PanelLiquidacion
          rut={rutSeleccionado}
          onClose={() => setRutSeleccionado(null)}
          onConfirmado={handleConfirmado}
        />
      )}

      {pendientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Todo al día</h3>
          <p className="text-zinc-500">No hay guías pendientes de facturar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.map((p) => {
            const hasEmail = p.email && !p.email.startsWith("AUTO-");
            return (
              <div key={p.rut} className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base truncate">{p.razonSocial}</h3>
                      {!hasEmail && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Sin email
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">RUT {p.rut}</p>
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Guías</p>
                      <p className="font-black text-lg">{p.totalGuias}</p>
                    </div>
                    {p.totalMerma > 0 && (
                      <div className="text-center">
                        <p className="text-[10px] text-red-400 uppercase tracking-widest">Merma</p>
                        <p className="font-black text-lg text-red-400">-{fmt(p.totalMerma)}</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Neto</p>
                      <p className="font-black text-lg">{fmt(p.netoFacturable)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-orange-400 uppercase tracking-widest">Total c/IVA</p>
                      <p className="font-black text-xl text-orange-400">{fmt(p.totalConIva)}</p>
                    </div>
                    <button
                      onClick={() => setRutSeleccionado(p.rut)}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 text-sm"
                    >
                      Liquidar <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
