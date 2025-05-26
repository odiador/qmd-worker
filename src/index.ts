import bcrypt from 'bcryptjs';
import { fromHono, getSwaggerUI } from 'chanfana';
import { Context, Hono } from 'hono';
import { carroRoutes } from './endpoints/carro';
import { detalleRoutes } from './endpoints/detalle';
import { notificacionRoutes } from './endpoints/notificacion';

declare var crypto: Crypto;

const openapi = fromHono(new Hono(), {
  schema: { openapi: '3.1.0', info: { title: 'QMD API', version: '1.0.0' } }
});

// --- CORS Middleware ---
openapi.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  // c.res.headers.set('Access-Control-Allow-Origin', 'https://qmd.odiador.dev');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-token');
});

// --- Opcional: responder preflight ---
openapi.options('*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-token');
  return c.body(null, 204);
});

// --- RUTAS PRINCIPALES ---
// Solo rutas globales (ciudadanos, productos, notificaciones)
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

// GET /ciudadanos - Listar ciudadanos
openapi.get('/ciudadanos', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT id, cedula, nombre, apellido FROM Ciudadano').all();
    return c.json(results);
  } catch (err) {
    console.error('Error en /ciudadanos:', err);
    return c.json({ error: 'Error interno en /ciudadanos', detalle: String(err) }, 500);
  }
});

// GET /ciudadanos/:id - Obtener un ciudadano por ID
openapi.get('/ciudadanos/:id', async (c: Context) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const ciudadano = await db.prepare('SELECT * FROM Ciudadano WHERE id = ?').bind(id).first();
    if (!ciudadano) {
      return c.json({ error: 'No encontrado' }, 404);
    }
    return c.json(ciudadano);
  } catch (err) {
    console.error('Error en /ciudadanos/:id:', err);
    return c.json({ error: 'Error interno en /ciudadanos/:id', detalle: String(err) }, 500);
  }
});

// --- LOGIN ADMIN CON TOKEN ---
openapi.post('/admin/login', async (c) => {
  const { email, password } = await c.req.json();
  const db = c.env.DB;
  const user = await db.prepare('SELECT * FROM AdminUser WHERE email = ?').bind(email).first();
  if (!user) {
    return c.json({ error: 'Usuario o contraseña incorrectos' }, 401);
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'Usuario o contraseña incorrectos' }, 401);
  }
  // Generar token seguro compatible con Workers
  const token = generateToken();
  globalThis.adminTokens = globalThis.adminTokens || new Set();
  globalThis.adminTokens.add(token);
  return c.json({ success: true, adminId: user.id, email: user.email, token });
});

// Función para generar token seguro usando Web Crypto API compatible con Cloudflare Workers
function generateToken() {
  const array = new Uint8Array(32);
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    crypto.getRandomValues(array);
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Middleware seguro para admin
export function requireAdminToken(c, next) {
  const token = c.req.header('x-admin-token');
  // LOG para depuración
  console.log('Token recibido:', token);
  console.log('Tokens válidos en memoria:', globalThis.adminTokens ? Array.from(globalThis.adminTokens) : []);
  if (!token || !globalThis.adminTokens || !globalThis.adminTokens.has(token)) {
    return c.json({ error: 'No autorizado' }, 401);
  }
  return next();
}

// --- ENDPOINTS PROTEGIDOS ---
openapi.put('/editciudadano/:id', requireAdminToken, async (c: Context) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const data = await c.req.json();
    await db.prepare('UPDATE Ciudadano SET nombre = ?, apellido = ?, cedula = ?, direccion = ?, telefono = ?, email = ?, fechaNacimiento = ?, genero = ?, estado = ? WHERE id = ?')
      .bind(
        data.nombre,
        data.apellido,
        data.cedula,
        data.direccion,
        data.telefono,
        data.email,
        data.fechaNacimiento,
        data.genero,
        data.estado,
        id
      ).run();
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Error al actualizar ciudadano', detalle: String(err) }, 500);
  }
});

openapi.delete('/ciudadanos/:id', requireAdminToken, async (c: Context) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    // Eliminar detalles relacionados a los carros del ciudadano
    const carros = await db.prepare('SELECT id FROM CarroCompras WHERE ciudadanoId = ?').bind(id).all();
    for (const carro of carros.results) {
      await db.prepare('DELETE FROM DetalleProducto WHERE carroId = ?').bind(carro.id).run();
    }
    // Eliminar carros del ciudadano
    await db.prepare('DELETE FROM CarroCompras WHERE ciudadanoId = ?').bind(id).run();
    // Eliminar el ciudadano
    await db.prepare('DELETE FROM Ciudadano WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (err) {
    console.error('Error en DELETE /ciudadanos/:id:', err);
    return c.json({ error: 'Error al eliminar ciudadano', detalle: String(err) }, 500);
  }
});

openapi.get('/carro/:ciudadanoId', async (c: Context) => {
  try {
    const db = c.env.DB;
    const ciudadanoId = c.req.param('ciudadanoId');
    const { results } = await db.prepare('SELECT * FROM CarroCompras WHERE ciudadanoId = ?').bind(ciudadanoId).all();
    return c.json(results);
  } catch (err) {
    return c.json({ error: 'Error al obtener carros', detalle: String(err) }, 500);
  }
});

// POST /ciudadanos - Crear un nuevo ciudadano
openapi.post('/ciudadanos', async (c: Context) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();
    const result = await db.prepare(`
      INSERT INTO Ciudadano (nombre, apellido, cedula, email, direccion, telefono, fechaNacimiento, genero, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.nombre,
      data.apellido,
      data.cedula,
      data.email || null,
      data.direccion || null,
      data.telefono || null,
      data.fechaNacimiento || null,
      data.genero || null,
      'Activo' // Estado por defecto
    ).run();
    const ciudadano = await db.prepare('SELECT * FROM Ciudadano WHERE id = ?').bind(result.lastInsertRowId).first();
    return c.json(ciudadano);
  } catch (err) {
    return c.json({ error: 'Error al crear ciudadano', detalle: String(err) }, 500);
  }
});

openapi.route('/carro', carroRoutes);
openapi.route('/carro', detalleRoutes);
openapi.route('/notificaciones', notificacionRoutes);

const app = new Hono();
app.route('/api', openapi);
app.get('/', (c) => c.html(getSwaggerUI('/api/openapi.json')));

export default app;
