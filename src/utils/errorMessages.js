// Service de mensagens de erro amigáveis
// Centraliza todas as mensagens de erro do sistema

const errorMessages = {
  // Aprovações
  APPROVAL_NOT_FOUND: 'Aprovação não encontrada. Verifique se o ID está correto.',
  APPROVAL_ALREADY_PROCESSED: 'Esta aprovação já foi processada. Recarregue a página para ver o status atual.',
  APPROVAL_INSUFFICIENT_PERMISSION: 'Você não tem permissão para aprovar este item. Contate o administrador.',
  
  // Financeiro
  EXIT_NOT_FOUND: 'Saída financeira não encontrada. Verifique se o ID está correto.',
  EXIT_INSUFFICIENT_BALANCE: 'Saldo insuficiente para aprovar esta saída. Verifique o saldo disponível no dashboard.',
  EXIT_ALREADY_APPROVED: 'Esta saída já foi aprovada. Recarregue a página para ver o status atual.',
  EXIT_ALREADY_PAID: 'Esta saída já foi paga e não pode ser editada ou rejeitada.',
  
  // Entradas
  ENTRY_NOT_FOUND: 'Entrada financeira não encontrada. Verifique se o ID está correto.',
  ENTRY_ALREADY_REVIEWED: 'Esta entrada já foi analisada. Recarregue a página para ver o status atual.',
  ENTRY_DUPLICATE: 'Esta entrada parece ser duplicada. Verifique se já não foi aprovada anteriormente.',
  
  // Ocorrências
  OCCURRENCE_NOT_FOUND: 'Ocorrência não encontrada. Verifique se o ID está correto.',
  OCCURRENCE_NOT_REQUIRES_APPROVAL: 'Esta ocorrência não requer aprovação do síndico.',
  OCCURRENCE_ALREADY_PROCESSED: 'Esta ocorrência já foi analisada. Recarregue a página para ver o status atual.',
  
  // Orçamentos
  BUDGET_NOT_FOUND: 'Orçamento não encontrado. Verifique se o ID está correto.',
  BUDGET_ALREADY_PROCESSED: 'Este orçamento já foi analisado. Recarregue a página para ver o status atual.',
  
  // Validações
  REJECTION_REASON_REQUIRED: 'O motivo da rejeição é obrigatório. Por favor, preencha o campo "Motivo da rejeição".',
  APPROVAL_NOTES_REQUIRED: 'Observações são obrigatórias para aprovações de alto valor. Por favor, preencha o campo "Observações".',
  
  // Permissões
  UNAUTHORIZED: 'Você não tem permissão para realizar esta ação. Verifique suas permissões ou contate o administrador.',
  CONDOMINIUM_NOT_ASSOCIATED: 'Usuário não está associado a um condomínio. Contate o administrador.',
  
  // Genérico
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado. Por favor, tente novamente. Se o problema persistir, contate o suporte.',
};

// Função para obter mensagem amigável
const getErrorMessage = (error) => {
  // Se o erro já tem uma mensagem específica, usar ela
  if (error.message && errorMessages[error.message]) {
    return errorMessages[error.message];
  }
  
  // Se o erro contém uma chave conhecida, usar mensagem customizada
  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message && error.message.includes(key)) {
      return message;
    }
  }
  
  // Se o erro tem mensagem, usar ela
  if (error.message) {
    return error.message;
  }
  
  // Fallback
  return errorMessages.UNKNOWN_ERROR;
};

module.exports = {
  errorMessages,
  getErrorMessage,
};
