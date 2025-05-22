-- Migración con datos de prueba adicionales para QMD
-- Ciudadanos adicionales
INSERT INTO Ciudadano (cedula, nombre, apellido, direccion, telefono, email) VALUES 
('1094567890', 'Ana', 'Martínez', 'Avenida 123 #45-67, Armenia', '3183456789', 'ana.martinez@example.com'),
('1094678901', 'Roberto', 'López', 'Carrera 45 #67-89, Armenia', '3004567890', 'roberto.lopez@example.com'),
('1094789012', 'Sofía', 'Torres', 'Calle 78 #90-12, Armenia', '3165678901', 'sofia.torres@example.com'),
('1094890123', 'Miguel', 'García', 'Diagonal 90 #12-34, Armenia', '3106789012', 'miguel.garcia@example.com'),
('1094901234', 'Laura', 'Hernández', 'Transversal 12 #34-56, Armenia', '3137890123', 'laura.hernandez@example.com');

-- Productos adicionales con más detalles
INSERT INTO Producto (codigo, nombre, categoriaPrincipal, categoriaSecundaria, descripcion, precio, stock, caracteristicas, garantia) VALUES 
('PROD-101', 'Smart TV 65" OLED', 'Electrónica', 'Televisores', 'Televisor OLED de alta gama con HDR10+ y sonido premium', 4999900, 5, 'Resolución 4K, HDR10+, WebOS, Dolby Vision y Atmos', '2 años'),
('PROD-102', 'Smartphone Plegable', 'Electrónica', 'Celulares', 'Smartphone con pantalla plegable y cámara de 108MP', 3999900, 8, 'Pantalla plegable de 7.6", 12GB RAM, 512GB almacenamiento', '1 año'),
('PROD-103', 'Aspiradora Robot', 'Hogar', 'Electrodomésticos', 'Robot aspirador con mapeo láser y control por app', 899900, 12, 'Mapeo láser, 120min autonomía, sensor anti-caídas', '1 año'),
('PROD-104', 'Cafetera Expresso', 'Hogar', 'Cocina', 'Cafetera profesional con molinillo integrado', 1299900, 7, '15 bares de presión, molinillo de 18 ajustes, espumador de leche', '2 años'),
('PROD-105', 'Laptop Gaming', 'Electrónica', 'Computadores', 'Laptop para gaming con tarjeta gráfica dedicada', 4599900, 4, 'Procesador i9, 32GB RAM, RTX 4080, 1TB SSD, pantalla 144Hz', '2 años'),
('PROD-106', 'Set de Ollas Premium', 'Hogar', 'Cocina', 'Juego de 10 ollas y sartenes antiadherentes', 799900, 10, 'Acero inoxidable, antiadherente cerámica, aptas inducción', '5 años'),
('PROD-107', 'Bicicleta Montaña', 'Deportes', 'Ciclismo', 'Bicicleta todo terreno con suspensión doble', 2499900, 6, 'Marco de carbono, 29", cambios Shimano, frenos hidráulicos', '1 año en marco'),
('PROD-108', 'Drone con Cámara 4K', 'Electrónica', 'Fotografía', 'Drone plegable con estabilizador y grabación 4K', 1899900, 8, '30min autonomía, 4K/60fps, alcance 8km, seguimiento automático', '1 año'),
('PROD-109', 'Consola Última Generación', 'Electrónica', 'Gaming', 'Consola de videojuegos de última generación', 2799900, 5, '1TB SSD, ray tracing, 4K/120fps, retrocompatible', '1 año'),
('PROD-110', 'Reloj Inteligente Premium', 'Electrónica', 'Wearables', 'Smartwatch de alta gama con ECG y monitor de sueño', 1299900, 15, 'ECG, SpO2, GPS, resistente al agua 50m, batería 7 días', '2 años');

-- Catálogos adicionales
INSERT INTO CatalogoPreferencias (codigo, nombre, descripcion, cantidad, estado) VALUES 
('CAT-101', 'Hogar Inteligente', 'Productos para automatizar el hogar', 6, 'activo'),
('CAT-102', 'Gaming Pro', 'Equipamiento completo para gamers', 5, 'activo'),
('CAT-103', 'Cocina Premium', 'Artículos de alta gama para cocina', 7, 'activo');

-- Crear carros para distintos usuarios
-- Carro para Ana Martínez (productos tecnológicos)
INSERT INTO CarroCompras (ciudadanoId, codigo, fecha, estado, subtotal, total) VALUES 
(4, 'CARRO-ANA-1', date('now'), 'activo', 0, 0);

-- Agregar productos al carro de Ana
INSERT INTO DetalleProducto (carroId, productoId, cantidad, monto) VALUES 
(2, 9, 1, 2799900),  -- Consola
(2, 5, 1, 4599900);  -- Laptop Gaming

-- Actualizar el total del carro de Ana
UPDATE CarroCompras 
SET subtotal = 7399800, 
    impuesto = 7399800 * 0.19, 
    total = 7399800 * 1.19
WHERE id = 2;

-- Carro para Roberto López (productos para el hogar)
INSERT INTO CarroCompras (ciudadanoId, codigo, fecha, estado, subtotal, total) VALUES 
(5, 'CARRO-ROBERTO-1', date('now'), 'activo', 0, 0);

-- Agregar productos al carro de Roberto
INSERT INTO DetalleProducto (carroId, productoId, cantidad, monto) VALUES 
(3, 3, 1, 899900),   -- Aspiradora Robot
(3, 4, 1, 1299900),  -- Cafetera
(3, 6, 2, 1599800);  -- Set de Ollas (2 unidades)

-- Actualizar el total del carro de Roberto
UPDATE CarroCompras 
SET subtotal = 3799600, 
    impuesto = 3799600 * 0.19, 
    total = 3799600 * 1.19
WHERE id = 3;

-- Carro para Sofía Torres (productos deportivos)
INSERT INTO CarroCompras (ciudadanoId, codigo, fecha, estado, subtotal, total) VALUES 
(6, 'CARRO-SOFIA-1', date('now', '-3 days'), 'tramitado', 0, 0);

-- Agregar productos al carro de Sofía
INSERT INTO DetalleProducto (carroId, productoId, cantidad, monto) VALUES 
(4, 7, 1, 2499900), -- Bicicleta
(4, 10, 1, 1299900); -- Reloj Inteligente

-- Actualizar el total del carro de Sofía
UPDATE CarroCompras 
SET subtotal = 3799800, 
    impuesto = 3799800 * 0.19, 
    total = 3799800 * 1.19
WHERE id = 4;

-- Carrito histórico para Miguel (ya tramitado)
INSERT INTO CarroCompras (ciudadanoId, codigo, fecha, estado, subtotal, total) VALUES 
(7, 'CARRO-MIGUEL-1', date('now', '-7 days'), 'tramitado', 6999800, 8329762);

-- Agregar productos al carro histórico de Miguel
INSERT INTO DetalleProducto (carroId, productoId, cantidad, monto) VALUES 
(5, 1, 1, 4999900), -- Smart TV OLED
(5, 8, 1, 1899900); -- Drone

-- Carrito de Laura (activo con varios productos)
INSERT INTO CarroCompras (ciudadanoId, codigo, fecha, estado, subtotal, total) VALUES 
(8, 'CARRO-LAURA-1', date('now'), 'activo', 0, 0);

-- Agregar productos variados al carro de Laura
INSERT INTO DetalleProducto (carroId, productoId, cantidad, monto) VALUES 
(6, 2, 1, 3999900), -- Smartphone Plegable
(6, 3, 1, 899900),  -- Aspiradora
(6, 10, 1, 1299900); -- Reloj Inteligente

-- Actualizar el total del carro de Laura
UPDATE CarroCompras 
SET subtotal = 6199700, 
    impuesto = 6199700 * 0.19, 
    total = 6199700 * 1.19
WHERE id = 6;
