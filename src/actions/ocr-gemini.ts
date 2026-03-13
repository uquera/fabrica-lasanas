
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
   - Sub-columna "Restituir en Tienda" (si existe) → IGNORAR o sumar a entregaIndividual
3. Sección "DEVOLUCIÓN" (o "Devoluciones", "Merma"): cuántas unidades se DEVOLVIERON
   - Sub-columna Individual → devolucionIndividual
   - Sub-columna Mini → devolucionMini

TIENDAS CONOCIDAS (úsalas como referencia para escribir los nombres):
${tiendaList}

INSTRUCCIONES:
- Lee TODOS los números en cada celda cuidadosamente
- Si una celda está vacía o tiene guión "-", el valor es 0
- Ignora filas de TOTAL, subtotal, y filas de encabezado
- Copia el nombre de la tienda EXACTAMENTE como aparece en la imagen
- Si hay letras en una celda (ej: "4 I"), extrae solo el número (4)
- Los números pueden ser 1 cifra (1-9) o 2 cifras (10-30)
- NO dejes valores vacíos — si no ves número, usa 0

RESPONDE ÚNICAMENTE con este JSON (sin bloques de código, sin texto adicional):
{"rows":[{"tienda":"nombre","entregaIndividual":4,"entregaMini":0,"devolucionIndividual":0,"devolucionMini":0}]}`;

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
  } catch (err: any) {
    console.error("[OCR Gemini] Error:", err?.message ?? err);
    return makeEmptyRows(tiendas);
  }
}
