// Script para alternar entre tema claro e escuro
// Salva preferência no localStorage

(function() {
  'use strict';

  // Função para aplicar tema
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Atualiza ícone do botão
    const toggleButton = document.getElementById('theme-toggle');
    const toggleButtonMobile = document.getElementById('theme-toggle-mobile');
    
    if (toggleButton) {
      if (theme === 'dark') {
        toggleButton.innerHTML = '☀️'; // Sol para voltar ao claro
        toggleButton.setAttribute('title', 'Alternar para tema claro');
      } else {
        toggleButton.innerHTML = '🌙'; // Lua para ir ao escuro
        toggleButton.setAttribute('title', 'Alternar para tema escuro');
      }
    }
    
    if (toggleButtonMobile) {
      if (theme === 'dark') {
        toggleButtonMobile.textContent = '☀️';
      } else {
        toggleButtonMobile.textContent = '🌙';
      }
    }
  }

  // Função para alternar tema
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }

  // Inicializa tema ao carregar página
  function initTheme() {
    // Verifica preferência salva ou usa preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  // Listener para mudanças na preferência do sistema
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Só aplica se não houver preferência salva
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Inicializa ao carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Expõe função globalmente
  window.toggleTheme = toggleTheme;
})();
