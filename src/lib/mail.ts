import nodemailer from "nodemailer";

const SEND_TIMEOUT_MS = 20000; // Absolute 20s limit per email

export async function sendMail({ to, subject, text, attachments }: {
  to: string;
  subject: string;
  text: string;
  attachments?: any[]
}) {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured. Email not sent.");
    return { success: false, error: "Credenciales de Gmail no configuradas." };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });

  // Prevent unhandled error events from crashing the process
  transporter.on("error", () => {});

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const sendPromise = transporter.sendMail({
      from: `"Doña Any - Guías de Despacho" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      attachments,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Timeout: el servidor de email no respondió en ${SEND_TIMEOUT_MS / 1000}s`)),
        SEND_TIMEOUT_MS,
      );
    });

    await Promise.race([sendPromise, timeoutPromise]);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error?.message ?? "Error al enviar el correo." };
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    try { transporter.close(); } catch (_) {}
  }
}
