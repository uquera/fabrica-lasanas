"use client";

import { useState, useMemo } from "react";
import { createMerma, deleteMerma } from "@/actions/mermas";
import {
  Trash2, ShieldAlert, History, User, Package, DollarSign,
  AlertTriangle, TrendingDown, X, Link2
} from "lucide-react";

type Cliente = { id: string; razonSocial: string };
type Producto = { id: string; nombre: string; precioBase: number; tasaIva: number | null };
type Envio = { id: string; folio: number | null; fecha: Date; clienteId: string };
type Merma = {
  id: string;
  fecha: Date;
  cantidad: number;
  motivo: string | null;
  clienteId: string;
  envioId: string | null;
  cliente: Cliente;
  producto: Producto;
  envio?: Envio | null;
};

const fmtCLP = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
const fmtDate = (d: Date) => new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
const today = () => new Date().toISOString().split("T")[0];

function DeleteButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteMerma(id);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
        title="Eliminar registro"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-80 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-white">Eliminar merma</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm font-medium transition-all"
              >
                Cancelar
              </button>
              <form action={async () => { setLoading(true); await deleteMerma(id); }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "Eliminando..." : "Eliminar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MermasView({
  mermas,
  clientes,
  productos,
  envios,
}: {
  mermas: Merma[];
  clientes: Cliente[];
  productos: Producto[];
  envios: Envio[];
}) {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [formCliente, setFormCliente] = useState("");
  const [pending, setPending] = useState(false);

  // Envíos filtrados por cliente seleccionado en el form
  const enviosFiltrados = useMemo(
    () => envios.filter((e) => !formCliente || e.clienteId === formCliente),
    [envios, formCliente]
  );

  // KPIs
  const kpis = useMemo(() => {
    const totalUnidades = mermas.reduce((s, m) => s + m.cantidad, 0);
    const totalCosto = mermas.reduce((s, m) => {
      const iva = m.producto.tasaIva ?? 0.19;
      return s + m.cantidad * m.producto.precioBase * (1 + iva);
    }, 0);
    const porCliente: Record<string, number> = {};
    for (const m of mermas) {
      porCliente[m.cliente.razonSocial] = (porCliente[m.cliente.razonSocial] ?? 0) + m.cantidad;
    }
    const topCliente = Object.entries(porCliente).sort((a, b) => b[1] - a[1])[0];
    return { totalUnidades, totalCosto, topCliente: topCliente?.[0] ?? "—", topCantidad: topCliente?.[1] ?? 0 };
  }, [mermas]);

  // Mermas filtradas por cliente
  const mermasFiltradas = useMemo(
    () => (filtroCliente ? mermas.filter((m) => m.clienteId === filtroCliente) : mermas),
    [mermas, filtroCliente]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    await createMerma(fd);
    setPending(false);
    (e.target as HTMLFormElement).reset();
    setFormCliente("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* KPI Cards */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2 bg-red-500/10 rounded-xl shrink-0">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Unidades perdidas</p>
            <p className="text-2xl font-black text-white">{kpis.totalUnidades}</p>
            <p className="text-[10px] text-zinc-600">total histórico</p>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2 bg-orange-500/10 rounded-xl shrink-0">
            <DollarSign className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Costo total pérdidas</p>
            <p className="text-2xl font-black text-orange-400">{fmtCLP(kpis.totalCosto)}</p>
            <p className="text-[10px] text-zinc-600">con IVA incluido</p>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Mayor generador</p>
            <p className="text-lg font-black text-white truncate">{kpis.topCliente}</p>
            <p className="text-[10px] text-zinc-600">{kpis.topCantidad} unidades</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/10 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Registrar Merma</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Fecha</label>
              <input
                name="fecha"
                type="date"
                defaultValue={today()}
                required
                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm [color-scheme:dark]"
              />
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Cliente</label>
              <select
                name="clienteId"
                required
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
              >
                <option value="">Selecciona cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.razonSocial}</option>
                ))}
              </select>
            </div>

            {/* Producto */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Producto</label>
              <select
                name="productoId"
                required
                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
              >
                <option value="">Selecciona producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Cantidad</label>
              <input
                name="cantidad"
                type="number"
                min="1"
                required
                placeholder="Ej: 5"
                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
              />
            </div>

            {/* Envío relacionado */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Envío relacionado
                <span className="text-zinc-700 font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <select
                name="envioId"
                disabled={!formCliente}
                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm disabled:opacity-40"
              >
                <option value="">{formCliente ? "Sin envío vinculado" : "Selecciona cliente primero"}</option>
                {enviosFiltrados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.folio ? `Folio #${e.folio}` : "Sin folio"} — {new Date(e.fecha).toLocaleDateString("es-CL")}
                  </option>
                ))}
              </select>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Motivo / Observación</label>
              <textarea
                name="motivo"
                placeholder="Ej: Empaque dañado, producto vencido..."
                className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm min-h-[80px]"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] mt-2 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Registrando..." : "Confirmar Registro"}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2 flex-1">
            <History className="w-3.5 h-3.5" />
            Historial ({mermasFiltradas.length})
            <div className="h-[1px] flex-grow bg-zinc-800/50" />
          </h2>
          <div className="relative">
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-zinc-600 pr-7"
            >
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razonSocial}</option>
              ))}
            </select>
            {filtroCliente && (
              <button
                onClick={() => setFiltroCliente("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {mermasFiltradas.length === 0 ? (
          <div className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center">
            <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 font-medium">No hay registros de mermas.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mermasFiltradas.map((merma) => {
              const iva = merma.producto.tasaIva ?? 0.19;
              const costo = merma.cantidad * merma.producto.precioBase * (1 + iva);
              return (
                <div
                  key={merma.id}
                  className="group bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 hover:bg-red-500/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-grow min-w-0">
                      {/* Top row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                          {fmtDate(merma.fecha)}
                        </span>
                        <span className="text-red-400 font-bold text-sm">-{merma.cantidad} unid.</span>
                        <span className="text-orange-400 font-bold text-sm">{fmtCLP(costo)}</span>
                        {merma.envioId && (
                          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {merma.envio?.folio ? `Folio #${merma.envio.folio}` : "Envío vinculado"}
                          </span>
                        )}
                      </div>

                      {/* Client + product */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <User className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="font-semibold truncate">{merma.cliente.razonSocial}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Package className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="truncate">{merma.producto.nombre}</span>
                        </div>
                      </div>

                      {merma.motivo && (
                        <div className="p-3 bg-black/40 rounded-xl text-xs text-zinc-500 italic">
                          "{merma.motivo}"
                        </div>
                      )}
                    </div>

                    <DeleteButton id={merma.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
