import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Clock, Mail, Download } from "lucide-react";
import GenerarGuiaButton from "@/components/GenerarGuiaButton";
import EliminarEnvioButton from "@/components/EliminarEnvioButton";

export default async function GuiasPage() {
  const envios = await (prisma.envio as any).findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cliente: { select: { razonSocial: true, email: true } },
      detalles: {
        include: { producto: { select: { nombre: true } } },
      },
    },
  });

  const enviadas = envios.filter((e: any) => e.guiaDespacho);
  const pendientes = envios.filter((e: any) => !e.guiaDespacho);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Historial de <span className="text-orange-500">Guías</span></h1>
          <p className="text-zinc-500">Registro de todas las guías de despacho generadas y enviadas.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-orange-500">{envios.length}</p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Total envíos</p>
          </div>
          <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-emerald-500">{enviadas.length}</p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Guías enviadas</p>
          </div>
          <div className="bg-zinc-900/50 border border-amber-500/20 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-amber-500">{pendientes.length}</p>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Sin guía</p>
          </div>
        </div>

        {/* Guías enviadas */}
        {enviadas.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Guías Enviadas ({enviadas.length})
              <div className="h-[1px] flex-grow bg-zinc-800/50" />
            </h2>
            <div className="space-y-3">
              {enviadas.map((envio: any) => (
                <div key={envio.id} className="bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/30 rounded-2xl p-5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <FileText className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-emerald-400">{envio.guiaDespacho}</span>
                          <span className="text-zinc-600">·</span>
                          <span className="font-semibold text-white">{envio.cliente.razonSocial}</span>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {envio.detalles.map((d: any) => `${d.cantidad} × ${d.producto.nombre}`).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-zinc-600">{new Date(envio.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        {envio.cliente.email && (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <Mail className="w-3 h-3 text-zinc-600" />
                            <span className="text-xs text-zinc-600">{envio.cliente.email}</span>
                          </div>
                        )}
                      </div>
                      <a
                        href={`/api/guia?envioId=${envio.id}`}
                        target="_blank"
                        className="p-2 bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-xl transition-all text-zinc-400"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pendientes sin guía */}
        {pendientes.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Sin Guía Generada ({pendientes.length})
              <div className="h-[1px] flex-grow bg-zinc-800/50" />
            </h2>
            <div className="space-y-3">
              {pendientes.map((envio: any) => (
                <div key={envio.id} className="bg-zinc-900/40 border border-zinc-800 hover:border-amber-500/20 rounded-2xl p-5 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-amber-500/10 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-white mb-1">{envio.cliente.razonSocial}</p>
                        <p className="text-sm text-zinc-500">
                          {envio.detalles.map((d: any) => `${d.cantidad} × ${d.producto.nombre}`).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-xs text-zinc-600">{new Date(envio.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      <GenerarGuiaButton envioId={envio.id} />
                      <EliminarEnvioButton envioId={envio.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {envios.length === 0 && (
          <div className="text-center py-20 text-zinc-600">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No hay envíos registrados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
