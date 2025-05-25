import { readFile } from 'fs/promises';
import path from 'path';

interface EmailTemplateData {
  fecha: string;
  codigoPedido: string;
  productosHTML: string;
  total: string;
}

// Función para leer la plantilla HTML
export async function getEmailTemplate(data: EmailTemplateData): Promise<string> {
  try {
    // Leer la plantilla
    const templatePath = path.resolve(__dirname, '..', 'templates', 'email-template.html');
    const template = await readFile(templatePath, 'utf-8');
    
    // Reemplazar los placeholders con datos reales
    return template
      .replace('{{DATE}}', data.fecha)
      .replace('{{ORDER_CODE}}', data.codigoPedido)
      .replace('{{PRODUCTS_ROWS}}', data.productosHTML)
      .replace('{{TOTAL}}', data.total);
  } catch (error) {
    console.error('Error leyendo la plantilla de correo:', error);
    // Fallback: usar template en línea básico
    return `
      <h2>Resumen de tu compra</h2>
      <p>Fecha: ${data.fecha}</p>
      <p>Código: ${data.codigoPedido}</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;min-width:400px;">
        <thead>
          <tr style="background:#f3f3f3;">
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${data.productosHTML}
        </tbody>
        <tfoot>
          <tr style="font-weight:bold;background:#e0e7ff;">
            <td colspan="3" style="text-align:right;">Total:</td>
            <td>${data.total}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top:16px;">¡Gracias por tu compra!</p>
    `;
  }
}
