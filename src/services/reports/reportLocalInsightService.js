const toNumber = (value) => Number(value || 0);

const asPercentChange = (base, compared) => {
  const b = toNumber(base);
  const c = toNumber(compared);
  if (!b && !c) return 0;
  if (!b) return 100;
  return ((c - b) / b) * 100;
};

const topCategory = (payload) => {
  const list =
    payload?.reportType === 'WEEKLY'
      ? []
      : Array.isArray(payload?.daily?.categories)
      ? payload.daily.categories
      : [];
  if (!list.length) return null;
  const first = list[0];
  return {
    category: String(first.category || 'OUTRAS'),
    total: toNumber(first.total),
  };
};

const buildLocalInsight = (payload, options = {}) => {
  const includeFinancial = options.includeFinancial !== false;
  const includeMaintenance = options.includeMaintenance !== false;
  const isWeekly = payload?.reportType === 'WEEKLY';

  if (!includeFinancial && !includeMaintenance) {
    return {
      enabled: true,
      cached: false,
      source: 'LOCAL_FALLBACK',
      data: {
        executive_summary:
          'Este relatório foi configurado para não exibir blocos financeiros nem de manutenção. Recomenda-se revisar as preferências se forem necessários indicadores numéricos.',
        top_insights: [
          'As preferências atuais limitam a análise automatizada a orientações gerais.',
          'Ajuste os blocos incluídos no relatório para receber métricas detalhadas.',
          'O acompanhamento periódico continua essencial para a gestão do condomínio.',
        ],
        risks: [
          'Decisões sem visibilidade de números podem aumentar a incerteza operacional.',
          'Falta de rastreio de manutenções pode atrasar correções preventivas.',
          'Comunicação com moradores pode ficar menos embasada sem indicadores.',
        ],
        recommended_actions: [
          'Revisar periodicamente quais blocos do relatório devem ser enviados.',
          'Garantir que a equipe consulte o sistema para dados completos quando necessário.',
          'Registrar decisões importantes em ata ou comunicados oficiais.',
        ],
        confidence: 55,
      },
    };
  }

  if (!includeFinancial && includeMaintenance && !isWeekly) {
    const m = payload?.daily?.maintenances || {};
    const p = toNumber(m.pendentes);
    const e = toNumber(m.emAndamento);
    const c = toNumber(m.concluidas);
    const summary = [];
    if (p > 0) summary.push(`Há ${p} manutenção(ões) pendente(s) no período.`);
    if (e > 0) summary.push(`${e} em andamento.`);
    if (c > 0) summary.push(`${c} concluída(s).`);
    if (!summary.length) summary.push('Não há registros de manutenção no período analisado.');

    return {
      enabled: true,
      cached: false,
      source: 'LOCAL_FALLBACK',
      data: {
        executive_summary: summary.join(' '),
        top_insights: [
          `Pendentes: ${p}.`,
          `Em andamento: ${e}.`,
          `Concluídas: ${c}.`,
        ],
        risks: [
          p > 2 ? 'Acúmulo de pendências pode gerar custos maiores depois.' : 'Manter ritmo de abertura e conclusão de chamados.',
          'Falta de priorização pode atrasar itens críticos de infraestrutura.',
          'Comunicação irregular com prestadores pode alongar prazos.',
        ],
        recommended_actions: [
          'Priorizar itens que afetam segurança ou áreas comuns.',
          'Definir responsáveis e prazos para cada pendência.',
          'Registrar evolução dos chamados para auditoria futura.',
        ],
        confidence: 60,
      },
    };
  }

  if (!includeFinancial && isWeekly) {
    const period = payload?.weekly?.period;
    const label = period ? `${period.startDate} a ${period.endDate}` : 'período';
    return {
      enabled: true,
      cached: false,
      source: 'LOCAL_FALLBACK',
      data: {
        executive_summary: `Relatório semanal (${label}) configurado sem exibir dados financeiros. Use o sistema para consultar fluxo de caixa quando necessário.`,
        top_insights: [
          'Os números financeiros não foram incluídos neste envio por preferência.',
          'A gestão deve validar entradas e saídas diretamente no painel financeiro.',
          'Reuniões de conselho podem complementar a visão estratégica do período.',
        ],
        risks: [
          'Decisões sem visão de caixa podem desalinhar planejamento.',
          'Metas de despesas ficam mais difíceis de acompanhar sem série histórica no relatório.',
          'Comunicação com moradores pode exigir outros canais para transparência.',
        ],
        recommended_actions: [
          'Habilitar o bloco financeiro no relatório se a transparência for prioridade.',
          'Agendar revisão semanal dos números no sistema.',
          'Documentar principais decisões do período em ata.',
        ],
        confidence: 58,
      },
    };
  }

  const metrics = isWeekly ? payload?.weekly?.totals || {} : payload?.daily || {};
  const entries = toNumber(metrics.entries);
  const exits = toNumber(metrics.exits);
  const balance = toNumber(metrics.balance);
  const expensePressure = asPercentChange(entries, exits);
  const cat = includeFinancial ? topCategory(payload) : null;

  const summary = [];
  if (includeFinancial) {
    if (balance >= 0) {
      summary.push('O período fechou com saldo positivo.');
    } else {
      summary.push('O período fechou com saldo negativo e exige atenção.');
    }
    if (entries === 0 && exits === 0) {
      summary.push('Não houve movimentação financeira relevante no período.');
    } else if (expensePressure > 15) {
      summary.push('As saídas cresceram acima das entradas no período analisado.');
    } else {
      summary.push('Entradas e saídas estão em patamar próximo no período analisado.');
    }
  }

  const topInsights = includeFinancial
    ? [
        `Entradas totais: ${entries.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        `Saídas totais: ${exits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        balance >= 0
          ? 'Saldo final positivo, com margem para organizar reservas e obrigações futuras.'
          : 'Saldo final negativo, indicando necessidade de ajuste imediato de caixa.',
      ]
    : ['Análise financeira omitida pelas preferências do relatório.', '', ''];

  if (includeFinancial && cat) {
    topInsights[2] = `A maior categoria de saída foi "${cat.category}", com ${cat.total.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}.`;
  }

  const risks = [];
  if (includeFinancial) {
    if (balance < 0) {
      risks.push('Risco de aperto de caixa para compromissos de curto prazo.');
    } else {
      risks.push('Risco de acomodação operacional mesmo com saldo positivo.');
    }
    if (expensePressure > 15) {
      risks.push('Risco de aumento recorrente das despesas acima da capacidade de entrada.');
    } else {
      risks.push('Risco moderado de oscilação de despesas em categorias sem teto definido.');
    }
    risks.push('Risco de decisões sem priorização clara caso não haja revisão semanal dos números.');
  } else {
    risks.push('Risco de lacunas de informação quando blocos são omitidos do relatório.');
    risks.push('Risco de desalinhamento entre conselho e operação sem os mesmos indicadores.');
    risks.push('Risco de comunicação incompleta com moradores.');
  }

  const recommendedActions = includeFinancial
    ? [
        'Definir teto por categoria de despesa para o próximo ciclo.',
        'Priorizar pagamentos críticos e reagendar itens não urgentes quando necessário.',
        'Revisar semanalmente o fluxo de caixa com foco em reduzir saídas não essenciais.',
      ]
    : [
        'Rever as preferências de relatório para incluir métricas necessárias.',
        'Consultar o dashboard financeiro para decisões que exijam números.',
        'Registrar acordos e metas em documentos formais do condomínio.',
      ];

  let executive_summary = summary.join(' ');
  if (includeFinancial && includeMaintenance && !isWeekly) {
    const maint = payload?.daily?.maintenances || {};
    executive_summary += ` Manutenções: ${maint.pendentes || 0} pendentes, ${maint.emAndamento || 0} em andamento, ${maint.concluidas || 0} concluídas.`;
  }

  return {
    enabled: true,
    cached: false,
    source: 'LOCAL_FALLBACK',
    data: {
      executive_summary:
        executive_summary.trim() ||
        'Resumo indisponível. Ajuste as preferências do relatório ou consulte o sistema.',
      top_insights: topInsights,
      risks,
      recommended_actions: recommendedActions,
      confidence: 62,
    },
  };
};

module.exports = {
  buildLocalInsight,
};
