// Síndico: acompanhar checklists completos e questionar itens não feitos

const dailyChecklistService = require('../services/dailyChecklistService');
const { query } = require('../config/database');
const { renderError } = require('../utils/errorHandler');

// GET /sindico/checklists-acompanhamento
const list = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const date = req.query.date ? new Date(req.query.date + 'T12:00:00') : new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    try {
      await dailyChecklistService.generateDailyChecklists(req.user.condominiumId, date);
    } catch (e) {
      console.warn('Aviso ao gerar checklists para acompanhamento:', e.message);
    }

    const checklists = await dailyChecklistService.listDailyChecklistsForSindico(
      req.user.condominiumId,
      date
    );

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    res.render('sindico/checklists-acompanhamento/list', {
      title: 'Acompanhar Checklists',
      user: req.user,
      checklists,
      date: dateStr,
      isToday,
      query: req.query || {},
    });
  } catch (error) {
    console.error('Erro ao listar checklists para acompanhamento:', error);
    renderError(res, 500, 'Erro ao carregar checklists', error);
  }
};

// GET /sindico/checklists-acompanhamento/:id
const show = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const checklist = await dailyChecklistService.getChecklistByIdForSindico(
      parseInt(req.params.id),
      req.user.condominiumId
    );
    if (!checklist) return renderError(res, 404, 'Checklist não encontrado');

    res.render('sindico/checklists-acompanhamento/detail', {
      title: 'Checklist — Acompanhamento',
      user: req.user,
      checklist,
      query: req.query || {},
    });
  } catch (error) {
    console.error('Erro ao exibir checklist para acompanhamento:', error);
    renderError(res, 500, 'Erro ao carregar checklist', error);
  }
};

// POST /sindico/checklists-acompanhamento/items/:id/questionar
const questionar = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.get('user-agent');

    await dailyChecklistService.addSindicoQuestion(
      parseInt(req.params.id),
      req.body.question || '',
      req.body.exigeResposta === '1' || req.body.exigeResposta === 'true',
      req.user.id,
      req.user.condominiumId,
      ip,
      ua
    );

    let checklistId = null;
    try {
      const itemResult = await query(
        `SELECT checklist_id FROM daily_checklist_items WHERE id = $1`,
        [parseInt(req.params.id)]
      );
      checklistId = itemResult.rows[0]?.checklist_id;
    } catch (_) {}
    const qs = req.body && req.body.date ? `&date=${encodeURIComponent(req.body.date)}` : '';
    const redirect = checklistId
      ? `/sindico/checklists-acompanhamento/${checklistId}?success=questionar${qs}`
      : `/sindico/checklists-acompanhamento${req.body && req.body.date ? '?date=' + encodeURIComponent(req.body.date) : ''}`;

    res.redirect(redirect);
  } catch (error) {
    console.error('Erro ao questionar item:', error);
    let checklistId = null;
    try {
      const itemResult = await query(
        `SELECT checklist_id FROM daily_checklist_items WHERE id = $1`,
        [parseInt(req.params.id)]
      );
      checklistId = itemResult.rows[0]?.checklist_id;
    } catch (_) {}
    const qs = req.body && req.body.date ? `&date=${encodeURIComponent(req.body.date)}` : '';
    const errParam = `error=${encodeURIComponent(error.message)}`;
    const redirect = checklistId
      ? `/sindico/checklists-acompanhamento/${checklistId}?${errParam}${qs}`
      : `/sindico/checklists-acompanhamento?${errParam}${req.body && req.body.date ? '&date=' + encodeURIComponent(req.body.date) : ''}`;
    res.redirect(redirect);
  }
};

module.exports = {
  list,
  show,
  questionar,
};
