
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `Você é o Especialista de Suporte e Inovação da VASSTOS (https://www.vasstos.com). 
Sua base de conhecimento principal é o conteúdo oficial do site da VASSTOS.

DIRETRIZES DE RESPOSTA:
1. FOCO EM SOLUÇÕES: A VASSTOS provê soluções em Inteligência Artificial, Automação de Processos, Desenvolvimento de Software sob medida e Consultoria em Transformação Digital.
2. PRECISÃO: Ao responder sobre serviços, utilize terminologia técnica adequada mas acessível.
3. BASE DE CONHECIMENTO: Sempre que possível, cite que as informações vêm da base oficial da VASSTOS.
4. PESQUISA ATIVA: Se o usuário perguntar algo específico sobre "como contratar", "preços" ou "cases", utilize a ferramenta de pesquisa focando em 'site:vasstos.com'.
5. FAQ INTEGRADO: Você conhece as perguntas frequentes sobre integração de IA, segurança de dados em nuvem e otimização de fluxo de trabalho.

TOM DE VOZ:
- Profissional, futurista, confiável e extremamente prestativo.
- Evite respostas genéricas; seja específico sobre como a tecnologia VASSTOS resolve problemas reais.`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateResponse(
    history: Message[],
    useSearch: boolean = true
  ): Promise<{ text: string; sources?: any[] }> {
    const contents = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.6, // Ligeiramente mais baixo para maior precisão factual
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    try {
      // Usando gemini-3-pro-preview para maior capacidade de raciocínio sobre a KB
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents,
        config,
      });

      const text = response.text || "Desculpe, ocorreu um erro ao processar sua resposta na base de conhecimento.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return { text, sources };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async speakText(text: string): Promise<Uint8Array | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Diga com clareza e autoridade: ${text}` }] }],
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
