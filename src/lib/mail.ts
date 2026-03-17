import nodemailer from "nodemailer";

const getTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 10000,
  socketTimeout: 20000,
});

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

  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: `"Doña Any - Guías de Despacho" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      attachments,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Error al enviar el correo." };
  }
}
