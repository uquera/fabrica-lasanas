export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason: unknown) => {
      console.error("[process] unhandledRejection (crash prevented):", reason);
    });
    process.on("uncaughtException", (err: Error) => {
      console.error("[process] uncaughtException (crash prevented):", err.message, "\n", err.stack);
    });
    console.log("[instrumentation] Global crash guards registered.");
  }
}
