import nodemailer from "nodemailer";

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

  // Create a fresh transporter per send to avoid stale connection issues
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 15000,
    socketTimeout: 30000,
  });

  // Absorb post-send errors so they don't crash the process
  transporter.on("error", () => {});

  try {
    await transporter.sendMail({
      from: `"Doña Any - Guías de Despacho" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      attachments,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error?.message ?? "Error al enviar el correo." };
  } finally {
    try { transporter.close(); } catch (_) {}
  }
}
