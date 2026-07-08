import { getSanwichLeads } from "@/actions/sanwich";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SanwichLeadsView } from "./SanwichLeadsView";

export const dynamic = "force-dynamic";

export default async function SanwichLeadsPage() {
  const leads = await getSanwichLeads();

  const rows = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    code: l.code,
    reward: l.reward,
    redeemed: l.redeemed,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-orange-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-orange-500 text-xs font-semibold tracking-widest uppercase mb-2">
              Campaña estreno nocturno
            </p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Leads <span className="text-orange-500">Sándwich</span>
            </h1>
            <p className="text-zinc-500 text-sm">
              Clientes que reclamaron su cupón 2x1 en{" "}
              <span className="text-zinc-300">donnaany.com/sanwich</span>
            </p>
          </div>
        </div>

        <SanwichLeadsView leads={rows} />
      </div>
    </div>
  );
}
