// Testes de Limpeza - Remove dados de teste criados

const { query } = require('../src/config/database');

async function run(runner) {
  runner.logInfo('Iniciando limpeza de dados de teste...');

  // Limpar dados de teste (opcional - descomente para ativar)
  await runner.test('Limpar dados de teste (OPCIONAL)', async () => {
    runner.logWarning('⚠️  Limpeza de dados DESATIVADA por padrão');
    runner.logDetail('Para ativar, descomente o código de limpeza neste arquivo');
    
    // DESCOMENTE AS LINHAS ABAIXO PARA ATIVAR LIMPEZA AUTOMÁTICA
    /*
    // Remove apartamentos de teste
    await query(`
      DELETE FROM apartments 
      WHERE number LIKE 'TEST-%'
    `);
    
    // Remove taxas de teste
    await query(`
      DELETE FROM monthly_fees 
      WHERE apartment_id IN (
        SELECT id FROM apartments WHERE number LIKE 'TEST-%'
      )
    `);
    
    // Remove assembleias de teste
    await query(`
      DELETE FROM assemblies 
      WHERE agenda LIKE '%Teste%' OR agenda LIKE '%teste%'
    `);
    
    runner.logSuccess('Dados de teste removidos');
    */
    
    runner.logDetail('Dados de teste mantidos para validação manual');
  });

  runner.logSuccess('Limpeza concluída!');
}

module.exports = { run };
