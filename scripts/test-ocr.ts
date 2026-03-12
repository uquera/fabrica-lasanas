import { processImageWithGemini } from '../src/actions/ocr-gemini';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

async function main() {
  // Use the sample planilla image saved as artifact
  const imagePath = path.resolve('C:/Users/Usuario/.gemini/antigravity/brain/b1f61393-400f-4f8e-b812-23d5337e480d/media__1773261897084.jpg');
  
  if (!fs.existsSync(imagePath)) {
    console.error('Image not found at:', imagePath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  console.log('Testing Gemini OCR with planilla image...');
  const rows = await processImageWithGemini(base64, 'image/jpeg', []);
  console.log('Result:');
  console.table(rows.map(r => ({
    Tienda: r.tienda,
    EntInd: r.entregaIndividual,
    EntMini: r.entregaMini,
    DevInd: r.devolucionIndividual,
    DevMini: r.devolucionMini,
  })));
}

main().catch(console.error);
