/* Cache só do código do álbum; nunca guarda respostas Supabase ou fotos externas.
   A navegação prefere internet. Offline mostra o shell e as memórias publicadas no repositório. */
const CACHE = 'album-do-meu-amor-shell-v2';
const ASSETS = [
  './', './index.html', './styles.css', './app.js',
  './memorias.js', './surpresas-data.js', './cloud-config.js',
  './cloud-bootstrap.js', './album-data.js', './editor.js',
  './experiencias.js', './privacidade.js', './foto-otimizador.js',
  './pwa.js', './temas.js', './manifest.webmanifest', './assets/icone-app.svg',
  './fotos/lembranca-04.webp', './fotos/lembranca-05.webp'
];
self.addEventListener('install', evento => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Um arquivo opcional indisponível não pode impedir o app de instalar.
    await Promise.all(ASSETS.map(async caminho => {
      try { await cache.add(new Request(caminho, { cache: 'reload' })); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', evento => {
  evento.waitUntil((async () => {
    const chaves = await caches.keys();
    await Promise.all(chaves.filter(chave => chave.startsWith('album-do-meu-amor-') && chave !== CACHE)
      .map(chave => caches.delete(chave)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', evento => {
  const req = evento.request;
  if (req.method !== 'GET') return;
  const destino = new URL(req.url);
  // Supabase, CDN e hospedagens externas nunca entram neste cache.
  if (destino.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    evento.respondWith(fetch(req).catch(async () =>
      (await caches.match('./index.html')) || Response.error()
    ));
    return;
  }
  // Ignorar fragmentos ou querystrings para servir o shell mesmo offline.
  if (!ASSETS.some(caminho => new URL(caminho, self.registration.scope).pathname === destino.pathname)) return;
  evento.respondWith((async () => {
    try {
      const resposta = await fetch(req);
      if (resposta.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(req, resposta.clone());
      }
      return resposta;
    } catch (_) {
      return (await caches.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});