// Middleware que exige req.user.condominiumId (rotas de condomínio).
// Usar em routers onde TODAS as rotas são por condomínio (sindico, financeiro, etc.).
// NÃO usar em /master (SUPER_MASTER não tem condominiumId).

const requireCondominium = (req, res, next) => {
  if (!req.user || !req.user.condominiumId) {
    return res.status(400).send('Usuário não está associado a um condomínio');
  }
  next();
};

module.exports = { requireCondominium };
