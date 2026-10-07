/* Intendance PSS – Import de prix : lecture des fichiers (JSON, CSV/texte), rapprochement avec le catalogue, application.
   Données seulement (aucun élément de la page). Script classique : voir l'ordre de chargement dans index.html. */

let pendingJson = null; // prix JSON lus, appliqués au clic sur « Importer »
let pendingInconnus = []; // produits du JSON absents du catalogue, ajoutés avec le bouton sous leur liste

/** Lit un JSON de prix (format Colruyt) : renvoie { lignes: [[id, prix, nom, via]], ignores, date, source } ou null.
    Un ingrédient est relié par son identifiant ; à défaut, par son nom (« nom » ou « requete » du JSON). */
function parsePrixJson(txt) {
  let j;
  try {
    j = JSON.parse(txt.replace(/^\uFEFF/, ""));
  } catch (e) {
    return null;
  }
  if (!j || typeof j.ingredients !== "object" || j.ingredients === null) return null;
  const unit = { g: "kg", ml: "l", pc: "piece" };
  const lignes = [],
    inconnus = [],
    pris = new Set(Object.keys(j.ingredients).filter((k) => ING[k]));
  let ignores = 0;
  const produit = (x) => {
    const pr = x.produit || {};
    // Colruyt met déjà la marque au début du nom (« EVERYDAY spaghetti 500g ») : ne pas la doubler
    const nom = String(pr.nom || ""),
      marque = String(pr.marque || "");
    return nomProduit(
      (marque && !nom.toLowerCase().startsWith(marque.toLowerCase())
        ? marque + " " + nom
        : nom
      ).trim()
    );
  };
  for (const cle in j.ingredients) {
    const x = j.ingredients[cle] || {},
      p = +x.prix_unitaire,
      u = String(x.unite).toLowerCase();
    let k = ING[cle] ? cle : null,
      via = "";
    if (!k && p > 0) {
      const nom = x.nom || x.requete;
      k = nom ? ingParNom(nom, pris, u) : null;
      if (k) {
        pris.add(k);
        via = String(nom);
      }
    }
    if (!k || !(p > 0) || u !== unit[ING[k][1]]) {
      // produit absent du catalogue mais exploitable : proposé à l'ajout
      const nom = String(x.nom || x.requete || "").trim(),
        unPc = { kg: "g", l: "ml", piece: "pc" }[u];
      const existe = ["kg", "l", "piece"].some((v) => ingParNom(nom, new Set(), v));
      if (!k && p > 0 && nom && unPc && nom.length <= 100 && !existe) {
        inconnus.push({
          nom,
          unite: unPc,
          prix: +p.toFixed(2),
          produit: produit(x),
          categorie: String(x.categorie || ""),
          lien: lienColruyt(x.lien),
          promo:
            x.promo && +x.promo.prix_unitaire > 0 && +x.promo.prix_unitaire < p
              ? {
                  p: +(+x.promo.prix_unitaire).toFixed(2),
                  t: String(x.promo.texte || "").slice(0, 60),
                }
              : null,
        });
      } else ignores++;
      continue;
    }
    lignes.push([
      k,
      +p.toFixed(2),
      produit(x),
      via,
      CATS.some((c) => c[0] === x.categorie) ? x.categorie : "",
      // promotion du fichier : seulement si elle est moins chère que le prix normal
      x.promo && +x.promo.prix_unitaire > 0 && +x.promo.prix_unitaire < p
        ? { p: +(+x.promo.prix_unitaire).toFixed(2), t: String(x.promo.texte || "").slice(0, 60) }
        : null,
      lienColruyt(x.lien),
    ]);
  }
  return {
    lignes,
    inconnus,
    ignores,
    date: String(j.date_maj || "").slice(0, 10),
    source: j.source || "JSON",
  };
}

const EXCL = {
  lait: "coco|riz au|chocolat|sans lactose",
  riz: "au lait|galette|soufflé",
  pain: "épice|sans gluten|grillé|burger",
  beu: "cacahu|arachide",
  suc: "sans sucre|glace|vanill",
  fro: "sans lactose",
  pates: "sans gluten|tartiner",
  hache: "dinde|halal|végétari",
  poulet: "halal|végétari",
  sauc: "halal|végétari",
  jam: "dinde|halal",
};

function perUnit(name, p) {
  const m = name.match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|ml)\b/i);
  if (!m) return null;
  const q =
    (m[1] ? +m[1] : 1) *
    parseFloat(m[2].replace(",", ".")) *
    { kg: 1000, g: 1, l: 1000, cl: 10, ml: 1 }[m[3].toLowerCase()];
  return q ? (p / q) * 1000 : null;
}

/** Compare un fichier de prix lu (`parsePrixJson`) au catalogue actuel : une ligne par prix, triée (hausses et baisses d'abord),
    et le budget de la liste de courses avant / après. */
function comparerPrix(pj) {
  const nouveau = {},
    rangs = { hausse: 0, baisse: 0, nouveau: 1, egal: 2 };
  const lignes = pj.lignes
    .map(([k, p, n, , cat, promo, lien]) => {
      nouveau[k] = p;
      const avant = price(k),
        delta = p - avant,
        etat = !(avant > 0)
          ? "nouveau"
          : delta > 0.004
            ? "hausse"
            : delta < -0.004
              ? "baisse"
              : "egal";
      return {
        k,
        avant,
        p,
        etat,
        pct: avant > 0 ? (delta / avant) * 100 : 0,
        produit: n,
        produitAvant: S.pn[k] || "",
        rayon: cat && !S.cat[k] && !CAT0[k] ? cat : "",
        promo,
        lien: lien || lienColruyt(S.url[k]),
      };
    })
    .sort(
      (a, b) =>
        rangs[a.etat] - rangs[b.etat] ||
        Math.abs(b.pct) - Math.abs(a.pct) ||
        ING[a.k][0].localeCompare(ING[b.k][0], "fr")
    );
  const avantB = LAST.sum,
    apresB = LAST.keys.reduce(
      (a, k) => a + (LAST.tot[k] / per(k)) * (k in nouveau ? nouveau[k] : price(k)),
      0
    );
  return { lignes, avantB, apresB };
}

/** Crée au catalogue les produits de pendingInconnus dont l'indice est dans `idx` (avec leur prix), sans les mettre dans une recette. */
function ajouterInconnus(idx) {
  idx.forEach((i) => {
    const u = pendingInconnus[i],
      k = createIng(u.nom, u.unite, "", u.categorie);
    S.prices[k] = u.prix;
    if (u.promo) S.promo[k] = u.promo;
    if (u.lien) S.url[k] = u.lien;
    if (u.produit) S.pn[k] = u.produit;
  });
  pendingInconnus = pendingInconnus.filter((_, i) => !idx.includes(i));
  return idx.length;
}

/** Applique un fichier de prix JSON lu : prix, produit, promotion, lien et rayon (celui du fichier ne sert que s'il n'y en a pas déjà un). */
function appliquerPrixJson(pj) {
  pj.lignes.forEach(([k, p, n, , cat, promo, lien]) => {
    if (promo) S.promo[k] = promo;
    else delete S.promo[k];
    if (lien) S.url[k] = lien;
    else delete S.url[k];
    // le rayon du fichier ne sert que pour un ingrédient qui n'en a pas encore (ni choisi, ni par défaut)
    if (cat && !S.cat[k] && !CAT0[k]) S.cat[k] = cat;
    S.prices[k] = p;
    if (n) S.pn[k] = n;
    else delete S.pn[k];
  });
}

/** Importe une liste de produits « nom ; prix » : le moins cher de chaque ingrédient (ses mots-clés) est retenu, converti en €/kg ou €/L si le poids est dans le nom. */
function importerCsv(texte) {
  const items = [];
  texte.split(/\r?\n/).forEach((l) => {
    const m = l.match(/^(.*?)[;\t,]\s*"?€?\s*(\d+(?:[.,]\d+)?)"?\s*€?\s*$/);
    if (m) {
      const n = m[1].replace(/"/g, "").trim(),
        p = parseFloat(m[2].replace(",", ".")),
        u = perUnit(n, p);
      items.push([n, u ?? p, u != null]);
    }
  });
  let hit = 0;
  for (const k in ING) {
    const re = new RegExp(ING[k][3], "i"),
      ex = EXCL[k] ? new RegExp(EXCL[k], "i") : null;
    const c = items
      .filter((i) => re.test(i[0]) && !(ex && ex.test(i[0])))
      .sort((a, b) => a[1] - b[1])[0];
    if (c) {
      S.prices[k] = +c[1].toFixed(2);
      delete S.promo[k];
      delete S.url[k];
      S.pn[k] = c[0] + (c[2] ? " (→ €/kg ou €/L calculé)" : " (prix pris tel quel)");
      hit++;
    }
  }
  return { lus: items.length, relies: hit };
}

/** Récupère le dernier fichier de prix publié avec l'appli (aucun service externe appelé, aucun crédit consommé). Lève une erreur s'il est introuvable. */
async function lirePrixPublies() {
  const res = await fetch("prix/prix_colruyt.json", { cache: "no-store" });
  if (!res.ok) throw new Error(res.status);
  return res.text();
}
