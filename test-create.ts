import prisma from "./src/lib/prisma";

async function main() {
  console.log("Intentando crear cliente de prueba...");
  try {
    const cliente = await prisma.cliente.create({
      data: {
        rut: "76.123.456-7",
        razonSocial: "Almacén Don Tito SpA",
        giro: "Minimarket",
        direccion: "Calle Falsa 123",
        email: "contacto@almacen.cl"
      }
    });
    console.log("Cliente creado con éxito:", cliente.razonSocial);
    
    const count = await prisma.cliente.count();
    console.log("Total de clientes ahora:", count);
  } catch (error) {
    console.error("Error al crear cliente:", error);
  } finally {
    // Process will exit
  }
}

main();
