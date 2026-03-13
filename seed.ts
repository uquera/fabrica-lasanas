import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Empezando el seed...");

  // Insertar Producto
  await prisma.producto.upsert({
    where: { sku: "LAS-TRAD-01" },
    update: {},
    create: {
      id: "prod_1",
      sku: "LAS-TRAD-01",
      nombre: "Lasaña Tradicional",
      precioBase: 6000,
    },
  });
  console.log("Producto verificado/insertado.");

  // Insertar Cliente
  const clienteCount = await prisma.cliente.count({ where: { id: "cli_1" } });
  if (clienteCount === 0) {
    await prisma.cliente.create({
      data: {
        id: "cli_1",
        rut: "76.123.456-7",
        razonSocial: "Almacén Don Tito SpA",
        direccion: "Calle Falsa 123",
        giro: "Minimarket",
        email: "tito@almacen.cl",
      },
    });
  }
  console.log("Cliente verificado/insertado.");

  const count = await prisma.producto.count();
  console.log("Productos en DB:", count);

  console.log("✅ Verificación SQL exitosa.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
