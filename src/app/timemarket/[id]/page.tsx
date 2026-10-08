import { notFound } from "next/navigation";
import { getTmConfig, getTmGuiasCalculadas, getTmTiendas } from "@/actions/timemarket";
import GuiaForm from "../GuiaForm";

export const dynamic = "force-dynamic";

export default async function EditarGuiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [calculadas, tiendas, config] = await Promise.all([getTmGuiasCalculadas(), getTmTiendas(), getTmConfig()]);
  const i = calculadas.findIndex((g) => g.guia.id === id);
  if (i < 0) notFound();
  const g = calculadas[i].guia;
  const ant = calculadas[i - 1]?.guia ?? null;
  const sig = calculadas[i + 1]?.guia ?? null;

  // Incluir tiendas activas que no tengan línea aún (p. ej. tienda nueva)
  const lineas = tiendas
    .filter((t) => t.activa || g.lineas.some((l) => l.tiendaId === t.id))
    .map((t) => g.lineas.find((l) => l.tiendaId === t.id) ?? { tiendaId: t.id, entregaIndividual: 0, devolucionIndividual: 0 });

  return (
    <GuiaForm
      modo="editar"
      guiaId={g.id}
      fechaInicial={g.fecha}
      notaInicial={g.nota ?? ""}
      lineasIniciales={lineas}
      tiendas={tiendas}
      config={{ ...config, precioIndividual: g.precioIndividual, tasaIva: g.tasaIva }}
      anterior={ant ? { fecha: ant.fecha, lineas: ant.lineas } : null}
      siguiente={sig ? { fecha: sig.fecha, lineas: sig.lineas } : null}
    />
  );
}
