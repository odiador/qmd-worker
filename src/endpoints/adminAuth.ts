import { Context, Hono } from 'hono';
import bcrypt from 'bcryptjs';

const adminAuth = new Hono();

// Reemplazar getDB por acceso a c.env.DB (estilo Hono D1)
adminAuth.post('/login', async (c: Context) => {
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
  // Aquí podrías generar un token JWT si lo deseas
  return c.json({ success: true, adminId: user.id, email: user.email });
});

export default adminAuth;
