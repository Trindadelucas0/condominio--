// Controller de ocorrências de LIMPEZA
// Gerencia ocorrências específicas da equipe de limpeza
// REGRA: LIMPEZA pode reportar, mas problemas técnicos viram ocorrências de ZELADORIA automaticamente

const limpezaService = require('../services/limpezaService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros
const { query } = require('../config/database'); // Conexão com banco

// Função para exibir dashboard de limpeza
// GET /limpeza/dashboard
const showDashboard = async (req, res) => {
  try {
    const occurrences = await limpezaService.listLimpezaOccurrences(
      req.user.id,
      req.user.condominiumId,
      { reportedBy: req.user.id }
    );

    res.render('limpeza/dashboard', {
      title: 'Dashboard Limpeza',
      user: req.user,
      occurrences,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard de limpeza:', error);
    renderError(res, 500, 'Erro ao carregar dashboard de limpeza', error);
  }
};

// Função para listar ocorrências de limpeza
// GET /limpeza/ocorrencias
const showOccurrences = async (req, res) => {
  try {
    const { status, limpezaType } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (limpezaType) filters.limpezaType = limpezaType;
    filters.reportedBy = req.user.id; // LIMPEZA só vê suas próprias ocorrências

    const occurrences = await limpezaService.listLimpezaOccurrences(
      req.user.id,
      req.user.condominiumId,
      filters
    );

    const limpezaTypes = limpezaService.getLimpezaTypes();

    res.render('limpeza/occurrences', {
      title: 'Ocorrências de Limpeza',
      user: req.user,
      occurrences,
      limpezaTypes,
      filters,
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências de limpeza:', error);
    renderError(res, 500, 'Erro ao carregar ocorrências', error);
  }
};

// Função para exibir formulário de criação de ocorrência
// GET /limpeza/ocorrencias/nova
const showCreateOccurrence = (req, res) => {
  const limpezaTypes = limpezaService.getLimpezaTypes();

  res.render('limpeza/occurrence-form', {
    title: 'Nova Ocorrência de Limpeza',
    user: req.user,
    limpezaTypes,
    occurrence: null,
  });
};

// Função para criar ocorrência de limpeza
// POST /limpeza/ocorrencias
const createOccurrence = async (req, res) => {
  try {
    const result = await limpezaService.createLimpezaOccurrence(
      req.body,
      req.user.id,
      req.user.condominiumId,
      req.ip,
      req.get('user-agent')
    );

    let message = 'Ocorrência de limpeza criada com sucesso';
    if (result.notificationSent) {
      message += '. O administrativo foi notificado para verificar se é necessário criar ocorrência de zeladoria.';
    }

    res.redirect(`/limpeza/ocorrencias?success=${encodeURIComponent(message)}`);
  } catch (error) {
    console.error('Erro ao criar ocorrência de limpeza:', error);
    const limpezaTypes = limpezaService.getLimpezaTypes();
    res.render('limpeza/occurrence-form', {
      title: 'Nova Ocorrência de Limpeza',
      user: req.user,
      limpezaTypes,
      occurrence: req.body,
      error: error.message,
    });
  }
};

// Função para exibir detalhes de uma ocorrência
// GET /limpeza/ocorrencias/:id
const showOccurrence = async (req, res) => {
  try {
    const { id } = req.params;
    const occurrences = await limpezaService.listLimpezaOccurrences(
      req.user.id,
      req.user.condominiumId
    );

    const occurrence = occurrences.find((o) => o.id === parseInt(id));

    if (!occurrence) {
      return renderError(res, 404, 'Ocorrência não encontrada');
    }

    const limpezaTypes = limpezaService.getLimpezaTypes();
    const limpezaTypeInfo = limpezaTypes.find((t) => t.value === occurrence.limpeza_type);

    res.render('limpeza/occurrence-detail', {
      title: `Ocorrência: ${occurrence.title}`,
      user: req.user,
      occurrence,
      limpezaTypeInfo,
    });
  } catch (error) {
    console.error('Erro ao exibir ocorrência:', error);
    renderError(res, 500, 'Erro ao carregar ocorrência', error);
  }
};

module.exports = {
  showDashboard,
  showOccurrences,
  showCreateOccurrence,
  createOccurrence,
  showOccurrence,
};
