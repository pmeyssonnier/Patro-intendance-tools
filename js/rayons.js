/* Intendance PSS – Rayons : créer, renommer, ordonner et supprimer les rayons (catégories d'ingrédients).
   Données seulement (aucun élément de la page). Chaque rayon a un identifiant stable (« fl », « r_… ») indépendant de son nom :
   renommer ne touche pas aux produits ni aux imports de prix. Script classique : voir l'ordre de chargement dans index.html. */

const RAYON_NOM_MAX = 40;

/** Enregistre la liste des rayons dans le projet (S.rayons), ou l'oublie quand elle est identique à celle d'origine. */
function memoriserRayons() {
  const l = CATS.map((c) => [...c]);
  if (JSON.stringify(l) === JSON.stringify(CATS0)) delete S.rayons;
  else S.rayons = l;
}

/** Nombre d'ingrédients visibles d'un rayon. */
const nbProduitsRayon = (id) =>
  Object.keys(ING).filter((k) => !S.hid.includes(k) && catOf(k) === id).length;

/** Message d'erreur si `nom` ne convient pas comme nom de rayon (vide, trop long, déjà pris par un autre rayon), sinon "". */
function erreurNomRayon(nom, sauf) {
  if (!nom) return "Le nom du rayon ne peut pas être vide.";
  if (nom.length > RAYON_NOM_MAX) return `Nom trop long (${RAYON_NOM_MAX} caractères au plus).`;
  const pris = CATS.find(([id, n]) => id !== sauf && plain(n) === plain(nom));
  return pris ? `Un rayon s'appelle déjà « ${pris[1]} ».` : "";
}

/** Crée un rayon, juste avant « Autre ». Renvoie { err } ou { id }. */
function creerRayon(nom) {
  nom = String(nom).trim().replace(/\s+/g, " ");
  const err = erreurNomRayon(nom);
  if (err) return { err };
  if (CATS.length >= 30) return { err: "30 rayons au plus." };
  let id = "r_" + Date.now().toString(36);
  while (CATS.some((c) => c[0] === id)) id += "a";
  const i = CATS.findIndex((c) => c[0] === "aut");
  CATS.splice(i < 0 ? CATS.length : i, 0, [id, nom]);
  memoriserRayons();
  return { id };
}

/** Renomme un rayon (ses produits restent dedans). Renvoie un message d'erreur, ou "". */
function renommerRayon(id, nom) {
  const r = CATS.find((c) => c[0] === id);
  if (!r) return "Rayon introuvable.";
  nom = String(nom).trim().replace(/\s+/g, " ");
  const err = erreurNomRayon(nom, id);
  if (err) return err;
  r[1] = nom;
  memoriserRayons();
  return "";
}

/** Monte (-1) ou descend (+1) un rayon : c'est l'ordre de la liste de courses et des exports. Renvoie true s'il a bougé. */
function deplacerRayon(id, sens) {
  const i = CATS.findIndex((c) => c[0] === id),
    j = i + sens;
  if (i < 0 || j < 0 || j >= CATS.length) return false;
  [CATS[i], CATS[j]] = [CATS[j], CATS[i]];
  memoriserRayons();
  return true;
}

/** Supprime un rayon et transfère ses produits vers `vers`. « Autre » ne peut pas être supprimé. Renvoie un message d'erreur, ou "". */
function supprimerRayon(id, vers) {
  if (id === "aut") return "« Autre » est le rayon de secours : il ne peut pas être supprimé.";
  if (!CATS.some((c) => c[0] === id)) return "Rayon introuvable.";
  if (vers === id || !CATS.some((c) => c[0] === vers))
    return "Choisis le rayon qui reçoit les produits.";
  for (const k of Object.keys(ING)) {
    if (catOf(k) !== id) continue;
    if (vers === (CAT0[k] || "aut")) delete S.cat[k];
    else S.cat[k] = vers;
  }
  CATS.splice(
    CATS.findIndex((c) => c[0] === id),
    1
  );
  memoriserRayons();
  return "";
}
