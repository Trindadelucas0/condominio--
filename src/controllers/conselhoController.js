// Controller do módulo CONSELHO
// Gerencia requisições do painel do conselho (somente leitura)

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
    res.status(500).send('Erro ao carregar dashboard');
  }
};

module.exports = {
  showDashboard,
};
