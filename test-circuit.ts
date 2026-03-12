import dotenv from "dotenv";
dotenv.config();
import prisma from "./src/lib/prisma";
import { generarYEnviarGuias } from "./src/actions/pdf";

async function main() {
  console.log("🚀 Iniciando circuito de prueba de email...");

  // 1. Buscar Cliente "Prueba B2B"
  const cliente = await prisma.cliente.findFirst({
    where: { razonSocial: "Prueba B2B" },
  });

  if (!cliente) {
    console.error("❌ Cliente 'Prueba B2B' no encontrado.");
    return;
  }
  console.log(`✅ Cliente encontrado: ${cliente.razonSocial} (${cliente.email})`);

  // 2. Buscar Producto "Lasaña individual tradicional"
  const producto = await prisma.producto.findFirst({
    where: { sku: "LAS-TRAD-IND" },
  });

  if (!producto) {
    console.error("❌ Producto 'LAS-TRAD-IND' no encontrado.");
    return;
  }
  console.log(`✅ Producto encontrado: ${producto.nombre}`);

  // 3. Crear Envío con 2 lasañas
  console.log("📦 Creando envío de prueba...");
  const envio = await prisma.envio.create({
    data: {
      clienteId: cliente.id,
      fecha: new Date(),
      detalles: {
        create: {
          productoId: producto.id,
          cantidad: 2,
        },
      },
    },
  });
  console.log(`✅ Envío creado con ID: ${envio.id}`);

  // 4. Generar PDF y enviar email
  console.log("📧 Generando PDF y enviando email...");
  const resultados = await generarYEnviarGuias([envio.id]);

  console.log("📊 Resultados:", JSON.stringify(resultados, null, 2));

  if (resultados[0]?.status === "sent") {
    console.log("🎉 Circuito completado con éxito. Email enviado.");
  } else {
    console.log("⚠️ El circuito terminó pero el email no se marcó como enviado.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error en el circuito:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
