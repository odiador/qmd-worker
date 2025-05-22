-- Datos de prueba para la base de datos QMD

-- Insertar ciudadanos de prueba
INSERT INTO Ciudadano (cedula, nombre, apellido, direccion, telefono, email) VALUES 
('1094123456', 'Juan', 'Pérez', 'Calle 123 #45-67, Armenia', '3101234567', 'juan.perez@example.com'),
('1094234567', 'María', 'González', 'Avenida 89 #12-34, Armenia', '3202345678', 'maria.gonzalez@example.com'),
('1094345678', 'Carlos', 'Rodríguez', 'Carrera 56 #78-90, Armenia', '3133456789', 'carlos.rodriguez@example.com');

-- Insertar productos de prueba
INSERT INTO Producto (codigo, nombre, categoriaPrincipal, categoriaSecundaria, descripcion, precio, stock) VALUES 
('PROD-001', 'Smartphone Galaxy S23', 'Electrónica', 'Celulares', 'Smartphone de última generación con cámara de 108MP y 256GB de almacenamiento', 2499900, 15),
('PROD-002', 'Laptop Inspiron 15', 'Electrónica', 'Computadores', 'Laptop con procesador i7, 16GB RAM y 512GB SSD', 3299900, 8),
('PROD-003', 'Smart TV 55"', 'Electrónica', 'Televisores', 'Televisor 4K UHD con Android TV', 1999900, 10),
('PROD-004', 'Audifonos Bluetooth', 'Electrónica', 'Audio', 'Audifonos inalámbricos con cancelación de ruido', 499900, 25),
('PROD-005', 'Cámara DSLR', 'Electrónica', 'Fotografía', 'Cámara profesional con sensor de 24MP', 1899900, 5),
('PROD-006', 'Consola de Videojuegos', 'Electrónica', 'Gaming', 'Consola de última generación con 1TB de almacenamiento', 2299900, 7),
('PROD-007', 'Tablet 10.1"', 'Electrónica', 'Tablets', 'Tablet Android con 64GB y pantalla HD', 899900, 12),
('PROD-008', 'Reloj Inteligente', 'Electrónica', 'Wearables', 'Smartwatch con monitor cardíaco y GPS', 599900, 18),
('PROD-009', 'Impresora Multifuncional', 'Electrónica', 'Impresoras', 'Impresora láser con escáner y wifi', 799900, 6),
('PROD-010', 'Altavoz Inteligente', 'Electrónica', 'Audio', 'Altavoz con asistente virtual integrado', 399900, 20);

-- Insertar preferencias de catálogo
INSERT INTO CatalogoPreferencias (codigo, nombre, descripcion, cantidad, estado) VALUES 
('CAT-001', 'Productos Destacados', 'Selección de productos más vendidos', 5, 'activo'),
('CAT-002', 'Ofertas Especiales', 'Productos con descuentos', 3, 'activo'),
('CAT-003', 'Novedades', 'Últimos productos agregados', 4, 'activo');

-- Crear un carrito de ejemplo para Juan Pérez
INSERT INTO CarroCompras (ciudadanoId, codigo, fecha, estado, subtotal, total) VALUES 
(1, 'CARRO-001', date('now'), 'activo', 0, 0);

-- Agregar productos al carrito de Juan
INSERT INTO DetalleProducto (carroId, productoId, cantidad, monto) VALUES 
(1, 1, 1, 2499900),
(1, 4, 2, 999800);

-- Actualizar el total del carrito
UPDATE CarroCompras 
SET subtotal = 3499700, 
    impuesto = 3499700 * 0.19, 
    total = 3499700 * 1.19
WHERE id = 1;
