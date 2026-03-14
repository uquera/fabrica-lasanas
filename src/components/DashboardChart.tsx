"use client";

import { useState } from "react";
import { BarChart2, TrendingUp } from "lucide-react";

export type ChartPoint = { date: string; count: number; revenue: number };

const fmtCLP = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
const fmtDate = (s: string) => {
  const [, m, d] = s.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
};

export default function DashboardChart({ data }: { data: ChartPoint[] }) {
  const [mode, setMode]       = useState<"count" | "revenue">("revenue");
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center justify-center h-48">
        <p className="text-zinc-600 text-sm">Sin datos para el período seleccionado</p>
      </div>
    );
  }

  const values = data.map((d) => (mode === "count" ? d.count : d.revenue));
  const max    = Math.max(...values, 1);
  const total  = values.reduce((a, b) => a + b, 0);

  // Decide how many X-axis labels to show
  const labelStep = data.length <= 7 ? 1 : data.length <= 14 ? 2 : data.length <= 31 ? 5 : 7;

  const BAR_H   = 80;
  const LABEL_H = 18;
  const SVG_H   = BAR_H + LABEL_H;
  const barGap  = 3;
  const barW    = Math.max(6, Math.floor((600 - barGap * data.length) / data.length));
  const SVG_W   = (barW + barGap) * data.length;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="font-semibold text-sm text-white flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-500" />
          Actividad del período
        </h2>
        <div className="flex bg-zinc-800 rounded-xl p-0.5 gap-0.5">
          <button
            onClick={() => setMode("revenue")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === "revenue" ? "bg-orange-500 text-black" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Ingresos
          </button>
          <button
            onClick={() => setMode("count")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === "count" ? "bg-orange-500 text-black" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <BarChart2 className="w-3 h-3" /> Despachos
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3">
        {/* Tooltip / summary */}
        <div className="mb-3 min-h-[36px]">
          {hovered !== null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-orange-400">
                {mode === "revenue" ? fmtCLP(values[hovered]) : values[hovered]}
              </span>
              <span className="text-xs text-zinc-500">
                {mode === "revenue" ? "con IVA" : "despachos"} · {fmtDate(data[hovered].date)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white">
                {mode === "revenue" ? fmtCLP(total) : total}
              </span>
              <span className="text-xs text-zinc-500">
                {mode === "revenue" ? "total c/IVA en el período" : "despachos en el período"}
              </span>
            </div>
          )}
        </div>

        {/* SVG Chart */}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ minWidth: `${Math.min(SVG_W, 300)}px`, height: `${SVG_H + 4}px` }}
            onMouseLeave={() => setHovered(null)}
          >
            {data.map((d, i) => {
              const v    = values[i];
              const h    = Math.max(2, (v / max) * BAR_H);
              const x    = i * (barW + barGap);
              const y    = BAR_H - h;
              const isHov = hovered === i;
              const showLabel = i % labelStep === 0;

              return (
                <g key={i}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx={Math.min(3, barW / 2)}
                    fill={isHov ? "#f97316" : v === 0 ? "#27272a" : "#f97316"}
                    opacity={v === 0 ? 0.3 : isHov ? 1 : 0.6}
                    style={{ cursor: "pointer", transition: "opacity 0.1s" }}
                    onMouseEnter={() => setHovered(i)}
                  />
                  {/* X label */}
                  {showLabel && (
                    <text
                      x={x + barW / 2}
                      y={SVG_H - 2}
                      textAnchor="middle"
                      fontSize="8"
                      fill={isHov ? "#f97316" : "#52525b"}
                      fontFamily="monospace"
                    >
                      {fmtDate(d.date)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
