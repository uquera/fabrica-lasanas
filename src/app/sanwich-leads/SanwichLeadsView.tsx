"use client";

import { useMemo, useState } from "react";
import { Download, Search, MessageCircle, Users, CalendarClock } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  code: string;
  reward: string;
  redeemed: boolean;
  createdAt: string;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function waLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function SanwichLeadsView({ leads }: { leads: Lead[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(t) ||
        l.phone.includes(t) ||
        l.code.toLowerCase().includes(t)
    );
  }, [q, leads]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return leads.filter((l) => new Date(l.createdAt).toDateString() === today).length;
  }, [leads]);

  function exportCsv() {
    const header = ["Nombre", "WhatsApp", "Código", "Recompensa", "Canjeado", "Fecha"];
    const lines = filtered.map((l) =>
      [l.name, l.phone, l.code, l.reward, l.redeemed ? "Sí" : "No", fmtDate(l.createdAt)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-sandwich-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">
            <Users className="w-4 h-4" /> Total leads
          </div>
          <p className="text-3xl font-bold tabular-nums">{leads.length}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">
            <CalendarClock className="w-4 h-4" /> Hoy
          </div>
          <p className="text-3xl font-bold tabular-nums text-orange-500">{todayCount}</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">
            <Download className="w-4 h-4" /> Exportar
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
              bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/25
              disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            <Download className="w-4 h-4" /> CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, WhatsApp o código…"
          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm
            text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wide border-b border-zinc-800">
                <th className="text-left font-medium px-4 py-3">Nombre</th>
                <th className="text-left font-medium px-4 py-3">WhatsApp</th>
                <th className="text-left font-medium px-4 py-3">Código</th>
                <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-600">
                    {leads.length === 0
                      ? "Aún no hay leads. Cuando alguien reclame su cupón, aparecerá aquí."
                      : "Sin resultados para tu búsqueda."}
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-100">{l.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={waLink(l.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {l.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-md px-2 py-0.5 text-xs">
                      {l.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap tabular-nums">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
