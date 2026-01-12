// Serviço de permissões formais
// Gerencia verificação de permissões baseada em AÇÃO x ENTIDADE

const { query } = require('../config/database');

// Função para verificar se um usuário tem uma permissão específica
// Recebe: userId, entityType, action
// Retorna: boolean
const hasPermission = async (userId, entityType, action) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM role_permissions rp
       INNER JOIN permissions p ON rp.permission_id = p.id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1
         AND p.entity_type = $2
         AND p.action = $3`,
      [userId, entityType, action]
    );

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false; // Em caso de erro, nega acesso
  }
};

// Função para verificar se uma transição de estado é permitida
// Recebe: userId, entityType, fromState, toState
// Retorna: boolean
const canTransition = async (userId, entityType, fromState, toState) => {
  try {
    // Busca a transição
    const transitionResult = await query(
      `SELECT required_permission
       FROM state_transitions
       WHERE entity_type = $1
         AND from_state = $2
         AND to_state = $3`,
      [entityType, fromState, toState]
    );

    if (transitionResult.rows.length === 0) {
      return false; // Transição não existe
    }

    const requiredPermission = transitionResult.rows[0].required_permission;

    // Se não requer permissão específica, permite
    if (!requiredPermission) {
      return true;
    }

    // Extrai entity_type e action da permissão (formato: "entity_type:action")
    const [reqEntityType, reqAction] = requiredPermission.split(':');

    // Verifica se o usuário tem a permissão necessária
    return await hasPermission(userId, reqEntityType, reqAction);
  } catch (error) {
    console.error('Erro ao verificar transição:', error);
    return false;
  }
};

// Função para obter todas as permissões de um usuário
// Recebe: userId
// Retorna: array de permissões [{entityType, action}]
const getUserPermissions = async (userId) => {
  try {
    const result = await query(
      `SELECT DISTINCT p.entity_type, p.action
       FROM role_permissions rp
       INNER JOIN permissions p ON rp.permission_id = p.id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY p.entity_type, p.action`,
      [userId]
    );

    return result.rows.map(row => ({
      entityType: row.entity_type,
      action: row.action,
    }));
  } catch (error) {
    console.error('Erro ao buscar permissões do usuário:', error);
    return [];
  }
};

// Função para obter estados válidos de uma entidade
// Recebe: entityType
// Retorna: array de estados
const getValidStates = async (entityType) => {
  try {
    const result = await query(
      `SELECT state, display_name, description, is_initial, is_final, display_order
       FROM state_machines
       WHERE entity_type = $1
       ORDER BY display_order`,
      [entityType]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar estados válidos:', error);
    return [];
  }
};

// Função para obter transições permitidas de um estado
// Recebe: entityType, fromState
// Retorna: array de estados de destino possíveis
const getPossibleTransitions = async (entityType, fromState) => {
  try {
    const result = await query(
      `SELECT to_state, required_permission, description
       FROM state_transitions
       WHERE entity_type = $1 AND from_state = $2`,
      [entityType, fromState]
    );

    return result.rows.map(row => ({
      toState: row.to_state,
      requiredPermission: row.required_permission,
      description: row.description,
    }));
  } catch (error) {
    console.error('Erro ao buscar transições possíveis:', error);
    return [];
  }
};

module.exports = {
  hasPermission,
  canTransition,
  getUserPermissions,
  getValidStates,
  getPossibleTransitions,
};
