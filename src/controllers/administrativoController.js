// Controller do módulo ADMINISTRATIVO
// Gerencia requisições do painel administrativo

const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard administrativo
// GET /administrativo/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    res.render('administrativo/dashboard', {
      title: 'Dashboard Administrativo',
      user: req.user,
      stats: {
        tarefasPendentes: 0,
        documentos: 0,
        ocorrenciasPendentes: 0,
      },
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard administrativo:', error);
    renderError(res, 500, 'Erro ao carregar dashboard administrativo', error);
  }
};

// Exporta funções para uso nas rotas
module.exports = {
  showDashboard,
};
