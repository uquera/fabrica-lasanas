import nodemailer from "nodemailer";

/**
 * Estándar Hypnos: autentica con contacto@hypnosapps.com y envía como
 * no-reply@hypnosapps.com (SPF+DKIM+DMARC); las respuestas van a EMAIL_REPLY_TO.
 */
export function mailConfigurado(): boolean {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_FROM);
}

export function createTransporter(opts: { connectionTimeout?: number; socketTimeout?: number } = {}) {
  return nodemailer.createTransport(
    {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Number(process.env.EMAIL_PORT || 587) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      ...opts,
    },
    { from: process.env.EMAIL_FROM, replyTo: process.env.EMAIL_REPLY_TO || undefined },
  );
}

/** `"Doña Any - Guías" <no-reply@...>`: cambia el nombre visible y conserva la dirección de EMAIL_FROM. */
export function fromConNombre(nombre: string): string | undefined {
  const from = process.env.EMAIL_FROM;
  const direccion = from?.match(/<([^>]+)>/)?.[1] ?? from;
  return direccion ? `"${nombre}" <${direccion}>` : undefined;
}

/**
 * Sends an email via SMTP (estándar no-reply de Hypnos).
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
  if (!mailConfigurado()) {
    console.warn("[mail] EMAIL_USER / EMAIL_PASS / EMAIL_FROM no configurados.");
    return Promise.resolve({ success: false, error: "Correo no configurado (EMAIL_USER / EMAIL_PASS / EMAIL_FROM)." });
  }

  return new Promise((resolve) => {
    const transporter = createTransporter({ connectionTimeout: 10000, socketTimeout: 15000 });

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
        from: fromConNombre("Doña Any - Guías de Despacho"),
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
