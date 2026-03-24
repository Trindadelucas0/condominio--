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

const buildLocalInsight = (payload) => {
  const isWeekly = payload?.reportType === 'WEEKLY';
  const metrics = isWeekly ? payload?.weekly?.totals || {} : payload?.daily || {};
  const entries = toNumber(metrics.entries);
  const exits = toNumber(metrics.exits);
  const balance = toNumber(metrics.balance);
  const expensePressure = asPercentChange(entries, exits);
  const cat = topCategory(payload);

  const summary = [];
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

  const topInsights = [
    `Entradas totais: ${entries.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
    `Saídas totais: ${exits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
    balance >= 0
      ? 'Saldo final positivo, com margem para organizar reservas e obrigações futuras.'
      : 'Saldo final negativo, indicando necessidade de ajuste imediato de caixa.',
  ];

  if (cat) {
    topInsights[2] = `A maior categoria de saída foi "${cat.category}", com ${cat.total.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}.`;
  }

  const risks = [];
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

  const recommendedActions = [
    'Definir teto por categoria de despesa para o próximo ciclo.',
    'Priorizar pagamentos críticos e reagendar itens não urgentes quando necessário.',
    'Revisar semanalmente o fluxo de caixa com foco em reduzir saídas não essenciais.',
  ];

  return {
    enabled: true,
    cached: false,
    source: 'LOCAL_FALLBACK',
    data: {
      executive_summary: summary.join(' '),
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
