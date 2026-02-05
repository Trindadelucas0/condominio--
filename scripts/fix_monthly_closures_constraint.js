// Script para remover a constraint de unicidade de monthly_closures (one-off)
// Execute na raiz do projeto: node scripts/fix_monthly_closures_constraint.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { query } = require('../src/config/database');

async function removeConstraint() {
  try {
    console.log('🔍 Verificando constraint de unicidade...');

    const checkResult = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'monthly_closures_condominium_id_month_year_key'
        AND table_name = 'monthly_closures'
      )
    `);

    if (checkResult.rows[0].exists) {
      console.log('⚠️  Constraint encontrada. Removendo...');

      await query(`
        ALTER TABLE monthly_closures
        DROP CONSTRAINT monthly_closures_condominium_id_month_year_key
      `);

      console.log('✅ Constraint removida com sucesso!');
      console.log('✅ Agora é possível criar múltiplas comandas do mesmo mês.');
    } else {
      console.log('✅ Constraint já foi removida anteriormente.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao remover constraint:', error.message);
    process.exit(1);
  }
}

removeConstraint();
