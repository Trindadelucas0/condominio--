// Utilitários para cálculo e verificação de SLA (Service Level Agreement)
// Usado para tarefas e ocorrências

/**
 * Calcula SLA deadline baseado em horas
 * @param {Date|string} startDate - Data/hora de início
 * @param {number} slaHours - SLA em horas (padrão: 24 para tarefas, 48 para ocorrências)
 * @returns {Date} - Data/hora limite para cumprir SLA
 */
const calculateSLADeadline = (startDate, slaHours = 24) => {
  if (!startDate) {
    return null;
  }
  
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return null;
  }
  
  // Adiciona horas ao timestamp
  const deadline = new Date(start.getTime() + (slaHours * 60 * 60 * 1000));
  
  return deadline;
};

/**
 * Verifica se SLA foi violado
 * @param {Date|string} slaDeadline - Data/hora limite do SLA
 * @param {Date|string} completedAt - Data/hora de conclusão (se houver, null se ainda pendente)
 * @returns {boolean} - true se SLA foi violado, false caso contrário
 */
const isSLAViolated = (slaDeadline, completedAt = null) => {
  if (!slaDeadline) {
    return false; // Sem SLA definido, não há violação
  }
  
  const deadline = new Date(slaDeadline);
  if (isNaN(deadline.getTime())) {
    return false;
  }
  
  const now = new Date();
  
  // Se já foi concluído, verifica se foi concluído após o deadline
  if (completedAt) {
    const completed = new Date(completedAt);
    if (!isNaN(completed.getTime())) {
      return completed > deadline;
    }
  }
  
  // Se ainda está pendente, verifica se já passou do deadline
  return now > deadline;
};

/**
 * Calcula horas restantes para SLA (pode ser negativo se violado)
 * @param {Date|string} slaDeadline - Data/hora limite do SLA
 * @param {Date|string} completedAt - Data/hora de conclusão (null se pendente)
 * @returns {number|null} - Horas restantes (negativo se violado), null se não houver SLA
 */
const getSLARemainingHours = (slaDeadline, completedAt = null) => {
  if (!slaDeadline) {
    return null;
  }
  
  const deadline = new Date(slaDeadline);
  if (isNaN(deadline.getTime())) {
    return null;
  }
  
  const referenceDate = completedAt ? new Date(completedAt) : new Date();
  
  if (isNaN(referenceDate.getTime())) {
    return null;
  }
  
  // Calcula diferença em milissegundos e converte para horas
  const diffMs = deadline.getTime() - referenceDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10; // Arredonda para 1 decimal
};

/**
 * Obtém SLA padrão baseado em prioridade
 * @param {string} priority - Prioridade (URGENTE, ALTA, NORMAL, BAIXA)
 * @param {string} type - Tipo ('task' ou 'occurrence')
 * @returns {number} - SLA em horas
 */
const getDefaultSLAHours = (priority = 'NORMAL', type = 'task') => {
  // SLA para tarefas (mais curto)
  if (type === 'task') {
    switch (priority) {
      case 'URGENTE':
        return 2; // 2 horas para tarefas urgentes
      case 'ALTA':
        return 6; // 6 horas para tarefas de alta prioridade
      case 'NORMAL':
        return 24; // 24 horas para tarefas normais
      case 'BAIXA':
        return 72; // 72 horas para tarefas de baixa prioridade
      default:
        return 24;
    }
  }
  
  // SLA para ocorrências (mais longo)
  if (type === 'occurrence') {
    switch (priority) {
      case 'URGENTE':
        return 4; // 4 horas para ocorrências urgentes
      case 'ALTA':
        return 12; // 12 horas para ocorrências de alta prioridade
      case 'NORMAL':
        return 48; // 48 horas para ocorrências normais
      case 'BAIXA':
        return 120; // 120 horas (5 dias) para ocorrências de baixa prioridade
      default:
        return 48;
    }
  }
  
  return type === 'task' ? 24 : 48;
};

/**
 * Formata SLA para exibição
 * @param {Date|string} slaDeadline - Data/hora limite
 * @param {Date|string} completedAt - Data/hora de conclusão (null se pendente)
 * @returns {object} - { status: 'OK'|'WARNING'|'VIOLATED', remainingHours: number, deadline: Date }
 */
const formatSLAForDisplay = (slaDeadline, completedAt = null) => {
  if (!slaDeadline) {
    return {
      status: 'NO_SLA',
      remainingHours: null,
      deadline: null,
      isViolated: false,
    };
  }
  
  const deadline = new Date(slaDeadline);
  const remainingHours = getSLARemainingHours(slaDeadline, completedAt);
  const isViolated = isSLAViolated(slaDeadline, completedAt);
  
  let status = 'OK';
  if (isViolated) {
    status = 'VIOLATED';
  } else if (remainingHours !== null && remainingHours < 6) {
    status = 'WARNING'; // Menos de 6 horas restantes
  }
  
  return {
    status,
    remainingHours,
    deadline,
    isViolated,
  };
};

module.exports = {
  calculateSLADeadline,
  isSLAViolated,
  getSLARemainingHours,
  getDefaultSLAHours,
  formatSLAForDisplay,
};
