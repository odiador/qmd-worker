// Plantilla HTML para correos electrónicos
export const emailTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumen de Compra - QMD</title>
  <style>
    /* Fuentes e-mail seguras */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f7fa;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }

    .header {
      background-color: #4f46e5;
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }

    .header h1 {
      font-size: 24px;
      margin: 0;
      font-weight: 700;
    }

    .content {
      padding: 20px;
      background-color: #ffffff;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }

    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e2e8f0;
    }
    
    .order-summary {
      margin-bottom: 24px;
    }

    .order-details {
      margin-top: 16px;
      border-collapse: collapse;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .order-details th {
      background-color: #f1f5f9;
      text-align: left;
      padding: 12px;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .order-details td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .order-details tr:last-child td {
      border-bottom: none;
    }
    
    .order-details .product-name {
      font-weight: 500;
    }
    
    .product-code {
      font-size: 12px;
      color: #64748b;
    }
    
    .total-row {
      background-color: #eef2ff;
      font-weight: 700;
    }
    
    .message {
      margin-top: 24px;
      padding: 16px;
      background-color: #f0fdf4;
      border-radius: 8px;
      border-left: 4px solid #22c55e;
      color: #166534;
    }

    .btn {
      display: inline-block;
      margin-top: 16px;
      padding: 10px 20px;
      background-color: #fff;
      border: 2px solid #4f46e5;
      color: #222;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 500;
    }
    
    .center {
      text-align: center;
    }
    
    .right {
      text-align: right;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        padding: 10px;
      }
      
      .header {
        padding: 20px 10px;
      }
      
      .content {
        padding: 15px;
      }
      
      .order-details th,
      .order-details td {
        padding: 8px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Resumen de tu Compra</h1>
    </div>
    
    <div class="content">
      <div class="order-summary">
        <h2>Detalles de tu pedido</h2>
        <p>Fecha: {{DATE}}</p>
        <p>Código de Pedido: {{ORDER_CODE}}</p>
      </div>
      
      <table class="order-details">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cant.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {{PRODUCTS_ROWS}}
          <tr class="total-row">
            <td colspan="3" class="right">Total:</td>
            <td>{{TOTAL}}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="message">
        <p>¡Gracias por tu compra! Tu pedido ha sido tramitado correctamente.</p>
      </div>
      
      <div class="center">
        <a href="https://qmd.odiador.dev/#/ciudadano/{{CIUDADANO_ID}}/ver" class="btn">Ver mis pedidos</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este es un correo automático, por favor no responda a este mensaje.</p>
      <p>&copy; 2025 QMD - Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;

// Función para generar el HTML del email con los datos del carro
export function generarEmailHTML(
  carro: any, 
  detalles: { producto: { nombre: string, precio: number, codigo?: string }, cantidad: number, subtotal: number }[], 
  total: number
): string {
  // Fecha actual formateada
  const fecha = new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Generar filas de productos
  const productosHTML = detalles.map(d => `
    <tr>
      <td class="product-name">
        ${d.producto.nombre}
        ${d.producto.codigo ? `<div class="product-code">Código: ${d.producto.codigo}</div>` : ''}
      </td>
      <td>$${d.producto.precio.toLocaleString('es-CO')}</td>
      <td>${d.cantidad}</td>
      <td>$${d.subtotal.toLocaleString('es-CO')}</td>
    </tr>
  `).join('');

  // Reemplazar placeholders en la plantilla
  return emailTemplate
    .replace('{{DATE}}', fecha)
    .replace('{{ORDER_CODE}}', carro.codigo || `QMD-${carro.id}`)
    .replace('{{PRODUCTS_ROWS}}', productosHTML)
    .replace('{{TOTAL}}', `$${total.toLocaleString('es-CO')}`)
    .replace('{{CIUDADANO_ID}}', (carro.ciudadanoId || carro.ciudadano_id || '').toString());
}
