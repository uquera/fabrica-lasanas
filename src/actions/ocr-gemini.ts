
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PlanillaRow {
  tienda: string;
  entregaIndividual: number;
  entregaMini: number;
  devolucionIndividual: number;
  devolucionMini: number;
}

export type PlanillaData = PlanillaRow[];

export interface OcrResult {
  rows: PlanillaData;
  success: boolean;
  error?: string;
}

export function makeEmptyRows(tiendas: string[]): PlanillaData {
  return tiendas.map((t) => ({
    tienda: t,
    entregaIndividual: 0,
    entregaMini: 0,
    devolucionIndividual: 0,
    devolucionMini: 0,
  }));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchTienda(imageName: string, knownTiendas: string[]): string {
  const normImage = normalize(imageName);

  for (const t of knownTiendas) {
    if (normalize(t) === normImage) return t;
  }
  for (const t of knownTiendas) {
    const normT = normalize(t);
    if (normT.includes(normImage) || normImage.includes(normT)) return t;
  }
  const firstWord = normImage.split(" ")[0];
  if (firstWord.length >= 4) {
    for (const t of knownTiendas) {
      if (normalize(t).startsWith(firstWord)) return t;
    }
  }
  return imageName;
}

async function callGemini(model: any, parts: any[]): Promise<string> {
  try {
    const result = await model.generateContent(parts);
    return result.response.text().trim();
  } catch (err: any) {
    // Retry once after 8 seconds on rate limit
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
      console.warn("[OCR] Rate limit hit, retrying in 8s...");
      await sleep(8000);
      const result = await model.generateContent(parts);
      return result.response.text().trim();
    }
    throw err;
  }
}

export async function processImageWithGemini(
  base64Image: string,
  mimeType: string,
  tiendas: string[]
): Promise<OcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { rows: makeEmptyRows(tiendas), success: false, error: "GEMINI_API_KEY no configurada" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0 } as any,
  });

  const tiendaList = tiendas.slice(0, 30).join(", ");

  const prompt = `Eres un sistema de lectura óptica de planillas de despacho de lasañas.

FORMATO DE LA PLANILLA:
La imagen contiene una tabla con estas secciones:
1. Columna izquierda: nombre de la tienda/local
2. Sección "ENTREGA": cuántas unidades se ENTREGARON a cada tienda
   - Sub-columna "Individual 550g" (o "Ind", "Individual", "I") → entregaIndividual
   - Sub-columna "Mini 200g" (o "Mini", "Ch", "M") → entregaMini
   - Sub-columna "Restituir en Tienda" (si existe) → IGNORAR
3. Sección "DEVOLUCIÓN" (o "Devoluciones", "Merma"): cuántas unidades se DEVOLVIERON
   - Sub-columna Individual → devolucionIndividual
   - Sub-columna Mini → devolucionMini

TIENDAS CONOCIDAS (úsalas como referencia para los nombres):
${tiendaList}

INSTRUCCIONES:
- Lee TODOS los números en cada celda cuidadosamente
- Si una celda está vacía o tiene guión "-", el valor es 0
- Ignora filas de TOTAL, subtotal, y filas de encabezado
- Copia el nombre de la tienda EXACTAMENTE como aparece en la imagen
- Los números pueden ser 1 cifra (1-9) o 2 cifras (10-30)
- NO dejes valores vacíos — si no ves número, usa 0

RESPONDE ÚNICAMENTE con este JSON (sin bloques de código, sin texto adicional):
{"rows":[{"tienda":"nombre","entregaIndividual":4,"entregaMini":0,"devolucionIndividual":0,"devolucionMini":0}]}`;

  const parts = [
    { inlineData: { mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp", data: base64Image } },
    { text: prompt },
  ];

  try {
    const text = await callGemini(model, parts);
    console.log("[OCR Gemini] Raw response:", text.slice(0, 600));

    const jsonStr = text.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.rows || !Array.isArray(parsed.rows)) {
      throw new Error("Respuesta JSON inválida de Gemini");
    }

    const resultRows: PlanillaData = parsed.rows
      .filter((row: any) => row.tienda && typeof row.tienda === "string")
      .map((row: any) => ({
        tienda: matchTienda(row.tienda, tiendas),
        entregaIndividual: Math.max(0, Math.round(Number(row.entregaIndividual) || 0)),
        entregaMini: Math.max(0, Math.round(Number(row.entregaMini) || 0)),
        devolucionIndividual: Math.max(0, Math.round(Number(row.devolucionIndividual) || 0)),
        devolucionMini: Math.max(0, Math.round(Number(row.devolucionMini) || 0)),
      }));

    const foundNames = new Set(resultRows.map((r) => normalize(r.tienda)));
    for (const t of tiendas) {
      if (!foundNames.has(normalize(t))) {
        resultRows.push({ tienda: t, entregaIndividual: 0, entregaMini: 0, devolucionIndividual: 0, devolucionMini: 0 });
      }
    }

    return { rows: resultRows, success: true };
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[OCR Gemini] Error:", msg);
    return { rows: makeEmptyRows(tiendas), success: false, error: msg };
  }
}
