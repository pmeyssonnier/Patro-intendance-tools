/* Service worker : permet l'installation et l'usage hors connexion.
   Stratégie « réseau d'abord » : la dernière version est toujours chargée si on est en ligne. */
const V = "pss-v5";
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "js/data-defaults.js",
  "js/utils.js",
  "js/storage.js",
  "js/state.js",
  "js/calculations.js",
  "js/shopping-list.js",
  "js/documents.js",
  "js/share-print.js",
  "js/navigation.js",
  "js/camps.js",
  "js/diets.js",
  "js/menu.js",
  "js/recipes.js",
  "js/ingredient-matching.js",
  "js/ingredients.js",
  "js/ingredient-merge.js",
  "js/rayons.js",
  "js/price-import.js",
  "js/catalog-ui.js",
  "js/recipe-import.js",
  "js/changelog.js",
  "js/config.js",
  "js/groupes.js",
  "js/sync-data.js",
  "js/cloud-groups.js",
  "js/cloud-sync.js",
  "js/cloud-history.js",
  "js/cloud.js",
  "js/pwa.js",
  "js/main.js",
  "assets/logo-pss.jpg",
  "manifest.webmanifest",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(V)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    // no-cache : on redemande toujours au serveur, sans se contenter de la copie gardée par le navigateur
    fetch(r, { cache: "no-cache" })
      .then((res) => {
        // seules les réponses valides remplacent la copie gardée : une erreur 404 ou 500 ne doit pas l'écraser
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(V).then((c) => c.put(r, copy)));
        }
        return res;
      })
      .catch(() =>
        caches.match(r, { ignoreSearch: true }).then((m) => {
          if (m) return m;
          // index.html seulement pour une navigation : un script ou une image manquant ne doit pas recevoir du HTML
          return r.mode === "navigate" ? caches.match("index.html") : Response.error();
        })
      )
  );
});
