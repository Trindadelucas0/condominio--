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

const extractBalancedJsonObject = (text) => {
  const value = String(text || '');
  const start = value.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < value.length; i += 1) {
    const ch = value[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return value.slice(start, i + 1);
    }
  }
  return null;
};

const normalizeJsonCandidates = (rawText) => {
  const text = String(rawText || '').trim();
  if (!text) return [];

  const candidates = new Set();
  candidates.add(text);

  // Remove blocos markdown ```json ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    candidates.add(String(fenceMatch[1]).trim());
  }

  // Remove prefixos comuns como "Here is the JSON..."
  const balanced = extractBalancedJsonObject(text);
  if (balanced) {
    candidates.add(String(balanced).trim());
  }

  return Array.from(candidates).filter(Boolean);
};

const parseJsonFromModelText = (rawText) => {
  const candidates = normalizeJsonCandidates(rawText);
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('JSON inválido');
};

const generateJson = async ({
  systemInstruction,
  prompt,
  schemaHint = null,
  model: modelOverride = null,
  maxOutputTokens: maxOutputTokensOverride = null,
  temperature: temperatureOverride = null,
  timeoutMs: timeoutMsOverride = null,
}) => {
  const model = modelOverride || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const maxOutputTokens =
    maxOutputTokensOverride ?? parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '500', 10);
  const temperature = temperatureOverride ?? parseFloat(process.env.GEMINI_TEMPERATURE || '0.2');
  const timeoutMs = timeoutMsOverride ?? parseInt(process.env.GEMINI_TIMEOUT_MS || '15000', 10);

  const instruction = schemaHint
    ? `${systemInstruction}\nResponda estritamente em JSON válido com o formato: ${schemaHint}\nNão adicione explicações, títulos, markdown ou bloco \`\`\`json.`
    : `${systemInstruction}\nResponda estritamente em JSON válido.\nNão adicione explicações, títulos, markdown ou bloco \`\`\`json.`;

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
    parsed = parseJsonFromModelText(text);
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
