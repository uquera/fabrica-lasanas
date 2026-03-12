/**
 * OCR processing for delivery sheet images.
 * Uses Tesseract.js to extract text, then parses it against known store names.
 */
import Tesseract from "tesseract.js";

// The 9 fixed stores from the physical delivery guide
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

export type TiendaName = typeof TIENDAS[number];

export interface PlanillaRow {
  tienda: TiendaName;
  entregaIndividual: number;
  entregaMini: number;
  devolucionIndividual: number;
  devolucionMini: number;
}

export type PlanillaData = PlanillaRow[];

/**
 * Runs OCR on the image and returns structured data.
 * Since handwritten numbers on paper are error-prone,
 * we do our best and the user will correct in the editable table.
 */
export async function processImage(imageFile: File): Promise<PlanillaData> {
  const { data } = await Tesseract.recognize(imageFile, "spa", {
    logger: (m) => console.log("[OCR]", m.status, Math.round((m.progress || 0) * 100) + "%"),
  });

  const rawText = data.text;
  console.log("[OCR] Raw text:\n", rawText);

  return parseDeliverySheet(rawText);
}

/**
 * Parses the OCR text output into structured rows.
 * Strategy: find each known store name in the text, then grab the numbers
 * that follow on the same line.
 */
function parseDeliverySheet(text: string): PlanillaData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Determine where "Entrega" and "Devolución" sections start
  let entregaStart = -1;
  let devolucionStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("entrega") && entregaStart === -1) entregaStart = i;
    if (lower.includes("devoluci") || lower.includes("devolución") || lower.includes("devolucion")) devolucionStart = i;
  }

  // Normalize store name matching
  const storeAliases: Record<string, TiendaName> = {
    "playa brava": "Playa Brava Prat 1656",
    "prat 1656": "Playa Brava Prat 1656",
    "peninsula": "Península",
    "península": "Península",
    "vivar": "Vivar",
    "terranova": "Terranova Bilbao 3717",
    "bilbao 3717": "Terranova Bilbao 3717",
    "bilbao 1": "Bilbao 1 Chipana",
    "chipana": "Bilbao 1 Chipana",
    "bilbao 2": "Bilbao 2",
    "anibal": "Aníbal Pinto",
    "aníbal": "Aníbal Pinto",
    "pinto": "Aníbal Pinto",
    "tarapaca": "Tarapacá",
    "tarapacá": "Tarapacá",
    "los molles": "Los Molles Prat 3082",
    "prat 3082": "Los Molles Prat 3082",
    "molles": "Los Molles Prat 3082",
  };

  function matchStore(line: string): TiendaName | null {
    const lower = line.toLowerCase();
    for (const [alias, store] of Object.entries(storeAliases)) {
      if (lower.includes(alias)) return store;
    }
    return null;
  }

  function extractNumbers(line: string): number[] {
    const nums = line.match(/\d+/g);
    return nums ? nums.map(Number) : [];
  }

  // Initialize result
  const result: Map<TiendaName, PlanillaRow> = new Map();
  for (const t of TIENDAS) {
    result.set(t, { tienda: t, entregaIndividual: 0, entregaMini: 0, devolucionIndividual: 0, devolucionMini: 0 });
  }

  // Parse Entrega section
  const entregaLines = devolucionStart > entregaStart
    ? lines.slice(entregaStart, devolucionStart)
    : lines.slice(entregaStart);

  for (const line of entregaLines) {
    const store = matchStore(line);
    if (store) {
      const nums = extractNumbers(line);
      const row = result.get(store)!;
      row.entregaIndividual = nums[0] ?? 0;
      row.entregaMini = nums[1] ?? 0;
    }
  }

  // Parse Devolución section
  if (devolucionStart >= 0) {
    const devLines = lines.slice(devolucionStart);
    for (const line of devLines) {
      const store = matchStore(line);
      if (store) {
        const nums = extractNumbers(line);
        const row = result.get(store)!;
        row.devolucionIndividual = nums[0] ?? 0;
        row.devolucionMini = nums[1] ?? 0;
      }
    }
  }

  return Array.from(result.values());
}
