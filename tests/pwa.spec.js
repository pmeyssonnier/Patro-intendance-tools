// Mode hors connexion : l'appli est servie en HTTP (le service worker ne s'enregistre pas en file://).
const { test, expect } = require("@playwright/test");
const http = require("http");
const fs = require("fs");
const path = require("path");

const RACINE = path.resolve(__dirname, "..");
const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

let serveur, base;
let coupe = false; // vrai : le serveur coupe les connexions, comme une panne de réseau

test.beforeAll(async () => {
  serveur = http.createServer((req, res) => {
    if (coupe) {
      req.socket.destroy();
      return;
    }
    const chemin = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const fichier = path.join(RACINE, chemin === "/" ? "index.html" : chemin);
    if (
      !fichier.startsWith(RACINE) ||
      !fs.existsSync(fichier) ||
      fs.statSync(fichier).isDirectory()
    ) {
      res.writeHead(404).end("introuvable");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream",
    });
    res.end(fs.readFileSync(fichier));
  });
  await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
  base = "http://127.0.0.1:" + serveur.address().port + "/";
});
test.beforeEach(() => {
  coupe = false;
});
test.afterAll(() => serveur.close());

/** Ouvre l'appli en HTTP et attend que le service worker soit actif et ait pris le contrôle de la page. */
async function ouvrirHTTP(page) {
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.goto(base);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  return erreurs;
}

/** Fichiers dont la page a besoin : scripts, styles, logo, manifeste et icônes du manifeste. */
function fichiersNecessaires() {
  const html = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");
  const manifeste = JSON.parse(fs.readFileSync(path.join(RACINE, "manifest.webmanifest"), "utf8"));
  const liste = [
    ...[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<link[^>]+href="([^"#]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]),
    ...manifeste.icons.map((i) => i.src),
  ];
  return [...new Set(liste.filter((f) => !/^(https?:|data:)/.test(f)))];
}

test("hors connexion : tous les fichiers nécessaires sont en cache", async ({ page }) => {
  await ouvrirHTTP(page);
  const enCache = await page.evaluate(async () => {
    const noms = [];
    for (const k of await caches.keys())
      for (const r of await (await caches.open(k)).keys()) noms.push(new URL(r.url).pathname);
    return noms;
  });
  const manquants = fichiersNecessaires().filter(
    (f) => !enCache.includes("/" + f.replace(/^\.?\//, ""))
  );
  expect(manquants).toEqual([]);
});

test("hors connexion : la page se recharge et fonctionne", async ({ page }) => {
  await ouvrirHTTP(page);
  coupe = true;
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.reload();
  await expect(page).toHaveTitle(/Intendance de camp/);
  await expect(page.locator("#cname")).toHaveValue("Mon camp");
  expect(await page.locator("#list tr").count()).toBeGreaterThan(5);
  await expect(page.locator("#appver")).toHaveText(/^Version \d/);
  expect(erreurs).toEqual([]);
});

test("hors connexion : un fichier absent du cache n'est pas remplacé par du HTML", async ({
  page,
}) => {
  await ouvrirHTTP(page);
  coupe = true;
  const resultat = await page.evaluate(() =>
    fetch("js/fichier-inexistant.js").then(
      (r) => "reponse " + r.status,
      () => "erreur reseau"
    )
  );
  expect(resultat).toBe("erreur reseau");
});
