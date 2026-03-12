"use client";

import { useState } from "react";
import { createEnvio } from "@/actions/envios";
import { Package, User, Plus, Trash2, Send, ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NuevoEnvio({ clientes, productos }: { clientes: any[], productos: any[] }) {
  const [selectedCliente, setSelectedCliente] = useState("");
  const [items, setItems] = useState<{ productoId: string, cantidad: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addItem = () => {
    if (productos.length > 0) {
      setItems([...items, { productoId: productos[0].id, cantidad: 1 }]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append("clienteId", selectedCliente);
    
    const result = await createEnvio(formData, items);

    if (result.success) {
      if (result.emailStatus === "sent") {
        alert("✓ Envío registrado y guía enviada por email.");
      } else if (result.emailStatus === "no_email") {
        alert("Envío registrado. El cliente no tiene email configurado.");
      } else if (result.emailStatus === "error") {
        alert(`Envío registrado, pero hubo un error al enviar el email: ${result.emailError}`);
      } else {
        alert("Envío registrado con éxito.");
      }
      router.push("/");
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Nuevo <span className="text-orange-500">Despacho</span></h1>
          <p className="text-zinc-500">Genera una guía de despacho y notifica al cliente.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cliente Selection */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-xl"><User className="w-5 h-5 text-orange-500" /></div>
              <h2 className="text-xl font-bold">Seleccionar Cliente</h2>
            </div>
            
            <select 
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-4 focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razonSocial} ({c.rut})</option>
              ))}
            </select>
          </div>

          {/* Items Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-xl"><Package className="w-5 h-5 text-orange-500" /></div>
                <h2 className="text-xl font-bold">Productos a Despachar</h2>
              </div>
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar Item
              </button>
            </div>

            <div className="space-y-4">
              {items.length === 0 && (
                <p className="text-center py-8 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl">
                  Agrega productos para generar el despacho.
                </p>
              )}
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-grow space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 ml-1">Producto</label>
                    <select 
                      value={item.productoId}
                      onChange={(e) => updateItem(index, "productoId", e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors text-sm"
                    >
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} - ${p.precioBase.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 ml-1">Cantidad</label>
                    <input 
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => updateItem(index, "cantidad", parseInt(e.target.value) || 1)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors text-sm"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-3 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all mb-0.5"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !selectedCliente || items.length === 0}
            className="w-full bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 text-black font-bold py-6 rounded-3xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3 text-xl active:scale-[0.98]"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Generando PDF y enviando guía...</>
            ) : (
              <>
                Confirmar Despacho y Enviar Guía
                <Send className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
