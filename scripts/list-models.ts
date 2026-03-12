import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  // List all available models
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
    { method: 'GET' }
  );
  
  const data = await response.json();
  const models = data.models || [];
  
  // Filter to only multimodal capable models (that support generateContent)
  const multimodal = models.filter((m: { supportedGenerationMethods?: string[] }) => 
    m.supportedGenerationMethods?.includes('generateContent')
  );
  
  console.log('Available models that support generateContent:');
  multimodal.forEach((m: { name: string; displayName?: string }) => {
    console.log(' -', m.name, '|', m.displayName || '');
  });
}

main().catch(console.error);
