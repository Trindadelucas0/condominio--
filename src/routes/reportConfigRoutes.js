const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const reportConfigService = require('../services/reports/reportConfigService');
const { dispatchCondominiumReport } = require('../services/reports/reportDispatchService');

router.use(authenticate);
router.use(authorize('SUPER_MASTER'));

const resolveCondominiumId = (req) => {
  if (req.user.roles.includes('SUPER_MASTER')) {
    return parseInt(req.body.condominiumId || req.query.condominiumId || req.params.condominiumId, 10) || null;
  }
  return req.user.condominiumId;
};

router.get('/preferences', async (req, res) => {
  try {
    const condominiumId = resolveCondominiumId(req);
    if (!condominiumId) return res.status(400).json({ error: 'condominiumId obrigatório' });
    const preferences = await reportConfigService.getPreferences(condominiumId);
    const recipients = await reportConfigService.listRecipients(condominiumId);
    const usage = await reportConfigService.getUsageSummary(condominiumId);
    res.json({ success: true, preferences, recipients, usage });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações', message: error.message });
  }
});

router.post('/preferences', async (req, res) => {
  try {
    const condominiumId = resolveCondominiumId(req);
    if (!condominiumId) return res.status(400).json({ error: 'condominiumId obrigatório' });
    const preferences = await reportConfigService.upsertPreferences(condominiumId, req.body || {});
    res.json({ success: true, preferences });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar configurações', message: error.message });
  }
});

router.get('/recipients', async (req, res) => {
  try {
    const condominiumId = resolveCondominiumId(req);
    if (!condominiumId) return res.status(400).json({ error: 'condominiumId obrigatório' });
    const recipients = await reportConfigService.listRecipients(condominiumId);
    res.json({ success: true, recipients });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar destinatários', message: error.message });
  }
});

router.post('/recipients', async (req, res) => {
  try {
    const condominiumId = resolveCondominiumId(req);
    if (!condominiumId) return res.status(400).json({ error: 'condominiumId obrigatório' });
    if (!req.body.email) return res.status(400).json({ error: 'Email obrigatório' });
    const recipient = await reportConfigService.addRecipient(condominiumId, req.body);
    res.json({ success: true, recipient });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar destinatário', message: error.message });
  }
});

router.delete('/recipients/:id', async (req, res) => {
  try {
    const condominiumId = resolveCondominiumId(req);
    if (!condominiumId) return res.status(400).json({ error: 'condominiumId obrigatório' });
    const removed = await reportConfigService.removeRecipient(condominiumId, parseInt(req.params.id, 10));
    if (!removed) return res.status(404).json({ error: 'Destinatário não encontrado' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover destinatário', message: error.message });
  }
});

router.post('/dispatch/manual', async (req, res) => {
  try {
    const condominiumId = resolveCondominiumId(req);
    if (!condominiumId) return res.status(400).json({ error: 'condominiumId obrigatório' });
    const reportType = req.body.reportType === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
    const result = await dispatchCondominiumReport(condominiumId, reportType);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao disparar relatório manual', message: error.message });
  }
});

module.exports = router;
