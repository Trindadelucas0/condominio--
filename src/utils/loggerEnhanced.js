// Sistema de logs melhorado com retry e alertas
// Extensão do logger.js original

const { query } = require('../config/database');
const { logAction: originalLogAction } = require('./logger');

// Fila de logs que falharam (para retry)
let failedLogsQueue = [];

// Função para registrar log com retry
// Recebe: mesmos parâmetros de logAction
// Retorna: ID do log criado ou null
const logActionWithRetry = async (logData, retries = 3) => {
  try {
    const logId = await originalLogAction(logData);
    
    // Se sucesso, tenta processar fila de logs falhados
    if (logId && failedLogsQueue.length > 0) {
      processFailedLogsQueue();
    }
    
    return logId;
  } catch (error) {
    console.error('Erro ao registrar log (tentativa):', error);
    
    // Adiciona à fila para retry
    failedLogsQueue.push({
      data: logData,
      retries: retries - 1,
      timestamp: new Date()
    });
    
    // Alerta se é primeira falha
    if (retries === 3) {
      console.error('⚠️  ATENÇÃO: Falha ao registrar log de auditoria. Log será tentado novamente.');
      console.error('⚠️  Dados do log:', JSON.stringify(logData, null, 2));
    }
    
    return null;
  }
};

// Processa fila de logs falhados
const processFailedLogsQueue = async () => {
  if (failedLogsQueue.length === 0) return;
  
  const logsToRetry = [...failedLogsQueue];
  failedLogsQueue = [];
  
  for (const logEntry of logsToRetry) {
    if (logEntry.retries > 0) {
      try {
        const logId = await originalLogAction(logEntry.data);
        if (logId) {
          console.log('✅ Log de auditoria registrado após retry');
        } else {
          // Re-adiciona à fila se ainda falhou
          failedLogsQueue.push({
            ...logEntry,
            retries: logEntry.retries - 1
          });
        }
      } catch (error) {
        // Re-adiciona à fila se ainda falhou
        failedLogsQueue.push({
          ...logEntry,
          retries: logEntry.retries - 1
        });
      }
    } else {
      // Logs que esgotaram tentativas - registrar em tabela de logs perdidos
      console.error('❌ Log de auditoria PERDIDO após esgotar tentativas:', JSON.stringify(logEntry.data, null, 2));
      
      // Tenta registrar em tabela de logs perdidos (se existir)
      try {
        await query(
          `INSERT INTO audit_logs_failed (log_data, failed_at, error_message)
           VALUES ($1, CURRENT_TIMESTAMP, $2)`,
          [JSON.stringify(logEntry.data), 'Esgotou tentativas de retry']
        );
      } catch (err) {
        // Se tabela não existe, apenas loga no console
        console.error('Não foi possível registrar log perdido:', err.message);
      }
    }
  }
};

// Processa fila periodicamente (a cada 30 segundos)
setInterval(() => {
  if (failedLogsQueue.length > 0) {
    processFailedLogsQueue();
  }
}, 30000);

// Função para obter estatísticas de logs
const getLogStats = async (condominiumId = null) => {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as logs_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as logs_week
      FROM audit_logs
    `;
    const params = [];
    
    if (condominiumId) {
      sql += ` WHERE condominium_id = $1`;
      params.push(condominiumId);
    }
    
    const result = await query(sql, params);
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao obter estatísticas de logs:', error);
    return null;
  }
};

module.exports = {
  logActionWithRetry,
  processFailedLogsQueue,
  getLogStats,
  getFailedLogsCount: () => failedLogsQueue.length,
};
