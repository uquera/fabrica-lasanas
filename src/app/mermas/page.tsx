import { getMermas, createMerma, deleteMerma } from "@/actions/mermas";
import { getClientes } from "@/actions/clientes";
import { getProductos } from "@/actions/productos";
import Link from "next/link";
import { Trash2, Plus, ArrowLeft, ShieldAlert, History, User, Package } from "lucide-react";

export default async function MermasPage() {
  const [mermas, clientes, productos] = await Promise.all([
    getMermas(),
    getClientes(),
    getProductos(),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      {/* Background Decorative Elem */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Gestión de <span className="text-red-500">Mermas</span></h1>
            <p className="text-zinc-500">Registra productos devueltos o dañados para ajustar el inventario y venta neta.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form Card */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold">Registrar Merma</h2>
              </div>

              <form action={async (fd) => { "use server"; await createMerma(fd); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Cliente</label>
                  <select 
                    name="clienteId" 
                    required 
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                  >
                    <option value="">Selecciona cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.razonSocial}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Producto</label>
                  <select 
                    name="productoId" 
                    required 
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                  >
                    <option value="">Selecciona producto...</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Cantidad</label>
                  <input 
                    name="cantidad" 
                    type="number"
                    min="1"
                    required 
                    placeholder="Ejem: 5"
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Motivo / Observación</label>
                  <textarea 
                    name="motivo" 
                    placeholder="Ejem: Empaque dañado, producto vencido..."
                    className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-colors text-sm min-h-[100px]"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] mt-4 active:scale-[0.98]"
                >
                  Confirmar Registro
                </button>
              </form>
            </div>
          </div>

          {/* History List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600 ml-1 mb-4 flex items-center gap-2">
              Historial de Mermas ({mermas.length})
              <div className="h-[1px] flex-grow bg-zinc-800/50" />
            </h2>
            
            {mermas.length === 0 ? (
              <div className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center">
                <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600 font-medium">No hay registros de mermas todavía.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {mermas.map((merma) => (
                  <div 
                    key={merma.id} 
                    className="group bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:bg-red-500/5 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                          {new Date(merma.fecha).toLocaleDateString('es-CL')}
                        </span>
                        <span className="text-red-500 font-bold">-{merma.cantidad} unidades</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <User className="w-4 h-4 text-zinc-500" />
                          <span className="font-semibold">{merma.cliente.razonSocial}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Package className="w-4 h-4 text-zinc-500" />
                          <span>{merma.producto.nombre}</span>
                        </div>
                      </div>

                      {merma.motivo && (
                        <div className="p-3 bg-black/40 rounded-xl text-xs text-zinc-500 italic">
                          "{merma.motivo}"
                        </div>
                      )}
                    </div>
                    
                    <form action={async () => { "use server"; await deleteMerma(merma.id); }}>
                      <button 
                        className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
