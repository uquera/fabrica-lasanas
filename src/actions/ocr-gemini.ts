
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PlanillaRow {
  tienda: string;
  entregaIndividual: number;
  entregaMini: number;
  devolucionIndividual: number;
  devolucionMini: number;
}

export type PlanillaData = PlanillaRow[];

export function makeEmptyRows(tiendas: string[]): PlanillaData {
  return tiendas.map((t) => ({
    tienda: t,
    entregaIndividual: 0,
    entregaMini: 0,
    devolucionIndividual: 0,
    devolucionMini: 0,
  }));
}

/** Normalizes a string for fuzzy comparison: lowercase, no accents, no extra spaces */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tries to match a tienda name from the image to a known client name.
 * Returns the known client name if found, otherwise returns the original.
 */
function matchTienda(imageName: string, knownTiendas: string[]): string {
  const normImage = normalize(imageName);

  // 1. Exact match (case-insensitive, accent-insensitive)
  for (const t of knownTiendas) {
    if (normalize(t) === normImage) return t;
  }

  // 2. One contains the other
  for (const t of knownTiendas) {
    const normT = normalize(t);
    if (normT.includes(normImage) || normImage.includes(normT)) return t;
  }

  // 3. First word match (e.g., "Unimarc" matches "Unimarc Las Condes")
  const firstWordImage = normImage.split(" ")[0];
  if (firstWordImage.length >= 4) {
    for (const t of knownTiendas) {
      if (normalize(t).startsWith(firstWordImage)) return t;
    }
  }

  // No match — return as-is (will create a new client)
  return imageName;
}

/**
 * Uses Google Gemini Vision to parse a delivery sheet image.
 * Receives the list of known stores for fuzzy-matching after OCR.
 */
export async function processImageWithGemini(
  base64Image: string,
  mimeType: string,
  tiendas: string[]
): Promise<PlanillaData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[OCR] GEMINI_API_KEY not set. Returning empty rows.");
    return makeEmptyRows(tiendas);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Eres un asistente de extracción de datos para una fábrica de lasañas.
Analiza la imagen y extrae la tabla de despacho/planilla.

La tabla tiene filas por tienda/local y columnas de entrega y devolución:
- Entrega individual (lasaña individual 550g) — puede llamarse "Ind", "Individual", "550g", "I"
- Entrega mini (lasaña mini 200g) — puede llamarse "Mini", "200g", "M", "Ch"
- Devolución individual — puede llamarse "Dev Ind", "Ret Ind", "Dev I", "Merma Ind"
- Devolución mini — puede llamarse "Dev Mini", "Ret Mini", "Dev M", "Merma Mini"

REGLAS IMPORTANTES:
- Copia los nombres de tiendas EXACTAMENTE como aparecen en la imagen (no los cambies ni corrijas)
- Si una columna no existe en la imagen, deja el valor en 0
- Si solo hay una columna de "Entrega" sin separar por tipo, ponla toda en entregaIndividual
- Ignora filas de TOTAL, SUBTOTAL o encabezados
- Los valores son cantidades de unidades (números enteros)
- No inventes datos: si no puedes leer un número claramente, usa 0

Responde ÚNICAMENTE con JSON válido (sin bloques de código, sin texto adicional):
{"rows":[{"tienda":"nombre exacto","entregaIndividual":0,"entregaMini":0,"devolucionIndividual":0,"devolucionMini":0}]}`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
          data: base64Image,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text().trim();
    console.log("[OCR Gemini] Raw response:", text.slice(0, 500));

    const jsonStr = text
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/gi, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.rows || !Array.isArray(parsed.rows)) {
      throw new Error("Invalid JSON structure from Gemini");
    }

    // Build result: for each row Gemini found, fuzzy-match the tienda name
    const resultRows: PlanillaData = parsed.rows
      .filter((row: any) => row.tienda && typeof row.tienda === "string")
      .map((row: any) => ({
        tienda: matchTienda(row.tienda, tiendas),
        entregaIndividual: Math.max(0, Math.round(Number(row.entregaIndividual) || 0)),
        entregaMini: Math.max(0, Math.round(Number(row.entregaMini) || 0)),
        devolucionIndividual: Math.max(0, Math.round(Number(row.devolucionIndividual) || 0)),
        devolucionMini: Math.max(0, Math.round(Number(row.devolucionMini) || 0)),
      }));

    // Add known tiendas that Gemini didn't find (with zeros)
    const foundNames = new Set(resultRows.map((r) => normalize(r.tienda)));
    for (const t of tiendas) {
      if (!foundNames.has(normalize(t))) {
        resultRows.push({
          tienda: t,
          entregaIndividual: 0,
          entregaMini: 0,
          devolucionIndividual: 0,
          devolucionMini: 0,
        });
      }
    }

    return resultRows;
  } catch (err) {
    console.error("[OCR Gemini] Error parsing image:", err);
    return makeEmptyRows(tiendas);
  }
}
