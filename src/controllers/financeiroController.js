// Controller do módulo FINANCEIRO
// Gerencia requisições do painel financeiro

const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard financeiro
// GET /financeiro/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    res.render('administrativo/financeiro/dashboard', {
      title: 'Dashboard Financeiro',
      user: req.user,
      stats: {
        totalEntradas: 0,
        totalSaidas: 0,
        saldo: 0,
        despesasPendentes: 0,
      },
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard financeiro:', error);
    renderError(res, 500, 'Erro ao carregar dashboard financeiro', error);
  }
};

// Exporta funções para uso nas rotas
module.exports = {
  showDashboard,
};
