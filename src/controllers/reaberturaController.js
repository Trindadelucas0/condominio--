// Controller de reabertura
// Gerencia reabertura de ocorrências, tarefas e despesas rejeitadas
// REGRA: Toda reabertura gera log especial

const reaberturaService = require('../services/reaberturaService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para reabrir ocorrência
// REGRA: Apenas Síndico pode reabrir ocorrências
// POST /sindico/ocorrencias/:id/reabrir
const reopenOccurrence = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Motivo da reabertura é obrigatório' });
    }

    const occurrence = await reaberturaService.reopenOccurrence(
      id,
      req.user.id,
      req.user.condominiumId,
      reason,
      req.ip,
      req.get('user-agent')
    );

    res.redirect(`/sindico/ocorrencias?success=Ocorrência reaberta com sucesso`);
  } catch (error) {
    console.error('Erro ao reabrir ocorrência:', error);
    renderError(res, 500, 'Erro ao reabrir ocorrência: ' + error.message, error);
  }
};

// Função para reabrir tarefa
// REGRA: Administrativo ou Síndico pode reabrir tarefas
// POST /administrativo/tarefas/:id/reabrir ou POST /sindico/tarefas/:id/reabrir
const reopenTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Motivo da reabertura é obrigatório' });
    }

    const task = await reaberturaService.reopenTask(
      id,
      req.user.id,
      req.user.condominiumId,
      reason,
      req.ip,
      req.get('user-agent')
    );

    // Redireciona conforme o módulo de origem
    const module = req.path.includes('/administrativo/') ? 'administrativo' : 'sindico';
    res.redirect(`/${module}/tarefas?success=Tarefa reaberta com sucesso`);
  } catch (error) {
    console.error('Erro ao reabrir tarefa:', error);
    renderError(res, 500, 'Erro ao reabrir tarefa: ' + error.message, error);
  }
};

// Função para exibir formulário de reabertura de despesa rejeitada
// GET /financeiro/despesas/:id/reabrir
const showReopenExpense = async (req, res) => {
  try {
    const { id } = req.params;
    // Busca despesa rejeitada (será implementado no controller financeiro)
    res.render('financeiro/expenses/reopen', {
      title: 'Reabrir Despesa Rejeitada',
      user: req.user,
      rejectedExpenseId: id,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de reabertura:', error);
    renderError(res, 500, 'Erro ao carregar formulário de reabertura', error);
  }
};

// Função para reabrir despesa rejeitada (cria nova)
// REGRA: Financeiro cria nova, Síndico aprova
// POST /financeiro/despesas/:id/reabrir
const reopenExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return renderError(res, 400, 'Motivo da reabertura é obrigatório');
    }

    const newExpense = await reaberturaService.reopenRejectedExpense(
      id,
      req.body,
      req.user.id,
      req.user.condominiumId,
      reason,
      req.ip,
      req.get('user-agent')
    );

    res.redirect(`/financeiro/saidas/${newExpense.id}?success=Nova despesa criada a partir da rejeitada`);
  } catch (error) {
    console.error('Erro ao reabrir despesa:', error);
    renderError(res, 500, 'Erro ao reabrir despesa: ' + error.message, error);
  }
};

module.exports = {
  reopenOccurrence,
  reopenTask,
  showReopenExpense,
  reopenExpense,
};
