import { Hono } from 'hono';
import type { Context } from 'hono';
import { sendEmail } from '../resend';
import { fromHono } from 'chanfana';
import { generarEmailHTML } from '../utils/email-template';
import { requireAdminToken } from '..';

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

  // Verificar stock suficiente antes de tramitar
  for (const detalle of detalles) {
    const producto = await db.prepare('SELECT stock, nombre FROM Producto WHERE id = ?').bind(detalle.producto.id).first();
    if (!producto || producto.stock === undefined) {
      return c.json({ ok: false, error: `Producto no encontrado: ${detalle.producto.nombre}` }, 400);
    }
    if (detalle.cantidad > producto.stock) {
      return c.json({
        ok: false,
        error: 'Stock insuficiente',
        producto: producto.nombre,
        stockDisponible: producto.stock,
        solicitado: detalle.cantidad,
        detalleId: detalle.id ?? undefined,
        productoId: detalle.producto?.id ?? detalle.productoId ?? undefined
      }, 400);
    }
  }

  // Descontar stock
  for (const detalle of detalles) {
    await db.prepare('UPDATE Producto SET stock = stock - ? WHERE id = ?')
      .bind(detalle.cantidad, detalle.producto.id).run();
  }

  // Actualizar estado y fecha/hora de tramitación
  const now = new Date();
  const fecha = now.toISOString();
  await db.prepare('UPDATE CarroCompras SET estado = "tramitado", fecha = ? WHERE id = ?').bind(fecha, carroId).run();

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

// GET /carro/lista/:ciudadanoId - Listar todos los carros de un ciudadano (con subtotal calculado)
carroRoutes.get('/lista/:ciudadanoId', async (c: Context) => {
  const db = c.env.DB;
  const ciudadanoId = Number(c.req.param('ciudadanoId'));
  // Traer solo los carros activos del ciudadano
  const carros = await db.prepare('SELECT * FROM CarroCompras WHERE ciudadanoId = ? AND estado = "activo"').bind(ciudadanoId).all();
  // Para cada carro, calcular el subtotal si no está
  const carrosConSubtotal = await Promise.all(carros.results.map(async (carro: any) => {
    // Traer detalles
    const detallesRaw = await db.prepare(`
      SELECT d.id, d.productoId, d.cantidad, d.subtotal, p.nombre, p.precio, p.codigo
      FROM DetalleProducto d
      LEFT JOIN Producto p ON d.productoId = p.id
      WHERE d.carroId = ?
    `).bind(carro.id).all();
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
    // Calcular subtotal
    const subtotal = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
    return { ...carro, subtotal };
  }));
  return c.json(carrosConSubtotal);
});

// GET /carro/tramitados/:ciudadanoId - Listar todos los carros tramitados de un ciudadano (solo admin)
carroRoutes.get('/tramitados/:ciudadanoId', async (c: Context) => {
  const db = c.env.DB;
  const ciudadanoId = Number(c.req.param('ciudadanoId'));
  // Traer solo los carros tramitados del ciudadano
  const carros = await db.prepare('SELECT * FROM CarroCompras WHERE ciudadanoId = ? AND estado = "tramitado"').bind(ciudadanoId).all();
  // Para cada carro, calcular el subtotal y cantidad de productos si no están
  const carrosConDatos = await Promise.all(carros.results.map(async (carro: any) => {
    const detallesRaw = await db.prepare(`
      SELECT d.id, d.productoId, d.cantidad, d.subtotal, p.nombre, p.precio, p.codigo
      FROM DetalleProducto d
      LEFT JOIN Producto p ON d.productoId = p.id
      WHERE d.carroId = ?
    `).bind(carro.id).all();
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
    // Calcular subtotal y cantidad de productos
    const total = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
    const cantidadProductos = detalles.reduce((sum, d) => sum + (d.cantidad || 0), 0);
    return { ...carro, total, cantidadProductos };
  }));
  return c.json(carrosConDatos);
});

// PUT /carro/:carroId - Editar atributos del carro (admin)
carroRoutes.put('/:carroId', async (c: Context) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  const data = await c.req.json();
  await db.prepare('UPDATE CarroCompras SET descripcion = ?, observaciones = ?, concepto = ? WHERE id = ?')
    .bind(data.descripcion, data.observaciones, data.concepto, carroId).run();
  return c.json({ success: true });
});

// POST /carro - Crear un nuevo carro vacío para un ciudadano
carroRoutes.post('/', async (c: Context) => {
  const db = c.env.DB;
  const { ciudadanoId } = await c.req.json();
  if (!ciudadanoId) {
    return c.json({ error: 'ciudadanoId requerido' }, 400);
  }
  const codigo = `CARRO-${Date.now()}`;
  await db.prepare('INSERT INTO CarroCompras (ciudadanoId, codigo, estado) VALUES (?, ?, "activo")').bind(ciudadanoId, codigo).run();
  const carro = await db.prepare('SELECT * FROM CarroCompras WHERE ciudadanoId = ? AND estado = "activo" ORDER BY id DESC').bind(ciudadanoId).first();
  return c.json(carro);
});

// PUT /carro/:carroId/detalle/:detalleId - Actualizar cantidad
carroRoutes.put('/:carroId/detalle/:detalleId', async (c: Context) => {
  const db = c.env.DB;
  const carroId = Number(c.req.param('carroId'));
  const detalleId = Number(c.req.param('detalleId'));
  const { cantidad } = await c.req.json();
  // Obtener el productoId del detalle
  const detalle = await db.prepare('SELECT productoId FROM DetalleProducto WHERE id = ?').bind(detalleId).first();
  if (!detalle) {
    return c.json({ ok: false, error: 'Detalle no encontrado' }, 404);
  }
  // Verificar stock
  const producto = await db.prepare('SELECT stock, nombre FROM Producto WHERE id = ?').bind(detalle.productoId).first();
  if (!producto || producto.stock === undefined) {
    return c.json({ ok: false, error: 'Producto no encontrado' }, 400);
  }
  if (cantidad > producto.stock) {
    return c.json({
      ok: false,
      error: 'Stock insuficiente',
      producto: producto.nombre,
      stockDisponible: producto.stock,
      solicitado: cantidad,
      detalleId: detalleId,
      productoId: detalle.productoId
    }, 400);
  }
  // Actualizar cantidad
  await db.prepare('UPDATE DetalleProducto SET cantidad = ? WHERE id = ?').bind(cantidad, detalleId).run();
  return c.json({ ok: true });
});
