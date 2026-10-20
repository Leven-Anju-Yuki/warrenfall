/* Les caches sont propres à ce projet, y compris sur un domaine GitHub Pages partagé. */
const PREFIX = 'lapinous-' + new URL(self.registration.scope).pathname + '-';
const SHELL = PREFIX + 'shell-v8', IMAGES = PREFIX + 'images-v1';
const HOME = new URL('index.html', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const response = await fetch(HOME, {cache:'reload'});
    if (!response.ok) throw Error('Page du jeu indisponible');
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)]
      .map(match => new URL(match[1], HOME).href).filter(url => new URL(url).origin === self.location.origin);
    await cache.put(HOME, response);
    await cache.addAll([...new Set([...assets, '403.html', '404.html', 'offline.html', 'assets/icons/error-403.png', 'assets/icons/error-404.png', 'assets/icons/error-offline.png', 'assets/icons/warrenfall-48.png', 'assets/icons/warrenfall-192.png', 'assets/icons/warrenfall-512.png', 'assets/fonts/CinzelDecorative-Bold.ttf', 'assets/fonts/EBGaramond.ttf', 'manifest.json', 'lapinous-content.json', 'lapinous-shop.json', 'lapinous-puzzles.json', 'lapinous-quiz.json'].map(url => new URL(url, HOME).href))]);
  })());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith(PREFIX) && ![SHELL,IMAGES].includes(name)).map(name => caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  const image = event.request.destination === 'image' && (url.hostname === 'res.cloudinary.com' || (url.origin === self.location.origin && (url.pathname.startsWith(new URL('assets/img/Ouverture_du_jeu/', self.registration.scope).pathname) || /^Zone_(?:cuisine|Chambre|SdB|jardin)\//.test(url.pathname.slice(new URL('assets/img/', self.registration.scope).pathname.length)))));
  const local = url.origin === self.location.origin && url.href.startsWith(self.registration.scope);
  const relative = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  const allowed = local && (relative === '' || relative === 'index.html' || /^assets\/(?:js|css|icons|fonts)\//.test(relative) || /^lapinous-(?:content|shop|puzzles|quiz)\.json$/.test(relative));
  const navigation = local && event.request.mode === 'navigate' && relative !== 'dashboard.html' && !relative.startsWith('assets/') && !relative.startsWith('.') && !relative.includes('Sauvegardes');
  if (!allowed && !image && !navigation) return;
  event.respondWith((async () => {
    const cache = await caches.open(image ? IMAGES : SHELL);
    const key = local && (relative === '' || relative === 'index.html') ? HOME : event.request;
    const cached = await cache.match(key);
    if (image && cached) return cached;
    try {
      const response = await fetch(event.request);
      if (navigation && [403,404].includes(response.status)) {
        const page = await cache.match(new URL(response.status + '.html', self.registration.scope).href);
        if (page) return new Response(await page.text(), {status:response.status, headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
      if (response.ok || (image && response.type === 'opaque')) {
        await cache.put(key, response.clone());
        if (image) { const keys = await cache.keys(); for (const old of keys.slice(0, Math.max(0, keys.length - 120))) await cache.delete(old); }
      }
      return response;
    } catch (error) { if (cached) return cached; if (navigation) { const page = await cache.match(new URL('offline.html', self.registration.scope).href); if(page) return page; } throw error; }
  })());
});
