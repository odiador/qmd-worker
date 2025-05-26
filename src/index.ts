import { Context, Hono } from 'hono';
import { fromHono, getSwaggerUI } from 'chanfana';
import { carroRoutes } from './endpoints/carro';
import { detalleRoutes } from './endpoints/detalle';
import { notificacionRoutes } from './endpoints/notificacion';
import adminAuth from './endpoints/adminAuth';
import bcrypt from 'bcryptjs';

const openapi = fromHono(new Hono(), {
  schema: { openapi: '3.1.0', info: { title: 'QMD API', version: '1.0.0' } }
});

// --- CORS Middleware ---
openapi.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Access-Control-Allow-Origin', '*');
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

openapi.route('/carro', carroRoutes);
openapi.route('/carro', detalleRoutes);
openapi.route('/notificaciones', notificacionRoutes);

// --- ENDPOINT DE LOGIN ADMIN ---
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
  return c.json({ success: true, adminId: user.id, email: user.email });
});

const app = new Hono();
app.route('/api', openapi);

// Swagger UI (served at /)
app.get('/', (c) => c.html(getSwaggerUI('/api/openapi.json')));

export default app;
