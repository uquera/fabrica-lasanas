import { getLiquidacionesPendientes } from "@/actions/liquidacionesFinal";
import LiquidacionView from "@/components/Liquidaciones/LiquidacionView";
import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";

export default async function LiquidacionesPage() {
  const pendientes = await getLiquidacionesPendientes();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[30%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2 text-orange-500">
               <Calculator className="w-6 h-6" />
               <span className="text-xs font-bold uppercase tracking-widest">Finanzas & Control</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">Cierre de <span className="text-orange-500">Ventas</span></h1>
            <p className="text-zinc-500 mt-2 text-lg">Control de depachos vs retiros para liquidación mensual.</p>
          </div>
        </div>

        <LiquidacionView pendienties={pendientes} />
      </div>
    </div>
  );
}
