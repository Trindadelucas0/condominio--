// Service de multi-aprovação
// Gerencia aprovações que requerem múltiplos aprovadores

const { query, getClient } = require('../config/database');
const { logAction } = require('../utils/logger');

const multiApprovalService = {
  // Verificar se item requer multi-aprovação baseado em regras
  requiresMultiApproval: async (entityType, entityId, condominiumId) => {
    try {
      // Regras: valores acima de R$ 10.000 requerem 2 aprovações
      if (entityType === 'financial_exits') {
        const exitResult = await query(
          `SELECT amount FROM financial_exits WHERE id = $1 AND condominium_id = $2`,
          [entityId, condominiumId]
        );
        
        if (exitResult.rows.length > 0) {
          const amount = parseFloat(exitResult.rows[0].amount);
          return amount >= 10000; // Requer multi-aprovação se >= R$ 10.000
        }
      }
      
      // Orçamentos acima de R$ 20.000 requerem 2 aprovações
      if (entityType === 'budget_requests') {
        const budgetResult = await query(
          `SELECT requested_amount FROM budget_requests WHERE id = $1 AND condominium_id = $2`,
          [entityId, condominiumId]
        );
        
        if (budgetResult.rows.length > 0) {
          const amount = parseFloat(budgetResult.rows[0].requested_amount);
          return amount >= 20000; // Requer multi-aprovação se >= R$ 20.000
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar multi-aprovação:', error);
      return false;
    }
  },
  
  // Obter número de aprovações necessárias baseado em regras
  getRequiredApprovals: (entityType, amount) => {
    if (entityType === 'financial_exits') {
      if (amount >= 50000) return 3; // Valores muito altos: 3 aprovações
      if (amount >= 10000) return 2; // Valores altos: 2 aprovações
    }
    
    if (entityType === 'budget_requests') {
      if (amount >= 50000) return 3;
      if (amount >= 20000) return 2;
    }
    
    return 1; // Padrão: 1 aprovação
  },
  
  // Criar processo de multi-aprovação
  createMultiApproval: async (entityType, entityId, condominiumId, requiredApprovals = 2) => {
    try {
      const result = await query(
        `INSERT INTO multi_approvals (entity_type, entity_id, condominium_id, required_approvals)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (entity_type, entity_id, condominium_id) 
         DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [entityType, entityId, condominiumId, requiredApprovals]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar multi-aprovação:', error);
      throw error;
    }
  },
  
  // Obter multi-aprovação existente
  getMultiApproval: async (entityType, entityId, condominiumId) => {
    try {
      const result = await query(
        `SELECT * FROM multi_approvals 
         WHERE entity_type = $1 AND entity_id = $2 AND condominium_id = $3`,
        [entityType, entityId, condominiumId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Erro ao buscar multi-aprovação:', error);
      throw error;
    }
  },
  
  // Votar em uma multi-aprovação
  vote: async (multiApprovalId, userId, vote, notes, ipAddress, userAgent) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // Buscar multi-aprovação com lock
      const multiApprovalResult = await client.query(
        `SELECT * FROM multi_approvals WHERE id = $1 FOR UPDATE`,
        [multiApprovalId]
      );
      
      if (multiApprovalResult.rows.length === 0) {
        throw new Error('Multi-aprovação não encontrada');
      }
      
      const multiApproval = multiApprovalResult.rows[0];
      
      // Verificar se já votou
      const existingVote = await client.query(
        `SELECT * FROM multi_approval_votes 
         WHERE multi_approval_id = $1 AND user_id = $2`,
        [multiApprovalId, userId]
      );
      
      if (existingVote.rows.length > 0) {
        throw new Error('Você já votou nesta aprovação');
      }
      
      // Inserir voto
      const voteResult = await client.query(
        `INSERT INTO multi_approval_votes (multi_approval_id, user_id, vote, notes, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [multiApprovalId, userId, vote, notes || null, ipAddress || null, userAgent || null]
      );
      
      // Atualizar contador de aprovações
      const currentApprovals = parseInt(multiApproval.current_approvals) + 1;
      const requiredApprovals = parseInt(multiApproval.required_approvals);
      
      let status = 'PENDING';
      if (vote === 'REJECT') {
        status = 'REJECTED'; // Uma rejeição rejeita tudo
      } else if (currentApprovals >= requiredApprovals) {
        status = 'APPROVED'; // Todas as aprovações necessárias
      }
      
      // Atualizar status
      const updateResult = await client.query(
        `UPDATE multi_approvals 
         SET current_approvals = $1, status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [currentApprovals, status, multiApprovalId]
      );
      
      await client.query('COMMIT');

      const updated = updateResult.rows[0];
      
      // Registrar no log de auditoria
      await logAction({
        userId: userId,
        condominiumId: multiApproval.condominium_id,
        action: vote === 'APPROVE' ? 'APPROVE' : 'REJECT',
        module: 'MULTI_APPROVAL',
        entityType: 'multi_approvals',
        entityId: multiApprovalId,
        beforeData: multiApproval,
        afterData: updated,
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
      
      return {
        multiApproval: updated,
        currentApprovals,
        requiredApprovals,
        status,
        remainingApprovals: requiredApprovals - currentApprovals
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Erro ao votar em multi-aprovação:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Obter votos de uma multi-aprovação
  getVotes: async (multiApprovalId) => {
    try {
      const result = await query(
        `SELECT mav.*, u.full_name as user_name, u.username
         FROM multi_approval_votes mav
         LEFT JOIN users u ON mav.user_id = u.id
         WHERE mav.multi_approval_id = $1
         ORDER BY mav.created_at`,
        [multiApprovalId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar votos:', error);
      throw error;
    }
  },
};

module.exports = multiApprovalService;
