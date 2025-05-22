# QMD-D1: Backend API para "Llenar Carro de Productos"

Este README describe los pasos para implementar la API backend en el proyecto `qmd-d1` usando Cloudflare Workers y D1, siguiendo la especificación del proceso "Llenar Carro de Productos".

## 1. Modelado de la Base de Datos (D1)

1. Define el esquema SQL para las siguientes entidades y relaciones:
   - Ciudadano
   - Producto
   - CatalogoPreferencias
   - CarroCompras
   - DetalleProducto
2. Crea los scripts de migración en la carpeta `migrations/` o usando `npx wrangler d1 migrations create`.
3. Aplica las migraciones con `npx wrangler d1 migrations apply`.

## 2. Estructura del Proyecto

- `src/types.ts`: Define los tipos TypeScript para las entidades del dominio.
- `src/endpoints/`: Implementa aquí los endpoints RESTful.
- `src/index.ts`: Registra y expone los endpoints.

## 3. Implementación de Endpoints (API RESTful)

Implementa los siguientes endpoints:

- **GET /productos**: Listar productos disponibles.
- **GET /carro/:ciudadanoId**: Obtener o crear el carro de compras de un ciudadano.
- **POST /carro/:carroId/producto**: Agregar producto o catálogo al carro.
- **PUT /carro/:carroId/detalle/:detalleId**: Actualizar cantidad de un producto en el carro.
- **DELETE /carro/:carroId/detalle/:detalleId**: Eliminar producto del carro.
- **GET /carro/:carroId**: Ver contenido completo del carro (con subtotales y total).
- **POST /carro/:carroId/tramitar**: Tramitar el carro de compras (validación y procesamiento).
- **GET /notificaciones/:ciudadanoId**: Consultar notificaciones del estado del carro.

## 4. Lógica de Negocio

- Implementa la lógica de cálculo de subtotales, impuestos y total en el backend.
- Aplica reglas de validación (ej. disponibilidad de productos, verificación de ciudadano).

## 5. Pruebas Locales

- Usa `npx wrangler dev` para pruebas locales.
- Usa herramientas como Postman o curl para probar los endpoints.

## 6. Despliegue

- Despliega con `npx wrangler deploy`.

## 7. Notas

- El binding a la base de datos D1 ya está configurado como `env.DB`.
- Consulta la especificación en `../REQUIREMENTS.md` para detalles de negocio y dominio.

---

**Referencia:**
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
