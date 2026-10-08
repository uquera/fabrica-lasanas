# Módulo Time Market

Replica la planilla "Guia Tiendas TM" dentro de la app.

**Lógica** (igual que la planilla):
- Cada guía es una visita del camión (martes y viernes): se *entrega* producto y se *retira* lo no vendido de la visita anterior.
- Venta efectiva de la guía N = entrega(N) − retiro registrado en la guía N+1.
- Neto = venta individual × precio individual + venta mini × precio mini. Los precios se congelan en cada guía al crearla.
- Una guía queda **abierta** hasta que exista la siguiente; el resumen por rango solo suma guías cerradas.

**Rutas:** `/timemarket` (lista), `/timemarket/nueva`, `/timemarket/[id]` (editar), `/timemarket/resumen?desde&hasta`, `/timemarket/config` (precios y tiendas), `/timemarket/importar` (JSON histórico).

## Deploy (una sola vez)

```bash
cd /root/fabrica-lasanas
git pull origin main
npm install
npx prisma db execute --file prisma/sql/2026-10-time-market.sql   # solo crea tablas nuevas
npx prisma generate
npm run build
cp -r .next/static .next/standalone/.next/static
pm2 restart fabrica-lasanas
```

Luego: `/timemarket/config` → revisar precio (por defecto toma el del producto individual) → `/timemarket/importar` → subir `tm-historico-2026.json`.

## Formato del JSON de importación

```json
{ "tiendas": [{ "nombre": "Playa Brava", "direccion": "Arturo Prat 1656" }],
  "guias": [{ "fecha": "2026-10-02", "lineas": [["Playa Brava", 3, 0, 2, 0]] }] }
```
Cada línea: `[tienda, entregaIndividual, entregaMini, devolucionIndividual, devolucionMini]`.
