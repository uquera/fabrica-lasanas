import { getMermas } from "@/actions/mermas";
import { getClientes } from "@/actions/clientes";
import { getProductos } from "@/actions/productos";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MermasView from "./MermasView";

export const dynamic = "force-dynamic";

export default async function MermasPage() {
  const [mermas, clientes, productos, envios] = await Promise.all([
    getMermas(),
    getClientes(),
    getProductos(),
    (prisma.envio as any).findMany({
      orderBy: { fecha: "desc" },
      select: { id: true, folio: true, fecha: true, clienteId: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Gestión de <span className="text-red-500">Mermas</span>
            </h1>
            <p className="text-zinc-500">Registra productos devueltos o dañados para ajustar el inventario y venta neta.</p>
          </div>
        </div>

        <MermasView
          mermas={mermas as any}
          clientes={clientes}
          productos={productos as any}
          envios={envios}
        />
      </div>
    </div>
  );
}
