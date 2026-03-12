"use client";

import { useState } from "react";
import { registrarLiquidacion, type LiquidacionPendiente } from "@/actions/liquidacionesFinal";
import { Calculator, Package, AlertTriangle, TrendingUp, CheckCircle, Loader2, DollarSign } from "lucide-react";

const PRECIO_NETO = 6000;

export default function LiquidacionView({ pendienties }: { pendienties: LiquidacionPendiente[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cantidadMerma, setCantidadMerma] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const selected = pendienties.find(p => p.envioId === selectedId);

  // Calculations
  const unidadesEnviadas = selected?.unidadesEnviadas || 0;
  const ventaBruta = unidadesEnviadas * PRECIO_NETO;
  const ventaEfectivaUnid = Math.max(0, unidadesEnviadas - cantidadMerma);
  const ventaEfectivaTotal = ventaEfectivaUnid * PRECIO_NETO;
  const totalEfectivo = ventaEfectivaTotal;

  const handleConfirm = async () => {
    if (!selectedId) return;
    setLoading(true);
    const res = await registrarLiquidacion(selectedId, cantidadMerma);
    if (res.success) {
      alert("Liquidación registrada con éxito.");
      window.location.reload();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List of Pending Deliveries */}
      <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-xl font-bold mb-4 sticky top-0 bg-[#0a0a0a] py-2 z-10">Despachos Pendientes</h2>
        {pendienties.length === 0 && (
          <p className="text-zinc-500 italic text-center py-10">No hay despachos pendientes de cierre.</p>
        )}
        {pendienties.map((p) => (
          <button
            key={p.envioId}
            onClick={() => {
                setSelectedId(p.envioId);
                setCantidadMerma(0);
            }}
            className={`w-full text-left p-6 rounded-3xl border transition-all ${
              selectedId === p.envioId
                ? "bg-orange-500/10 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {new Date(p.fecha).toLocaleDateString("es-CL")}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                selectedId === p.envioId ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-400"
              }`}>
                ABIERTO
              </span>
            </div>
            <p className="font-bold text-lg mb-1">{p.cliente.razonSocial}</p>
            <p className="text-sm text-zinc-500 mb-3">{p.cliente.direccion}</p>
            <div className="flex items-center gap-2 text-orange-500 font-mono text-sm">
              <Package className="w-4 h-4" />
              <span>{p.unidadesEnviadas} Unidades</span>
            </div>
          </button>
        ))}
      </div>

      {/* settlement logic */}
      <div className="lg:col-span-2">
        {selected ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Calculator className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="mb-10">
                <h2 className="text-3xl font-bold mb-2">Liquidación de Venta</h2>
                <p className="text-zinc-500">Registra las mermas y cierra la facturación de este despacho.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                {/* Despacho (Left side) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500/10 rounded-xl"><Package className="w-5 h-5 text-orange-500" /></div>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Datos de Despacho</h3>
                  </div>
                  <div className="p-6 bg-black/40 rounded-3xl border border-zinc-800/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-zinc-500 text-sm">Unidades Enviadas:</span>
                        <span className="text-xl font-bold text-orange-500">{unidadesEnviadas}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400 text-sm italic">
                        <span>Precio Unit. (6000):</span>
                        <span>${ventaBruta.toLocaleString("es-CL")}</span>
                    </div>
                  </div>
                </div>

                {/* Retiro / Merma (Center-ish) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Retiros / Mermas</h3>
                  </div>
                  <div className="p-6 bg-black/40 rounded-3xl border border-red-500/20">
                    <label className="block text-zinc-500 text-sm mb-3">Cantidad de mermas retiradas:</label>
                    <input 
                      type="number" 
                      min="0"
                      max={unidadesEnviadas}
                      value={cantidadMerma}
                      onChange={(e) => setCantidadMerma(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 text-2xl font-mono text-center focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Result / Effective (Right side in concept) */}
              <div className="bg-gradient-to-br from-zinc-800/30 to-black p-8 rounded-[32px] border border-zinc-700/50">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-emerald-500/10 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-500" /></div>
                  <h3 className="text-xl font-bold">Venta Efectiva</h3>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                        <span className="text-zinc-400">Resumen Unidades ({unidadesEnviadas} - {cantidadMerma})</span>
                        <span className="font-bold text-lg">{ventaEfectivaUnid} Uni.</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Subtotal Neto (Venta Efectiva)</span>
                        <span className="font-mono text-emerald-500 font-bold text-xl">${ventaEfectivaTotal.toLocaleString("es-CL")}</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">Total a Facturar</p>
                        <p className="text-5xl font-black text-white">${totalEfectivo.toLocaleString("es-CL")}</p>
                    </div>

                    <button 
                      onClick={handleConfirm}
                      disabled={loading}
                      className="w-full md:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(16,185,129,0.2)] active:scale-[0.98]"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle className="w-6 h-6" /> Cerrar Liquidación</>}
                    </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-zinc-900/10 border-2 border-dashed border-zinc-800 rounded-[40px] p-20 text-center">
            <div className="p-6 bg-zinc-900 rounded-3xl mb-6 shadow-xl"><Calculator className="w-12 h-12 text-zinc-700" /></div>
            <h3 className="text-2xl font-bold text-zinc-500 mb-2">Selecciona un despacho</h3>
            <p className="text-zinc-600 max-w-sm">Elige un despacho de la lista de la izquierda para realizar el cuadre y cierre de venta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
