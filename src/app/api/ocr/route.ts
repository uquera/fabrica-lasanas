import { NextRequest, NextResponse } from "next/server";
import { processImageWithGemini, makeEmptyRows } from "@/actions/ocr-gemini";
import prisma from "@/lib/prisma";

async function getClienteNames(): Promise<string[]> {
  const clientes = await prisma.cliente.findMany({
    select: { razonSocial: true },
    orderBy: { razonSocial: "asc" },
  });
  return clientes.map((c) => c.razonSocial);
}

// GET: returns the list of clients as empty rows (for manual entry fallback)
export async function GET() {
  try {
    const tiendas = await getClienteNames();
    return NextResponse.json({ emptyRows: makeEmptyRows(tiendas) });
  } catch (err) {
    console.error("[API/OCR] Error fetching clients:", err);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST: processes an image with Gemini and returns rows for all clients
export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();
    if (!base64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const tiendas = await getClienteNames();
    const emptyRows = makeEmptyRows(tiendas);

    const ocr = await processImageWithGemini(base64, mimeType || "image/jpeg", tiendas);
    return NextResponse.json({ rows: ocr.rows, emptyRows, success: ocr.success, ocrError: ocr.error ?? null });
  } catch (err) {
    console.error("[API/OCR] Error:", err);
    return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
  }
}
