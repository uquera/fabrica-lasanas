import { getProductos } from "@/actions/productos";
import Link from "next/link";
import { Package, ArrowLeft, Tag, Info, CheckCircle2 } from "lucide-react";

export default async function ProductosPage() {
  const productos = await getProductos();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      {/* Background Decorative Elem */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-orange-600/20 rounded-full blur-[100px]" />
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">Catálogo de <span className="text-orange-500">Productos</span></h1>
            <p className="text-zinc-500">Gestión de stock y precios de lasañas comercializadas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-xl">
                  <Info className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold">Resumen</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-black/40 border border-zinc-800 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">Precios</p>
                  <p className="text-sm text-zinc-400">Todos los precios mostrados incluyen **IVA (19%)** por defecto, según requerimiento.</p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">Estado de Carga</p>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Producto base configurado
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 opacity-50">
                    <CheckCircle2 className="w-4 h-4" /> Gestión de variantes (Próximamente)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600 ml-1 mb-4 flex items-center gap-2">
              Productos en Sistema ({productos.length})
              <div className="h-[1px] flex-grow bg-zinc-800/50" />
            </h2>
            
            <div className="grid gap-6">
              {productos.map((producto) => (
                <div 
                  key={producto.id} 
                  className="group bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 hover:border-orange-500/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Package className="w-24 h-24" />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                      <span className="inline-block px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {producto.sku}
                      </span>
                      <h3 className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                        {producto.nombre}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Formato Individual</span>
                        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                        <span className="text-green-500 font-medium">En Venta</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1">Precio Unitario</p>
                      <p className="text-3xl font-black text-orange-500">
                        ${producto.precioBase.toLocaleString("es-CL")}
                        <span className="text-xs text-zinc-500 font-normal ml-1">CLP</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
