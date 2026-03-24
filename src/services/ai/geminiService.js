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

const parseWithStrategy = (candidate, strategy) => {
  return {
    data: JSON.parse(candidate),
    strategy,
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

const tryLocalJsonRepair = (rawText) => {
  const raw = String(rawText || '').trim();
  const balanced = extractBalancedJsonObject(raw);
  const candidate = balanced || raw;
  if (!candidate) return null;

  let repaired = candidate;
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces);
  }
  const quoteCount = (repaired.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) repaired += '"';

  return repaired;
};

const parseJsonFromModelText = (rawText) => {
  const candidates = normalizeJsonCandidates(rawText);
  let lastError = null;

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const strategy = i === 0 ? 'RAW_PARSE' : i === 1 ? 'MARKDOWN_EXTRACT' : 'BALANCED_EXTRACT';
    try {
      return parseWithStrategy(candidate, strategy);
    } catch (error) {
      lastError = error;
    }
  }

  const repaired = tryLocalJsonRepair(rawText);
  if (repaired) {
    try {
      return parseWithStrategy(repaired, 'LOCAL_REPAIR');
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('JSON inválido');
};

const callGeminiRaw = async ({
  model,
  prompt,
  instruction,
  temperature,
  maxOutputTokens,
  timeoutMs,
}) => {
  const client = getClient();
  return withTimeout(
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
};

const runGeminiRepairPass = async ({
  model,
  instruction,
  schemaHint,
  rawResponse,
  timeoutMs,
}) => {
  const repairPrompt = [
    'Conserte a resposta abaixo para JSON válido.',
    'Retorne SOMENTE JSON válido, sem markdown.',
    `Schema esperado: ${schemaHint || '{}'}`,
    'Resposta original:',
    String(rawResponse || ''),
  ].join('\n\n');

  return callGeminiRaw({
    model,
    prompt: repairPrompt,
    instruction,
    temperature: 0,
    maxOutputTokens: 1600,
    timeoutMs: Math.max(timeoutMs, 30000),
  });
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

  const startedAt = Date.now();
  console.log('[GEMINI] Iniciando geração JSON', {
    model,
    maxOutputTokens,
    temperature,
    promptSize: String(prompt || '').length,
  });
  const response = await callGeminiRaw({
    model,
    prompt,
    instruction,
    temperature,
    maxOutputTokens,
    timeoutMs,
  });

  let text = response.text || '{}';
  let finishReason = response?.candidates?.[0]?.finishReason || null;
  let parsed;
  let parseStrategy = 'RAW_PARSE';
  try {
    parsed = parseJsonFromModelText(text);
  } catch (error) {
    if (finishReason === 'MAX_TOKENS') {
      try {
        const repairedResponse = await runGeminiRepairPass({
          model,
          instruction,
          schemaHint,
          rawResponse: text,
          timeoutMs,
        });
        text = repairedResponse?.text || text;
        finishReason = repairedResponse?.candidates?.[0]?.finishReason || finishReason;
        parsed = parseJsonFromModelText(text);
        parseStrategy = 'GEMINI_REPAIR_PASS';
      } catch (repairError) {
        console.error('[GEMINI] Repair pass falhou', {
          elapsedMs: Date.now() - startedAt,
          message: repairError.message,
        });
      }
    }
  }

  if (!parsed) {
    console.error('[GEMINI] Resposta não JSON', {
      elapsedMs: Date.now() - startedAt,
      finishReason,
      preview: String(text).slice(0, 160),
    });
    throw new Error('Gemini retornou JSON inválido');
  }
  if (typeof parsed === 'object' && parsed && parsed.strategy && parsed.data) {
    parseStrategy = parseStrategy === 'GEMINI_REPAIR_PASS' ? parseStrategy : parsed.strategy;
    parsed = parsed.data;
  }

  const usage = extractUsage(response);
  const latencyMs = Date.now() - startedAt;
  console.log('[GEMINI] Geração concluída', {
    latencyMs,
    finishReason,
    parseStrategy,
    responseSize: String(text || '').length,
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
