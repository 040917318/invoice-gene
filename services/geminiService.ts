import { GoogleGenAI } from "@google/genai";

// Declare global extension for window to support runtime injection
declare global {
  interface Window {
    RUNTIME_API_KEY?: string;
  }
}

// 1. Check window.RUNTIME_API_KEY (Injected by server.js in Cloud Run)
// 2. Fallback to process.env.API_KEY (Injected by Vite during local dev)
const apiKey = (typeof window !== 'undefined' && window.RUNTIME_API_KEY) 
  ? window.RUNTIME_API_KEY 
  : (process.env.API_KEY || '');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

export const generateCargoDescription = async (rawInput: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing.");
    return rawInput;
  }

  try {
    const prompt = `
      You are a logistics and sea freight expert assistant.
      Refine the following rough cargo description into a professional line item description suitable for a commercial invoice or shipping manifest.
      Keep it concise (under 20 words).
      
      Rough Input: "${rawInput}"
      
      Output only the refined description text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || rawInput;
  } catch (error) {
    console.error("Error generating description:", error);
    return rawInput; // Fallback to original text on error
  }
};

export const generateNextInvoiceNumber = async (currentNumber: string): Promise<string> => {
  if (!apiKey) {
    // Basic fallback if no API key available: increment last number found
    const match = currentNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      const len = match[1].length;
      const next = (num + 1).toString().padStart(len, '0');
      return currentNumber.replace(match[1], next);
    }
    return currentNumber + "-NEXT";
  }

  try {
    const prompt = `
      You are an invoicing assistant.
      The previous invoice number was "${currentNumber}".
      Generate the next unique and sequential invoice number.
      
      Rules:
      1. If the number contains a year (e.g., 2023, 24), update it to the current year (${new Date().getFullYear()}) if necessary.
      2. If updating the year, reset the sequence number to 001 or similar, unless the format implies a continuous sequence.
      3. If no year change is needed, simply increment the sequence.
      4. Maintain the exact same style/format (separators, prefixes).
      
      Output ONLY the new invoice number string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || currentNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return currentNumber;
  }
};