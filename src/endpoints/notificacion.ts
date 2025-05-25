import { Hono } from 'hono';
import { fromHono } from 'chanfana';

export const notificacionRoutes = fromHono(new Hono());

// GET /notificaciones/:ciudadanoId - Consultar notificaciones del estado del carro
notificacionRoutes.get('/:ciudadanoId', async (c) => {
  // Simulación: en un sistema real, esto consultaría una tabla de notificaciones
  return c.json({ notificaciones: [
    { mensaje: 'Carro tramitado', fecha: new Date().toISOString() }
  ] });
});
