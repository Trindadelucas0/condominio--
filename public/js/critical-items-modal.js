/**
 * Modal de itens críticos - exibido após login
 * Mostra: itens críticos, avisos e últimas notificações
 * Aparece toda vez para SINDICO, FINANCEIRO, ADMINISTRATIVO
 */
(function() {
  const MODAL_ID = 'critical-items-modal';
  const CONTENT_ID = 'critical-items-content';

  function getRoles() {
    try {
      const r = window.__userRoles;
      if (Array.isArray(r)) return r;
      if (typeof r === 'string') return JSON.parse(r || '[]');
      return [];
    } catch (_) {
      return [];
    }
  }

  function isOnDashboard() {
    const path = window.location.pathname || '';
    return /^\/(sindico|financeiro|administrativo)\/dashboard\/?$/.test(path) || path === '/sindico/dashboard' || path === '/financeiro/dashboard' || path === '/administrativo/dashboard';
  }

  function shouldFetchCriticalItems() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showCriticalModal') === '1') return true;
    const roles = getRoles();
    return roles.some(function(r) {
      return r === 'SINDICO' || r === 'SUBSINDICO' || r === 'FINANCEIRO' || r === 'ADMINISTRATIVO';
    });
  }

  function closeCriticalItemsModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.classList.add('hidden');
      modal.style.setProperty('display', 'none', 'important');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  window.closeCriticalItemsModal = closeCriticalItemsModal;

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return dateStr;
    }
  }

  function buildContent(data) {
    const s = data.summary || {};
    const links = data.links || {};
    const notifs = data.notifications || [];
    var html = '';

    var hasCritical = (s.payableOverdue || 0) > 0 || (s.payableDueToday || 0) > 0 ||
      (s.documentsExpired || 0) > 0 || (s.criticalAlerts || 0) > 0;
    var hasWarning = (s.payableUpcoming7Days || 0) > 0 || (s.documentsExpiring30Days || 0) > 0;

    if (hasCritical) {
      html += '<div class="mb-4"><p class="text-sm font-semibold text-red-600 mb-2">🔴 Crítico</p><ul class="space-y-2">';
      if ((s.payableOverdue || 0) > 0 && links.contasAPagar) {
        html += '<li class="flex justify-between items-center gap-2"><span>' + s.payableOverdue + ' conta(s) vencida(s)</span><a href="' + links.contasAPagar + '" class="text-primary-600 hover:underline font-medium text-sm whitespace-nowrap">Ver</a></li>';
      }
      if ((s.payableDueToday || 0) > 0 && links.contasAPagar) {
        html += '<li class="flex justify-between items-center gap-2"><span>' + s.payableDueToday + ' conta(s) vence(m) hoje</span><a href="' + links.contasAPagar + '" class="text-primary-600 hover:underline font-medium text-sm whitespace-nowrap">Ver</a></li>';
      }
      if ((s.documentsExpired || 0) > 0 && links.documentos) {
        html += '<li class="flex justify-between items-center gap-2"><span>' + s.documentsExpired + ' documento(s) vencido(s)</span><a href="' + links.documentos + '" class="text-primary-600 hover:underline font-medium text-sm whitespace-nowrap">Ver</a></li>';
      }
      if ((s.criticalAlerts || 0) > 0 && links.alertas) {
        html += '<li class="flex justify-between items-center gap-2"><span>' + s.criticalAlerts + ' alerta(s) crítico(s)</span><a href="' + links.alertas + '" class="text-primary-600 hover:underline font-medium text-sm whitespace-nowrap">Ver</a></li>';
      }
      html += '</ul></div>';
    }

    if (hasWarning) {
      html += '<div class="mb-4"><p class="text-sm font-semibold text-amber-600 mb-2">🟡 Aviso</p><ul class="space-y-2">';
      if ((s.payableUpcoming7Days || 0) > 0 && links.contasAPagar) {
        html += '<li class="flex justify-between items-center gap-2"><span>' + s.payableUpcoming7Days + ' conta(s) vencem em 7 dias</span><a href="' + links.contasAPagar + '" class="text-primary-600 hover:underline font-medium text-sm whitespace-nowrap">Ver</a></li>';
      }
      if ((s.documentsExpiring30Days || 0) > 0 && links.documentos) {
        html += '<li class="flex justify-between items-center gap-2"><span>' + s.documentsExpiring30Days + ' documento(s) vencem em 30 dias</span><a href="' + links.documentos + '" class="text-primary-600 hover:underline font-medium text-sm whitespace-nowrap">Ver</a></li>';
      }
      html += '</ul></div>';
    }

    html += '<div><p class="text-sm font-semibold text-blue-600 mb-2">📋 Últimas notificações</p>';
    if (notifs.length === 0) {
      html += '<p class="text-gray-500 text-sm py-2">Nenhuma notificação recente.</p>';
    } else {
      html += '<ul class="space-y-2 max-h-32 overflow-y-auto">';
      notifs.forEach(function(n) {
        var unreadClass = n.read ? '' : 'font-semibold';
        html += '<li class="text-sm ' + unreadClass + '"><span class="text-gray-500 text-xs">' + escapeHtml(formatDate(n.created_at)) + '</span> ' + escapeHtml(n.title || n.message) + '</li>';
      });
      html += '</ul>';
      if (links.notificacoes) {
        html += '<a href="' + links.notificacoes + '" class="inline-block mt-2 text-primary-600 hover:underline font-medium text-sm">Ver todas as notificações →</a>';
      }
    }
    html += '</div>';

    if (!hasCritical && !hasWarning && notifs.length === 0) {
      return '<p class="text-gray-500 text-sm">Nenhum item pendente no momento.</p>';
    }
    return html;
  }

  function showModal(data) {
    const contentEl = document.getElementById(CONTENT_ID);
    const modal = document.getElementById(MODAL_ID);
    if (!contentEl || !modal) {
      console.warn('Modal de itens críticos: elementos não encontrados');
      return;
    }
    contentEl.innerHTML = buildContent(data || {});
    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  function init() {
    var forceShow = new URLSearchParams(window.location.search).get('showCriticalModal') === '1';
    var onDashboard = isOnDashboard();
    if (!shouldFetchCriticalItems() && !forceShow) return;
    if (!onDashboard && !forceShow) return;

    var defaultData = { summary: {}, links: { contasAPagar: '/financeiro/contas-a-pagar', documentos: '/administrativo/documentos', alertas: '/sindico/alertas', notificacoes: '/notifications' }, notifications: [] };

    fetch('/api/critical-items', { credentials: 'same-origin' })
      .then(function(res) {
        if (!res.ok) throw new Error('API retornou ' + res.status);
        return res.json();
      })
      .then(function(data) {
        if (!data) data = defaultData;
        if (onDashboard || forceShow || (data && data.showModal)) {
          showModal(data);
        }
      })
      .catch(function(err) {
        console.error('Erro ao buscar itens críticos:', err);
        if (onDashboard || forceShow) {
          showModal(defaultData);
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
