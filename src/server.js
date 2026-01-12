// Arquivo principal que inicia o servidor
// Este arquivo deve ser executado para iniciar a aplicação

const app = require('./app');
require('dotenv').config();

// Porta do servidor (padrão: 3000)
const PORT = process.env.PORT || 3000;

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  
  // Verifica se as variáveis de ambiente essenciais estão configuradas
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  AVISO: JWT_SECRET não configurado no .env');
  }
  
  if (!process.env.DB_USER && !process.env.DATABASE_URL) {
    console.warn('⚠️  AVISO: Configuração do banco de dados não encontrada no .env');
  }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado (unhandledRejection):', err);
  // Não encerra o processo em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Exceção não capturada (uncaughtException):', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT recebido, encerrando servidor...');
  process.exit(0);
});
