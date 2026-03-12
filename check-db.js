const { createClient } = require("@libsql/client");
const client = createClient({ url: "file:dev.db" });
async function run() {
  console.log("Checking tables in dev.db...");
  try {
    const rs = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Found tables:", rs.rows.map(r => r[0] || r.name));
  } catch (e) {
    console.error("Error checking tables:", e);
  }
}
run();
