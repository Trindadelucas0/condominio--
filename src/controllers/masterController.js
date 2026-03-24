// Controller do módulo SUPER_MASTER
// Gerencia requisições do painel master
// Apenas usuários com perfil SUPER_MASTER podem acessar

const masterService = require('../services/masterService');
const reportConfigService = require('../services/reports/reportConfigService');
const { dispatchCondominiumReport } = require('../services/reports/reportDispatchService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

const parseCron = (cron, fallback) => {
  const value = String(cron || '').trim();
  const parts = value.split(/\s+/);
  if (parts.length !== 5) return fallback;
  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  const weekday = parts[4] === '*' ? null : parseInt(parts[4], 10);

  if (Number.isNaN(minute) || minute < 0 || minute > 59) return fallback;
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return fallback;
  if (weekday !== null && (Number.isNaN(weekday) || weekday < 0 || weekday > 6)) return fallback;

  return { minute, hour, weekday };
};

const toCronDaily = (hour, minute) => `${minute} ${hour} * * *`;
const toCronWeekly = (hour, minute, weekday) => `${minute} ${hour} * * ${weekday}`;

const parseRangeInt = (value, min, max, fieldLabel) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldLabel} inválido(a). Valor esperado entre ${min} e ${max}.`);
  }
  return parsed;
};

const normalizeIsoDate = (value, fieldLabel) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`${fieldLabel} inválida. Use o formato AAAA-MM-DD.`);
  }
  return raw;
};

const parseCustomRange = (startValue, endValue) => {
  const start = normalizeIsoDate(startValue, 'Data inicial');
  const end = normalizeIsoDate(endValue, 'Data final');
  if (!start && !end) return { start: null, end: null };
  if (!start || !end) {
    throw new Error('Para período personalizado, informe data inicial e final.');
  }
  if (start > end) {
    throw new Error('Período personalizado inválido: data inicial maior que data final.');
  }
  return { start, end };
};

// Função para exibir dashboard master
// GET /master/dashboard
const showDashboard = async (req, res) => {
  try {
    const stats = await masterService.getDashboardStats();

    res.render('master/dashboard', {
      title: 'Dashboard Master',
      user: req.user,
      stats: stats,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard master:', error);
    renderError(res, 500, 'Erro ao carregar dashboard master', error);
  }
};

const showIaReportsCenter = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const condominios = await masterService.listCondominios(includeInactive);

    res.render('master/ia-relatorios/index', {
      title: 'Central IA Relatórios',
      user: req.user,
      condominios,
      includeInactive,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao exibir central IA de relatórios:', error);
    renderError(res, 500, 'Erro ao carregar central IA de relatórios', error);
  }
};

// Função para listar condomínios
// GET /master/condominios
const listCondominios = async (req, res) => {
  try {
    // Verifica se deve incluir inativos (query parameter ?includeInactive=true)
    const includeInactive = req.query.includeInactive === 'true';
    const condominios = await masterService.listCondominios(includeInactive);

    res.render('master/condominios/list', {
      title: 'Condomínios',
      user: req.user,
      condominios: condominios,
      includeInactive: includeInactive,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    renderError(res, 500, 'Erro ao carregar condomínios', error);
  }
};

// Função para exibir formulário de criação de condomínio
// GET /master/condominios/novo
const showCreateCondominio = async (req, res) => {
  try {
    res.render('master/condominios/form', {
      title: 'Novo Condomínio',
      user: req.user,
      condominio: null,
      action: 'create',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de condomínio:', error);
    renderError(res, 500, 'Erro ao carregar formulário de condomínio', error);
  }
};

// Função para criar condomínio
// POST /master/condominios
const createCondominio = async (req, res) => {
  try {
    // Valida que não está tentando criar com ID válido (deve ser criação, não atualização)
    // Só redireciona se o ID for um número válido
    if (req.body.id) {
      const id = parseInt(req.body.id, 10);
      if (!isNaN(id) && id > 0) {
        console.warn('⚠️ Tentativa de criar condomínio com ID fornecido. Redirecionando para atualização.');
        return res.redirect(`/master/condominios/${id}/editar`);
      }
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await masterService.createCondominium(
      req.body,
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/condominios?success=created');
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    // Remove ID do req.body se existir (para garantir que é criação, não edição)
    // Mantém outros campos para preservar dados preenchidos pelo usuário
    const condominioData = { ...req.body };
    delete condominioData.id;
    // Garante que não tem ID para o formulário não tentar usar rota de atualização
    condominioData.id = undefined;
    
    res.render('master/condominios/form', {
      title: 'Novo Condomínio',
      user: req.user,
      condominio: condominioData, // Passa dados sem ID para manter valores preenchidos
      action: 'create',
      error: error.message,
    });
  }
};

// Função para exibir formulário de edição de condomínio
// GET /master/condominios/:id/editar
const showEditCondominio = async (req, res) => {
  try {
    // Valida se ID existe
    if (!req.params.id || req.params.id === 'undefined') {
      return renderError(res, 400, 'ID do condomínio não fornecido');
    }

    const condominio = await masterService.getCondominiumById(req.params.id);

    res.render('master/condominios/form', {
      title: 'Editar Condomínio',
      user: req.user,
      condominio: condominio,
      action: 'edit',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição de condomínio:', error);
    renderError(res, 500, 'Erro ao carregar formulário de edição de condomínio', error);
  }
};

// Função para atualizar condomínio
// POST /master/condominios/:id
const updateCondominio = async (req, res) => {
  try {
    // Valida se ID existe
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).render('master/condominios/form', {
        title: 'Editar Condomínio',
        user: req.user,
        condominio: req.body,
        action: 'edit',
        error: 'ID do condomínio não fornecido',
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte active para boolean
    // O campo hidden sempre envia "true" ou "false" como string
    let active = false;
    if (req.body.active !== undefined) {
      if (typeof req.body.active === 'string') {
        active = req.body.active === 'true' || req.body.active === '1';
      } else if (typeof req.body.active === 'boolean') {
        active = req.body.active;
      } else {
        active = Boolean(req.body.active);
      }
    }

    console.log('🔍 [DEBUG] Active recebido:', req.body.active, 'Tipo:', typeof req.body.active, 'Convertido:', active);

    await masterService.updateCondominium(
      req.params.id,
      { ...req.body, active },
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/condominios?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    
    // Se ID não existe ou é inválido, usa req.body como fallback
    let condominio = req.body;
    if (req.params.id && req.params.id !== 'undefined') {
      try {
        condominio = await masterService.getCondominiumById(req.params.id);
      } catch (err) {
        console.error('Erro ao buscar condomínio para exibir erro:', err);
        // Mantém req.body como fallback
      }
    }
    
    res.render('master/condominios/form', {
      title: 'Editar Condomínio',
      user: req.user,
      condominio: condominio,
      action: 'edit',
      error: error.message,
    });
  }
};

const showCondominioReportConfig = async (req, res) => {
  try {
    const condominiumId = parseInt(req.params.id, 10);
    if (!condominiumId) return renderError(res, 400, 'ID do condomínio inválido');
    console.log('[MASTER_REPORT_CONFIG] Abrindo tela de configuração', { condominiumId, userId: req.user?.id });

    const condominio = await masterService.getCondominiumById(condominiumId);
    const preferences = await reportConfigService.getPreferences(condominiumId);
    const recipients = await reportConfigService.listRecipients(condominiumId);
    const usage = await reportConfigService.getUsageSummary(condominiumId);
    const dailyParsed = parseCron(preferences?.daily_cron, { minute: 0, hour: 7, weekday: null });
    const weeklyParsed = parseCron(preferences?.weekly_cron, { minute: 30, hour: 7, weekday: 1 });

    res.render('master/condominios/report-config', {
      title: `Configuração de Relatórios - ${condominio.name}`,
      user: req.user,
      condominio,
      preferences,
      scheduleForm: {
        dailyMinute: dailyParsed.minute,
        dailyHour: dailyParsed.hour,
        weeklyMinute: weeklyParsed.minute,
        weeklyHour: weeklyParsed.hour,
        weeklyWeekday: weeklyParsed.weekday === null ? 1 : weeklyParsed.weekday,
      },
      recipients,
      usage,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao exibir configuração de relatórios:', error);
    renderError(res, 500, 'Erro ao carregar configuração de relatórios', error);
  }
};

const updateCondominioReportPreferences = async (req, res) => {
  try {
    const condominiumId = parseInt(req.params.id, 10);
    console.log('[MASTER_REPORT_CONFIG] Atualizando preferências', { condominiumId, userId: req.user?.id });
    const dailyHour = parseRangeInt(req.body.daily_hour, 0, 23, 'Hora do relatório diário');
    const dailyMinute = parseRangeInt(req.body.daily_minute, 0, 59, 'Minuto do relatório diário');
    const weeklyHour = parseRangeInt(req.body.weekly_hour, 0, 23, 'Hora do relatório semanal');
    const weeklyMinute = parseRangeInt(req.body.weekly_minute, 0, 59, 'Minuto do relatório semanal');
    const weeklyWeekday = parseRangeInt(req.body.weekly_weekday, 0, 6, 'Dia da semana do relatório semanal');

    const data = {
      enabled: req.body.enabled === 'on',
      daily_enabled: req.body.daily_enabled === 'on',
      weekly_enabled: req.body.weekly_enabled === 'on',
      include_financial: req.body.include_financial === 'on',
      include_maintenance: req.body.include_maintenance === 'on',
      include_charts: req.body.include_charts === 'on',
      include_ai_insights: req.body.include_ai_insights === 'on',
      daily_cron: toCronDaily(dailyHour, dailyMinute),
      weekly_cron: toCronWeekly(weeklyHour, weeklyMinute, weeklyWeekday),
      timezone: req.body.timezone,
      ai_daily_request_limit: req.body.ai_daily_request_limit,
      ai_monthly_token_limit: req.body.ai_monthly_token_limit,
    };
    const customRange = parseCustomRange(req.body.custom_start_date, req.body.custom_end_date);
    data.custom_start_date = customRange.start;
    data.custom_end_date = customRange.end;
    await reportConfigService.upsertPreferences(condominiumId, data);
    console.log('[MASTER_REPORT_CONFIG] Preferências atualizadas', {
      condominiumId,
      dailyCron: data.daily_cron,
      weeklyCron: data.weekly_cron,
      timezone: data.timezone,
      customStartDate: data.custom_start_date,
      customEndDate: data.custom_end_date,
    });
    res.redirect(`/master/condominios/${condominiumId}/relatorios?success=preferences_updated`);
  } catch (error) {
    console.error('[MASTER_REPORT_CONFIG] Erro ao atualizar preferências', {
      condominiumId: req.params.id,
      userId: req.user?.id,
      message: error.message,
    });
    res.redirect(`/master/condominios/${req.params.id}/relatorios?error=${encodeURIComponent(error.message)}`);
  }
};

const addCondominioReportRecipient = async (req, res) => {
  try {
    const condominiumId = parseInt(req.params.id, 10);
    console.log('[MASTER_REPORT_CONFIG] Adicionando destinatário', {
      condominiumId,
      userId: req.user?.id,
      roleScope: req.body.role_scope || 'CUSTOM',
    });
    await reportConfigService.addRecipient(condominiumId, {
      email: req.body.email,
      role_scope: req.body.role_scope || 'CUSTOM',
    });
    res.redirect(`/master/condominios/${condominiumId}/relatorios?success=recipient_added`);
  } catch (error) {
    console.error('Erro ao adicionar destinatário:', error);
    res.redirect(`/master/condominios/${req.params.id}/relatorios?error=${encodeURIComponent(error.message)}`);
  }
};

const removeCondominioReportRecipient = async (req, res) => {
  try {
    const condominiumId = parseInt(req.params.id, 10);
    console.log('[MASTER_REPORT_CONFIG] Removendo destinatário', {
      condominiumId,
      recipientId: req.params.recipientId,
      userId: req.user?.id,
    });
    await reportConfigService.removeRecipient(condominiumId, parseInt(req.params.recipientId, 10));
    res.redirect(`/master/condominios/${condominiumId}/relatorios?success=recipient_removed`);
  } catch (error) {
    console.error('Erro ao remover destinatário:', error);
    res.redirect(`/master/condominios/${req.params.id}/relatorios?error=${encodeURIComponent(error.message)}`);
  }
};

const dispatchCondominioReportNow = async (req, res) => {
  try {
    const condominiumId = parseInt(req.params.id, 10);
    const reportType = req.body.reportType === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
    const customRange = parseCustomRange(req.body.custom_start_date, req.body.custom_end_date);
    console.log('[MASTER_REPORT_CONFIG] Disparo manual solicitado', {
      condominiumId,
      reportType,
      userId: req.user?.id,
      customStartDate: customRange.start,
      customEndDate: customRange.end,
    });
    await dispatchCondominiumReport(condominiumId, reportType, {
      startDate: customRange.start,
      endDate: customRange.end,
      source: 'MANUAL',
    });
    console.log('[MASTER_REPORT_CONFIG] Disparo manual concluído', { condominiumId, reportType });
    res.redirect(`/master/condominios/${condominiumId}/relatorios?success=report_sent`);
  } catch (error) {
    console.error('[MASTER_REPORT_CONFIG] Falha no disparo manual', {
      condominiumId: req.params.id,
      userId: req.user?.id,
      message: error.message,
    });
    res.redirect(`/master/condominios/${req.params.id}/relatorios?error=${encodeURIComponent(error.message)}`);
  }
};

// Função para listar usuários
// GET /master/usuarios
const listUsuarios = async (req, res) => {
  try {
    const usuarios = await masterService.listUsuarios();

    res.render('master/usuarios/list', {
      title: 'Usuários',
      user: req.user,
      usuarios: usuarios,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    renderError(res, 500, 'Erro ao carregar usuários', error);
  }
};

// Função para exibir formulário de criação de usuário
// GET /master/usuarios/novo
const showCreateUsuario = async (req, res) => {
  try {
    const roles = await masterService.listRoles();
    const condominios = await masterService.listCondominios();

    res.render('master/usuarios/form', {
      title: 'Novo Usuário',
      user: req.user,
      usuario: null,
      roles: roles,
      condominios: condominios,
      action: 'create',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de usuário:', error);
    renderError(res, 500, 'Erro ao carregar formulário de usuário', error);
  }
};

// Função para criar usuário
// POST /master/usuarios
const createUsuario = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte roleIds para array se for string
    const roleIds = req.body.roleIds 
      ? (Array.isArray(req.body.roleIds) ? req.body.roleIds : [req.body.roleIds])
      : [];

    await masterService.createUser(
      { ...req.body, roleIds },
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/usuarios?success=created');
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    const roles = await masterService.listRoles().catch(() => []);
    const condominios = await masterService.listCondominios().catch(() => []);
    
    res.render('master/usuarios/form', {
      title: 'Novo Usuário',
      user: req.user,
      usuario: req.body,
      roles: roles,
      condominios: condominios,
      action: 'create',
      error: error.message,
    });
  }
};

// Função para exibir formulário de edição de usuário
// GET /master/usuarios/:id/editar
const showEditUsuario = async (req, res) => {
  try {
    const usuario = await masterService.getUsuarioById(req.params.id);
    const roles = await masterService.listRoles();
    const condominios = await masterService.listCondominios();

    res.render('master/usuarios/form', {
      title: 'Editar Usuário',
      user: req.user,
      usuario: usuario,
      roles: roles,
      condominios: condominios,
      action: 'edit',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição de usuário:', error);
    renderError(res, 500, 'Erro ao carregar formulário de edição de usuário', error);
  }
};

// Função para atualizar usuário
// POST /master/usuarios/:id
const updateUsuario = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte roleIds para array se for string
    const roleIds = req.body.roleIds 
      ? (Array.isArray(req.body.roleIds) ? req.body.roleIds : [req.body.roleIds])
      : [];

    await masterService.updateUsuario(
      req.params.id,
      { ...req.body, roleIds },
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/usuarios?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    const usuario = await masterService.getUsuarioById(req.params.id).catch(() => req.body);
    const roles = await masterService.listRoles().catch(() => []);
    const condominios = await masterService.listCondominios().catch(() => []);
    
    res.render('master/usuarios/form', {
      title: 'Editar Usuário',
      user: req.user,
      usuario: usuario,
      roles: roles,
      condominios: condominios,
      action: 'edit',
      error: error.message,
    });
  }
};

// Exporta funções para uso nas rotas
module.exports = {
  showDashboard,
  showIaReportsCenter,
  listCondominios,
  showCreateCondominio,
  createCondominio,
  showEditCondominio,
  updateCondominio,
  showCondominioReportConfig,
  updateCondominioReportPreferences,
  addCondominioReportRecipient,
  removeCondominioReportRecipient,
  dispatchCondominioReportNow,
  listUsuarios,
  showCreateUsuario,
  createUsuario,
  showEditUsuario,
  updateUsuario,
};
