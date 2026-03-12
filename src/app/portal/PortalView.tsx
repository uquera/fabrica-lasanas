"use client";

import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import { FileText, LogOut, Package, ChevronDown, Eye } from "lucide-react";
import Image from "next/image";

type Detalle = {
  cantidad: number;
  producto: { nombre: string; precioBase: number; tasaIva: number };
};

type Envio = {
  id: string;
  folio: number | null;
  fecha: string;
  cliente: { razonSocial: string; sucursal: string | null };
  detalles: Detalle[];
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function PortalView({ envios }: { envios: Envio[] }) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth()); // 0-indexed
  const [año, setAño] = useState(now.getFullYear());
  const [descuento, setDescuento] = useState(0);

  // Años disponibles en los datos
  const añosDisponibles = useMemo(() => {
    const set = new Set(envios.map((e) => new Date(e.fecha).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [envios]);

  // Filtrar por mes/año
  const enviosFiltrados = useMemo(() => {
    return envios.filter((e) => {
      const d = new Date(e.fecha);
      return d.getMonth() === mes && d.getFullYear() === año;
    });
  }, [envios, mes, año]);

  // Calcular totales
  const totales = useMemo(() => {
    let unidades = 0;
    let neto = 0;

    for (const envio of enviosFiltrados) {
      for (const det of envio.detalles) {
        unidades += det.cantidad;
        neto += det.cantidad * det.producto.precioBase;
      }
    }

    const netoConDesc = neto * (1 - descuento / 100);
    const iva = netoConDesc * 0.19;
    const total = netoConDesc + iva;
    const ahorroDesc = neto - netoConDesc;

    return { unidades, neto, netoConDesc, iva, total, ahorroDesc };
  }, [enviosFiltrados, descuento]);

  const fmt = (n: number) =>
    n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 relative shrink-0">
            <Image src="/logo.png" alt="Doña Any" fill className="object-contain" unoptimized />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Portal Time Market</p>
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

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Mes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Mes</label>
            <div className="relative">
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="appearance-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-orange-500/50"
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Año */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Año</label>
            <div className="relative">
              <select
                value={año}
                onChange={(e) => setAño(Number(e.target.value))}
                className="appearance-none bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:border-orange-500/50"
              >
                {añosDisponibles.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Descuento */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center justify-between">
              <span>Descuento</span>
              <span className="text-orange-400 font-black text-sm">{descuento}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={descuento}
              onChange={(e) => setDescuento(Number(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        {/* Resumen cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Guías</p>
            <p className="text-2xl font-black">{enviosFiltrados.length}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{MESES[mes]} {año}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Unidades</p>
            <p className="text-2xl font-black">{totales.unidades}</p>
            <p className="text-xs text-zinc-600 mt-0.5">lasañas despachadas</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Neto{descuento > 0 ? ` (-${descuento}%)` : ""}</p>
            <p className="text-xl font-black text-white">{fmt(totales.netoConDesc)}</p>
            {descuento > 0 && (
              <p className="text-xs text-emerald-400 mt-0.5">ahorro {fmt(totales.ahorroDesc)}</p>
            )}
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <p className="text-xs text-orange-400 mb-1">Total c/IVA</p>
            <p className="text-xl font-black text-orange-400">{fmt(totales.total)}</p>
            <p className="text-xs text-zinc-600 mt-0.5">IVA {fmt(totales.iva)}</p>
          </div>
        </div>

        {/* Tabla de guías */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
            <Package className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-sm">Detalle de guías — {MESES[mes]} {año}</h2>
          </div>

          {enviosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-zinc-600 text-sm">
              Sin guías para este período.
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
                    <th className="px-5 py-3 text-right">Neto</th>
                    <th className="px-5 py-3 text-right">Total c/IVA</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {enviosFiltrados.map((envio) => {
                    const netoEnvio = envio.detalles.reduce(
                      (s, d) => s + d.cantidad * d.producto.precioBase, 0
                    );
                    const netoDesc = netoEnvio * (1 - descuento / 100);
                    const totalEnvio = netoDesc * 1.19;
                    const unidadesEnvio = envio.detalles.reduce((s, d) => s + d.cantidad, 0);
                    const producto = envio.detalles[0]?.producto.nombre ?? "—";

                    return (
                      <tr key={envio.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-5 py-3.5 text-zinc-300">
                          {new Date(envio.fecha).toLocaleDateString("es-CL")}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md">
                            #{envio.folio ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300 max-w-[140px] truncate">
                          {envio.cliente.sucursal ?? envio.cliente.razonSocial}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400 text-xs max-w-[160px] truncate">
                          {producto}{envio.detalles.length > 1 ? ` +${envio.detalles.length - 1}` : ""}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold">{unidadesEnvio}</td>
                        <td className="px-5 py-3.5 text-right text-zinc-300">{fmt(netoDesc)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-orange-400">{fmt(totalEnvio)}</td>
                        <td className="px-5 py-3.5">
                          <a
                            href={`/api/guia?envioId=${envio.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totales fila */}
                <tfoot>
                  <tr className="bg-zinc-800/30 font-bold">
                    <td colSpan={4} className="px-5 py-3.5 text-zinc-400 text-xs uppercase tracking-wider">
                      Total {MESES[mes]} {año}{descuento > 0 ? ` · ${descuento}% descuento` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-right">{totales.unidades}</td>
                    <td className="px-5 py-3.5 text-right">{fmt(totales.netoConDesc)}</td>
                    <td className="px-5 py-3.5 text-right text-orange-400">{fmt(totales.total)}</td>
                    <td />
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
