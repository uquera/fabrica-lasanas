import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads", "comprobantes");

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "pdf"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, filename), Buffer.from(bytes));

  return NextResponse.json({ filename });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filename = req.nextUrl.searchParams.get("file");
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  try {
    const data = await readFile(join(UPLOAD_DIR, filename));
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType = ext === "pdf" ? "application/pdf" : `image/${ext}`;
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
