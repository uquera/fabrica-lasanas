import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: ["/dashboard", "/clientes", "/envios", "/guias", "/mermas", "/liquidaciones", "/reportes", "/productos", "/api/", "/portal/"],
      },
    ],
    sitemap: "https://donnaany.com/sitemap.xml",
  };
}
