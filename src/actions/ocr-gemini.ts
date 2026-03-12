

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

/**
 * Uses Google Gemini Vision to parse a delivery sheet image.
 * Receives the list of known stores dynamically from the DB.
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const tiendasList = tiendas.map((t) => `- ${t}`).join("\n");

  const prompt = `
Eres un asistente de extracción de datos para una fábrica de lasañas.
Analiza la imagen de la planilla/guía de despacho y extrae los datos de entregas y devoluciones por tienda.

Las tiendas conocidas son exactamente estas (usa estos nombres exactos):
${tiendasList}

Para cada tienda, busca:
- Entrega Individual (Lasaña Individual 550g) - columna de entrega
- Entrega Mini (Lasaña Mini 200g) - columna de entrega
- Devolución Individual - columna de devolución/retiro/merma
- Devolución Mini - columna de devolución/retiro/merma

Responde ÚNICAMENTE con JSON válido en este formato exacto (sin texto adicional, sin markdown):
{
  "rows": [
    {
      "tienda": "nombre exacto de la tienda",
      "entregaIndividual": 0,
      "entregaMini": 0,
      "devolucionIndividual": 0,
      "devolucionMini": 0
    }
  ]
}

Si una tienda no aparece en la imagen o no tiene datos, ponla con valores 0.
Devuelve SIEMPRE todas las tiendas en el orden listado arriba.
`;

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
    console.log("[OCR Gemini] Raw response:", text.slice(0, 200));

    const jsonStr = text
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/gi, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.rows || !Array.isArray(parsed.rows)) {
      throw new Error("Invalid JSON structure from Gemini");
    }

    // Merge into known tiendas to guarantee all are present
    const resultMap = new Map<string, PlanillaRow>();
    for (const t of tiendas) {
      resultMap.set(t.toLowerCase(), {
        tienda: t,
        entregaIndividual: 0,
        entregaMini: 0,
        devolucionIndividual: 0,
        devolucionMini: 0,
      });
    }

    for (const row of parsed.rows) {
      const key = (row.tienda || "").toLowerCase();
      if (resultMap.has(key)) {
        const original = resultMap.get(key)!;
        resultMap.set(key, {
          tienda: original.tienda,
          entregaIndividual: Number(row.entregaIndividual) || 0,
          entregaMini: Number(row.entregaMini) || 0,
          devolucionIndividual: Number(row.devolucionIndividual) || 0,
          devolucionMini: Number(row.devolucionMini) || 0,
        });
      }
    }

    return Array.from(resultMap.values());
  } catch (err) {
    console.error("[OCR Gemini] Error parsing image:", err);
    return makeEmptyRows(tiendas);
  }
}
