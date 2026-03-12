// Configuración de PM2 para Hostinger VPS
// Uso: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "fabrica-lasanas",
      // Next.js standalone mode usa server.js directamente
      script: ".next/standalone/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
