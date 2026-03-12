import prisma from '../src/lib/prisma';

async function main() {
  const products = await prisma.producto.findMany();
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error);
