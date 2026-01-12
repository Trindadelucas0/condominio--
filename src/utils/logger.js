// Utilitário de logs para auditoria
// Este módulo facilita o registro de ações no sistema
// Todas as ações importantes devem passar por aqui

const { query } = require('../config/database'); // Conexão com banco

// Função para registrar ação no log de auditoria
// Recebe: dados da ação (usuário, ação, módulo, entidade, etc)
// Retorna: ID do log criado
const logAction = async ({
  userId = null, // ID do usuário que executou (NULL se sistema)
  condominiumId = null, // ID do condomínio relacionado
  action, // Tipo de ação: CREATE, UPDATE, DELETE, LOGIN, APPROVE, etc
  module, // Módulo: USER, FINANCIAL, MAINTENANCE, AUTH, etc
  entityType, // Tipo de entidade: users, condominiums, tasks, etc
  entityId = null, // ID da entidade afetada
  beforeData = null, // Estado ANTES (objeto JavaScript, será convertido para JSON)
  afterData = null, // Estado DEPOIS (objeto JavaScript)
  ipAddress = null, // IP de origem
  userAgent = null, // Navegador/dispositivo
}) => {
  try {
    // Converte objetos JavaScript para JSONB (formato do PostgreSQL)
    const beforeJson = beforeData ? JSON.stringify(beforeData) : null;
    const afterJson = afterData ? JSON.stringify(afterData) : null;

    // Insere registro no banco
    const result = await query(
      `INSERT INTO audit_logs (
        user_id, condominium_id, action, module, entity_type, 
        entity_id, before_data, after_data, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        userId,
        condominiumId,
        action,
        module,
        entityType,
        entityId,
        beforeJson,
        afterJson,
        ipAddress,
        userAgent,
      ]
    );

    return result.rows[0].id; // Retorna ID do log criado
  } catch (error) {
    // Loga erro mas não interrompe o fluxo (auditoria não deve quebrar funcionalidades)
    console.error('Erro ao registrar log de auditoria:', error);
    return null; // Retorna null em caso de erro
  }
};

// Exporta função para uso em controllers e services
module.exports = { logAction };
