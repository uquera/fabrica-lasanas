import prisma from '../src/lib/prisma';

async function main() {
  console.log('--- Reseteando Bases de Datos ---');

  // Delete transactions first (due to FK constraints if any, though SQLite is relaxed)
  console.log('Eliminando Mermas...');
  await prisma.merma.deleteMany();

  console.log('Eliminando Detalles de Envío...');
  await prisma.detalleEnvio.deleteMany();

  console.log('Eliminando Envíos...');
  await prisma.envio.deleteMany();

  console.log('Eliminando Clientes...');
  await prisma.cliente.deleteMany();

  console.log('Eliminando Productos (excepto Lasaña Tradicional Individual)...');
  await prisma.producto.deleteMany({
    where: {
      sku: {
        not: 'LAS-TRAD-IND'
      }
    }
  });

  console.log('--- Reset Completado Exitosamente ---');
}

main()
  .catch((e) => {
    console.error('Error durante el reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
