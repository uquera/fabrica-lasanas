import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTmConfig, getTmTiendas } from "@/actions/timemarket";
import ConfigView from "./ConfigView";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const [config, tiendas] = await Promise.all([getTmConfig(), getTmTiendas()]);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/timemarket" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 mb-6 text-sm"><ArrowLeft size={16} /> Volver a Time Market</Link>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Precios y <span className="text-orange-500">tiendas</span></h1>
        <p className="text-zinc-500 text-sm mb-8">Los precios se congelan en cada guía al crearla; cambiarlos aquí afecta solo a las guías nuevas.</p>
        <ConfigView config={config} tiendas={tiendas} />
      </div>
    </div>
  );
}
