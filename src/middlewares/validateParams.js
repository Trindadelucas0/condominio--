// Middleware para validar parâmetros de rota (ex.: id numérico)
// Evita propagar NaN e retorna 400 com mensagem clara quando o ID é inválido
// Nota: usa req.path porque com router.use() o Express ainda não preencheu req.params

// Segmentos que não são IDs (rotas como /entradas/nova, /centros-custo/novo, listagem /taxas)
const SEGMENT_WHITELIST = new Set(['nova', 'novo', 'relatorio', 'relatorios', 'visualizar', 'download', 'excluir', 'mensal', 'gerar', 'taxas', 'gerar-vencimentos', 'alertas', 'logs', 'aprovacoes', 'tarefas', 'ocorrencias', 'orcamentos', 'entradas-pendentes', 'saidas-pendentes', 'orcamentos-pendentes', 'ocorrencias-pendentes-aprovacao']);

/**
 * Valida que, quando o path contém um segundo segmento que deve ser :id (ex.: /saidas/123/pagar),
 * esse valor é um inteiro positivo. Responde 400 para ID inválido (não numérico, zero ou negativo).
 * @param {string} [paramName='id'] - Nome do parâmetro (usado apenas para documentação; o path é analisado)
 */
const validateNumericIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    // Usar path relativo ao router (req.path já é relativo ao mount no Express; garantir não bloquear listagens)
    const pathToCheck = (req.baseUrl && req.path.startsWith(req.baseUrl)) ? req.path.slice(req.baseUrl.length) || '/' : req.path;
    const match = pathToCheck.match(/^\/[^/]+\/([^/]+)(?:\/|$)/);
    if (!match) return next();
    const segment = match[1];
    if (SEGMENT_WHITELIST.has(segment.toLowerCase())) return next();
    if (/^\d+$/.test(segment)) {
      const id = parseInt(segment, 10);
      if (id < 1) {
        return res.status(400).send('ID inválido. Informe um número válido.');
      }
      return next();
    }
    return res.status(400).send('ID inválido. Informe um número válido.');
  };
};

module.exports = {
  validateNumericIdParam,
};
