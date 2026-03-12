import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PortalView from "./PortalView";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await auth();
  const portalUsername = process.env.APP_USERNAME_3 ?? "timemarket";
  if (session?.user?.name !== portalUsername) redirect("/");

  // Fetch all envios for Time Market clients (filter by RUT)
  const portalRut = process.env.PORTAL_CLIENT_RUT ?? "76452043-2";
  const clientes = await prisma.cliente.findMany({
    where: { rut: portalRut },
  });

  const clienteIds = clientes.map((c) => c.id);

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

  return <PortalView envios={envios as any} />;
}
