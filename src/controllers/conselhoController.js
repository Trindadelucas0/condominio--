// Controller do módulo CONSELHO
// Gerencia requisições do painel do conselho (somente leitura)

const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard do conselho
// GET /conselho/dashboard
const showDashboard = async (req, res) => {
  try {
    res.render('conselho/dashboard', {
      title: 'Dashboard Conselho',
      user: req.user,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard conselho:', error);
    res.status(500).render('error', {
      message: 'Erro ao carregar dashboard conselho',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

module.exports = {
  showDashboard,
};
