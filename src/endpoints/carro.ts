import { Hono } from 'hono';
import type { Context } from 'hono';
import { sendEmail } from '../resend';
import { fromHono } from 'chanfana';
import { generarEmailHTML } from '../utils/email-template';

export const carroRoutes = fromHono(new Hono());

// GET /carro/:ciudadanoId - Obtener o crear el carro de compras de un ciudadano
carroRoutes.get('/:ciudadanoId', async (c: Context) => {
  const db = c.env.DB;
  const ciudadanoId = Number(c.req.param('ciudadanoId'));
  let carro = await db.prepare('SELECT * FROM CarroCompras WHERE ciudadanoId = ? AND estado = "activo"').bind(ciudadanoId).first();
  if (!carro) {
    const codigo = `CARRO-${Date.now()}`;
    await db.prepare('INSERT INTO CarroCompras (ciudadanoId, codigo, estado) VALUES (?, ?, "activo")').bind(ciudadanoId, codigo).run();
    carro = await db.prepare('SELECT * FROM CarroCompras WHERE ciudadanoId = ? AND estado = "activo"').bind(ciudadanoId).first();
  }
  return c.json(carro);
});

// GET /carro/detalle/:carroId - Ver contenido completo del carro
carroRoutes.get('/detalle/:carroId', async (c: Context) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  const carro = await db.prepare('SELECT * FROM CarroCompras WHERE id = ?').bind(carroId).first();
  // Traer detalles con join a Producto
  const detallesRaw = await db.prepare(`
    SELECT d.id, d.productoId, d.cantidad, d.subtotal, p.nombre, p.precio, p.codigo
    FROM DetalleProducto d
    LEFT JOIN Producto p ON d.productoId = p.id
    WHERE d.carroId = ?
  `).bind(carroId).all();
  // Mapear detalles al formato esperado
  const detalles = detallesRaw.results.map((d: any) => ({
    id: d.id,
    producto: {
      id: d.productoId,
      nombre: d.nombre,
      precio: d.precio,
      codigo: d.codigo
    },
    cantidad: d.cantidad,
    subtotal: d.subtotal ?? (d.cantidad * d.precio)
  }));
  // Calcular total
  const total = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  return c.json({ carro, detalles, total });
});

// POST /carro/:carroId/tramitar - Tramitar el carro de compras
carroRoutes.post('/:carroId/tramitar', async (c: Context) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  // Obtener detalles del carro
  const carro = await db.prepare('SELECT * FROM CarroCompras WHERE id = ?').bind(carroId).first();
  const detallesRaw = await db.prepare(`
    SELECT d.id, d.productoId, d.cantidad, d.subtotal, p.nombre, p.precio, p.codigo
    FROM DetalleProducto d
    LEFT JOIN Producto p ON d.productoId = p.id
    WHERE d.carroId = ?
  `).bind(carroId).all();
  const detalles = detallesRaw.results.map((d: any) => ({
    id: d.id,
    producto: {
      id: d.productoId,
      nombre: d.nombre,
      precio: d.precio,
      codigo: d.codigo
    },
    cantidad: d.cantidad,
    subtotal: d.subtotal ?? (d.cantidad * d.precio)
  }));
  const total = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);

  // Actualizar estado
  await db.prepare('UPDATE CarroCompras SET estado = "tramitado" WHERE id = ?').bind(carroId).run();

  // Enviar correo
  try {    // Generar HTML mejorado con la plantilla
    const html = generarEmailHTML(carro, detalles, total);
      // Buscar el correo del ciudadano a partir del ciudadanoId del carro
    let destinatario = 'arroa03@gmail.com'; // Default
    if (carro.ciudadanoId) {
      const ciudadano = await db.prepare('SELECT email FROM Ciudadano WHERE id = ?').bind(carro.ciudadanoId).first();
      if (ciudadano?.email) {
        destinatario = ciudadano.email;
      }
    }
    
    await sendEmail({
      to: destinatario,
      subject: 'Resumen de tu compra - QMD',
      html
    });
  } catch (e) {
    // No bloquear tramitación si falla el correo
    console.error('Error enviando correo:', e);
  }

  return c.json({ ok: true });
});
