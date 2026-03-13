
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.producto.findMany();
  console.log("PRODUCTS:", JSON.stringify(products, null, 2));
  process.exit(0);
}

main();
