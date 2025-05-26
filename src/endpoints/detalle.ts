import { Hono } from 'hono';
import { fromHono } from 'chanfana';

export const detalleRoutes = fromHono(new Hono());

// POST /carro/:carroId/producto - Agregar producto o catálogo al carro
// Espera body: { productoId?, catalogoId?, cantidad }
detalleRoutes.post('/:carroId/producto', async (c) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  const { productoId, catalogoId, cantidad } = await c.req.json();
  await db.prepare('INSERT INTO DetalleProducto (carroId, productoId, catalogoId, cantidad) VALUES (?, ?, ?, ?)')
    .bind(carroId, productoId || null, catalogoId || null, cantidad).run();
  return c.json({ ok: true });
});

// PUT /carro/:carroId/detalle/:detalleId - Actualizar cantidad
// Espera body: { cantidad }
detalleRoutes.put('/:carroId/detalle/:detalleId', async (c) => {
  const db = c.env.DB;
  const detalleId = Number(c.req.param('detalleId'));
  const { cantidad } = await c.req.json();
  await db.prepare('UPDATE DetalleProducto SET cantidad = ? WHERE id = ?').bind(cantidad, detalleId).run();
  return c.json({ ok: true });
});

// DELETE /carro/:carroId/detalle/:detalleId - Eliminar producto del carro
detalleRoutes.delete('/:carroId/detalle/:detalleId', async (c) => {
  const db = c.env.DB;
  const detalleId = Number(c.req.param('detalleId'));
  await db.prepare('DELETE FROM DetalleProducto WHERE id = ?').bind(detalleId).run();
  return c.json({ ok: true });
});

// GET /producto/:productoId - Ver todos los detalles de un producto específico
// Devuelve los detalles de DetalleProducto para ese producto, con info de carro y ciudadano
detalleRoutes.get('/producto/:productoId', async (c) => {
  const db = c.env.DB;
  const productoId = Number(c.req.param('productoId'));
  // Traer detalles con join a CarroCompras y Ciudadano
  const detallesRaw = await db.prepare(`
    SELECT d.*, cc.codigo as carroCodigo, cc.estado as carroEstado, cc.fecha as carroFecha, ci.nombre as ciudadanoNombre, ci.apellido as ciudadanoApellido, ci.cedula as ciudadanoCedula, ci.email as ciudadanoEmail
    FROM DetalleProducto d
    LEFT JOIN CarroCompras cc ON d.carroId = cc.id
    LEFT JOIN Ciudadano ci ON cc.ciudadanoId = ci.id
    WHERE d.productoId = ?
  `).bind(productoId).all();
  return c.json({ detalles: detallesRaw.results });
});
