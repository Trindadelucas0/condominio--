const crypto = require('crypto');
const cacheService = require('../cacheService');
const { generateJson } = require('../ai/geminiService');
const { checkQuota, logUsage } = require('../ai/aiQuotaService');

const shouldUseAi = (payload) => {
  if (process.env.REPORT_AI_ENABLED === 'false') return false;
  if (payload.reportType === 'WEEKLY') return true;
  const threshold = parseFloat(process.env.REPORT_AI_MIN_ANOMALY_PERCENT || '15');
  const entries = payload?.daily?.entries || 0;
  const exits = payload?.daily?.exits || 0;
  if (!entries && !exits) return false;
  const change = entries > 0 ? Math.abs(((exits - entries) / entries) * 100) : 100;
  return change >= threshold;
};

const buildPrompt = (payload) => {
  return JSON.stringify(
    {
      condominium_name: payload.condominiumName,
      report_type: payload.reportType,
      generated_at: payload.generatedAt,
      timezone: process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo',
      metrics: payload.reportType === 'WEEKLY' ? payload.weekly : payload.daily,
      rules: [
        'Apontar 3 principais insights baseados nos números',
        'Listar 3 riscos objetivos e mensuráveis',
        'Recomendar 3 ações práticas priorizadas',
        'Nao inventar dados ausentes',
      ],
    },
    null,
    2
  );
};

const SCHEMA_HINT = JSON.stringify({
  executive_summary: 'string max 120 palavras',
  top_insights: ['string', 'string', 'string'],
  risks: ['string', 'string', 'string'],
  recommended_actions: ['string', 'string', 'string'],
  confidence: 'number 0-100',
});

const systemInstruction =
  'Você é analista financeiro condominial. Use somente os dados fornecidos. Não invente números. Responda em português do Brasil, objetiva e profissional.';

const generateInsight = async (payload) => {
  console.log('[REPORT_INSIGHT] Avaliando geração de insight', {
    condominiumId: payload.condominiumId,
    reportType: payload.reportType,
  });
  if (!shouldUseAi(payload)) {
    console.log('[REPORT_INSIGHT] Insight ignorado por regra de negócio', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
    });
    return { enabled: false, reason: 'NOT_REQUIRED' };
  }

  const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const cacheKey = `ai:insight:${payload.condominiumId}:${payload.reportType}:${hash}`;
  const cached = cacheService.get(cacheKey);
  if (cached) {
    console.log('[REPORT_INSIGHT] Retorno via cache', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
    });
    return { enabled: true, cached: true, ...cached };
  }

  const quota = await checkQuota(payload.condominiumId);
  if (!quota.allowed) {
    console.warn('[REPORT_INSIGHT] Quota bloqueou geração', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
      reason: quota.reason,
    });
    return { enabled: false, reason: quota.reason };
  }

  const feature = `${payload.reportType}_REPORT_INSIGHT`;

  try {
    const result = await generateJson({
      systemInstruction,
      prompt: buildPrompt(payload),
      schemaHint: SCHEMA_HINT,
    });

    await logUsage({
      condominiumId: payload.condominiumId,
      feature,
      requestTokens: result.usage.requestTokens,
      responseTokens: result.usage.responseTokens,
      latencyMs: result.latencyMs,
      status: 'SUCCESS',
    });

    const insight = {
      enabled: true,
      cached: false,
      data: result.data,
    };
    cacheService.set(cacheKey, insight, 60 * 60 * 8);
    console.log('[REPORT_INSIGHT] Insight gerado com sucesso', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
      confidence: insight.data?.confidence ?? null,
    });
    return insight;
  } catch (error) {
    await logUsage({
      condominiumId: payload.condominiumId,
      feature,
      status: 'ERROR',
      errorMessage: error.message,
    });
    console.error('[REPORT_INSIGHT] Erro ao gerar insight', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
      message: error.message,
    });
    return { enabled: false, reason: 'AI_ERROR', error: error.message };
  }
};

module.exports = {
  generateInsight,
};
