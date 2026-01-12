// Controller do módulo SINDICO/SUBSINDICO
// Gerencia requisições do painel do síndico
// Apenas usuários com perfil SINDICO ou SUBSINDICO podem acessar

const sindicoService = require('../services/sindicoService'); // Service do módulo síndico

// Função para exibir dashboard do síndico
// GET /sindico/dashboard
const showDashboard = async (req, res) => {
  try {
    // Valida se usuário tem condomínio associado
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    // Busca estatísticas do condomínio
    const stats = await sindicoService.getDashboardStats(req.user.condominiumId);

    res.render('sindico/dashboard', {
      title: 'Dashboard Síndico',
      user: req.user,
      stats: stats,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard síndico:', error);
    res.status(500).send('Erro ao carregar dashboard');
  }
};

// Função para listar aprovações pendentes
// GET /sindico/aprovacoes
const showAprovacoes = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const approvals = await sindicoService.listPendingApprovals(req.user.condominiumId);

    res.render('sindico/aprovacoes', {
      title: 'Aprovações Pendentes',
      user: req.user,
      approvals: approvals,
    });
  } catch (error) {
    console.error('Erro ao listar aprovações:', error);
    res.status(500).send('Erro ao carregar aprovações');
  }
};

// Função para processar aprovação (aprovar ou rejeitar)
// POST /sindico/aprovacoes/:id/processar
const processAprovacao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const { action, reason } = req.body;
    const approvalId = req.params.id;

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return res.status(400).send('Ação inválida');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await sindicoService.processApproval(
      approvalId,
      action,
      reason,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/sindico/aprovacoes?success=processed');
  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    res.redirect('/sindico/aprovacoes?error=' + encodeURIComponent(error.message));
  }
};

// Função para listar alertas
// GET /sindico/alertas
const showAlertas = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
      severity: req.query.severity || undefined,
    };

    const alerts = await sindicoService.listAlerts(req.user.condominiumId, filters);

    res.render('sindico/alertas', {
      title: 'Alertas',
      user: req.user,
      alerts: alerts,
      filters: filters,
    });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).send('Erro ao carregar alertas');
  }
};

// Função para resolver alerta
// POST /sindico/alertas/:id/resolver
const resolverAlerta = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const alertId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await sindicoService.resolveAlert(alertId, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/sindico/alertas?success=resolved');
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.redirect('/sindico/alertas?error=' + encodeURIComponent(error.message));
  }
};

// Função para listar logs de auditoria
// GET /sindico/logs
const showLogs = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      module: req.query.module || undefined,
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      action: req.query.action || undefined,
      startDate: req.query.startDate || undefined,
      endDate: req.query.endDate || undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
    };

    const logs = await sindicoService.listAuditLogs(req.user.condominiumId, filters);
    const users = await sindicoService.listUsers(req.user.condominiumId);

    // Lista de módulos disponíveis (para filtro)
    const modules = ['USER', 'FINANCIAL', 'TASK', 'OCCURRENCE', 'DOCUMENT', 'APPROVAL', 'PATRIMONY', 'AUTH'];
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT', 'COMPLETE'];

    res.render('sindico/logs', {
      title: 'Logs de Auditoria',
      user: req.user,
      logs: logs,
      filters: filters,
      users: users,
      modules: modules,
      actions: actions,
    });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    res.status(500).send('Erro ao carregar logs');
  }
};

// Exporta funções
module.exports = {
  showDashboard,
  showAprovacoes,
  processAprovacao,
  showAlertas,
  resolverAlerta,
  showLogs,
};
