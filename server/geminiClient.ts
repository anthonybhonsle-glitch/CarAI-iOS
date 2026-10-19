import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return aiInstance;
}

/**
 * Executes Gemini generateContent with automatic retry on transient high-demand / 503 / 429 spikes,
 * plus automatic fallback model cascading (e.g. gemini-3.7-flash -> gemini-3.1-flash-lite).
 */
export async function generateContentWithRetry(
  params: Omit<GenerateContentParameters, 'model'> & {
    model?: string;
    fallbackModels?: string[];
    maxRetries?: number;
  }
): Promise<GenerateContentResponse | null> {
  const ai = getGeminiAI();
  if (!ai) {
    return null;
  }

  const primaryModel = params.model || 'gemini-3.7-flash';
  const candidateModels = [primaryModel, ...(params.fallbackModels || ['gemini-3.1-flash-lite', 'gemini-flash-latest'])];
  const maxRetriesPerModel = params.maxRetries ?? 2;

  let lastError: any = null;

  for (const modelToTry of candidateModels) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelToTry,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errString = String(err?.message || err || '');
        const statusCode = err?.status || err?.code || (err?.error && err.error.code);
        const isTransient =
          statusCode === 503 ||
          statusCode === 429 ||
          errString.includes('503') ||
          errString.includes('429') ||
          errString.includes('high demand') ||
          errString.includes('UNAVAILABLE') ||
          errString.includes('RESOURCE_EXHAUSTED') ||
          errString.includes('overloaded');

        if (isTransient && attempt < maxRetriesPerModel) {
          // Exponential backoff with jitter: 400ms, 900ms, etc.
          const delayMs = Math.pow(2, attempt) * 400 + Math.floor(Math.random() * 200);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // If not transient or exhausted retries for this model, break inner loop to try next fallback model
        break;
      }
    }
  }

  console.warn('Gemini request failed across all candidate models & retries:', lastError?.message || lastError);
  return null;
}

