/* Service Worker — Organizador de Aulas (Prometeu)
   Cache do "app shell" para funcionamento offline.
   CACHE e as URLs versionadas (?v=) são preenchidos pelo build.py a partir de
   um hash do conteúdo — isso garante que toda publicação com mudança real
   gera um service-worker.js diferente (o navegador detecta sozinho) e URLs
   novas para os arquivos versionados (o cache HTTP nunca serve versão velha). */
const CACHE = 'prometeu-cc3a77dfde';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=cc3a77dfde',
  './app.js?v=cc3a77dfde',
  './i18n.js?v=cc3a77dfde',
  './privacidade.html',
  './termos.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/favicon-64.png',
  // prints anotados do tutorial — sem eles no pré-cache, o tutorial ficaria
  // sem figuras no primeiro uso offline
  './tutorial/01-inicio.jpg',
  './tutorial/02-menu.jpg',
  './tutorial/03-projetos.jpg',
  './tutorial/04-series.jpg',
  './tutorial/05-aulas.jpg',
  './tutorial/06-selecao.jpg',
  './tutorial/07-capitulos.jpg',
  './tutorial/08-video.jpg',
  './tutorial/09-materiais.jpg',
  './tutorial/10-desfazer.jpg',
  './tutorial/11-lixeira.jpg',
  './tutorial/12-backup.jpg'
];

// Instala e pré-carrega os arquivos locais no cache, ignorando o cache HTTP
// do navegador (cache:'reload') — sem isso, o addAll poderia reaproveitar uma
// resposta antiga já guardada pelo navegador para a mesma URL.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(ASSETS.map((url) =>
        fetch(url, { cache: 'reload' }).then((res) => c.put(url, res))
      ))
    ).then(() => self.skipWaiting())
  );
});

// Remove caches antigos ao ativar
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: cache-first para os arquivos do app; rede para o resto (ex: fontes/YouTube)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Só intercepta arquivos do próprio app (mesma origem)
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        // guarda cópia no cache para próximas vezes
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html')))
    );
  }
  // Recursos externos (Google Fonts, oEmbed do YouTube): deixa passar direto pela rede
});
