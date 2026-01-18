// Service de cache para otimização de performance
// Usa node-cache para desenvolvimento (pode ser substituído por Redis em produção)

const NodeCache = require('node-cache');

// Criar instância do cache com configurações padrão
const cache = new NodeCache({
  stdTTL: 300, // TTL padrão: 5 minutos
  checkperiod: 60, // Verificar expiração a cada 1 minuto
  useClones: false // Não clonar objetos (melhor performance)
});

const cacheService = {
  // Obter valor do cache
  get: (key) => {
    try {
      return cache.get(key);
    } catch (error) {
      console.error('Erro ao obter do cache:', error);
      return null;
    }
  },
  
  // Salvar no cache
  set: (key, value, ttl = 300) => {
    try {
      return cache.set(key, value, ttl);
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
      return false;
    }
  },
  
  // Invalidar cache
  delete: (key) => {
    try {
      return cache.del(key);
    } catch (error) {
      console.error('Erro ao deletar do cache:', error);
      return false;
    }
  },
  
  // Invalidar cache por padrão (ex: todas as chaves que começam com "dashboard:")
  deletePattern: (pattern) => {
    try {
      const keys = cache.keys();
      let deletedCount = 0;
      
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.del(key);
          deletedCount++;
        }
      });
      
      console.log(`🗑️ Cache: ${deletedCount} chave(s) deletada(s) com padrão "${pattern}"`);
      return deletedCount;
    } catch (error) {
      console.error('Erro ao deletar padrão do cache:', error);
      return 0;
    }
  },
  
  // Limpar todo o cache
  flush: () => {
    try {
      cache.flushAll();
      console.log('🗑️ Cache: Todo o cache foi limpo');
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  },
  
  // Obter estatísticas do cache
  getStats: () => {
    return cache.getStats();
  }
};

module.exports = cacheService;
