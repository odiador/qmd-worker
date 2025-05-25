// resend.ts - Cliente Resend para Cloudflare Worker
import { RESEND_API_KEY_ENV } from './resend.key';

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  // Cloudflare Workers NO soporta process.env, usar import o c.env
  const RESEND_API_KEY = RESEND_API_KEY_ENV;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "QMD Carrito <noreply@qmd.odiador.dev>",
      to,
      subject,
      html
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error enviando correo: ${error}`);
  }
  return response.json();
}
