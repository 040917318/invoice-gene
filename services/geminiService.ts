import { GoogleGenAI } from "@google/genai";

// Ensure we access process.env.API_KEY safely.
// Vite replaces `process.env.API_KEY` with the string value at build time.
// We default to an empty string to prevent runtime errors if the key is missing.
const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
// Note: In a real production app, you might proxy this through a backend to protect the key,
// or require the user to input their key if it's a BYOK app.
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