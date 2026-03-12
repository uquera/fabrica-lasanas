import { getClientes, createCliente } from "@/actions/clientes";
import Link from "next/link";
import { Building2, ArrowLeft, UserPlus } from "lucide-react";
import ClienteCard from "./ClienteCard";

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-6 lg:p-12 selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors mb-8 text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Gestión de <span className="text-orange-500">Clientes</span></h1>
          <p className="text-zinc-500">Administra la base de datos de empresas y comercios asociados.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-xl"><UserPlus className="w-5 h-5 text-orange-500" /></div>
                <h2 className="text-xl font-bold">Nuevo Cliente</h2>
              </div>
              <form action={async (formData) => { "use server"; await createCliente(formData); }} className="space-y-4">
                {[
                  { name: "rut", label: "RUT Empresa", placeholder: "76.123.456-7", required: true },
                  { name: "razonSocial", label: "Razón Social", placeholder: "Almacén Don Tito SpA", required: true },
                  { name: "sucursal", label: "Sucursal / Tienda", placeholder: "Tienda Centro, Local 3...", required: false },
                  { name: "giro", label: "Giro", placeholder: "Minimarket", required: true },
                  { name: "direccion", label: "Dirección", placeholder: "Calle Falsa 123, Iquique", required: true },
                  { name: "email", label: "Email para Guías", placeholder: "contacto@tienda.cl", type: "email", required: true },
                ].map((f) => (
                  <div key={f.name} className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 ml-1">
                      {f.label} {!f.required && <span className="text-zinc-700 normal-case font-normal">(opcional)</span>}
                    </label>
                    <input name={f.name} required={f.required} type={f.type || "text"} placeholder={f.placeholder}
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors text-sm" />
                  </div>
                ))}
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] mt-4 active:scale-[0.98]">
                  Registrar Cliente
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600 ml-1 mb-4 flex items-center gap-2">
              Clientes Registrados ({clientes.length})
              <div className="h-[1px] flex-grow bg-zinc-800/50" />
            </h2>
            
            {clientes.length === 0 ? (
              <div className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center">
                <Building2 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600 font-medium">No hay clientes registrados.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clientes.map((cliente) => (
                  <ClienteCard key={cliente.id} cliente={cliente} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
