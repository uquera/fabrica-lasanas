import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PortalView from "./PortalView";

export const dynamic = "force-dynamic";

// Mapa usuario → RUT del cliente
const PORTAL_RUT_MAP: Record<string, string> = {
  [process.env.APP_USERNAME_3 ?? "timemarket"]: process.env.PORTAL_CLIENT_RUT ?? "76452043-2",
  [process.env.APP_USERNAME_4 ?? "susana"]: "76915420-5",
};

export default async function PortalPage() {
  const session = await auth();
  const username = session?.user?.name ?? "";
  const portalRut = PORTAL_RUT_MAP[username];
  if (!portalRut) redirect("/");

  const clientes = await prisma.cliente.findMany({
    where: { rut: portalRut },
  });

  const clienteIds = clientes.map((c) => c.id);
  const razonSocial = clientes[0]?.razonSocial ?? "Portal";

  const envios = await prisma.envio.findMany({
    where: { clienteId: { in: clienteIds } },
    include: {
      cliente: { select: { razonSocial: true, sucursal: true } },
      detalles: {
        include: { producto: { select: { nombre: true, precioBase: true, tasaIva: true } } },
      },
    },
    orderBy: { fecha: "desc" },
  });

  const serialized = envios.map((e) => ({
    ...e,
    fecha: e.fecha.toISOString(),
    fechaPago: (e as any).fechaPago ? (e as any).fechaPago.toISOString() : null,
  }));

  return <PortalView envios={serialized as any} razonSocial={razonSocial} />;
}
