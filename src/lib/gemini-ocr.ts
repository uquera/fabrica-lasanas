import { GoogleGenerativeAI } from "@google/generative-ai";

export const TIENDAS = [
  "Playa Brava Prat 1656",
  "Península",
  "Vivar",
  "Terranova Bilbao 3717",
  "Bilbao 1 Chipana",
  "Bilbao 2",
  "Aníbal Pinto",
  "Tarapacá",
  "Los Molles Prat 3082",
] as const;

export type TiendaName = (typeof TIENDAS)[number];

export interface PlanillaRow {
  tienda: TiendaName;
  entregaIndividual: number;
  entregaMini: number;
  devolucionIndividual: number;
  devolucionMini: number;
}

export type PlanillaData = PlanillaRow[];

export const EMPTY_ROWS: PlanillaData = TIENDAS.map((t) => ({
  tienda: t,
  entregaIndividual: 0,
  entregaMini: 0,
  devolucionIndividual: 0,
  devolucionMini: 0,
}));

/**
 * Uses Google Gemini Vision to parse a delivery sheet image.
 * This is a plain server-side utility (NOT a server action).
 */
export async function processImageWithGemini(
  base64Image: string,
  mimeType: string
): Promise<PlanillaData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[OCR] GEMINI_API_KEY not set. Returning empty rows.");
    return EMPTY_ROWS;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Eres un asistente de extracción de datos para una fábrica de lasañas. 
Analiza la imagen de la planilla/guía de despacho y extrae los datos de entregas y devoluciones por tienda.

Las tiendas conocidas son exactamente estas (usa estos nombres exactos):
- Playa Brava Prat 1656
- Península
- Vivar
- Terranova Bilbao 3717
- Bilbao 1 Chipana
- Bilbao 2
- Aníbal Pinto
- Tarapacá
- Los Molles Prat 3082

Para cada tienda, busca:
- Entrega Individual (Lasaña Individual 550g) - columna de entrega
- Entrega Mini (Lasaña Mini 200g) - columna de entrega  
- Devolución Individual - columna de devolución/retiro/merma
- Devolución Mini - columna de devolución/retiro/merma

Responde ÚNICAMENTE con JSON válido en este formato exacto (sin texto adicional, sin markdown):
{
  "rows": [
    {
      "tienda": "Playa Brava Prat 1656",
      "entregaIndividual": 0,
      "entregaMini": 0,
      "devolucionIndividual": 0,
      "devolucionMini": 0
    }
  ]
}

Si una tienda no aparece en la imagen o no tiene datos, ponla con valores 0.
Devuelve SIEMPRE las 9 tiendas en el orden listado arriba.
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

    // Strip any markdown code fences if present
    const jsonStr = text
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/gi, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.rows || !Array.isArray(parsed.rows)) {
      throw new Error("Invalid JSON structure from Gemini");
    }

    // Merge into known tiendas to guarantee all 9 are present
    const resultMap = new Map<string, PlanillaRow>();
    for (const t of TIENDAS) {
      resultMap.set(t, {
        tienda: t,
        entregaIndividual: 0,
        entregaMini: 0,
        devolucionIndividual: 0,
        devolucionMini: 0,
      });
    }

    for (const row of parsed.rows) {
      const tienda = TIENDAS.find(
        (t) => t.toLowerCase() === (row.tienda || "").toLowerCase()
      );
      if (tienda) {
        resultMap.set(tienda, {
          tienda,
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
    return EMPTY_ROWS;
  }
}
