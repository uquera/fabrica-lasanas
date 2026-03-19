"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, X } from "lucide-react";

const PRESETS = [
  { id: "day",       label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "week",      label: "7 días" },
  { id: "month",     label: "Este mes" },
  { id: "year",      label: "Este año" },
];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const range  = searchParams.get("range") || "month";
  const fromParam = searchParams.get("from") || "";
  const toParam   = searchParams.get("to")   || "";

  const isCustomActive = !searchParams.get("range") && (!!fromParam || !!toParam);

  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(fromParam);
  const [to,   setTo]   = useState(toParam || todayStr());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyPreset = useCallback((id: string) => {
    router.push(`/dashboard?range=${id}`);
  }, [router]);

  const applyCustom = useCallback(() => {
    if (!from || !to) return;
    router.push(`/dashboard?from=${from}&to=${to}`);
    setOpen(false);
  }, [from, to, router]);

  const clearCustom = useCallback(() => {
    setFrom("");
    setTo(todayStr());
    router.push(`/dashboard?range=month`);
  }, [router]);

  const activePreset = PRESETS.find((p) => p.id === range);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Preset pills */}
      <div className="flex bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isCustomActive && range === p.id
                ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range button */}
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            isCustomActive
              ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
              : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 bg-zinc-900/80"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isCustomActive
            ? `${formatDisplayDate(fromParam)} – ${formatDisplayDate(toParam)}`
            : "Personalizado"}
          {isCustomActive ? (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); clearCustom(); }}
              className="ml-1 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          ) : (
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </button>

        {/* Popover */}
        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/60 p-4">
            {/* Arrow */}
            <div className="absolute -top-1.5 right-5 w-3 h-3 bg-zinc-900 border-l border-t border-zinc-700 rotate-45" />

            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
              Rango personalizado
            </p>

            <div className="space-y-3">
              {/* From */}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block font-medium">Desde</label>
                <input
                  type="date"
                  value={from}
                  max={to || todayStr()}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500/60 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* To */}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block font-medium">Hasta</label>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  max={todayStr()}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500/60 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Quick shortcuts inside popover */}
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-600 mb-2 font-medium uppercase tracking-wider">Atajos</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Última semana", days: 7 },
                  { label: "Últimos 15 días", days: 15 },
                  { label: "Últimos 30 días", days: 30 },
                  { label: "Últimos 90 días", days: 90 },
                ].map((s) => {
                  const d = new Date();
                  const f = new Date(d);
                  f.setDate(f.getDate() - s.days);
                  const fStr = f.toISOString().split("T")[0];
                  const tStr = d.toISOString().split("T")[0];
                  return (
                    <button
                      key={s.label}
                      onClick={() => { setFrom(fStr); setTo(tStr); }}
                      className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyCustom}
                disabled={!from || !to}
                className="flex-1 px-3 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-black rounded-xl transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
