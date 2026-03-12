import { getClientes } from "@/actions/clientes";
import { getProductos } from "@/actions/productos";
import NuevoEnvio from "./NuevoEnvio";

export default async function Page() {
  const [clientes, productos] = await Promise.all([
    getClientes(),
    getProductos(),
  ]);

  return <NuevoEnvio clientes={clientes} productos={productos} />;
}
