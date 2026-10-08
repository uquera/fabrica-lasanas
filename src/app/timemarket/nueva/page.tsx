import { getTmPropuestaSiguiente, getTmGuiasCalculadas } from "@/actions/timemarket";
import GuiaForm from "../GuiaForm";

export const dynamic = "force-dynamic";

export default async function NuevaGuiaPage() {
  const [p, calculadas] = await Promise.all([getTmPropuestaSiguiente(), getTmGuiasCalculadas()]);
  const ultima = calculadas[calculadas.length - 1] ?? null;
  return (
    <GuiaForm
      modo="nueva"
      fechaInicial={p.fecha}
      lineasIniciales={p.lineas}
      tiendas={p.tiendas}
      config={p.config}
      anterior={ultima ? { fecha: ultima.guia.fecha, lineas: ultima.guia.lineas } : null}
    />
  );
}
