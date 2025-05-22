import { Hono } from 'hono';
import type { Context } from 'hono';

export const productoRoutes = new Hono();

// GET /productos - Listar productos disponibles
productoRoutes.get('/', async (c: Context) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT * FROM Producto WHERE estado IS NULL OR estado != "inactivo"').all();
  return c.json(results);
});
