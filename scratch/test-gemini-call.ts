// Scratch test file - reads key from environment variable
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.VITE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.log('No key in env');
  process.exit(0);
}
const ai = new GoogleGenAI({ apiKey });
console.log('Gemini configured');
