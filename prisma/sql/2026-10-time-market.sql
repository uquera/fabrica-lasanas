-- Módulo Time Market: crea SOLO tablas nuevas. No modifica ni borra nada existente.
-- Ejecutar una vez en el VPS:  npx prisma db execute --file prisma/sql/2026-10-time-market.sql

CREATE TABLE IF NOT EXISTS "TmConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "precioIndividual" DOUBLE PRECISION NOT NULL DEFAULT 5300,
    "precioMini" DOUBLE PRECISION NOT NULL DEFAULT 2521,
    "tasaIva" DOUBLE PRECISION NOT NULL DEFAULT 0.19,
    "usarMini" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TmConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TmTienda" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL DEFAULT '',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TmTienda_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TmTienda_nombre_key" ON "TmTienda"("nombre");

CREATE TABLE IF NOT EXISTS "TmGuia" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "precioIndividual" DOUBLE PRECISION NOT NULL,
    "precioMini" DOUBLE PRECISION NOT NULL,
    "tasaIva" DOUBLE PRECISION NOT NULL DEFAULT 0.19,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TmGuia_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TmGuia_fecha_key" ON "TmGuia"("fecha");
CREATE INDEX IF NOT EXISTS "TmGuia_fecha_idx" ON "TmGuia"("fecha");

CREATE TABLE IF NOT EXISTS "TmLinea" (
    "id" TEXT NOT NULL,
    "guiaId" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "entregaIndividual" INTEGER NOT NULL DEFAULT 0,
    "entregaMini" INTEGER NOT NULL DEFAULT 0,
    "devolucionIndividual" INTEGER NOT NULL DEFAULT 0,
    "devolucionMini" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TmLinea_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TmLinea_guiaId_fkey" FOREIGN KEY ("guiaId") REFERENCES "TmGuia"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TmLinea_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "TmTienda"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "TmLinea_guiaId_tiendaId_key" ON "TmLinea"("guiaId", "tiendaId");
