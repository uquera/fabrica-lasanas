import nodemailer from "nodemailer";

/**
 * Sends an email via Gmail SMTP.
 * Uses callback-style nodemailer to guarantee the returned Promise
 * always RESOLVES (never rejects), preventing unhandled rejections from
 * crashing the Node.js process.
 */
export function sendMail({ to, subject, text, attachments }: {
  to: string;
  subject: string;
  text: string;
  attachments?: any[];
}): Promise<{ success: boolean; error?: string }> {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("[mail] Gmail credentials not configured.");
    return Promise.resolve({ success: false, error: "Credenciales de Gmail no configuradas." });
  }

  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });

    let settled = false;
    const settle = (result: { success: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      try { transporter.close(); } catch (_) {}
      resolve(result);
    };

    // Hard absolute timeout — guarantees the promise always settles
    const timer = setTimeout(() => {
      console.error("[mail] Timeout enviando a", to);
      settle({ success: false, error: "Timeout: sin respuesta del servidor de email en 20s" });
    }, 20000);

    // Catch transport-level errors (connection refused, auth error, etc.)
    transporter.on("error", (err) => {
      clearTimeout(timer);
      console.error("[mail] Transport error:", err.message);
      settle({ success: false, error: err.message });
    });

    // Use callback API — nodemailer handles all internal SMTP events before calling back
    transporter.sendMail(
      {
        from: `"Doña Any - Guías de Despacho" <${GMAIL_USER}>`,
        to,
        subject,
        text,
        attachments,
      },
      (err) => {
        clearTimeout(timer);
        if (err) {
          console.error("[mail] sendMail error:", err.message);
          settle({ success: false, error: err.message });
        } else {
          settle({ success: true });
        }
      },
    );
  });
}
