import { Hono } from 'hono';
import { fromHono, getSwaggerUI } from 'chanfana';

const openapi = fromHono(new Hono(), {
  schema: { openapi: '3.1.0', info: { title: 'QMD API', version: '1.0.0' } }
});

// --- CORS Middleware ---
openapi.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Access-Control-Allow-Origin', '*'); // Permitir cualquier origen (desarrollo)
  // Para producción restringida, usa:
  // c.res.headers.set('Access-Control-Allow-Origin', 'https://qmd.odiador.dev');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
});

// --- Opcional: responder preflight ---
openapi.options('*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return c.text('', 204 as 200);
});

// GET /productos - Listar productos disponibles
openapi.get('/productos', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT * FROM Producto WHERE estado IS NULL OR estado != "inactivo"').all();
    return c.json(results);
  } catch (err) {
    console.error('Error en /productos:', err);
    return c.json({ error: 'Error interno en /productos', detalle: String(err) }, 500);
  }
});

// GET /carro/:ciudadanoId - Obtener o crear el carro de compras de un ciudadano
openapi.get('/carro/:ciudadanoId', async (c) => {
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
openapi.get('/carro/detalle/:carroId', async (c) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  const carro = await db.prepare('SELECT * FROM CarroCompras WHERE id = ?').bind(carroId).first();
  const detalles = await db.prepare('SELECT * FROM DetalleProducto WHERE carroId = ?').bind(carroId).all();
  return c.json({ carro, detalles: detalles.results });
});

// POST /carro/:carroId/tramitar - Tramitar el carro de compras
openapi.post('/carro/:carroId/tramitar', async (c) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  await db.prepare('UPDATE CarroCompras SET estado = "tramitado" WHERE id = ?').bind(carroId).run();
  return c.json({ ok: true });
});

// POST /carro/:carroId/producto - Agregar producto o catálogo al carro
openapi.post('/carro/:carroId/producto', async (c) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  const { productoId, catalogoId, cantidad } = await c.req.json();
  await db.prepare('INSERT INTO DetalleProducto (carroId, productoId, catalogoId, cantidad) VALUES (?, ?, ?, ?)')
    .bind(carroId, productoId || null, catalogoId || null, cantidad).run();
  return c.json({ ok: true });
});

// PUT /carro/:carroId/detalle/:detalleId - Actualizar cantidad
openapi.put('/carro/:carroId/detalle/:detalleId', async (c) => {
  const db = c.env.DB;
  const detalleId = Number(c.req.param('detalleId'));
  const { cantidad } = await c.req.json();
  await db.prepare('UPDATE DetalleProducto SET cantidad = ? WHERE id = ?').bind(cantidad, detalleId).run();
  return c.json({ ok: true });
});

// DELETE /carro/:carroId/detalle/:detalleId - Eliminar producto del carro
openapi.delete('/carro/:carroId/detalle/:detalleId', async (c) => {
  const db = c.env.DB;
  const detalleId = Number(c.req.param('detalleId'));
  await db.prepare('DELETE FROM DetalleProducto WHERE id = ?').bind(detalleId).run();
  return c.json({ ok: true });
});

// GET /notificaciones/:ciudadanoId - Consultar notificaciones del estado del carro
openapi.get('/notificaciones/:ciudadanoId', async (c) => {
  return c.json({ notificaciones: [
    { mensaje: 'Carro tramitado', fecha: new Date().toISOString() }
  ] });
});

const app = new Hono();
app.route('/api', openapi);

// Swagger UI (served at /)
app.get('/', (c) => c.html(getSwaggerUI('/api/openapi.json')));

export default app;
