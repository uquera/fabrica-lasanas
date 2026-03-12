#!/bin/bash
# ===========================================
# Script de despliegue - Fábrica Lasañas
# Ejecutar en el servidor Hostinger VPS:
#   chmod +x deploy.sh
#   ./deploy.sh
# ===========================================

set -e  # Detener si hay algún error

APP_DIR="/home/usuario/fabrica-lasanas"  # <-- Cambiar por tu ruta real

echo "==> Entrando al directorio de la app..."
cd "$APP_DIR"

echo "==> Descargando últimos cambios..."
git pull origin main

echo "==> Instalando dependencias..."
npm ci --omit=dev

echo "==> Generando cliente Prisma..."
npx prisma generate

echo "==> Aplicando migraciones de base de datos..."
npx prisma migrate deploy

echo "==> Construyendo la app..."
npm run build

echo "==> Copiando archivos estáticos para modo standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> Reiniciando servidor con PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo ""
echo "✅ Despliegue completado. La app corre en puerto 3000."
echo "   Para ver los logs: pm2 logs fabrica-lasanas"
