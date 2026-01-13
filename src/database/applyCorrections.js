// Script para aplicar correções no banco de dados automaticamente
// Verifica se as correções já foram aplicadas e aplica se necessário
// Pode ser executado manualmente ou automaticamente no startup do servidor

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Verifica se as correções já foram aplicadas
 */
async function checkIfCorrectionsApplied() {
  try {
    // Verifica se a coluna deleted_at existe em financial_entries
    const checkDeletedAt = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_entries' 
      AND column_name = 'deleted_at'
    `);

    // Verifica se a coluna asset_id existe em financial_exits
    const checkAssetId = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_exits' 
      AND column_name = 'asset_id'
    `);

    // Verifica se os estados corretos existem na state machine
    const checkStates = await query(`
      SELECT state 
      FROM state_machines 
      WHERE entity_type = 'financial_entries' 
      AND state = 'PENDING_REVIEW'
    `);

    return {
      deletedAtExists: checkDeletedAt.rows.length > 0,
      assetIdExists: checkAssetId.rows.length > 0,
      statesExist: checkStates.rows.length > 0,
      allApplied: checkDeletedAt.rows.length > 0 && 
                  checkAssetId.rows.length > 0 && 
                  checkStates.rows.length > 0
    };
  } catch (error) {
    console.error('Erro ao verificar correções:', error.message);
    throw error;
  }
}

/**
 * Aplica as correções no banco de dados
 */
async function applyCorrections() {
  const client = await require('../config/database').getClient();
  
  try {
    await client.query('BEGIN'); // Inicia transação

    console.log('🔧 Aplicando correções no banco de dados...');

    // ============================================
    // CORREÇÃO 1: Estados de financial_entries
    // ============================================
    console.log('  → Atualizando estados de financial_entries...');

    // Remove estados antigos e insere novos estados
    await client.query(`DELETE FROM state_transitions WHERE entity_type = 'financial_entries'`);
    await client.query(`DELETE FROM state_machines WHERE entity_type = 'financial_entries'`);

    // Insere novos estados
    await client.query(`
      INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
        ('financial_entries', 'PENDING_REVIEW', 'Aguardando Análise', 'Entrada criada, aguardando análise do síndico', TRUE, FALSE, 1)
      ON CONFLICT (entity_type, state) DO NOTHING
    `);

    await client.query(`
      INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
        ('financial_entries', 'APPROVED', 'Aprovada', 'Entrada aprovada pelo síndico, aguardando recebimento', FALSE, FALSE, 2)
      ON CONFLICT (entity_type, state) DO NOTHING
    `);

    await client.query(`
      INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
        ('financial_entries', 'REJECTED', 'Rejeitada', 'Entrada rejeitada pelo síndico', FALSE, TRUE, 3)
      ON CONFLICT (entity_type, state) DO NOTHING
    `);

    await client.query(`
      INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
        ('financial_entries', 'RECEIVED', 'Recebida', 'Entrada recebida (final)', FALSE, TRUE, 4)
      ON CONFLICT (entity_type, state) DO NOTHING
    `);

    // Insere transições
    await client.query(`
      INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
        ('financial_entries', 'PENDING_REVIEW', 'APPROVED', 'financial_entries:approve', 'Entrada aprovada pelo síndico')
      ON CONFLICT (entity_type, from_state, to_state) DO NOTHING
    `);

    await client.query(`
      INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
        ('financial_entries', 'PENDING_REVIEW', 'REJECTED', 'financial_entries:approve', 'Entrada rejeitada pelo síndico')
      ON CONFLICT (entity_type, from_state, to_state) DO NOTHING
    `);

    await client.query(`
      INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
        ('financial_entries', 'APPROVED', 'RECEIVED', 'financial_entries:mark_received', 'Entrada marcada como recebida')
      ON CONFLICT (entity_type, from_state, to_state) DO NOTHING
    `);

    await client.query(`
      INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
        ('financial_entries', 'REJECTED', 'PENDING_REVIEW', 'financial_entries:approve', 'Entrada rejeitada reaberta para análise')
      ON CONFLICT (entity_type, from_state, to_state) DO NOTHING
    `);

    // ============================================
    // CORREÇÃO 2: Soft Delete em financial_entries
    // ============================================
    console.log('  → Adicionando soft delete em financial_entries...');

    // Verifica e adiciona deleted_at
    const checkDeletedAt = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_entries' AND column_name = 'deleted_at'
    `);
    
    if (checkDeletedAt.rows.length === 0) {
      await client.query(`ALTER TABLE financial_entries ADD COLUMN deleted_at TIMESTAMP NULL`);
    }

    // Verifica e adiciona deleted_by
    const checkDeletedBy = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_entries' AND column_name = 'deleted_by'
    `);
    
    if (checkDeletedBy.rows.length === 0) {
      await client.query(`ALTER TABLE financial_entries ADD COLUMN deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    }

    // Verifica e adiciona delete_reason
    const checkDeleteReason = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_entries' AND column_name = 'delete_reason'
    `);
    
    if (checkDeleteReason.rows.length === 0) {
      await client.query(`ALTER TABLE financial_entries ADD COLUMN delete_reason TEXT`);
    }

    // Índice para melhorar performance
    await client.query(`DROP INDEX IF EXISTS idx_financial_entries_deleted_at`);
    await client.query(`CREATE INDEX idx_financial_entries_deleted_at ON financial_entries(deleted_at) WHERE deleted_at IS NULL`);

    // Comentários para documentação
    try {
      await client.query(`COMMENT ON COLUMN financial_entries.deleted_at IS 'Data/hora da exclusão (soft delete). NULL = não deletado'`);
      await client.query(`COMMENT ON COLUMN financial_entries.deleted_by IS 'ID do usuário que deletou a entrada'`);
      await client.query(`COMMENT ON COLUMN financial_entries.delete_reason IS 'Motivo da exclusão (obrigatório para entradas rejeitadas)'`);
    } catch (commentError) {
      // Ignora erros de comentário (pode não ter permissão)
      console.warn('  ⚠️  Não foi possível adicionar comentários nas colunas (normal se não tiver permissão)');
    }

    // ============================================
    // CORREÇÃO 3: Asset_id em financial_exits
    // ============================================
    console.log('  → Adicionando asset_id em financial_exits...');

    // Verifica e adiciona asset_id
    const checkAssetId = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_exits' AND column_name = 'asset_id'
    `);
    
    if (checkAssetId.rows.length === 0) {
      await client.query(`ALTER TABLE financial_exits ADD COLUMN asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL`);
    }

    // Índice para melhorar performance
    await client.query(`DROP INDEX IF EXISTS idx_financial_exits_asset_id`);
    await client.query(`CREATE INDEX idx_financial_exits_asset_id ON financial_exits(asset_id) WHERE asset_id IS NOT NULL`);

    // Comentário para documentação
    try {
      await client.query(`COMMENT ON COLUMN financial_exits.asset_id IS 'ID do ativo relacionado (opcional). Permite rastrear custos por ativo. Exemplo: "quanto esse elevador custou?" → SUM(amount) WHERE asset_id = X'`);
    } catch (commentError) {
      // Ignora erros de comentário
      console.warn('  ⚠️  Não foi possível adicionar comentário na coluna (normal se não tiver permissão)');
    }

    await client.query('COMMIT'); // Confirma transação

    console.log('✅ Todas as correções foram aplicadas com sucesso!');
    console.log('  → Estados de financial_entries atualizados');
    console.log('  → Soft delete implementado em financial_entries');
    console.log('  → Asset_id adicionado em financial_exits');

    return true;
  } catch (error) {
    await client.query('ROLLBACK'); // Reverte transação em caso de erro
    console.error('❌ Erro ao aplicar correções:', error.message);
    throw error;
  } finally {
    client.release(); // Libera conexão
  }
}

/**
 * Função principal: verifica e aplica correções se necessário
 */
async function ensureCorrectionsApplied() {
  try {
    console.log('🔍 Verificando se as correções já foram aplicadas...');
    
    const status = await checkIfCorrectionsApplied();
    
    if (status.allApplied) {
      console.log('✅ Todas as correções já foram aplicadas anteriormente.');
      return false; // Não aplicou nada (já estava tudo OK)
    }

    console.log('⚠️  Correções pendentes encontradas. Aplicando...');
    await applyCorrections();
    return true; // Aplicou correções
  } catch (error) {
    console.error('❌ Erro ao verificar/aplicar correções:', error.message);
    throw error;
  }
}

// Se executado diretamente (node applyCorrections.js), executa as correções
if (require.main === module) {
  require('dotenv').config();
  
  ensureCorrectionsApplied()
    .then((applied) => {
      if (applied) {
        console.log('\n✅ Processo concluído com sucesso!');
        process.exit(0);
      } else {
        console.log('\n✅ Nenhuma correção necessária.');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Erro fatal:', error);
      process.exit(1);
    });
}

// Exporta funções para uso em outros módulos
module.exports = {
  ensureCorrectionsApplied,
  checkIfCorrectionsApplied,
  applyCorrections
};
