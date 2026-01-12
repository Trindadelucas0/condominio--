// Middleware auxiliar para verificar roles específicas
// Usado para permitir/negar acesso a funcionalidades específicas baseado em role

// Middleware para bloquear acesso de LIMPEZA a criar ocorrências
// LIMPEZA pode executar checklists, mas NÃO pode criar ocorrências
const blockLimpezaFromOccurrences = (req, res, next) => {
  // Verifica se usuário tem role LIMPEZA (e não tem OPERACIONAL)
  const hasLimpeza = req.user.roles.includes('LIMPEZA');
  const hasOperacional = req.user.roles.includes('OPERACIONAL');

  // Se tem apenas LIMPEZA (sem OPERACIONAL), bloqueia criação de ocorrências
  if (hasLimpeza && !hasOperacional) {
    return res.status(403).send('Acesso negado. LIMPEZA não pode criar ocorrências.');
  }

  next();
};

module.exports = {
  blockLimpezaFromOccurrences,
};
