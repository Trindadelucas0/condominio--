// Constantes e mapeamentos para categorias financeiras
// Usado em receitas (financial_entries) e despesas (financial_exits)

// DESPESAS - códigos e labels
const DESPESA_CATEGORIES = [
  { code: 'TARIFAS_PUBLICAS', label: 'Tarifas Públicas - Concessionárias' },
  { code: 'CONTRATOS_FIXOS', label: 'Contratos Fixos' },
  { code: 'DESPESAS_ADMINISTRATIVAS', label: 'Despesas Administrativas' },
  { code: 'DESPESAS_MANUTENCAO', label: 'Despesas com Manutenção' },
  { code: 'DESPESAS_FINANCEIRAS', label: 'Despesas Financeiras' },
  { code: 'IMPOSTOS_TAXAS', label: 'Impostos Taxas e Contribuições' },
  { code: 'BENS_PATRIMONIAIS', label: 'Bens Patrimoniais' },
  { code: 'DESPESAS_FUNDO_RESERVA', label: 'DESPESAS FUNDO DE RESERVA' },
];

// RECEITAS - códigos e labels
const RECEITA_CATEGORIES = [
  { code: 'RECEITAS_COTAS_ORDINARIA', label: 'RECEITAS DE COTAS ORDINÁRIA' },
  { code: 'RECEITAS_FUNDO_RESERVA', label: 'RECEITAS DE FUNDO DE RESERVA' },
  { code: 'RECEITAS_TAXAS_EXTRAS', label: 'RECEITAS DE TAXAS EXTRAS' },
  { code: 'RECEITAS_ALUGUEIS', label: 'RECEITAS DE ALUGUÉIS' },
  { code: 'RECEITAS_FINANCEIRAS', label: 'RECEITAS FINANCEIRAS' },
  { code: 'RECEITAS_EVENTUAIS', label: 'RECEITAS EVENTUAIS' },
];

// Defaults para novos registros
const DEFAULT_RECEITA_CATEGORY = 'RECEITAS_COTAS_ORDINARIA';
const DEFAULT_DESPESA_CATEGORY = 'DESPESAS_ADMINISTRATIVAS';

// Mapeamento código -> label (exibição)
const RECEITA_LABELS = Object.fromEntries(
  RECEITA_CATEGORIES.map((c) => [c.code, c.label])
);

const DESPESA_LABELS = Object.fromEntries(
  DESPESA_CATEGORIES.map((c) => [c.code, c.label])
);

// Fallback para categorias antigas (compatibilidade com dados existentes)
const RECEITA_LEGACY_MAP = {
  TAXA: 'RECEITAS DE COTAS ORDINÁRIA',
  RECEITA: 'RECEITAS EVENTUAIS',
  OUTRA: 'RECEITAS EVENTUAIS',
};

const DESPESA_LEGACY_MAP = {
  MANUTENCAO: 'Despesas com Manutenção',
  CONTA: 'Tarifas Públicas - Concessionárias',
  CONTRATO: 'Contratos Fixos',
  OUTRA: 'Despesas Administrativas',
};

// Mapeamento legado -> código novo (para formulários de edição)
const RECEITA_LEGACY_TO_NEW = {
  TAXA: 'RECEITAS_COTAS_ORDINARIA',
  RECEITA: 'RECEITAS_EVENTUAIS',
  OUTRA: 'RECEITAS_EVENTUAIS',
};

const DESPESA_LEGACY_TO_NEW = {
  MANUTENCAO: 'DESPESAS_MANUTENCAO',
  CONTA: 'TARIFAS_PUBLICAS',
  CONTRATO: 'CONTRATOS_FIXOS',
  OUTRA: 'DESPESAS_ADMINISTRATIVAS',
};

/**
 * Normaliza categoria legada para código novo (uso em formulários de edição).
 */
function normalizeReceitaCategoryForForm(code) {
  return RECEITA_LEGACY_TO_NEW[code] || code;
}

function normalizeDespesaCategoryForForm(code) {
  return DESPESA_LEGACY_TO_NEW[code] || code;
}

/**
 * Retorna o label de exibição para uma categoria de receita.
 * @param {string} code - Código da categoria (pode ser novo ou legado)
 * @returns {string}
 */
function getReceitaLabel(code) {
  if (!code) return '';
  return RECEITA_LABELS[code] || RECEITA_LEGACY_MAP[code] || code;
}

/**
 * Retorna o label de exibição para uma categoria de despesa.
 * @param {string} code - Código da categoria (pode ser novo ou legado)
 * @returns {string}
 */
function getDespesaLabel(code) {
  if (!code) return '';
  return DESPESA_LABELS[code] || DESPESA_LEGACY_MAP[code] || code;
}

/**
 * Objeto unificado para uso nas views (entries + exits).
 * @param {string} code - Código da categoria
 * @param {string} type - 'receita' ou 'despesa'
 * @returns {string}
 */
function getCategoryLabel(code, type) {
  if (!code) return '';
  return type === 'receita' ? getReceitaLabel(code) : getDespesaLabel(code);
}

// Labels unificados para views (receita + despesa + legado)
const ALL_CATEGORY_LABELS = {
  ...RECEITA_LABELS,
  ...DESPESA_LABELS,
  ...RECEITA_LEGACY_MAP,
  ...DESPESA_LEGACY_MAP,
};

module.exports = {
  DESPESA_CATEGORIES,
  RECEITA_CATEGORIES,
  DEFAULT_RECEITA_CATEGORY,
  DEFAULT_DESPESA_CATEGORY,
  RECEITA_LABELS,
  DESPESA_LABELS,
  RECEITA_LEGACY_MAP,
  DESPESA_LEGACY_MAP,
  RECEITA_LEGACY_TO_NEW,
  DESPESA_LEGACY_TO_NEW,
  ALL_CATEGORY_LABELS,
  normalizeReceitaCategoryForForm,
  normalizeDespesaCategoryForForm,
  getReceitaLabel,
  getDespesaLabel,
  getCategoryLabel,
};
