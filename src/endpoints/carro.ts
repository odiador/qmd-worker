import { Hono } from 'hono';
import type { Context } from 'hono';

export const carroRoutes = new Hono();

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
  const detalles = await db.prepare('SELECT * FROM DetalleProducto WHERE carroId = ?').bind(carroId).all();
  return c.json({ carro, detalles: detalles.results });
});

// POST /carro/:carroId/tramitar - Tramitar el carro de compras
carroRoutes.post('/:carroId/tramitar', async (c: Context) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  // Aquí iría la lógica de validación y tramitación
  await db.prepare('UPDATE CarroCompras SET estado = "tramitado" WHERE id = ?').bind(carroId).run();
  return c.json({ ok: true });
});
