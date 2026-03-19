import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChefHat,
  Truck,
  Users,
  ShieldCheck,
  LogIn,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Doña Any | Fábrica y Distribución de Lasañas en Chile",
  description:
    "Doña Any es una fábrica chilena especializada en la elaboración y distribución de lasañas artesanales para supermercados, restaurantes y negocios. Calidad, frescura y entrega directa a tu local.",
  keywords: [
    "lasañas Chile",
    "fábrica de lasañas",
    "distribución lasañas",
    "lasañas artesanales",
    "Doña Any",
    "lasañas para supermercados",
    "lasañas para restaurantes",
    "comida italiana Chile",
    "distribuidor lasañas",
    "lasañas congeladas Chile",
    "B2B alimentos Chile",
  ],
  metadataBase: new URL("https://donnaany.com"),
  openGraph: {
    title: "Doña Any | Fábrica y Distribución de Lasañas",
    description:
      "Lasañas artesanales elaboradas con ingredientes de calidad, distribuidas directamente a tu negocio en Chile.",
    url: "https://donnaany.com",
    siteName: "Doña Any",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doña Any | Fábrica de Lasañas en Chile",
    description:
      "Distribuimos lasañas artesanales directamente a supermercados y negocios en Chile.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FoodEstablishment",
      "@id": "https://donnaany.com/#business",
      name: "Doña Any — Fábrica de Lasañas",
      description:
        "Fábrica chilena especializada en la elaboración y distribución de lasañas artesanales para el comercio B2B.",
      url: "https://donnaany.com",
      address: {
        "@type": "PostalAddress",
        addressCountry: "CL",
        addressRegion: "Chile",
      },
      servesCuisine: "Italiana",
      priceRange: "$$",
      openingHours: "Mo-Fr 08:00-18:00",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Catálogo de Lasañas",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña de Carne" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña Vegetariana" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña de Pollo" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña 4 Quesos" } },
        ],
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://donnaany.com/#website",
      url: "https://donnaany.com",
      name: "Doña Any",
      publisher: { "@id": "https://donnaany.com/#business" },
      inLanguage: "es-CL",
    },
  ],
};

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
        {/* Background glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] right-[15%] w-[40%] h-[40%] bg-orange-600/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-orange-600/5 rounded-full blur-[100px]" />
        </div>

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Doña Any" className="h-9 w-auto" />
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              <LogIn className="w-4 h-4" />
              Acceder al sistema
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-36 pb-24 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <ChefHat className="w-3.5 h-3.5" />
              Distribución B2B — Chile
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              Lasañas artesanales
              <br />
              <span className="text-orange-500">para tu negocio</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              En <strong className="text-white">Doña Any</strong> elaboramos lasañas con ingredientes
              de calidad y las distribuimos directamente a supermercados, restaurantes y tiendas en
              todo Chile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-bold px-8 py-3.5 rounded-2xl text-base"
              >
                <LogIn className="w-5 h-5" />
                Portal de clientes
              </Link>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-200 font-semibold px-8 py-3.5 rounded-2xl text-base"
              >
                Quiero distribuir
              </a>
            </div>
          </div>
        </section>

        {/* Por qué elegirnos */}
        <section className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-white mb-3">
                ¿Por qué elegir Doña Any?
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Trabajamos con supermercados y negocios en todo Chile para garantizar producto fresco,
                despacho oportuno y control total de cada pedido.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: ChefHat,
                  color: "text-orange-400",
                  bg: "bg-orange-500/10",
                  title: "Elaboración artesanal",
                  desc: "Recetas propias con ingredientes frescos, sin conservantes artificiales.",
                },
                {
                  icon: Truck,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  title: "Despacho directo",
                  desc: "Distribución puntual a tu local con seguimiento de cada envío.",
                },
                {
                  icon: Package,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  title: "Variedad de productos",
                  desc: "Lasañas de carne, pollo, vegetariana y 4 quesos. Tamaños para todo negocio.",
                },
                {
                  icon: ShieldCheck,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                  title: "Control de calidad",
                  desc: "Cada lote es revisado antes del despacho para garantizar frescura.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className={`${item.bg} w-11 h-11 rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portal de clientes */}
        <section className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-wider">
                  <Users className="w-3 h-3" />
                  Clientes B2B
                </div>
                <h2 className="text-3xl font-black text-white mb-5">
                  Distribuimos a los mejores negocios del país
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  Supermercados, cadenas de tiendas de conveniencia y restaurantes confían en Doña Any
                  para mantener sus góndolas y menús abastecidos con lasañas de calidad consistente.
                </p>
                <ul className="space-y-3">
                  {[
                    "Pedidos mínimos accesibles para todo tamaño de negocio",
                    "Facturación y guías de despacho en línea",
                    "Historial de compras y liquidaciones en tu portal",
                    "Atención personalizada para cada cliente",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-6">
                  Portal exclusivo para clientes
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Package, label: "Consulta tus despachos en tiempo real" },
                    { icon: Truck, label: "Revisa guías y confirmaciones de entrega" },
                    { icon: Users, label: "Gestiona tus pedidos y liquidaciones" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-sm text-zinc-300">{item.label}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-bold py-3.5 rounded-2xl text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Ingresar al portal
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-black text-white mb-4">¿Quieres vender Doña Any?</h2>
            <p className="text-zinc-400 mb-10">
              Contáctanos y un ejecutivo se comunicará contigo para presentarte nuestro catálogo y
              condiciones de distribución.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: Phone, label: "Teléfono", value: "Escríbenos para más info" },
                { icon: Mail, label: "Email", value: "contacto@donnaany.com" },
                { icon: MapPin, label: "Cobertura", value: "Todo Chile" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6"
                >
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm text-zinc-300 font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 py-8 px-6 relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Doña Any" className="h-8 w-auto" />
            <p className="text-zinc-600 text-sm text-center">
              © {new Date().getFullYear()} Doña Any — Fábrica y Distribución de Lasañas · Chile
            </p>
            <Link href="/login" className="text-zinc-500 hover:text-orange-400 transition-colors text-sm">
              Acceso clientes
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
