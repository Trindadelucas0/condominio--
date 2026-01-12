// Job automático para gerar checklists diários
// Executa todo dia às 00:01 (configurar via cron ou node-cron)

const dailyChecklistService = require('../services/dailyChecklistService');
const { query } = require('../config/database');

// Função para executar geração de checklists para todos os condomínios ativos
// ATENÇÃO: Esta função é apenas para execução automática via cron job
// Para execução manual, use runManually(condominiumId) que gera apenas para o condomínio específico
// Esta função deve ser chamada por um cron job todo dia
const generateDailyChecklistsForAllCondominiums = async () => {
  try {
    console.log('[DAILY_CHECKLIST_JOB] Iniciando geração de checklists diários...');

    // Busca todos os condomínios ativos
    const condominiumsResult = await query(
      `SELECT id, name FROM condominiums WHERE active = TRUE`
    );

    const condominiums = condominiumsResult.rows;
    console.log(`[DAILY_CHECKLIST_JOB] Encontrados ${condominiums.length} condomínios ativos`);

    const today = new Date();
    let totalCreated = 0;

    for (const condominium of condominiums) {
      try {
        const created = await dailyChecklistService.generateDailyChecklists(
          condominium.id,
          today
        );

        totalCreated += created.length;
        console.log(`[DAILY_CHECKLIST_JOB] Condomínio ${condominium.name}: ${created.length} checklists criados`);
      } catch (error) {
        console.error(`[DAILY_CHECKLIST_JOB] Erro ao gerar checklists para condomínio ${condominium.name}:`, error);
      }
    }

    console.log(`[DAILY_CHECKLIST_JOB] Concluído! Total de ${totalCreated} checklists criados`);
    return { totalCreated, condominiumsProcessed: condominiums.length };
  } catch (error) {
    console.error('[DAILY_CHECKLIST_JOB] Erro fatal:', error);
    throw error;
  }
};

// Função para executar manualmente (útil para testes ou chamadas via endpoint)
// IMPORTANTE: Quando chamada via endpoint, sempre recebe condominiumId do usuário logado
// Gera checklists apenas para o condomínio especificado e seus departamentos/usuários
const runManually = async (condominiumId = null) => {
  try {
    if (!condominiumId) {
      throw new Error('condominiumId é obrigatório para execução manual');
    }
    
    // Gera apenas para o condomínio específico (e seus departamentos/usuários)
    const created = await dailyChecklistService.generateDailyChecklists(condominiumId);
    return { totalCreated: created.length, condominiumsProcessed: 1 };
  } catch (error) {
    console.error('[DAILY_CHECKLIST_JOB] Erro ao executar manualmente:', error);
    throw error;
  }
};

module.exports = {
  generateDailyChecklistsForAllCondominiums,
  runManually
};
