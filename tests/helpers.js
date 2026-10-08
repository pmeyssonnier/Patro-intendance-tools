const path = require("path");
const fs = require("fs");

const URL = "file://" + path.resolve(__dirname, "..", "index.html");

/** Ouvre l'appli (stockage vide) ; renvoie la liste des erreurs JavaScript rencontrées. */
async function ouvrir(page) {
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto(URL);
  return erreurs;
}

/** Va sur la page Recettes et ouvre la fiche (fenêtre d'édition) d'une recette ; sans nom, la recette courante. */
async function ouvrirFiche(page, nom) {
  await aller(page, "rec");
  if (!nom) nom = await page.evaluate(() => S.cur || Object.keys(S.rec)[0]);
  const exact = new RegExp("^" + nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$");
  await page.locator("#rlist .rln").filter({ hasText: exact }).click();
  await page.locator("#rdlg[open]").waitFor();
}

/** Referme la fiche d'une recette : « Enregistrer » (par défaut) ou « Annuler ». */
async function fermerFiche(page, enregistrer = true) {
  await page.locator(enregistrer ? "#rdokc" : "#rdno").click();
  await page.locator("#rdlg").waitFor({ state: "hidden" });
}

/** Va sur une page du menu ☰ (eff, reg, menu, rec, cat, list, sh, pj), sur ordinateur comme sur téléphone. */
async function aller(page, id) {
  // une fiche de recette ouverte bloque la page : on la referme (sans enregistrer)
  if (await page.locator("#rdlg[open]").count()) await fermerFiche(page, false);
  const burger = page.locator("#burger");
  if (await burger.isVisible()) {
    if (await page.locator("#drawer").evaluate((d) => d.inert)) await burger.click();
  }
  await page.locator(`.ni[data-g="${id}"]`).click();
  await page.locator(`#g-${id}.on`).waitFor();
}

/** Sur téléphone, les régimes sont des blocs dépliables (un seul ouvert) : déplie celui demandé. Sans effet sur ordinateur. */
async function deplierRegime(page, cle) {
  const bloc = page.locator(`details.rg[data-rg="${cle}"]`);
  if ((await bloc.count()) && !(await bloc.evaluate((d) => d.open)))
    await bloc.locator("summary").click();
}

/** Clique sur un bouton qui télécharge un fichier et renvoie { nom, texte, octets, chemin }. */
async function telecharger(page, selecteur) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator(selecteur).click()]);
  const chemin = await dl.path();
  const octets = fs.readFileSync(chemin);
  return { nom: dl.suggestedFilename(), octets, texte: octets.toString("utf8"), chemin };
}

/** Importe un projet (chemin ou { name, mimeType, buffer }) et attend le rechargement de la page. */
async function importer(page, fichier) {
  await Promise.all([page.waitForEvent("load"), page.locator("#jin").setInputFiles(fichier)]);
}

/** Bascule « quantité unique » / « par personne » d'un ingrédient de recette (le bouton est dans sa fiche : on l'ouvre d'abord). `ligne` : la ligne de l'ingrédient dans #rb. */
async function basculerQuantite(page, ligne) {
  const k = await ligne.getAttribute("data-rk");
  if (!(await page.locator(`#rb [data-tg="${k}"]`).count())) await ligne.locator(".ib").click();
  await page.locator(`#rb [data-tg="${k}"]`).click();
}

/** Montant affiché en euros (« 198,21 € ») → nombre. */
const montant = (txt) => parseFloat(txt.replace(/[^\d,]/g, "").replace(",", "."));

module.exports = {
  basculerQuantite,
  ouvrirFiche,
  fermerFiche,
  ouvrir,
  aller,
  telecharger,
  importer,
  montant,
  URL,
  deplierRegime,
};
