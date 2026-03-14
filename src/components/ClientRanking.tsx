"use client";

import { useState } from "react";
import { Medal } from "lucide-react";

export type RankingClient = {
  id: string;
  razonSocial: string;
  revenue: number;
  despachos: number;
  mermas: number;
};

type SortKey = "revenue" | "despachos" | "mermas";

const fmtCLP = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "revenue",   label: "Ventas" },
  { id: "despachos", label: "Despachos" },
  { id: "mermas",    label: "Mermas" },
];

const MEDAL_COLORS = ["text-yellow-400", "text-zinc-400", "text-orange-700"];

export default function ClientRanking({ clients }: { clients: RankingClient[] }) {
  const [sort, setSort] = useState<SortKey>("revenue");

  const sorted = [...clients].sort((a, b) => b[sort] - a[sort]);
  const maxVal = Math.max(sorted[0]?.[sort] ?? 1, 1);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="font-semibold text-sm text-white flex items-center gap-2">
          <Medal className="w-4 h-4 text-zinc-500" />
          Ranking de clientes
        </h2>
        <div className="flex bg-zinc-800 rounded-xl p-0.5 gap-0.5">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setSort(o.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                sort === o.id
                  ? "bg-orange-500 text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-zinc-800/40">
        {sorted.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-10">Sin datos en el período</p>
        )}
        {sorted.map((c, i) => {
          const val    = c[sort];
          const pct    = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isZero = val === 0;

          return (
            <div key={c.id} className="px-5 py-3 hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center gap-3">
                {/* Rank badge */}
                <span className={`text-sm font-black w-5 text-center shrink-0 ${
                  i < 3 && !isZero ? MEDAL_COLORS[i] : "text-zinc-700"
                }`}>
                  {i + 1}
                </span>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white truncate">{c.razonSocial}</p>
                    <p className={`text-xs font-bold shrink-0 ml-2 ${
                      sort === "mermas" ? "text-red-400" : "text-orange-400"
                    }`}>
                      {sort === "revenue" ? fmtCLP(val) : val}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isZero ? "" : sort === "mermas" ? "bg-red-500/60" : "bg-orange-500/60"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Sub-metrics */}
                  <div className="flex gap-3 mt-1 text-[10px] text-zinc-600">
                    {sort !== "despachos" && <span>{c.despachos} despachos</span>}
                    {sort !== "revenue"   && <span>{fmtCLP(c.revenue)}</span>}
                    {sort !== "mermas" && c.mermas > 0 && <span className="text-red-600">{c.mermas} mermas</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
