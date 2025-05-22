#!/bin/bash

# Script para aplicar migraciones y datos de prueba a la base de datos D1
# Ejecutar desde la carpeta raíz del proyecto qmd-d1

echo "=== Aplicando migraciones a la base de datos D1 ==="

# Verificar que estamos en la carpeta correcta
if [ ! -f "wrangler.jsonc" ]; then
  echo "Error: Este script debe ejecutarse desde la carpeta raíz del proyecto qmd-d1"
  exit 1
fi

# Verificar que wrangler está instalado
if ! command -v npx &> /dev/null; then
  echo "Error: npx no está instalado. Instale Node.js y npm primero."
  exit 1
fi

# Aplicar todas las migraciones
echo "Aplicando migraciones..."
npx wrangler d1 migrations apply d1-db

if [ $? -eq 0 ]; then
  echo "✅ Migraciones aplicadas correctamente"
  echo "Base de datos poblada con datos de prueba:"
  echo "- 8 Ciudadanos"
  echo "- 20 Productos"
  echo "- 6 Catálogos de preferencias"
  echo "- 6 Carros de compras con detalles"
  
  # Opcional: Mostrar cómo consultar los datos
  echo -e "\nPara consultar los datos, puede usar los siguientes comandos:"
  echo "npx wrangler d1 execute d1-db --command 'SELECT * FROM Ciudadano'"
  echo "npx wrangler d1 execute d1-db --command 'SELECT * FROM Producto'"
  echo "npx wrangler d1 execute d1-db --command 'SELECT * FROM CarroCompras'"
  echo "npx wrangler d1 execute d1-db --command 'SELECT * FROM DetalleProducto'"
else
  echo "❌ Error al aplicar las migraciones"
fi

echo -e "\nPara iniciar el servidor de desarrollo, ejecute:"
echo "npx wrangler dev"
