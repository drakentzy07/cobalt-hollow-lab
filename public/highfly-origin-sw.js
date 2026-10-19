/* HIGHFLY ORIGIN F1.1: isolated offline app-shell + on-demand world cache.
 * Same-origin static files only. Never cache APIs, websocket calls or third parties.
 * World GLBs/texture sets are cached as they are visited; not magically all
 * downloaded on install. Offline world proof remains a separate test gate.
 */
const VERSION = 'highfly-origin-f11-20261019-v1';
const CACHE = VERSION + '-resources';
const scopeUrl = new URL(self.registration.scope);
const shellUrl = new URL('./', scopeUrl).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // The launcher always gets a cached fallback. Manifest failures are
    // non-fatal: never prevent an update/install solely due to a media file.
    try {
      const response = await fetch(shellUrl, { cache: 'reload' });
      if (response.ok) await cache.put(shellUrl, response);
    } catch {}
    try {
      const response = await fetch(new URL('highfly-origin-appshell.json', scopeUrl));
      if (response.ok) {
        const paths = await response.json();
        if (Array.isArray(paths)) {
          for (let i = 0; i < paths.length; i += 8) {
            await Promise.allSettled(paths.slice(i, i + 8).map(async path => {
              if (typeof path !== 'string' || path.startsWith('/') || path.includes('..')) return;
              const url = new URL(path, scopeUrl);
              if (url.origin !== scopeUrl.origin) return;
              try {
                const res = await fetch(url);
                if (res.ok && res.type === 'basic') await cache.put(url, res);
              } catch {}
            }));
          }
        }
      }
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('highfly-origin-f11-') && k !== CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;
  const relative = url.pathname.slice(scopeUrl.pathname.length);
  if (relative.startsWith('api/') || relative.startsWith('auth/') ||
      relative.startsWith('highfly-origin-sw.js')) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        if (response.ok) {
          try { await (await caches.open(CACHE)).put(shellUrl, response.clone()); } catch {}
        }
        return response;
      } catch {
        return (await caches.match(shellUrl)) ||
          new Response('HIGHFLY: esta pantalla no fue descargada todavía.', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
      }
    })());
    return;
  }

  // Content hashes make cache-first safe for Vite bundles and media.
  // For mutable non-hashed files the SW is versioned with each F1.1 build.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const response = await fetch(req);
    if (response.ok && response.type === 'basic') {
      event.waitUntil((async () => {
        try { await (await caches.open(CACHE)).put(req, response.clone()); } catch {}
      })());
    }
    return response;
  })());
});
