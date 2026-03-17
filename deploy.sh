#!/bin/bash
# =============================================================
# deploy.sh — Fabrica Lasañas · Hostinger VPS Setup
# Uso: bash deploy.sh
# =============================================================
set -e

APP_DIR="/root/fabrica-lasanas"
DATA_DIR="$APP_DIR/data"
REPO="https://github.com/uquera/fabrica-lasanas.git"
NODE_VERSION="20"

# ── Colores ───────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
info() { echo -e "${YELLOW}▶ $1${NC}"; }

# ── 1. Sistema ─────────────────────────────────────────────────
info "Actualizando paquetes del sistema..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git nginx ufw
ok "Sistema actualizado"

# ── 2. Node.js 20 LTS ─────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
  info "Instalando Node.js ${NODE_VERSION}..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi
ok "Node.js $(node -v)"

# ── 3. PM2 ────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Instalando PM2..."
  npm install -g pm2 --silent
fi
ok "PM2 $(pm2 -v)"

# ── 4. Clonar / actualizar repositorio ───────────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Actualizando repositorio..."
  cd "$APP_DIR"
  git pull origin main
else
  info "Clonando repositorio..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi
ok "Repositorio listo en $APP_DIR"

# ── 5. Directorio de datos ────────────────────────────────────
mkdir -p "$DATA_DIR"
ok "Directorio de datos: $DATA_DIR"

# ── 6. Variables de entorno ───────────────────────────────────
info "Creando archivo .env..."
cat > "$APP_DIR/.env" <<'ENVEOF'
DATABASE_URL="file:/root/fabrica-lasanas/data/prod.db"
GMAIL_USER=donna.any.cl@gmail.com
GMAIL_APP_PASSWORD=dqdiihnypxuopnsn
GEMINI_API_KEY=AIzaSyB7xzizu16xCbmMRiYREvo0fQlBJukzJmw
NODE_ENV=production
ENVEOF
ok ".env creado"

# ── 7. Dependencias ───────────────────────────────────────────
info "Instalando dependencias npm..."
cd "$APP_DIR"
npm install --silent
ok "npm install completado"

# ── 8. Prisma ─────────────────────────────────────────────────
info "Generando Prisma Client..."
npx prisma generate

info "Aplicando schema a la base de datos..."
npx prisma db push --accept-data-loss
ok "Base de datos lista"

# ── 9. Seed inicial (solo si la DB está vacía) ────────────────
info "Verificando producto inicial..."
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:/root/fabrica-lasanas/data/prod.db' });
async function run() {
  try {
    const r = await client.execute('SELECT COUNT(*) as c FROM Producto');
    if (r.rows[0].c == 0) {
      await client.execute({
        sql: 'INSERT INTO Producto (id, sku, nombre, precioBase, tasaIva, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?)',
        args: ['prod_1','LAS-TRAD-01','Lasaña Tradicional',5042,0.19,new Date().toISOString(),new Date().toISOString()]
      });
      console.log('Producto insertado.');
    } else {
      console.log('Producto ya existe (' + r.rows[0].c + ').');
    }
  } catch(e) { console.error('Seed error:', e.message); }
}
run();
"
ok "Producto verificado"

# ── 10. Build ─────────────────────────────────────────────────
info "Construyendo la aplicación (puede tardar 2-3 min)..."
npm run build
ok "Build completado"

# ── 10b. Copiar archivos estáticos al directorio standalone ───
# Requerido por Next.js output:'standalone' para servir CSS/JS correctamente
info "Copiando archivos estáticos a standalone..."
cp -r "$APP_DIR/.next/static" "$APP_DIR/.next/standalone/.next/static"
cp -r "$APP_DIR/public" "$APP_DIR/.next/standalone/public" 2>/dev/null || true
ok "Archivos estáticos copiados"

# ── 11. PM2 ───────────────────────────────────────────────────
info "Iniciando/reiniciando con PM2..."
pm2 stop fabrica-lasanas 2>/dev/null || true
pm2 delete fabrica-lasanas 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Configurar PM2 para arrancar al reiniciar el servidor
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root 2>/dev/null | grep -E "^sudo|^env" | bash || true
ok "PM2 configurado (puerto 3000)"

# ── 12. Nginx ─────────────────────────────────────────────────
info "Configurando Nginx como reverse proxy..."
cat > /etc/nginx/sites-available/fabrica-lasanas <<'NGINXEOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/fabrica-lasanas /etc/nginx/sites-enabled/fabrica-lasanas
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configurado"

# ── 13. Firewall ──────────────────────────────────────────────
info "Configurando firewall..."
ufw allow 22/tcp   >/dev/null 2>&1 || true
ufw allow 80/tcp   >/dev/null 2>&1 || true
ufw allow 443/tcp  >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true
ok "Firewall activo (puertos 22, 80, 443)"

# ── Resumen ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment completado exitosamente!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "  App en:      ${YELLOW}http://31.97.86.247${NC}"
echo -e "  Estado:      pm2 status"
echo -e "  Logs:        pm2 logs fabrica-lasanas"
echo -e "  Reiniciar:   pm2 restart fabrica-lasanas"
echo ""
