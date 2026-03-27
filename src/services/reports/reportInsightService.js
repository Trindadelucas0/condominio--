const crypto = require('crypto');
const cacheService = require('../cacheService');
const { generateJson } = require('../ai/geminiService');
const { checkQuota, logUsage } = require('../ai/aiQuotaService');
const { buildLocalInsight } = require('./reportLocalInsightService');

const shouldUseAi = (payload, insightOptions = {}) => {
  if (process.env.REPORT_AI_ENABLED === 'false') return false;
  if (payload.reportType === 'WEEKLY') return true;
  const fin = insightOptions.includeFinancial !== false;
  const maint = insightOptions.includeMaintenance !== false;
  if (!fin && !maint) return true;
  if (!fin && maint) {
    const m = payload?.daily?.maintenances || {};
    const act = (m.pendentes || 0) + (m.emAndamento || 0) + (m.concluidas || 0);
    if (act > 0) return true;
  }
  const threshold = parseFloat(process.env.REPORT_AI_MIN_ANOMALY_PERCENT || '15');
  const entries = payload?.daily?.entries || 0;
  const exits = payload?.daily?.exits || 0;
  if (!entries && !exits) return false;
  const change = entries > 0 ? Math.abs(((exits - entries) / entries) * 100) : 100;
  return change >= threshold;
};

const compactWeeklyMetrics = (weekly) => {
  const days = Array.isArray(weekly?.days) ? weekly.days : [];
  const firstDays = days.slice(0, 7);
  const lastDays = days.slice(-7);

  const dayWithMaxExit = days.reduce(
    (acc, day) => (Number(day?.exits || 0) > Number(acc?.exits || 0) ? day : acc),
    days[0] || null
  );
  const dayWithMinBalance = days.reduce(
    (acc, day) => (Number(day?.balance || 0) < Number(acc?.balance || 0) ? day : acc),
    days[0] || null
  );

  return {
    period: weekly?.period,
    totals: weekly?.totals,
    days_count: days.length,
    first_7_days: firstDays,
    last_7_days: lastDays,
    worst_exit_day: dayWithMaxExit,
    worst_balance_day: dayWithMinBalance,
  };
};

const compactDailyMetrics = (daily) => ({
  date: daily?.date || null,
  period: daily?.period || null,
  entries: daily?.entries || 0,
  exits: daily?.exits || 0,
  balance: daily?.balance || 0,
  maintenances: daily?.maintenances || {},
  top_categories: (daily?.categories || []).slice(0, 6),
});

const buildPrompt = (payload, mode = 'FULL', insightOptions = {}) => {
  const includeFinancial = insightOptions.includeFinancial !== false;
  const includeMaintenance = insightOptions.includeMaintenance !== false;

  const fullWeekly =
    payload.reportType === 'WEEKLY' ? compactWeeklyMetrics(payload.weekly) : null;
  const fullDaily =
    payload.reportType !== 'WEEKLY' ? compactDailyMetrics(payload.daily) : null;

  let metrics;
  if (payload.reportType === 'WEEKLY') {
    if (!includeFinancial) {
      metrics = {
        period: fullWeekly.period,
        days_count: fullWeekly.days_count,
        note: 'bloco_financeiro_desativado_no_relatorio',
      };
    } else {
      metrics = fullWeekly;
    }
  } else {
    if (!includeFinancial) {
      metrics = {
        period: fullDaily.period,
        date: fullDaily.date,
        note: 'bloco_financeiro_desativado_no_relatorio',
      };
      if (includeMaintenance) {
        metrics.maintenances = fullDaily.maintenances;
      }
    } else {
      metrics = { ...fullDaily };
      if (!includeMaintenance) {
        delete metrics.maintenances;
      }
    }
  }

  const compactMetrics =
    payload.reportType === 'WEEKLY'
      ? !includeFinancial
        ? {
            period: metrics.period,
            days_count: metrics.days_count,
            note: metrics.note,
          }
        : {
            period: metrics.period,
            totals: metrics.totals,
            days_count: metrics.days_count,
            worst_exit_day: metrics.worst_exit_day,
            worst_balance_day: metrics.worst_balance_day,
          }
      : !includeFinancial
        ? {
            period: metrics.period,
            date: metrics.date,
            maintenances: metrics.maintenances,
            note: metrics.note,
          }
        : {
            period: metrics.period,
            entries: metrics.entries,
            exits: metrics.exits,
            balance: metrics.balance,
            maintenances: includeMaintenance ? metrics.maintenances : undefined,
            top_categories: metrics.top_categories,
          };

  const rules = [
    'Apontar 3 principais insights alinhados aos dados fornecidos',
    'Listar 3 riscos objetivos e mensuráveis',
    'Recomendar 3 ações práticas priorizadas',
    'Nao inventar dados ausentes',
  ];
  if (!includeFinancial) {
    rules.push(
      'Nao mencionar valores monetarios, entradas, saidas, saldo nem categorias de despesa, pois o destinatario optou por omitir o bloco financeiro'
    );
    rules.push('Se nao houver metricas, oferecer orientacao operacional geral para gestao condominial');
  }
  if (!includeMaintenance && payload.reportType === 'DAILY') {
    rules.push('Nao mencionar manutencoes ou chamados tecnicos');
  }

  return JSON.stringify(
    {
      condominium_name: payload.condominiumName,
      report_type: payload.reportType,
      generated_at: payload.generatedAt,
      timezone: process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo',
      sections_included: {
        financial: includeFinancial,
        maintenance: includeMaintenance,
      },
      metrics: mode === 'COMPACT' ? compactMetrics : metrics,
      output_rules: {
        max_summary_words: mode === 'COMPACT' ? 35 : 50,
        max_items_each_list: 3,
        short_sentences: true,
        max_words_per_item: mode === 'COMPACT' ? 10 : 14,
      },
      rules,
    },
    null,
    2
  );
};

const SCHEMA_HINT = JSON.stringify({
  executive_summary: 'string max 50 palavras',
  top_insights: ['string curto', 'string curto', 'string curto'],
  risks: ['string curto', 'string curto', 'string curto'],
  recommended_actions: ['string curto', 'string curto', 'string curto'],
  confidence: 'number 0-100',
});

const systemInstruction =
  'Você é analista financeiro condominial. Use somente os dados fornecidos. Não invente números. Responda em português do Brasil, objetiva e profissional.';

const normalizeInsightData = (data = {}) => {
  const asShortArray = (value, fallbackLabel) => {
    const base = Array.isArray(value) ? value : [];
    const cleaned = base
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((item) => (item.length > 160 ? `${item.slice(0, 157)}...` : item));
    while (cleaned.length < 3) cleaned.push(`${fallbackLabel} ${cleaned.length + 1}.`);
    return cleaned;
  };

  const confidenceRaw = Number(data.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.max(0, Math.min(100, Math.round(confidenceRaw)))
    : 60;

  const summary = String(data.executive_summary || '').trim();
  return {
    executive_summary:
      summary.length > 0
        ? summary.slice(0, 450)
        : 'Resumo indisponível. Dados do período considerados para análise.',
    top_insights: asShortArray(data.top_insights, 'Insight'),
    risks: asShortArray(data.risks, 'Risco'),
    recommended_actions: asShortArray(data.recommended_actions, 'Ação'),
    confidence,
  };
};

const tryGemini = async (payload, mode = 'FULL', insightOptions = {}) => {
  const result = await generateJson({
    systemInstruction,
    prompt: buildPrompt(payload, mode, insightOptions),
    schemaHint: SCHEMA_HINT,
    // Aumenta chance de JSON válido para relatórios maiores.
    maxOutputTokens: Math.max(parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '220', 10), 700),
    timeoutMs: Math.max(parseInt(process.env.GEMINI_TIMEOUT_MS || '12000', 10), 25000),
    temperature: 0,
  });
  return {
    enabled: true,
    cached: false,
    source: 'IA',
    data: normalizeInsightData(result.data),
    usage: result.usage,
    latencyMs: result.latencyMs,
  };
};

const generateInsight = async (payload, insightOptions = {}) => {
  const focus = {
    includeFinancial: insightOptions.includeFinancial !== false,
    includeMaintenance: insightOptions.includeMaintenance !== false,
  };

  console.log('[REPORT_INSIGHT] Avaliando geração de insight', {
    condominiumId: payload.condominiumId,
    reportType: payload.reportType,
    focus,
  });
  if (!shouldUseAi(payload, insightOptions)) {
    console.log('[REPORT_INSIGHT] Insight ignorado por regra de negócio', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
    });
    return { enabled: false, reason: 'NOT_REQUIRED' };
  }

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ payload, focus }))
    .digest('hex');
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
    const localInsight = buildLocalInsight(payload, insightOptions);
    localInsight.reason = quota.reason;
    localInsight.data = normalizeInsightData(localInsight.data);
    cacheService.set(cacheKey, localInsight, 60 * 30);
    return localInsight;
  }

  const feature = `${payload.reportType}_REPORT_INSIGHT`;

  try {
    let insight = await tryGemini(payload, 'FULL', insightOptions);

    await logUsage({
      condominiumId: payload.condominiumId,
      feature,
      requestTokens: insight.usage.requestTokens,
      responseTokens: insight.usage.responseTokens,
      latencyMs: insight.latencyMs,
      status: 'SUCCESS',
    });
    cacheService.set(cacheKey, insight, 60 * 60 * 8);
    console.log('[REPORT_INSIGHT] Insight gerado com sucesso', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
      confidence: insight.data?.confidence ?? null,
      source: insight.source,
    });
    return insight;
  } catch (error) {
    console.warn('[REPORT_INSIGHT] AI_RETRY: primeira tentativa falhou, tentando novamente', {
      condominiumId: payload.condominiumId,
      reportType: payload.reportType,
      message: error.message,
    });
    try {
      const retryInsight = await tryGemini(payload, 'COMPACT', insightOptions);
      await logUsage({
        condominiumId: payload.condominiumId,
        feature,
        requestTokens: retryInsight.usage.requestTokens,
        responseTokens: retryInsight.usage.responseTokens,
        latencyMs: retryInsight.latencyMs,
        status: 'SUCCESS',
      });
      cacheService.set(cacheKey, retryInsight, 60 * 60 * 8);
      console.log('[REPORT_INSIGHT] Insight gerado com sucesso (retry)', {
        condominiumId: payload.condominiumId,
        reportType: payload.reportType,
        confidence: retryInsight.data?.confidence ?? null,
        source: retryInsight.source,
      });
      return retryInsight;
    } catch (retryError) {
      await logUsage({
        condominiumId: payload.condominiumId,
        feature,
        status: 'ERROR',
        errorMessage: retryError.message,
      });
      console.error('[REPORT_INSIGHT] AI_FALLBACK_LOCAL: erro no Gemini, gerando análise local', {
        condominiumId: payload.condominiumId,
        reportType: payload.reportType,
        message: retryError.message,
      });
      const localInsight = buildLocalInsight(payload, insightOptions);
      localInsight.data = normalizeInsightData(localInsight.data);
      cacheService.set(cacheKey, localInsight, 60 * 30);
      return localInsight;
    }
  }
};

module.exports = {
  generateInsight,
};
