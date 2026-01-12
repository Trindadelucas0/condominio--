// Controller de estoque/insumos
// Gerencia cadastro de insumos e movimentações de estoque
// REGRA: Operacional baixa, Administrativo controla, Financeiro vê impacto

const estoqueService = require('../services/estoqueService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard de estoque
// GET /estoque
const showDashboard = async (req, res) => {
  try {
    const items = await estoqueService.listItems(req.user.condominiumId, { active: true });
    const itemsBelowMinimum = await estoqueService.getItemsBelowMinimum(req.user.condominiumId);

    res.render('estoque/dashboard', {
      title: 'Estoque e Insumos',
      user: req.user,
      items,
      itemsBelowMinimum,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard de estoque:', error);
    renderError(res, 500, 'Erro ao carregar estoque', error);
  }
};

// Função para listar itens de estoque
// GET /estoque/items
const listItems = async (req, res) => {
  try {
    const { category, belowMinimum } = req.query;
    const filters = {};

    if (category) filters.category = category;
    if (belowMinimum === 'true') filters.belowMinimum = true;

    const items = await estoqueService.listItems(req.user.condominiumId, filters);

    res.render('estoque/items', {
      title: 'Itens de Estoque',
      user: req.user,
      items,
      filters,
    });
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    renderError(res, 500, 'Erro ao listar itens', error);
  }
};

// Função para exibir formulário de criação de item
// GET /estoque/items/novo
const showCreateItem = (req, res) => {
  res.render('estoque/items/form', {
    title: 'Novo Item de Estoque',
    user: req.user,
    item: null,
  });
};

// Função para criar item de estoque
// POST /estoque/items
const createItem = async (req, res) => {
  try {
    const item = await estoqueService.createItem(
      req.body,
      req.user.id,
      req.user.condominiumId,
      req.ip,
      req.get('user-agent')
    );

    res.redirect(`/estoque/items/${item.id}?success=Item criado com sucesso`);
  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.render('estoque/items/form', {
      title: 'Novo Item de Estoque',
      user: req.user,
      item: req.body,
      error: error.message,
    });
  }
};

// Função para exibir detalhes de um item
// GET /estoque/items/:id
const showItem = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await estoqueService.listItems(req.user.condominiumId);
    const item = items.find((i) => i.id === parseInt(id));

    if (!item) {
      return renderError(res, 404, 'Item não encontrado');
    }

    const movements = await estoqueService.listMovements(id, req.user.condominiumId);

    res.render('estoque/items/detail', {
      title: `Item: ${item.name}`,
      user: req.user,
      item,
      movements,
    });
  } catch (error) {
    console.error('Erro ao exibir item:', error);
    renderError(res, 500, 'Erro ao carregar item', error);
  }
};

// Função para exibir formulário de edição de item
// GET /estoque/items/:id/editar
const showEditItem = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await estoqueService.listItems(req.user.condominiumId);
    const item = items.find((i) => i.id === parseInt(id));

    if (!item) {
      return renderError(res, 404, 'Item não encontrado');
    }

    res.render('estoque/items/form', {
      title: `Editar Item: ${item.name}`,
      user: req.user,
      item,
    });
  } catch (error) {
    console.error('Erro ao exibir edição de item:', error);
    renderError(res, 500, 'Erro ao carregar item', error);
  }
};

// Função para atualizar item
// POST /estoque/items/:id
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    await estoqueService.updateItem(
      id,
      req.body,
      req.user.id,
      req.user.condominiumId,
      req.ip,
      req.get('user-agent')
    );

    res.redirect(`/estoque/items/${id}?success=Item atualizado com sucesso`);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    renderError(res, 500, 'Erro ao atualizar item: ' + error.message, error);
  }
};

// Função para exibir formulário de movimentação
// GET /estoque/items/:id/movimentacao
const showCreateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await estoqueService.listItems(req.user.condominiumId);
    const item = items.find((i) => i.id === parseInt(id));

    if (!item) {
      return renderError(res, 404, 'Item não encontrado');
    }

    res.render('estoque/movements/form', {
      title: `Nova Movimentação: ${item.name}`,
      user: req.user,
      item,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de movimentação:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para criar movimentação
// POST /estoque/items/:id/movimentacao
const createMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { movementType, quantity, reason, cost, movementDate } = req.body;

    if (!movementType || !quantity) {
      return renderError(res, 400, 'Tipo e quantidade são obrigatórios');
    }

    await estoqueService.createMovement(
      id,
      movementType,
      quantity,
      reason,
      cost,
      movementDate,
      req.user.id,
      req.user.condominiumId,
      req.ip,
      req.get('user-agent')
    );

    res.redirect(`/estoque/items/${id}?success=Movimentação registrada com sucesso`);
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    renderError(res, 500, 'Erro ao criar movimentação: ' + error.message, error);
  }
};

module.exports = {
  showDashboard,
  listItems,
  showCreateItem,
  createItem,
  showItem,
  showEditItem,
  updateItem,
  showCreateMovement,
  createMovement,
};
