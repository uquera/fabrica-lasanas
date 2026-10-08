"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  calcularGuias,
  fechaAIso,
  isoAFecha,
  resumenPorRango,
  siguienteFechaVisita,
  type TmGuiaData,
  type TmGuiaCalculada,
} from "@/lib/timemarket";

// Los modelos Tm* requieren `prisma generate` tras la migración; mientras tanto
// se accede sin tipado estricto, siguiendo el patrón del resto del proyecto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export type TmTienda = { id: string; nombre: string; direccion: string; orden: number; activa: boolean };
export type TmConfig = { precioIndividual: number; tasaIva: number };

const TIENDAS_INICIALES: { nombre: string; direccion: string }[] = [
  { nombre: "Playa Brava", direccion: "Arturo Prat 1656" },
  { nombre: "Peninsula", direccion: "Filomena Valenzuela 211" },
  { nombre: "Vivar", direccion: "Vivar 1656" },
  { nombre: "Terranova", direccion: "Francisco Bilbao 3717" },
  { nombre: "Bilbao 1 Chipana", direccion: "Francisco Bilbao 3412" },
  { nombre: "Bilbao 2", direccion: "Francisco Bilbao 3670" },
  { nombre: "Anibal Pinto", direccion: "Anibal Pinto 440" },
  { nombre: "Tarapaca", direccion: "Tarapaca 345" },
  { nombre: "Los Molles", direccion: "Arturo Prat 3082" },
];

// ── Config ────────────────────────────────────────────────────────────────────

export async function getTmConfig(): Promise<TmConfig> {
  let c = await db.tmConfig.findUnique({ where: { id: 1 } });
  if (!c) {
    // Precio por defecto: el del producto individual si existe, si no $5.300 neto
    const prod = await prisma.producto.findFirst({ where: { sku: { in: ["LAS-TRAD-IND", "LAS-TRAD-01"] } } });
    c = await db.tmConfig.create({
      data: { id: 1, precioIndividual: prod?.precioBase ?? 5300, tasaIva: prod?.tasaIva ?? 0.19 },
    });
  }
  return { precioIndividual: c.precioIndividual, tasaIva: c.tasaIva };
}

export async function updateTmConfig(data: Partial<TmConfig>) {
  await getTmConfig();
  await db.tmConfig.update({ where: { id: 1 }, data });
  revalidatePath("/timemarket");
  return { success: true };
}

// ── Tiendas ───────────────────────────────────────────────────────────────────

export async function getTmTiendas(soloActivas = false): Promise<TmTienda[]> {
  let tiendas = await db.tmTienda.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }] });
  if (tiendas.length === 0) {
    await db.tmTienda.createMany({ data: TIENDAS_INICIALES.map((t, i) => ({ ...t, orden: i })) });
    tiendas = await db.tmTienda.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }] });
  }
  return soloActivas ? tiendas.filter((t: TmTienda) => t.activa) : tiendas;
}

export async function upsertTmTienda(data: { id?: string; nombre: string; direccion: string; activa: boolean }) {
  const nombre = data.nombre.trim();
  if (!nombre) return { success: false, error: "El nombre es obligatorio." };
  try {
    if (data.id) {
      await db.tmTienda.update({ where: { id: data.id }, data: { nombre, direccion: data.direccion.trim(), activa: data.activa } });
    } else {
      const n = await db.tmTienda.count();
      await db.tmTienda.create({ data: { nombre, direccion: data.direccion.trim(), activa: data.activa, orden: n } });
    }
    revalidatePath("/timemarket");
    return { success: true };
  } catch {
    return { success: false, error: "Ya existe una tienda con ese nombre." };
  }
}

// ── Guías ─────────────────────────────────────────────────────────────────────

async function cargarGuias(): Promise<TmGuiaData[]> {
  const guias = await db.tmGuia.findMany({ include: { lineas: true }, orderBy: { fecha: "asc" } });
  type GuiaRow = { id: string; fecha: Date; precioIndividual: number; tasaIva: number; nota: string | null; lineas: LineaRow[] };
  type LineaRow = { tiendaId: string; entregaIndividual: number; devolucionIndividual: number };
  return (guias as GuiaRow[]).map((g) => ({
    id: g.id,
    fecha: fechaAIso(g.fecha),
    precioIndividual: g.precioIndividual,
    tasaIva: g.tasaIva,
    nota: g.nota,
    lineas: g.lineas.map((l) => ({
      tiendaId: l.tiendaId,
      entregaIndividual: l.entregaIndividual,
      devolucionIndividual: l.devolucionIndividual,
    })),
  }));
}

export async function getTmGuiasCalculadas(): Promise<TmGuiaCalculada[]> {
  return calcularGuias(await cargarGuias());
}

export async function getTmResumen(desde: string, hasta: string) {
  return resumenPorRango(await getTmGuiasCalculadas(), desde, hasta);
}

/** Propuesta para la siguiente guía: fecha (mar/vie) y entregas iguales a la última. */
export async function getTmPropuestaSiguiente() {
  const [config, tiendas, guias] = await Promise.all([getTmConfig(), getTmTiendas(true), cargarGuias()]);
  const ultima = guias[guias.length - 1] ?? null;
  const fecha = ultima ? siguienteFechaVisita(ultima.fecha) : siguienteFechaVisita(new Date().toISOString().slice(0, 10));
  const lineas = tiendas.map((t) => {
    const prev = ultima?.lineas.find((l) => l.tiendaId === t.id);
    return {
      tiendaId: t.id,
      entregaIndividual: prev?.entregaIndividual ?? 0,
      devolucionIndividual: 0,
    };
  });
  return { config, tiendas, fecha, ultimaFecha: ultima?.fecha ?? null, lineas };
}

export type TmGuiaInput = {
  id?: string;
  fecha: string; // YYYY-MM-DD
  nota?: string;
  lineas: {
    tiendaId: string;
    entregaIndividual: number;
    devolucionIndividual: number;
  }[];
};

const entero = (n: unknown) => Math.max(0, Math.floor(Number(n) || 0));

export async function saveTmGuia(input: TmGuiaInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)) return { success: false, error: "Fecha inválida." };
  const fecha = isoAFecha(input.fecha);
  const config = await getTmConfig();

  const lineas = input.lineas.map((l) => ({
    tiendaId: l.tiendaId,
    entregaIndividual: entero(l.entregaIndividual),
    devolucionIndividual: entero(l.devolucionIndividual),
  }));

  try {
    const existente = await db.tmGuia.findUnique({ where: { fecha } });
    if (existente && existente.id !== input.id) {
      return { success: false, error: "Ya existe una guía con esa fecha." };
    }

    let id = input.id;
    if (id) {
      // En una sola transacción: si falla, la guía no queda sin líneas
      await prisma.$transaction([
        db.tmLinea.deleteMany({ where: { guiaId: id } }),
        db.tmGuia.update({
          where: { id },
          data: { fecha, nota: input.nota?.trim() || null, lineas: { create: lineas } },
        }),
      ]);
    } else {
      const g = await db.tmGuia.create({
        data: {
          fecha,
          nota: input.nota?.trim() || null,
          precioIndividual: config.precioIndividual,
          tasaIva: config.tasaIva,
          lineas: { create: lineas },
        },
      });
      id = g.id;
    }
    revalidatePath("/timemarket");
    return { success: true, id };
  } catch (e) {
    console.error("saveTmGuia", e);
    return { success: false, error: "No se pudo guardar la guía." };
  }
}

export async function deleteTmGuia(id: string) {
  await db.tmGuia.delete({ where: { id } });
  revalidatePath("/timemarket");
  return { success: true };
}

// ── Importación histórica (JSON exportado desde la planilla) ─────────────────
// Formato de línea heredado de la planilla: [tienda, entrega, entregaMini, retiro, retiroMini].
// La lasaña mini está descontinuada: sus columnas se ignoran.
// El retiro se importa con signo (la planilla tiene correcciones negativas).

export type TmImportJson = {
  tiendas?: { nombre: string; direccion?: string }[];
  guias: { fecha: string; nota?: string; lineas: [string, number, number, number, number][] }[];
};

export async function importarTmHistorico(json: TmImportJson) {
  const config = await getTmConfig();
  // Asegurar tiendas
  const existentes: TmTienda[] = await getTmTiendas();
  const porNombre = new Map(existentes.map((t) => [t.nombre.toLowerCase(), t]));
  const nombres = new Set<string>();
  for (const t of json.tiendas ?? []) nombres.add(t.nombre);
  for (const g of json.guias) for (const l of g.lineas) nombres.add(l[0]);
  for (const nombre of nombres) {
    if (!porNombre.has(nombre.toLowerCase())) {
      const dir = json.tiendas?.find((t) => t.nombre === nombre)?.direccion ?? "";
      const t = await db.tmTienda.create({ data: { nombre, direccion: dir, orden: porNombre.size } });
      porNombre.set(nombre.toLowerCase(), t);
    }
  }

  let creadas = 0;
  let omitidas = 0;
  for (const g of json.guias) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.fecha)) { omitidas++; continue; }
    const fecha = isoAFecha(g.fecha);
    const ya = await db.tmGuia.findUnique({ where: { fecha } });
    if (ya) { omitidas++; continue; }
    await db.tmGuia.create({
      data: {
        fecha,
        nota: g.nota ?? null,
        precioIndividual: config.precioIndividual,
        tasaIva: config.tasaIva,
        lineas: {
          create: g.lineas.map(([nombre, ei, , di]) => ({
            tiendaId: porNombre.get(nombre.toLowerCase())!.id,
            entregaIndividual: entero(ei),
            devolucionIndividual: Math.trunc(Number(di) || 0),
          })),
        },
      },
    });
    creadas++;
  }
  revalidatePath("/timemarket");
  return { success: true, creadas, omitidas };
}
