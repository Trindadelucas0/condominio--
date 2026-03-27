/**
 * Service Worker - Êxito Gestão Condominial
 * Faz cache de recursos estáticos (logo, CSS, JS) e da página de login
 * para carregamento mais rápido no celular e uso offline básico.
 */

// Nome e versão do cache: alterar a versão invalida caches antigos ao atualizar o SW
const CACHE_NAME = 'exito-v1';

// Lista de URLs para precache na instalação (recursos essenciais)
const PRECACHE_URLS = [
  '/logo.png',
  '/css/design-system.css',
  '/js/critical-items-modal.js',
  '/manifest.json'
];

/**
 * Evento install: executado quando o Service Worker é instalado.
 * Abre o cache, adiciona os recursos da lista e força o SW a ficar ativo.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('SW install: falha no precache', err))
  );
});

/**
 * Evento activate: executado quando o SW assume controle.
 * Remove caches de versões antigas (outros nomes que não CACHE_NAME).
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
      .catch((err) => console.warn('SW activate:', err))
  );
});

/**
 * Evento fetch: intercepta requisições de rede.
 * - Cache-first para estáticos (logo, css, js, manifest): mais rápido no celular.
 * - Network-first para o resto (páginas dinâmicas, API): evita dados desatualizados.
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Só processa requisições GET do mesmo origin
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Recursos estáticos: cache-first (usa cache se existir, senão rede)
  if (
    url.pathname === '/logo.png' ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone).catch((e) =>
              console.warn('SW cache.put (estático):', e)
            )
          );
          return response;
        });
      })
    );
    return;
  }

  // Página de login: network-first com fallback para cache (abre rápido ao reabrir o app)
  if (url.pathname === '/auth/login' || url.pathname === '/auth/login/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone).catch((e) =>
              console.warn('SW cache.put (login):', e)
            )
          );
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais requisições: deixa o navegador buscar normalmente (sem interceptar)
});
