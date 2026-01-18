// Script para aplicar tabelas de multi-aprovação e dashboard config
// Executa os arquivos SQL necessários

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

const applyTables = async () => {
  try {
    console.log('📋 Aplicando tabelas de multi-aprovação e dashboard config...');
    
    // Aplicar tabela de multi-aprovação
    const multiApprovalSql = fs.readFileSync(
      path.join(__dirname, 'extendTablesMultiApproval.sql'),
      'utf8'
    );
    
    await query(multiApprovalSql);
    console.log('✅ Tabelas de multi-aprovação criadas com sucesso');
    
    // Aplicar tabela de dashboard config
    const dashboardConfigSql = fs.readFileSync(
      path.join(__dirname, 'extendTablesDashboardConfig.sql'),
      'utf8'
    );
    
    await query(dashboardConfigSql);
    console.log('✅ Tabela de dashboard config criada com sucesso');
    
    console.log('✅ Todas as tabelas foram aplicadas com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao aplicar tabelas:', error);
    throw error;
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  applyTables()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

module.exports = applyTables;
