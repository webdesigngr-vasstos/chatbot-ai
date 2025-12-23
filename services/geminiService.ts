
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Language } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Orientador Acadêmico IA da VASSTOS (https://www.vasstos.com). 
A VASSTOS é uma Academia de Formação Profissional de elite, hospedada no Google Workspace.

DIRETRIZES BILINGUES:
1. IDIOMA: Responda obrigatoriamente no idioma solicitado pelo sistema ou utilizado pelo usuário.
2. CONHECIMENTO: Foco total no catálogo de cursos, certificações e programas da VASSTOS.
3. GROUNDING: Use o Google Search em 'vasstos.com'. Se o usuário estiver em Inglês, procure termos equivalentes mas priorize a precisão dos dados do site oficial.
4. TOM DE VOZ: Acadêmico, moderno, inspirador e focado no sucesso (Career Advisor).

TRADUÇÃO DE CONCEITOS:
- Certificação Profissional / Professional Certification
- Trilha de Aprendizado / Learning Path
- Próximas Turmas / Upcoming Classes`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateResponse(
    history: Message[],
    language: Language,
    useSearch: boolean = true
  ): Promise<{ text: string; sources?: any[] }> {
    const contents = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const langContext = language === 'pt' 
      ? "Responda em Português (Brasil)." 
      : "Respond in English (Global).";

    const config: any = {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCURRENT LANGUAGE PREFERENCE: ${langContext}`,
      temperature: 0.5,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents,
        config,
      });

      const text = response.text || (language === 'pt' ? "Erro na base de dados." : "Database error.");
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return { text, sources };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async speakText(text: string, language: Language): Promise<Uint8Array | null> {
    const prompt = language === 'pt' 
      ? `Diga de forma motivadora: ${text}` 
      : `Say in a motivating academic tone: ${text}`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) return null;

      return this.decodeBase64(audioData);
    } catch (error) {
      console.error("TTS Error:", error);
      return null;
    }
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

export async function playRawPCM(data: Uint8Array) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
