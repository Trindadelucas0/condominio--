require('dotenv').config();

async function runDatabaseMigrations() {
  const { initializeDatabase } = require('./init');
  const { ensureCorrectionsApplied } = require('./applyCorrections');

  console.log('📦 Iniciando migrações e correções de banco...');
  await initializeDatabase();
  await ensureCorrectionsApplied();
  console.log('✅ Migrações e correções concluídas.');
}

if (require.main === module) {
  runDatabaseMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro ao executar migrações:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runDatabaseMigrations,
};
