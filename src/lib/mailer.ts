import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendSolicitudEmail(data: {
  tienda: string;
  cantidad: number;
  fechaEntrega: Date;
  nota?: string | null;
  responsable?: string | null;
}) {
  const fecha = data.fechaEntrega.toLocaleDateString("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:480px;background:#0a0a0a;color:#e4e4e7;padding:24px;border-radius:16px;border:1px solid #27272a">
      <h2 style="color:#f97316;margin:0 0 16px">🛒 Nuevo Pedido Recibido</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#71717a;font-size:13px">Tienda</td>
          <td style="padding:8px 0;font-weight:bold">${data.tienda}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#71717a;font-size:13px">Cantidad</td>
          <td style="padding:8px 0;font-weight:bold;color:#f97316">${data.cantidad} unidades</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#71717a;font-size:13px">Fecha entrega</td>
          <td style="padding:8px 0;font-weight:bold;text-transform:capitalize">${fecha}</td>
        </tr>
        ${data.responsable ? `
        <tr>
          <td style="padding:8px 0;color:#71717a;font-size:13px">Responsable</td>
          <td style="padding:8px 0;font-weight:bold">${data.responsable}</td>
        </tr>` : ""}
        ${data.nota ? `
        <tr>
          <td style="padding:8px 0;color:#71717a;font-size:13px">Nota</td>
          <td style="padding:8px 0;font-style:italic;color:#a1a1aa">${data.nota}</td>
        </tr>` : ""}
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#52525b">
        Doña Any — Sistema de Gestión B2B
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Doña Any Sistema" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `📦 Pedido ${data.tienda} — ${data.cantidad} unid. para ${fecha}`,
    html,
  });
}
