import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function Home() {
  let stats = { clientes: 0, productos: 0, envios: 0, mermas: 0 };

  try {
    const [cCount, pCount, eCount, mCount] = await Promise.all([
      prisma.cliente.count(),
      prisma.producto.count(),
      prisma.envio.count(),
      prisma.merma.count(),
    ]);
    stats = { clientes: cCount, productos: pCount, envios: eCount, mermas: mCount };
  } catch (e) {
    console.error("Error al cargar estadísticas:", e);
  }

  const modules = [
    {
      title: "Gestión de Clientes",
      desc: "Crear, ver y administrar clientes B2B",
      action: "Ver Clientes",
      link: "/clientes",
      icon: "🏢",
      accent: "orange",
    },
    {
      title: "Catálogo de Productos",
      desc: "Visualizar precios y stock disponible",
      action: "Ver Catálogo",
      link: "/productos",
      icon: "🍝",
      accent: "orange",
    },
    {
      title: "Nuevo Despacho",
      desc: "Generar guía de despacho y notificar cliente",
      action: "Crear Envío",
      link: "/envios/nuevo",
      icon: "🚚",
      accent: "orange",
    },
    {
      title: "Cargar Planilla",
      desc: "Sube foto de guía y registra entregas + devoluciones",
      action: "Subir Imagen",
      link: "/cargar-planilla",
      icon: "📷",
      accent: "blue",
    },
    {
      title: "Gestión de Mermas",
      desc: "Registrar devoluciones y productos dañados",
      action: "Registrar",
      link: "/mermas",
      icon: "⚠️",
      accent: "red",
    },
    {
      title: "Cierre de Ventas",
      desc: "Cuadre de despachos vs retiros y liquidación",
      action: "Liquidar Venta",
      link: "/liquidaciones",
      icon: "💰",
      accent: "orange",
    },
    {
      title: "Historial de Guías",
      desc: "Registro de todas las guías de despacho enviadas",
      action: "Ver Guías",
      link: "/guias",
      icon: "📄",
      accent: "emerald",
    },
    {
      title: "Reporte Ventas",
      desc: "Control mensual de venta efectiva y mermas",
      action: "Ver Reporte",
      link: "/reportes",
      icon: "📊",
      accent: "emerald",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold tracking-widest uppercase">
              B2B Manager v0.2
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Fábrica de <br />
            <span className="text-orange-500">Lasañas</span>
          </h1>
          <p className="text-zinc-400 text-lg lg:text-xl max-w-2xl leading-relaxed">
            Sistema centralizado de gestión comercial. Automatiza tus despachos,
            controla mermas y gestiona tu facturación B2B en un solo lugar.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "Clientes", value: stats.clientes, icon: "🏢", color: "from-blue-500/20" },
            { label: "Productos", value: stats.productos, icon: "🍝", color: "from-orange-500/20" },
            { label: "Despachos", value: stats.envios, icon: "🚚", color: "from-emerald-500/20" },
            { label: "Mermas", value: stats.mermas, icon: "⚠️", color: "from-red-500/20" },
          ].map((stat, i) => (
            <div key={i} className="group relative p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative flex flex-col gap-3">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modules Grid */}
        <section>
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
            Módulos del Sistema
            <div className="h-[1px] flex-grow bg-zinc-800 ml-4" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, i) => (
              <Link
                key={i}
                href={mod.link}
                className={`group p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800 hover:border-${mod.accent}-500/30 hover:bg-${mod.accent}-500/5 transition-all duration-300`}
              >
                <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform origin-left">{mod.icon}</span>
                <h3 className={`text-xl font-bold mb-2 group-hover:text-${mod.accent}-500 transition-colors`}>{mod.title}</h3>
                <p className="text-zinc-500 text-sm mb-6 leading-relaxed">{mod.desc}</p>
                <span className={`inline-flex items-center gap-2 text-sm font-bold text-${mod.accent}-500`}>
                  {mod.action}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 p-8 rounded-3xl bg-zinc-900/20 border border-zinc-900 text-center">
          <p className="text-zinc-600 text-sm">
            Fábrica de Lasañas — Sistema B2B v0.2 · Todos los precios incluyen IVA
          </p>
        </footer>
      </main>
    </div>
  );
}
