/**
 * Período do dashboard (data início / data fim) com validação e período anterior de mesma duração (dias inclusivos).
 */

const MAX_RANGE_DAYS = 366;

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** @returns {string} YYYY-MM-DD no fuso local */
function toISODateLocal(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** @param {string} iso YYYY-MM-DD */
function parseLocalDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  if (mo < 1 || mo > 12 || day < 1 || day > 31) return null;
  const d = new Date(y, mo - 1, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== day) return null;
  return d;
}

function daysInclusive(dataInicioStr, dataFimStr) {
  const a = parseLocalDate(dataInicioStr);
  const b = parseLocalDate(dataFimStr);
  if (!a || !b) return 0;
  const diffMs = b.getTime() - a.getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

/** Primeiro e último dia do mês calendário atual (local). */
function defaultCurrentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return {
    dataInicio: toISODateLocal(start),
    dataFim: toISODateLocal(end),
  };
}

/**
 * @param {string|undefined} dataInicioStr
 * @param {string|undefined} dataFimStr
 * @returns {{ dataInicio: string, dataFim: string, dataInicioAnterior: string, dataFimAnterior: string, diasInclusivos: number, label: string, labelAnterior: string }}
 */
function resolveDashboardPeriod(dataInicioStr, dataFimStr) {
  const def = defaultCurrentMonthRange();
  let dataInicio = dataInicioStr && String(dataInicioStr).trim();
  let dataFim = dataFimStr && String(dataFimStr).trim();

  if (!dataInicio && !dataFim) {
    return buildPeriodObject(def.dataInicio, def.dataFim);
  }

  if (!dataInicio || !dataFim) {
    return buildPeriodObject(def.dataInicio, def.dataFim);
  }

  const di = parseLocalDate(dataInicio);
  const df = parseLocalDate(dataFim);
  if (!di || !df || di > df) {
    return buildPeriodObject(def.dataInicio, def.dataFim);
  }

  const dias = daysInclusive(dataInicio, dataFim);
  if (dias < 1 || dias > MAX_RANGE_DAYS) {
    return buildPeriodObject(def.dataInicio, def.dataFim);
  }

  dataInicio = toISODateLocal(di);
  dataFim = toISODateLocal(df);
  return buildPeriodObject(dataInicio, dataFim);
}

function buildPeriodObject(dataInicio, dataFim) {
  const dias = daysInclusive(dataInicio, dataFim);
  const start = parseLocalDate(dataInicio);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (dias - 1));

  const dataInicioAnterior = toISODateLocal(prevStart);
  const dataFimAnterior = toISODateLocal(prevEnd);

  return {
    dataInicio,
    dataFim,
    dataInicioAnterior,
    dataFimAnterior,
    diasInclusivos: dias,
    label: formatPeriodLabelBR(dataInicio, dataFim),
    labelAnterior: formatPeriodLabelBR(dataInicioAnterior, dataFimAnterior),
  };
}

function formatPeriodLabelBR(inicio, fim) {
  const di = parseLocalDate(inicio);
  const df = parseLocalDate(fim);
  if (!di || !df) return '';
  const opt = { day: '2-digit', month: 'short', year: 'numeric' };
  return `${di.toLocaleDateString('pt-BR', opt)} — ${df.toLocaleDateString('pt-BR', opt)}`;
}

module.exports = {
  resolveDashboardPeriod,
  formatPeriodLabelBR,
  daysInclusive,
  MAX_RANGE_DAYS,
  toISODateLocal,
};
