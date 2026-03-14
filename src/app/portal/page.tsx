import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PortalView from "./PortalView";
import SubUserView from "./SubUserView";

export const dynamic = "force-dynamic";

const PORTAL_RUT_MAP: Record<string, string> = {
  [process.env.APP_USERNAME_3 ?? "timemarket"]: process.env.PORTAL_CLIENT_RUT ?? "76452043-2",
  [process.env.APP_USERNAME_4 ?? "susana"]: "76915420-5",
};

const TM_STORE_MAP: Record<string, { clienteId: string; tienda: string }> = {
  "tm.vivar":       { clienteId: "cmmnmfpkv0001r4kyrfgs13z9", tienda: "Vivar" },
  "tm.terranova":   { clienteId: "cmmnmh1mf0002r4kysf9yc5xo", tienda: "Terranova" },
  "tm.chipana":     { clienteId: "cmmnmjxy60003r4kymk3ikkub", tienda: "Chipana" },
  "tm.playabrava":  { clienteId: "cmmnm03e800007qkymmpexyb1", tienda: "Playa Brava" },
  "tm.anibalpinto": { clienteId: "cmmnmoo4m0005r4ky04fyw48a", tienda: "Anibal Pinto" },
  "tm.tarapaca":    { clienteId: "cmmnmqbom0006r4kyudp2r4qa", tienda: "Tarapaca" },
  "tm.losmolles":   { clienteId: "cmmnmrlqz0007r4kyudp2r4qa", tienda: "Los Molles" },
  "tm.bilbao2":     { clienteId: "cmmnmlph80004r4kyvhrm0777", tienda: "Bilbao 2" },
  "tm.peninsula":   { clienteId: "cmmnmdjfr0000r4kyba7mwu1j", tienda: "Peninsula" },
};

export default async function PortalPage() {
  const session = await auth();
  const username = session?.user?.name ?? "";

  const tmStore = TM_STORE_MAP[username];
  if (tmStore) {
    const [envios, mermas, productos] = await Promise.all([
      (prisma.envio as any).findMany({
        where: { clienteId: tmStore.clienteId },
        include: { detalles: { include: { producto: { select: { nombre: true, precioBase: true, tasaIva: true } } } } },
        orderBy: { fecha: "desc" },
      }),
      prisma.merma.findMany({
        where: { clienteId: tmStore.clienteId },
        include: { producto: { select: { nombre: true } } },
        orderBy: { fecha: "desc" },
        take: 30,
      }),
      prisma.producto.findMany({ select: { id: true, nombre: true } }),
    ]);

    return (
      <SubUserView
        envios={envios.map((e: any) => ({ ...e, fecha: e.fecha.toISOString(), fechaPago: e.fechaPago?.toISOString() ?? null }))}
        mermas={mermas.map((m: any) => ({ ...m, fecha: m.fecha.toISOString() }))}
        productos={productos}
        clienteId={tmStore.clienteId}
        tienda={tmStore.tienda}
      />
    );
  }

  const portalRut = PORTAL_RUT_MAP[username];
  if (!portalRut) redirect("/");

  const clientes = await prisma.cliente.findMany({ where: { rut: portalRut } });
  const clienteIds = clientes.map((c) => c.id);
  const razonSocial = clientes[0]?.razonSocial ?? "Portal";

  const envios = await (prisma.envio as any).findMany({
    where: { clienteId: { in: clienteIds } },
    include: {
      cliente: { select: { razonSocial: true, sucursal: true } },
      detalles: { include: { producto: { select: { nombre: true, precioBase: true, tasaIva: true } } } },
    },
    orderBy: { fecha: "desc" },
  });

  const serialized = envios.map((e: any) => ({
    ...e,
    fecha: e.fecha.toISOString(),
    fechaPago: e.fechaPago ? e.fechaPago.toISOString() : null,
  }));

  return <PortalView envios={serialized as any} razonSocial={razonSocial} />;
}
