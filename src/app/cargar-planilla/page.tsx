"use client";

import { useState, useRef } from "react";
import { type PlanillaData, type PlanillaRow } from "@/actions/ocr-gemini";
import { procesarPlanilla, type EnvioCreado } from "@/actions/planilla";
import { enviarGuia } from "@/actions/envios";
import {
  Upload, Camera, CheckCircle2, Loader2, ArrowLeft, Edit3,
  FileImage, Send, Mail, Sparkles, FileText, Eye
} from "lucide-react";
import Link from "next/link";

export default function CargarPlanillaPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [data, setData] = useState<PlanillaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [result, setResult] = useState<{ enviosCreados: number; mermasCreadas: number; envios: EnvioCreado[] } | null>(null);
  const [emailStatuses, setEmailStatuses] = useState<Record<string, "idle" | "sending" | "sent" | "no_email" | "error">>({});
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Convert to base64 for server
    const base64Reader = new FileReader();
    base64Reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      // Strip the "data:image/jpeg;base64," prefix
      const base64 = dataUrl.split(",")[1];
      const mime = file.type || "image/jpeg";
      setImageBase64(base64);
      setImageMime(mime);

      setLoading(true);
      setOcrStatus("Enviando imagen a Gemini AI...");
      try {
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: mime }),
        });
        if (res.ok) {
          const parsed = await res.json();
          setData(parsed.rows);
          if (parsed.success) {
            setOcrStatus("¡Análisis completado con IA!");
          } else {
            const errMsg = parsed.ocrError ?? "Error desconocido";
            if (errMsg.includes("429") || errMsg.includes("quota")) {
              setOcrStatus("⚠️ Límite de API alcanzado. Ingresa los datos manualmente.");
            } else {
              setOcrStatus(`⚠️ No se pudo analizar la imagen. Ingresa los datos manualmente.`);
            }
          }
        } else {
          throw new Error("OCR request failed");
        }
      } catch (err) {
        console.error("OCR failed:", err);
        // Fallback: fetch client list from server to allow manual entry
        try {
          const fallback = await fetch("/api/ocr");
          if (fallback.ok) {
            const { emptyRows } = await fallback.json();
            setData(emptyRows);
          }
        } catch {
          // If both calls fail, leave data null so user sees an error
        }
        setOcrStatus("No se pudo analizar la imagen. Por favor, ingresa los datos manualmente.");
      }
      setLoading(false);
    };
    base64Reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const updateCell = (index: number, field: keyof PlanillaRow, value: number) => {
    if (!data) return;
    const newData = [...data];
    (newData[index] as unknown as Record<string, unknown>)[field as string] = value;
    setData(newData);
  };

  const handleSubmit = async () => {
    if (!data) return;
    setSubmitting(true);
    const res = await procesarPlanilla(data, new Date(fecha).toISOString());
    if (res.success) {
      setResult({ enviosCreados: res.enviosCreados!, mermasCreadas: res.mermasCreadas!, envios: res.envios || [] });
    } else {
      alert(res.error);
    }
    setSubmitting(false);
  };

  const handleSendOne = async (envioId: string) => {
    setEmailStatuses((prev) => ({ ...prev, [envioId]: "sending" }));
    const res = await enviarGuia(envioId) as any;
    if (res.success) {
      setEmailStatuses((prev) => ({ ...prev, [envioId]: res.emailStatus ?? "sent" }));
      if (res.emailError) setEmailErrors((prev) => ({ ...prev, [envioId]: res.emailError }));
    } else {
      setEmailStatuses((prev) => ({ ...prev, [envioId]: "error" }));
      setEmailErrors((prev) => ({ ...prev, [envioId]: res.error ?? "Error desconocido" }));
    }
  };

  const resetAll = () => {
    setResult(null);
    setData(null);
    setImagePreview(null);
    setImageBase64(null);
    setEmailStatuses({});
    setEmailErrors({});
    setOcrStatus(null);
  };

  // ========== SUCCESS STATE ==========
  if (result) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-10 pt-16 lg:pt-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Planilla Procesada</h2>
              <p className="text-zinc-500 text-sm">{result.enviosCreados} guías creadas · {result.mermasCreadas} mermas registradas</p>
            </div>
          </div>

          {/* Per-client cards */}
          {result.envios.length > 0 && (
            <div className="space-y-5 mb-6">
              {result.envios.map(({ tienda, envioId }) => {
                const pdfUrl = `/api/guia?envioId=${envioId}`;
                const status = emailStatuses[envioId] ?? "idle";
                return (
                  <div key={envioId} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                      <span className="font-semibold text-sm">{tienda}</span>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Abrir en nueva pestaña
                      </a>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3">
                      {/* PDF preview */}
                      <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-zinc-800">
                        <iframe
                          src={pdfUrl}
                          className="w-full h-[400px] bg-white"
                          title={`Guía de despacho — ${tienda}`}
                        />
                      </div>

                      {/* Send actions */}
                      <div className="p-5 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-orange-500" /> Enviar al cliente
                          </h3>

                          {status === "idle" && (
                            <button
                              onClick={() => handleSendOne(envioId)}
                              className="mt-3 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-sm"
                            >
                              <Send className="w-4 h-4" /> Enviar por email
                            </button>
                          )}

                          {status === "sending" && (
                            <div className="mt-3 flex items-center justify-center gap-2 bg-zinc-800 py-3 rounded-xl text-sm text-zinc-400">
                              <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                            </div>
                          )}

                          {status === "sent" && (
                            <div className="mt-3 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm font-medium">
                              <CheckCircle2 className="w-4 h-4" /> Enviada correctamente
                            </div>
                          )}

                          {status === "no_email" && (
                            <div className="mt-3 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm">
                              Sin email configurado.
                            </div>
                          )}

                          {status === "error" && (
                            <div className="mt-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                              Error: {emailErrors[envioId]}
                              <button onClick={() => handleSendOne(envioId)} className="block mt-2 text-xs underline hover:text-red-300">
                                Reintentar
                              </button>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={resetAll} className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 font-bold transition-colors text-center">
              Cargar otra planilla
            </button>
            <Link href="/reportes" className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-center transition-colors">
              Ver Reporte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ========== UPLOAD STATE ==========
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[-5%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold tracking-tight">Cargar <span className="text-orange-500">Planilla</span></h1>
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gemini AI
            </span>
          </div>
          <p className="text-zinc-500">Sube una foto de tu guía de despacho y Gemini AI extraerá los datos automáticamente.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Zone */}
          <div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all min-h-[300px] flex flex-col items-center justify-center ${
                imagePreview ? "border-orange-500/30 bg-orange-500/5" : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/30"
              }`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-[400px] rounded-2xl object-contain" />
              ) : (
                <>
                  <div className="p-4 bg-zinc-800 rounded-2xl mb-4"><Camera className="w-8 h-8 text-zinc-500" /></div>
                  <p className="text-zinc-400 font-medium mb-1">Arrastra una imagen aquí</p>
                  <p className="text-zinc-600 text-sm">o haz clic para seleccionar</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            <div className="mt-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2 block">Fecha del Despacho</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center bg-zinc-900/30 rounded-3xl border border-purple-500/20 p-8">
              <div className="relative mb-6">
                <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
              </div>
              <p className="text-zinc-300 font-bold text-lg mb-1">Analizando con Gemini AI</p>
              <p className="text-zinc-600 text-sm text-center">{ocrStatus || "Procesando imagen..."}</p>
            </div>
          )}

          {!loading && !data && (
            <div className="flex flex-col justify-center bg-zinc-900/20 rounded-3xl border-2 border-dashed border-zinc-800 p-8">
              <div className="flex items-center gap-3 mb-4">
                <FileImage className="w-6 h-6 text-zinc-600" />
                <h3 className="text-lg font-bold text-zinc-400">¿Cómo funciona?</h3>
              </div>
              <ol className="space-y-3 text-sm text-zinc-500 list-decimal list-inside">
                <li>Sube la foto de tu guía de despacho</li>
                <li className="text-purple-400 font-medium">Gemini AI lee e interpreta los números automáticamente</li>
                <li>Revisa y corrige los valores si es necesario</li>
                <li>Confirma para registrar envíos y mermas</li>
                <li className="text-blue-400 font-medium">Envía las guías PDF por email automáticamente</li>
              </ol>
            </div>
          )}

          {!loading && ocrStatus && data && (
            <div className="flex items-center gap-2 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 self-start mt-4 lg:col-start-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <p className="text-sm text-purple-300">{ocrStatus}</p>
            </div>
          )}
        </div>

        {/* Editable Table */}
        {data && !loading && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-xl"><Edit3 className="w-5 h-5 text-orange-500" /></div>
              <div>
                <h2 className="text-xl font-bold">Revisión de Datos</h2>
                <p className="text-zinc-500 text-sm">Corrige los valores detectados si es necesario.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="py-3 px-2 text-left text-xs font-bold uppercase tracking-widest text-zinc-600" rowSpan={2}>Tienda</th>
                    <th className="py-2 px-2 text-center text-xs font-bold uppercase tracking-widest text-orange-500 border-b border-zinc-800" colSpan={2}>Entrega</th>
                    <th className="py-2 px-2 text-center text-xs font-bold uppercase tracking-widest text-red-500 border-b border-zinc-800" colSpan={2}>Devolución</th>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <th className="py-2 px-2 text-center text-[10px] font-bold uppercase text-zinc-500">Ind. 550g</th>
                    <th className="py-2 px-2 text-center text-[10px] font-bold uppercase text-zinc-500">Mini 200g</th>
                    <th className="py-2 px-2 text-center text-[10px] font-bold uppercase text-zinc-500">Ind. 550g</th>
                    <th className="py-2 px-2 text-center text-[10px] font-bold uppercase text-zinc-500">Mini 200g</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.tienda} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-2 font-semibold text-white whitespace-nowrap">{row.tienda}</td>
                      {(["entregaIndividual", "entregaMini", "devolucionIndividual", "devolucionMini"] as const).map((field) => (
                        <td key={field} className="py-3 px-2 text-center">
                          <input type="number" min="0" value={row[field]}
                            onChange={(e) => updateCell(i, field, Math.max(0, parseInt(e.target.value) || 0))}
                            className={`w-16 text-center bg-black border rounded-lg py-2 px-1 focus:outline-none transition-colors font-mono text-lg ${
                              field.startsWith("devolucion") ? "border-red-900/30 focus:border-red-500/50 text-red-400" : "border-zinc-800 focus:border-orange-500/50 text-orange-400"
                            }`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-zinc-800/20 font-bold">
                    <td className="py-3 px-2 text-zinc-400">TOTAL</td>
                    <td className="py-3 px-2 text-center text-orange-500 font-mono">{data.reduce((s, r) => s + r.entregaIndividual, 0)}</td>
                    <td className="py-3 px-2 text-center text-orange-500 font-mono">{data.reduce((s, r) => s + r.entregaMini, 0)}</td>
                    <td className="py-3 px-2 text-center text-red-500 font-mono">{data.reduce((s, r) => s + r.devolucionIndividual, 0)}</td>
                    <td className="py-3 px-2 text-center text-red-500 font-mono">{data.reduce((s, r) => s + r.devolucionMini, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full mt-8 bg-orange-500 disabled:opacity-50 hover:bg-orange-600 text-black font-bold py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3 text-lg active:scale-[0.98]">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><Upload className="w-5 h-5" /> Confirmar y Registrar Despacho</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
