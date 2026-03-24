const { GoogleGenAI } = require('@google/genai');

let geminiClient = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout ao chamar Gemini')), timeoutMs);
    }),
  ]);

const extractUsage = (response) => {
  const meta = response?.usageMetadata || {};
  return {
    requestTokens: meta.promptTokenCount || 0,
    responseTokens: meta.candidatesTokenCount || 0,
  };
};

const generateJson = async ({ systemInstruction, prompt, schemaHint = null }) => {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const maxOutputTokens = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '500', 10);
  const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.2');
  const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '15000', 10);

  const instruction = schemaHint
    ? `${systemInstruction}\nResponda estritamente em JSON válido com o formato: ${schemaHint}`
    : `${systemInstruction}\nResponda estritamente em JSON válido.`;

  const client = getClient();
  const startedAt = Date.now();
  console.log('[GEMINI] Iniciando geração JSON', {
    model,
    maxOutputTokens,
    temperature,
    promptSize: String(prompt || '').length,
  });
  const response = await withTimeout(
    client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: instruction,
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
      },
    }),
    timeoutMs
  );

  const text = response.text || '{}';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    console.error('[GEMINI] Resposta não JSON', {
      elapsedMs: Date.now() - startedAt,
      preview: String(text).slice(0, 160),
    });
    throw new Error('Gemini retornou JSON inválido');
  }

  const usage = extractUsage(response);
  const latencyMs = Date.now() - startedAt;
  console.log('[GEMINI] Geração concluída', {
    latencyMs,
    requestTokens: usage.requestTokens,
    responseTokens: usage.responseTokens,
  });

  return {
    data: parsed,
    usage,
    latencyMs,
  };
};

module.exports = {
  generateJson,
};
