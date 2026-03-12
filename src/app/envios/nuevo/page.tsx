import { getClientes } from "@/actions/clientes";
import { getProductos } from "@/actions/productos";
import NuevoEnvio from "./NuevoEnvio";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [clientes, productos] = await Promise.all([
    getClientes(),
    getProductos(),
  ]);

  return <NuevoEnvio clientes={clientes} productos={productos} />;
}
