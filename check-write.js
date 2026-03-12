const { createClient } = require("@libsql/client");
const client = createClient({ url: "file:dev.db" });

async function run() {
  console.log("Testing direct write to dev.db...");
  try {
    const rs = await client.execute({
      sql: "INSERT INTO Cliente (id, rut, razonSocial, giro, direccion, email, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: ["test-id", "76.123.456-7", "Almacén Don Tito SpA", "Minimarket", "Calle Falsa 123", "contacto@almacen.cl", new Date().toISOString()]
    });
    console.log("Insert successful!");
    
    const countRs = await client.execute("SELECT COUNT(*) as count FROM Cliente");
    console.log("Current customer count:", countRs.rows[0].count || countRs.rows[0][0]);
  } catch (e) {
    if (e.message.includes("UNIQUE constraint failed")) {
      console.log("Client already exists (database is healthy).");
    } else {
      console.error("Error writing to DB:", e);
    }
  }
}
run();
