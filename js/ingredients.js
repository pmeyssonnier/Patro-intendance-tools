/* Intendance PSS – Ingrédients : modification (nom, unité, rayon, régime), création, prix saisi, export.
   Données seulement (aucun élément de la page). Script classique : voir l'ordre de chargement dans index.html. */

/** Recettes qui utilisent un ingrédient. */
const recettesDe = (k) =>
  Object.entries(S.rec)
    .filter(([, r]) => k in r.ing)
    .map(([n]) => n);

const famille = (u) => (u === "pc" ? "pc" : "poids");

/** Régimes concernés par « Attention régime » (ceux de DMAP) dans lesquels un ingrédient a une règle. */
const dietsDMAP = [...new Set(Object.values(DMAP).flat())];

/** « Attention régime » actuelle d'un ingrédient (clé de DMAP, "" pour aucune), ou "perso" si ses règles ne correspondent à aucun choix. */
function regimeActuel(k) {
  const en = dietsDMAP.filter((d) => DIETS[d] && k in DIETS[d].ex);
  for (const [cle, ds] of [["", []], ...Object.entries(DMAP)]) {
    const a = ds.filter((d) => DIETS[d]);
    if (a.length === en.length && a.every((d) => en.includes(d))) return cle;
  }
  return "perso";
}

/** Texte d'avertissement affiché pendant la modification d'un ingrédient (nouvelle unité et nouvelle attention régime choisies ou non). */
function editInfo(k, unite, dg) {
  const rec = recettesDe(k),
    u0 = ING[k][1];
  let t = rec.length
    ? `Utilisé dans ${rec.length} recette${rec.length > 1 ? "s" : ""} : ${rec.slice(0, 5).join(", ")}${rec.length > 5 ? "…" : ""}. Le nouveau nom s'affichera partout (recettes, liste de courses, documents).`
    : "Pas utilisé dans une recette.";
  if (unite !== u0) {
    if (famille(unite) !== famille(u0))
      t += rec.length
        ? " ⚠ Changement impossible : g/ml ⇄ pièce n'est pas permis tant que l'ingrédient est dans une recette."
        : " Le prix de cet ingrédient sera remis à zéro (unité différente).";
    else
      t +=
        " g ⇄ ml : quantités et prix sont conservés (le prix devient par L au lieu de par kg, ou l'inverse).";
  }
  if (dg !== undefined && dg !== "perso" && dg !== regimeActuel(k)) {
    const nouveau = DMAP[dg] || [],
      perdus = dietsDMAP.filter((d) => DIETS[d] && DIETS[d].ex[k] && !nouveau.includes(d));
    if (perdus.length)
      t += ` ⚠ Les remplacements actuels seront supprimés pour : ${perdus.map((d) => DIETS[d].n).join(", ")}.`;
  }
  return t;
}

/** Applique une « Attention régime » à un ingrédient : crée ou retire ses règles dans les régimes concernés. */
function appliquerRegime(k, dg) {
  const voulus = DMAP[dg] || [];
  for (const d of dietsDMAP) {
    if (!DIETS[d]) continue;
    if (voulus.includes(d)) {
      if (!(k in DIETS[d].ex)) DIETS[d].ex[k] = null;
    } else delete DIETS[d].ex[k];
  }
  if (S.cust[k]) S.cust[k][5] = [...voulus];
}

/** Valide et applique un nouveau nom / une nouvelle unité. Renvoie un message d'erreur, ou "" si c'est fait. */
function editIng(k, nom, unite, dg, cat) {
  nom = nom.trim().replace(/\s+/g, " ");
  if (!nom) return "Le nom ne peut pas être vide.";
  if (nom.length > 100) return "Nom trop long (100 caractères au plus).";
  const ancien = ING[k][0],
    u0 = ING[k][1];
  if (cleNom(nom) !== cleNom(ancien)) {
    const dbl = Object.keys(ING).find((x) => x !== k && cleNom(ING[x][0]) === cleNom(nom));
    if (dbl)
      return `Un ingrédient s'appelle déjà « ${ING[dbl][0]} » (majuscules, accents et pluriel comptent pour pareil).`;
  }
  const autre = famille(unite) !== famille(u0);
  if (autre && recettesDe(k).length)
    return "L'unité ne peut pas passer de g/ml à pièce (ni l'inverse) : l'ingrédient est utilisé dans des recettes. Retire-le d'abord des recettes.";
  ING[k][0] = nom;
  ING[k][1] = unite;
  if (S.cust[k]) {
    // mots-clés de l'import de texte : ils suivent le nom quand ils venaient de l'ancien nom
    const kw = (t) => t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (ING[k][3] === kw(ancien)) ING[k][3] = kw(nom);
  } else if (nom === ING0[k][0] && unite === ING0[k][1]) delete S.ov[k];
  else S.ov[k] = { n: nom, u: unite };
  if (autre) {
    S.prices[k] = 0;
    delete S.pn[k];
    delete S.promo[k];
    delete S.url[k];
  }
  if (dg !== undefined && dg !== "perso" && dg !== regimeActuel(k)) appliquerRegime(k, dg);
  if (CATS.some((c) => c[0] === cat)) {
    if (cat === (CAT0[k] || "aut")) delete S.cat[k];
    else S.cat[k] = cat;
  }
  return "";
}

/** Prix saisi à la main : il remplace le produit retenu à l'import (nom et promotion sont oubliés) ; le lien du produit est gardé. */
function poserPrix(k, p) {
  S.prices[k] = p;
  delete S.pn[k];
  delete S.promo[k];
}

/** Message qui explique pourquoi un ingrédient ne peut pas être supprimé (utilisé dans des recettes), ou "" s'il le peut. */
function refusSuppression(k) {
  const rec = recettesDe(k);
  return rec.length
    ? "Suppression impossible : « " +
        ING[k][0] +
        " » est utilisé dans " +
        (rec.length > 1 ? rec.length + " recettes" : "une recette") +
        " (" +
        rec.join(", ") +
        "). Retire-le d'abord de la recette."
    : "";
}

/** Texte JSON du catalogue de prix, au format que l'import de prix sait relire. */
function catalogueJson(jour) {
  const unit = { g: "kg", ml: "l", pc: "piece" },
    ingredients = {};
  Object.keys(ING)
    .filter((k) => !S.hid.includes(k))
    .forEach((k) => {
      ingredients[k] = {
        nom: ING[k][0],
        categorie: catOf(k),
        unite: unit[ING[k][1]],
        prix_unitaire: price(k),
        produit: {
          nom: prodName(k),
        },
      };
    });
  return JSON.stringify(
    { source: "Export du catalogue de prix", date_maj: jour + "T00:00:00", ingredients },
    null,
    2
  );
}

/** Crée un ingrédient (prix facultatif) et, si `recette` est donné, l'ajoute à cette recette. Renvoie son identifiant. */
function ajouterIngredient(nom, unite, dg, cat, prix, recette) {
  const k = createIng(nom, unite, dg, cat);
  if (prix > 0) S.prices[k] = prix;
  if (recette) S.rec[recette].ing[k] = SEC.map(() => 0);
  return k;
}

/** Ajoute un ingrédient existant à une recette (sans effet s'il y est déjà). */
function utiliserIngredient(k, recette) {
  if (k && recette && S.rec[recette] && !(k in S.rec[recette].ing))
    S.rec[recette].ing[k] = SEC.map(() => 0);
}
