const { createClient } = require("@libsql/client");

const client = createClient({
  url: "file:./prisma/dev.db",
});

async function main() {
  console.log("🌱 Empezando el seed (Direct SQL)...");

  // Insertar Producto
  await client.execute({
    sql: "INSERT OR IGNORE INTO Producto (id, sku, nombre, precioBase, updatedAt) VALUES (?, ?, ?, ?, ?)",
    args: ["prod_1", "LAS-TRAD-01", "Lasaña Tradicional", 6000, new Date().toISOString()],
  });
  console.log("Producto verificado/insertado.");

  // Insertar Cliente
  await client.execute({
    sql: "INSERT OR IGNORE INTO Cliente (id, rut, razonSocial, direccion, giro, email, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: ["cli_1", "76.123.456-7", "Almacén Don Tito SpA", "Calle Falsa 123", "Minimarket", "tito@almacen.cl", new Date().toISOString()],
  });
  console.log("Cliente verificado/insertado.");

  const products = await client.execute("SELECT * FROM Producto");
  console.log("Productos en DB:", products.rows.length);

  console.log("✅ Verificación SQL exitosa.");
}

main().catch(console.error);
