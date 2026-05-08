import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateInterviewSummary(transcript: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this interview transcript and provide feedback on the candidate's performance. 
      Also, suggest a feedback tone (e.g., Encouraging, Constructive, Professional) and a score out of 10 for communication and technical ability.
      
      Transcript:
      ${transcript}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
