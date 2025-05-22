import { Hono } from 'hono';
import type { Context } from 'hono';

export const detalleRoutes = new Hono();

// POST /carro/:carroId/producto - Agregar producto o catálogo al carro
// Espera body: { productoId?, catalogoId?, cantidad }
detalleRoutes.post('/:carroId/producto', async (c: Context) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  const { productoId, catalogoId, cantidad } = await c.req.json();
  await db.prepare('INSERT INTO DetalleProducto (carroId, productoId, catalogoId, cantidad) VALUES (?, ?, ?, ?)')
    .bind(carroId, productoId || null, catalogoId || null, cantidad).run();
  return c.json({ ok: true });
});

// PUT /carro/:carroId/detalle/:detalleId - Actualizar cantidad
// Espera body: { cantidad }
detalleRoutes.put('/:carroId/detalle/:detalleId', async (c: Context) => {
  const db = c.env.DB;
  const detalleId = Number(c.req.param('detalleId'));
  const { cantidad } = await c.req.json();
  await db.prepare('UPDATE DetalleProducto SET cantidad = ? WHERE id = ?').bind(cantidad, detalleId).run();
  return c.json({ ok: true });
});

// DELETE /carro/:carroId/detalle/:detalleId - Eliminar producto del carro
detalleRoutes.delete('/:carroId/detalle/:detalleId', async (c: Context) => {
  const db = c.env.DB;
  const detalleId = Number(c.req.param('detalleId'));
  await db.prepare('DELETE FROM DetalleProducto WHERE id = ?').bind(detalleId).run();
  return c.json({ ok: true });
});
