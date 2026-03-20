import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChefHat,
  Truck,
  ShieldCheck,
  LogIn,
  Phone,
  Mail,
  MapPin,
  Package,
  Store,
  UtensilsCrossed,
  Building2,
  CheckCircle2,
  MessageCircle,
  Star,
  ArrowRight,
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
      telephone: "+56958315506",
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
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña Individual Tradicional" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña de Carne" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña Vegetariana" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Lasaña de Pollo" } },
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

const WHATSAPP_URL = "https://wa.me/56958315506?text=Hola%2C%20me%20interesa%20distribuir%20las%20lasa%C3%B1as%20Do%C3%B1a%20Any%20en%20mi%20local.";

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
          <div className="absolute top-[-5%] right-[10%] w-[45%] h-[45%] bg-orange-600/6 rounded-full blur-[160px]" />
          <div className="absolute bottom-[20%] left-[0%] w-[35%] h-[35%] bg-orange-600/4 rounded-full blur-[120px]" />
          <div className="absolute top-[50%] left-[40%] w-[25%] h-[25%] bg-orange-600/3 rounded-full blur-[100px]" />
        </div>

        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-[#0a0a0a]/85 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Doña Any" className="h-9 w-auto" />
            </div>
            <div className="flex items-center gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                +56 9 5831 5506
              </a>
              <Link
                href="/login"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 text-sm font-medium px-4 py-2 rounded-xl"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Portal clientes</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-36 pb-24 px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <ChefHat className="w-3.5 h-3.5" />
              Proveedor B2B · Chile
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              La lasaña que tus clientes
              <br />
              <span className="text-orange-500">ya quieren comprar</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Somos fabricantes. Te entregamos lasañas listas para vender —
              refrigeradas, etiquetadas y con el margen que necesitas para que funcione en tu negocio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-bold px-8 py-3.5 rounded-2xl text-base"
              >
                <MessageCircle className="w-5 h-5" />
                Quiero ser distribuidor
              </a>
              <a
                href="#producto"
                className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-200 font-semibold px-8 py-3.5 rounded-2xl text-base"
              >
                Ver producto estrella
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Para quién es */}
        <section className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-white mb-3">
                ¿Tu negocio vende comida?
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Trabajamos con locales de todo tamaño que necesitan un producto de alto margen,
                listo para el exhibidor o el menú.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: UtensilsCrossed,
                  color: "text-orange-400",
                  bg: "bg-orange-500/10",
                  border: "border-orange-500/20",
                  title: "Restaurantes",
                  desc: "Incorpora la lasaña a tu menú sin invertir en producción. Lista para calentar y servir.",
                  items: ["Formato individual y familiar", "Consistencia en cada porción", "Sin preparación previa"],
                },
                {
                  icon: Building2,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/20",
                  title: "Casinos y caterings",
                  desc: "Volumen constante, entrega puntual. Ideal para servicios de alimentación colectiva.",
                  items: ["Pedidos por volumen", "Despacho programado", "Precio preferencial"],
                },
                {
                  icon: Store,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                  title: "Tiendas refrigeradas",
                  desc: "Producto con alta rotación en góndola. Etiquetado y listo para exhibición.",
                  items: ["Etiquetado profesional", "Alta rotación probada", "Reposición regular"],
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`bg-zinc-900/60 border ${item.border} rounded-2xl p-6 hover:border-opacity-50 transition-colors`}
                >
                  <div className={`${item.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-5`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-4">{item.desc}</p>
                  <ul className="space-y-2">
                    {item.items.map((point) => (
                      <li key={point} className="flex items-center gap-2 text-xs text-zinc-400">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Producto estrella */}
        <section id="producto" className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-wider">
                  <Star className="w-3 h-3" />
                  Producto estrella
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                  Lasaña Individual
                  <br />
                  <span className="text-orange-500">Tradicional</span>
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  Nuestra lasaña más vendida. Relleno de carne en salsa napolitana,
                  capas de pasta fresca y bechamel casera. Formato individual pensado
                  para el consumidor final — rotación garantizada.
                </p>

                {/* Precio */}
                <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl p-5 mb-6">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-semibold">Precio de venta sugerido</p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-white">$6.000</span>
                    <span className="text-zinc-500 text-sm mb-1">IVA incluido</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Precio neto: $5.042 + IVA</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Pasta fresca elaborada diariamente",
                    "Sin conservantes artificiales",
                    "Producto refrigerado, listo para calentar",
                    "Embalaje profesional para exhibición",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      {point}
                    </li>
                  ))}
                </ul>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-bold px-6 py-3.5 rounded-2xl text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar precio por volumen
                </a>
              </div>

              {/* Visual del producto */}
              <div className="relative">
                <div className="bg-gradient-to-br from-orange-500/10 to-zinc-900/60 border border-zinc-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center min-h-[320px]">
                  <div className="w-24 h-24 bg-orange-500/15 rounded-full flex items-center justify-center mb-5">
                    <ChefHat className="w-12 h-12 text-orange-400" />
                  </div>
                  <p className="text-white font-bold text-xl mb-1">Lasaña Individual</p>
                  <p className="text-zinc-500 text-sm mb-6">Tradicional · Refrigerada</p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    {["Pasta fresca", "Carne", "Bechamel", "Sin conservantes"].map((tag) => (
                      <span
                        key={tag}
                        className="bg-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full border border-zinc-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Badge de precio flotante */}
                <div className="absolute -top-4 -right-4 bg-orange-500 text-white rounded-2xl px-4 py-2 shadow-lg shadow-orange-500/25">
                  <p className="text-xs font-semibold opacity-80">Desde</p>
                  <p className="text-lg font-black leading-none">$6.000</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prueba social */}
        <section className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-white mb-3">
                Negocios que ya nos eligen
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Nuestras lasañas ya están en las góndolas de locales de todo Chile.
              </p>
            </div>

            {/* Timemarket card */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-zinc-900/60 border border-zinc-700 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center shrink-0">
                      <Store className="w-7 h-7 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-xl">Timemarket</h3>
                      <p className="text-zinc-500 text-sm">Cadena de tiendas de conveniencia · Iquique</p>
                    </div>
                  </div>
                  <p className="text-zinc-300 leading-relaxed mb-6">
                    Presentes en las <strong className="text-white">9 tiendas</strong> de la cadena
                    en toda la ciudad de Iquique. Doña Any es parte del catálogo permanente de
                    productos refrigerados de Timemarket, con reposición regular en cada sucursal.
                  </p>
                  <div className="flex items-center gap-6 pt-5 border-t border-zinc-800">
                    <div className="text-center">
                      <p className="text-3xl font-black text-orange-400">9</p>
                      <p className="text-xs text-zinc-500 mt-0.5">tiendas activas</p>
                    </div>
                    <div className="w-px h-10 bg-zinc-800" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-white">100%</p>
                      <p className="text-xs text-zinc-500 mt-0.5">cobertura en Iquique</p>
                    </div>
                    <div className="w-px h-10 bg-zinc-800" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-white">Alta</p>
                      <p className="text-xs text-zinc-500 mt-0.5">rotación probada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Por qué Doña Any */}
        <section className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black text-white mb-3">
                Por qué funciona en tu negocio
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                No somos un intermediario. Somos la fábrica, lo que se traduce en
                mejor precio, mejor calidad y más control para ti.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: ChefHat,
                  color: "text-orange-400",
                  bg: "bg-orange-500/10",
                  title: "Fabricante directo",
                  desc: "Sin intermediarios. Precio de fábrica y calidad controlada en cada lote.",
                },
                {
                  icon: Truck,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  title: "Despacho a tu local",
                  desc: "Entregamos directamente en tu negocio con seguimiento de cada envío.",
                },
                {
                  icon: Package,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  title: "Listo para vender",
                  desc: "Etiquetado, refrigerado y empacado para ir directo al exhibidor o el menú.",
                },
                {
                  icon: ShieldCheck,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                  title: "Calidad constante",
                  desc: "Cada lote revisado. El mismo sabor siempre, para que tus clientes vuelvan.",
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

        {/* CTA / Contacto */}
        <section id="contacto" className="py-20 px-6 border-t border-zinc-800/50 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-orange-500/10 via-zinc-900/60 to-zinc-900/60 border border-orange-500/20 rounded-3xl p-10 text-center">
              <div className="w-14 h-14 bg-orange-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <MessageCircle className="w-7 h-7 text-orange-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">
                ¿Quieres tener Doña Any en tu local?
              </h2>
              <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
                Escríbenos por WhatsApp y te enviamos el catálogo completo con precios
                por volumen. Sin compromisos.
              </p>

              {/* CTA principal */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-bold px-8 py-4 rounded-2xl text-base mb-8 w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5" />
                Escribir por WhatsApp
              </a>

              {/* Contactos secundarios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-zinc-800">
                {[
                  { icon: Phone, label: "WhatsApp / Teléfono", value: "+56 9 5831 5506", href: WHATSAPP_URL },
                  { icon: Mail, label: "Email", value: "contacto@donnaany.com", href: "mailto:contacto@donnaany.com" },
                  { icon: MapPin, label: "Cobertura", value: "Todo Chile", href: null },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center">
                    <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center mb-2">
                      <item.icon className="w-4 h-4 text-orange-400" />
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm text-zinc-300 font-medium hover:text-orange-400 transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-zinc-300 font-medium">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
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
