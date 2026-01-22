// Controller de reabertura
// Gerencia reabertura de ocorrências, tarefas e despesas rejeitadas
// REGRA: Toda reabertura gera log especial

const reaberturaService = require('../services/reaberturaService');
const { renderError } = require('../utils/errorHandler');
const { query } = require('../config/database');

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

// Formulário para reabrir tarefa (apenas canceladas)
// GET /administrativo/tarefas/:id/reabrir
const showReopenTask = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const taskId = req.params.id;
    const q = await query(
      `SELECT t.*, u.full_name as assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1 AND t.condominium_id = $2`,
      [taskId, req.user.condominiumId]
    );
    if (q.rows.length === 0) {
      return renderError(res, 404, 'Tarefa não encontrada');
    }
    const task = q.rows[0];
    if (task.status !== 'CANCELLED') {
      return renderError(res, 400, 'Somente tarefas canceladas podem ser reabertas.');
    }
    if (task.reopened) {
      return renderError(res, 400, 'Esta tarefa já foi reaberta anteriormente.');
    }
    res.render('administrativo/tarefas/reabrir', {
      title: 'Reabrir Tarefa',
      user: req.user,
      task,
      error: null,
    });
  } catch (e) {
    console.error('Erro ao exibir formulário de reabertura de tarefa:', e);
    renderError(res, 500, 'Erro ao carregar formulário', e);
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
      if (req.path.includes('/administrativo/')) {
        try {
          const q = await query(
            `SELECT t.*, u.full_name as assigned_to_name
             FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
             WHERE t.id = $1 AND t.condominium_id = $2`,
            [req.params.id, req.user.condominiumId]
          );
          const task = q.rows[0] || { id: req.params.id, title: '-', assigned_to_name: '-' };
          return res.render('administrativo/tarefas/reabrir', {
            title: 'Reabrir Tarefa',
            user: req.user,
            task,
            error: 'Motivo da reabertura é obrigatório.',
          });
        } catch (_) {
          return res.redirect('/administrativo/tarefas?error=' + encodeURIComponent('Motivo da reabertura é obrigatório'));
        }
      }
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

    const module = req.path.includes('/administrativo/') ? 'administrativo' : 'sindico';
    res.redirect(`/${module}/tarefas?success=reopened`);
  } catch (error) {
    console.error('Erro ao reabrir tarefa:', error);
    if (req.path && req.path.includes('/administrativo/')) {
      try {
        const q = await query(
          `SELECT t.*, u.full_name as assigned_to_name
           FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
           WHERE t.id = $1 AND t.condominium_id = $2`,
          [req.params.id, req.user.condominiumId]
        );
        const task = q.rows[0] || { id: req.params.id, title: '-', assigned_to_name: '-' };
        return res.render('administrativo/tarefas/reabrir', {
          title: 'Reabrir Tarefa',
          user: req.user,
          task,
          error: error.message || 'Erro ao reabrir tarefa.',
        });
      } catch (_) {}
    }
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
  showReopenTask,
  showReopenExpense,
  reopenExpense,
};
