// Utilitário para validação de transições de estado
// Usa a state machine para validar transições

const permissionService = require('../services/permissionService');

// Função para validar e executar transição de estado
// Recebe: userId, entityType, currentState, newState, entityId (opcional para logs)
// Retorna: { valid: boolean, error: string }
const validateAndTransition = async (userId, entityType, currentState, newState, entityId = null) => {
  try {
    // Verifica se a transição é permitida
    const canTrans = await permissionService.canTransition(
      userId,
      entityType,
      currentState,
      newState
    );

    if (!canTrans) {
      return {
        valid: false,
        error: `Transição de ${currentState} para ${newState} não é permitida ou você não tem permissão.`
      };
    }

    return {
      valid: true,
      error: null
    };
  } catch (error) {
    console.error('Erro ao validar transição:', error);
    return {
      valid: false,
      error: 'Erro ao validar transição de estado'
    };
  }
};

// Função helper para obter estados válidos de uma entidade
// Recebe: entityType
// Retorna: array de estados
const getValidStates = async (entityType) => {
  return await permissionService.getValidStates(entityType);
};

// Função helper para obter transições possíveis
// Recebe: entityType, fromState
// Retorna: array de transições possíveis
const getPossibleTransitions = async (entityType, fromState) => {
  return await permissionService.getPossibleTransitions(entityType, fromState);
};

module.exports = {
  validateAndTransition,
  getValidStates,
  getPossibleTransitions,
};
