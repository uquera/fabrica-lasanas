export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason: unknown) => {
      console.error("[process] unhandledRejection (crash prevented):", reason);
    });
    process.on("uncaughtException", (err: Error) => {
      console.error("[process] uncaughtException (crash prevented):", err.message, "\n", err.stack);
    });
    console.log("[instrumentation] Global crash guards registered.");

    // Guías que quedaron a medio enviar (reinicio del servidor): retomar al
    // arrancar y revisar cada 5 minutos. Ver src/lib/colaGuias.ts.
    const { retomarPendientes } = await import("@/lib/colaGuias");
    const retomar = () => retomarPendientes().catch((err) => console.error("[colaGuias] retomar:", err?.message ?? err));
    setTimeout(retomar, 30_000);
    setInterval(retomar, 5 * 60_000);
  }
}
