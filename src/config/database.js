// Configuração de conexão com PostgreSQL
// Este arquivo gerencia a conexão com o banco de dados
// Usa a biblioteca 'pg' para conexões SQL puro (sem ORM)

const { Pool } = require('pg'); // Pool de conexões do PostgreSQL
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

// Monta string de conexão a partir de variáveis de ambiente separadas
// Se DATABASE_URL estiver definido, usa ele (prioridade - necessário no Render)
// Caso contrário, constrói a partir de DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE
let connectionString;
let poolConfig = {};

// Em produção (Render), DATABASE_URL é obrigatória
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não configurada em produção. Configure a variável DATABASE_URL no Render.');
  throw new Error('DATABASE_URL é obrigatória em produção. Configure no painel do Render.');
}

if (process.env.DATABASE_URL) {
  // No Render, sempre use DATABASE_URL
  connectionString = process.env.DATABASE_URL;
  console.log('✅ Usando DATABASE_URL para conexão com banco de dados');
  // Em produção, força SSL mesmo se não estiver na URL
  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
    console.log('🔒 SSL habilitado para produção');
  }
} else {
  // Constrói connectionString a partir de variáveis separadas (desenvolvimento local)
  console.log('⚠️  DATABASE_URL não encontrada, usando variáveis separadas');
  const dbHost = process.env.DB_HOST || 'localhost'; // Host do banco (padrão: localhost)
  const dbPort = process.env.DB_PORT || '5432'; // Porta do banco (padrão: 5432)
  const dbUser = process.env.DB_USER; // Usuário do banco (obrigatório)
  const dbPassword = process.env.DB_PASSWORD; // Senha do banco (obrigatório)
  const dbDatabase = process.env.DB_DATABASE; // Nome do banco (obrigatório)
  
  console.log(`🔍 Tentando conectar em: ${dbUser}@${dbHost}:${dbPort}/${dbDatabase}`);
  
  // Valida se variáveis obrigatórias foram fornecidas
  if (!dbUser || !dbPassword || !dbDatabase) {
    throw new Error('Variáveis de ambiente do banco não configuradas. Configure DB_USER, DB_PASSWORD e DB_DATABASE no .env ou use DATABASE_URL');
  }
  
  // Formato: postgresql://usuario:senha@host:porta/nome_banco
  connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabase}`;
  
  // Em produção com variáveis separadas, também aplica SSL
  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
    console.log('🔒 SSL habilitado para produção');
  }
}

// Cria pool de conexões com PostgreSQL
// Pool permite reutilização de conexões, melhorando performance
const pool = new Pool({
  connectionString: connectionString, // String de conexão montada
  ...poolConfig, // Configuração SSL para produção (se aplicável)
  // Configurações opcionais do pool
  max: 20, // Máximo de 20 conexões simultâneas
  idleTimeoutMillis: 30000, // Fecha conexões inativas após 30 segundos
  connectionTimeoutMillis: 2000, // Timeout de 2 segundos para estabelecer conexão
});

// Evento disparado quando há erro na conexão
pool.on('error', (err) => {
  console.error('Erro inesperado na conexão com o banco:', err);
  // Não encerra o processo, apenas loga o erro
  // O pool tentará reconectar automaticamente
});

// Função para executar queries SQL
// Recebe: texto SQL e parâmetros (array)
// Retorna: resultado da query
const query = async (text, params) => {
  const start = Date.now(); // Marca início da execução para log
  try {
    const res = await pool.query(text, params); // Executa query usando o pool
    const duration = Date.now() - start; // Calcula tempo de execução
    // Em desenvolvimento, loga queries lentas (>1s)
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.log('Query lenta detectada:', { text, duration, rows: res.rowCount });
    }
    return res; // Retorna resultado (rows, rowCount, etc)
  } catch (error) {
    console.error('Erro ao executar query:', { text, error: error.message });
    throw error; // Propaga erro para quem chamou
  }
};

// Função para obter cliente do pool (para transações)
// Usado quando precisa de múltiplas queries na mesma conexão
const getClient = async () => {
  const client = await pool.connect(); // Obtém cliente do pool
  return client; // Retorna cliente para uso em transações
};

// Exporta funções para uso em outros módulos
module.exports = {
  query, // Função principal para queries
  getClient, // Função para obter cliente (transações)
  pool, // Pool exportado para casos especiais
};
