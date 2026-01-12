// Arquivo de inicialização do servidor
// Carrega configurações, inicializa banco e inicia servidor HTTP

require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env (deve ser o primeiro)
const app = require('./app'); // Importa aplicação Express configurada
const initializeDatabase = require('./database/init'); // Função de inicialização do banco

// Porta do servidor (lê do .env ou usa 3000 como padrão)
const PORT = process.env.PORT || 3300;

// Função assíncrona para iniciar servidor
// Inicializa banco primeiro, depois inicia servidor HTTP
const startServer = async () => {
  try {
    // Etapa 1: Inicializar banco de dados
    // Cria tabelas, perfis e SUPER_MASTER se não existirem
    await initializeDatabase();

    // Etapa 2: Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor iniciado na porta ${PORT}`);
      console.log(`📱 Acesse: http://localhost:${PORT}\n`);
    });

    // Tratamento de erro específico para porta em uso
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: A porta ${PORT} já está em uso!\n`);
        console.error('💡 Soluções possíveis:\n');
        console.error(`   1. Encerre o processo que está usando a porta ${PORT}:`);
        console.error(`      Windows: netstat -ano | findstr :${PORT}`);
        console.error(`      Depois: taskkill /PID <PID> /F\n`);
        console.error(`   2. Altere a porta no arquivo .env:`);
        console.error(`      PORT=3001 (ou outra porta disponível)\n`);
        console.error(`   3. Aguarde alguns segundos e tente novamente\n`);
        process.exit(1);
      } else {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    // Se houver erro crítico, encerra processo
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Inicia servidor
startServer();
