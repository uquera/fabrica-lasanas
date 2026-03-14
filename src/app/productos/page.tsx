"use client";

import { useEffect, useState } from "react";
import { getProductos, createProducto, updateProducto, deleteProducto } from "@/actions/productos";
import Link from "next/link";
import { Package, ArrowLeft, Plus, Pencil, Save, X, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

type Producto = { id: string; sku: string; nombre: string; precioBase: number; tasaIva: number };

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ nombre: "", sku: "", precioBase: "", tasaIva: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const reload = () => getProductos().then((p) => { setProductos(p as Producto[]); setLoading(false); });

  useEffect(() => { reload(); }, []);

  const startEdit = (p: Producto) => {
    setEditingId(p.id);
    setEditData({
      nombre: p.nombre,
      sku: p.sku,
      precioBase: String(p.precioBase),
      tasaIva: String(Math.round((p.tasaIva ?? 0.19) * 100)),
    });
  };

  const saveEdit = async (id: string) => {
    const precio = parseFloat(editData.precioBase);
    const iva = parseFloat(editData.tasaIva) / 100;
    if (!editData.nombre.trim() || !editData.sku.trim() || isNaN(precio) || precio <= 0 || isNaN(iva)) {
      showToast("Completa todos los campos correctamente.", "error");
      return;
    }
    setSaving(true);
    const result = await updateProducto(id, {
      nombre: editData.nombre.trim(),
      sku: editData.sku.trim().toUpperCase(),
      precioBase: precio,
      tasaIva: iva,
    });
    if (result.success) {
      setProductos(prev => prev.map(p => p.id === id
        ? { ...p, nombre: editData.nombre.trim(), sku: editData.sku.trim().toUpperCase(), precioBase: precio, tasaIva: iva }
        : p));
      setEditingId(null);
      showToast("Producto actualizado correctamente.", "success");
    } else {
      showToast(result.error ?? "Error al guardar.", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const result = await deleteProducto(id);
    if (result.success) {
      setProductos(prev => prev.filter(p => p.id !== id));
      setDeleteId(null);
      showToast("Producto eliminado.", "success");
    } else {
      showToast(result.error ?? "Error al eliminar.", "error");
      setDeleteId(null);
    }
    setSaving(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);
    const result = await createProducto(new FormData(form));
    if (result.success) {
      showToast("Producto agregado al catálogo.", "success");
      form.reset();
      reload();
    } else {
      showToast(result.error ?? "Error al crear.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-orange-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Gestión de <span className="text-orange-500">Productos</span></h1>
            <p className="text-zinc-500">Agrega, edita y elimina productos del catálogo.</p>
          </div>
          <span className="text-zinc-600 text-sm font-mono">{productos.length} producto{productos.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Create form */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-xl"><Plus className="w-5 h-5 text-orange-500" /></div>
                <h2 className="text-xl font-bold">Nuevo Producto</h2>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5 block">Nombre</label>
                  <input
                    name="nombre" required
                    placeholder="Ej: Lasaña familiar"
                    className="w-full bg-black border border-zinc-800 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5 block">SKU</label>
                  <input
                    name="sku" required
                    placeholder="Ej: LAS-FAM-TRD"
                    className="w-full bg-black border border-zinc-800 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-sm font-mono outline-none transition-colors"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5 block">Precio Neto (CLP)</label>
                  <input
                    name="precioBase" type="number" required min="1" step="1"
                    placeholder="5042"
                    className="w-full bg-black border border-zinc-800 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-sm font-mono outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5 block">IVA (%)</label>
                  <input
                    name="tasaIva" type="number" defaultValue="19" min="0" max="100" step="1"
                    className="w-full bg-black border border-zinc-800 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-sm font-mono outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-all mt-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Agregar Producto
                </button>
              </form>
            </div>
          </div>

          {/* Product list */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600 ml-1 mb-4 flex items-center gap-2">
              Catálogo ({productos.length})
              <div className="h-[1px] flex-grow bg-zinc-800/50" />
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-28 bg-zinc-900/40 border border-zinc-800 rounded-3xl animate-pulse" />)}
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-16 text-zinc-600">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay productos. Agrega el primero.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {productos.map((producto) => {
                  const isEditing = editingId === producto.id;
                  const isDeleting = deleteId === producto.id;
                  const tasaIva = producto.tasaIva ?? 0.19;
                  const neto = producto.precioBase;
                  const ivaAmt = Math.round(neto * tasaIva);
                  const total = Math.round(neto + ivaAmt);

                  if (isDeleting) {
                    return (
                      <div key={producto.id} className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6">
                        <p className="text-sm text-red-300 mb-4">
                          ¿Eliminar <strong className="text-white">{producto.nombre}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDelete(producto.id)} disabled={saving}
                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Confirmar eliminación
                          </button>
                          <button onClick={() => setDeleteId(null)} className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm transition-all">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={producto.id} className="group bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 hover:border-orange-500/20 transition-all">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1 block">Nombre</label>
                              <input
                                value={editData.nombre}
                                onChange={e => setEditData(d => ({ ...d, nombre: e.target.value }))}
                                className="w-full bg-black border border-orange-500/40 rounded-xl px-3 py-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1 block">SKU</label>
                              <input
                                value={editData.sku}
                                onChange={e => setEditData(d => ({ ...d, sku: e.target.value.toUpperCase() }))}
                                className="w-full bg-black border border-orange-500/40 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1 block">IVA (%)</label>
                              <input
                                type="number" value={editData.tasaIva}
                                onChange={e => setEditData(d => ({ ...d, tasaIva: e.target.value }))}
                                className="w-full bg-black border border-orange-500/40 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1 block">Precio Neto (CLP)</label>
                              <input
                                type="number" value={editData.precioBase}
                                onChange={e => setEditData(d => ({ ...d, precioBase: e.target.value }))}
                                className="w-full bg-black border border-orange-500/40 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(producto.id)} disabled={saving}
                              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-2 px-4 rounded-xl text-sm transition-all"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Guardar
                            </button>
                            <button onClick={() => setEditingId(null)} className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm transition-all">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <span className="inline-block px-2.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              {producto.sku}
                            </span>
                            <h3 className="text-lg font-bold text-white">{producto.nombre}</h3>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                              <span>Neto ${neto.toLocaleString("es-CL")}</span>
                              <span className="text-zinc-700">+</span>
                              <span>IVA {Math.round(tasaIva * 100)}% (${ivaAmt.toLocaleString("es-CL")})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-black text-orange-500">${total.toLocaleString("es-CL")}</p>
                              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">c / IVA</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => startEdit(producto)}
                                className="p-2 bg-zinc-800 hover:bg-orange-500/20 hover:text-orange-400 rounded-xl transition-all text-zinc-500"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(producto.id)}
                                className="p-2 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all text-zinc-500"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
