// Service de itens críticos
// Retorna resumo de contas vencidas, documentos, alertas e notificações para o modal ao login

const { query } = require('../config/database');
const notificationService = require('./notificationService');

/**
 * Retorna resumo de itens críticos para o condomínio
 * Usado no modal que aparece após login (SINDICO, FINANCEIRO, ADMINISTRATIVO)
 * @param {number} condominiumId
 * @param {number} userId
 * @param {string[]} userRoles - roles do usuário para filtrar links corretos
 * @returns {Promise<Object>}
 */
const getCriticalItemsSummary = async (condominiumId, userId, userRoles = []) => {
  try {
    const hasSindico = userRoles.includes('SINDICO') || userRoles.includes('SUBSINDICO');
    const hasFinanceiro = userRoles.includes('FINANCEIRO');
    const hasAdministrativo = userRoles.includes('ADMINISTRATIVO');
    const canShowModal = hasSindico || hasFinanceiro || hasAdministrativo;

    if (!condominiumId || !canShowModal) {
      return { showModal: false, hasCritical: false, summary: {}, links: {}, notifications: [] };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().slice(0, 10);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().slice(0, 10);

    // 1. Contas a pagar (payable_items)
    let payableOverdue = 0;
    let payableDueToday = 0;
    let payableUpcoming7Days = 0;
    try {
      const overdueResult = await query(
        `SELECT COUNT(*) as total FROM payable_items 
         WHERE condominium_id = $1 AND status = 'PENDING' AND due_date < $2`,
        [condominiumId, todayStr]
      );
      payableOverdue = parseInt(overdueResult.rows[0].total, 10);

      const dueTodayResult = await query(
        `SELECT COUNT(*) as total FROM payable_items 
         WHERE condominium_id = $1 AND status = 'PENDING' AND due_date = $2`,
        [condominiumId, todayStr]
      );
      payableDueToday = parseInt(dueTodayResult.rows[0].total, 10);

      const upcomingResult = await query(
        `SELECT COUNT(*) as total FROM payable_items 
         WHERE condominium_id = $1 AND status = 'PENDING' 
         AND due_date > $2 AND due_date <= $3`,
        [condominiumId, todayStr, in7DaysStr]
      );
      payableUpcoming7Days = parseInt(upcomingResult.rows[0].total, 10);
    } catch (err) {
      console.error('Erro ao buscar contas a pagar (criticalItemsService):', err.message);
    }

    // 2. Documentos vencidos e próximos
    let documentsExpired = 0;
    let documentsExpiring30Days = 0;
    try {
      const expiredDocsResult = await query(
        `SELECT COUNT(*) as total FROM documents 
         WHERE condominium_id = $1 AND expiry_date IS NOT NULL 
         AND expiry_date < $2 AND status = 'ACTIVE'`,
        [condominiumId, todayStr]
      );
      documentsExpired = parseInt(expiredDocsResult.rows[0].total, 10);

      const expiringDocsResult = await query(
        `SELECT COUNT(*) as total FROM documents 
         WHERE condominium_id = $1 AND expiry_date IS NOT NULL 
         AND expiry_date >= $2 AND expiry_date <= $3 AND status = 'ACTIVE'`,
        [condominiumId, todayStr, in30DaysStr]
      );
      documentsExpiring30Days = parseInt(expiringDocsResult.rows[0].total, 10);
    } catch (err) {
      console.error('Erro ao buscar documentos (criticalItemsService):', err.message);
    }

    // 3. Alertas críticos
    let criticalAlerts = 0;
    try {
      const alertsTableExists = await query(
        `SELECT EXISTS (SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'alerts')`
      );
      if (alertsTableExists.rows[0].exists) {
        const alertsResult = await query(
          `SELECT COUNT(*) as total FROM alerts 
           WHERE condominium_id = $1 AND severity = 'CRITICAL' AND resolved = FALSE`,
          [condominiumId]
        );
        criticalAlerts = parseInt(alertsResult.rows[0].total, 10);
      }
    } catch (err) {
      console.error('Erro ao buscar alertas (criticalItemsService):', err.message);
    }

    const summary = {
      payableOverdue,
      payableDueToday,
      payableUpcoming7Days,
      documentsExpired,
      documentsExpiring30Days,
      criticalAlerts,
    };

    const hasCritical =
      payableOverdue > 0 ||
      payableDueToday > 0 ||
      documentsExpired > 0 ||
      criticalAlerts > 0;

    const hasWarning =
      payableUpcoming7Days > 0 || documentsExpiring30Days > 0;

    // 4. Últimas notificações do usuário
    let notifications = [];
    try {
      if (userId) {
        const notifList = await notificationService.getUserNotifications(userId, condominiumId, {
          read: null,
          limit: 8,
          offset: 0,
        });
        notifications = (notifList || []).map(function(n) {
          return {
            id: n.id,
            title: n.title,
            message: (n.message || '').substring(0, 100),
            read: n.read,
            created_at: n.created_at,
          };
        });
      }
    } catch (err) {
      console.error('Erro ao buscar notificações (criticalItemsService):', err.message);
    }

    // Links conforme perfil do usuário
    const links = {};
    links.contasAPagar = '/financeiro/contas-a-pagar';
    links.documentos = '/administrativo/documentos';
    links.alertas = '/sindico/alertas';
    links.notificacoes = '/notifications';

    return {
      showModal: true,
      hasCritical: hasCritical || hasWarning,
      hasCriticalOnly: hasCritical,
      summary,
      links,
      notifications,
    };
  } catch (error) {
    console.error('Erro em getCriticalItemsSummary:', error);
    return { showModal: false, hasCritical: false, summary: {}, links: {}, notifications: [] };
  }
};

/**
 * Retorna lista de itens críticos para exibir em tabela no dashboard
 * Cada item tem: key, type, label, count, link
 */
const getCriticalItemsList = async (condominiumId, userId, userRoles = []) => {
  const summary = await getCriticalItemsSummary(condominiumId, userId, userRoles);
  if (!summary.summary || !summary.links) return { items: [], links: {} };

  const s = summary.summary;
  const links = summary.links;
  const items = [];

  if ((s.payableOverdue || 0) > 0 && links.contasAPagar) {
    items.push({ key: 'payable_overdue', type: 'critical', label: s.payableOverdue + ' conta(s) vencida(s)', link: links.contasAPagar });
  }
  if ((s.payableDueToday || 0) > 0 && links.contasAPagar) {
    items.push({ key: 'payable_due_today', type: 'critical', label: s.payableDueToday + ' conta(s) vence(m) hoje', link: links.contasAPagar });
  }
  if ((s.documentsExpired || 0) > 0 && links.documentos) {
    items.push({ key: 'documents_expired', type: 'critical', label: s.documentsExpired + ' documento(s) vencido(s)', link: links.documentos });
  }
  if ((s.criticalAlerts || 0) > 0 && links.alertas) {
    items.push({ key: 'critical_alerts', type: 'critical', label: s.criticalAlerts + ' alerta(s) crítico(s)', link: links.alertas });
  }
  if ((s.payableUpcoming7Days || 0) > 0 && links.contasAPagar) {
    items.push({ key: 'payable_upcoming_7d', type: 'warning', label: s.payableUpcoming7Days + ' conta(s) vencem em 7 dias', link: links.contasAPagar });
  }
  if ((s.documentsExpiring30Days || 0) > 0 && links.documentos) {
    items.push({ key: 'documents_expiring_30d', type: 'warning', label: s.documentsExpiring30Days + ' documento(s) vencem em 30 dias', link: links.documentos });
  }

  return { items, links: summary.links };
};

module.exports = {
  getCriticalItemsSummary,
  getCriticalItemsList,
};
