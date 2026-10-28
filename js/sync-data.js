/* Intendance PSS – Synchronisation : découpage du projet en morceaux (catalogue du groupe + un morceau par camp) et reconstruction.
   Données seulement (aucun accès à la page ni à Firebase) : l'envoi et la réception sont dans cloud-sync.js.
   Chaque morceau est un texte JSON « stable » (clés triées) : deux appareils qui ont les mêmes données produisent le même texte,
   donc la même empreinte, et on n'envoie que ce qui a vraiment changé.
   Script classique : voir l'ordre de chargement dans index.html. */

/** Taille maximale d'un morceau envoyé (Firestore accepte 1 Mo par document). */
const SYNC_TAILLE_MAX = 900000;

/** Ce qui reste sur l'appareil : le logo, la recette ouverte et le camp ouvert ; les camps sont des morceaux à part. */
const SYNC_LOCAL = ["camps", "ccur", "logo", "cur"];

/** JSON dont les clés d'objets sont triées : le même contenu donne toujours le même texte. */
function jsonStable(v) {
  if (Array.isArray(v))
    return "[" + v.map((x) => jsonStable(x === undefined ? null : x)).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .filter((k) => v[k] !== undefined)
        .map((k) => JSON.stringify(k) + ":" + jsonStable(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}

/** Empreinte courte d'un texte (FNV-1a, 32 bits) : sert à repérer qu'un morceau a changé, pas à protéger quoi que ce soit. */
function empreinte(texte) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16) + "." + texte.length;
}

/** Clé d'un morceau : « cat » pour le catalogue du groupe, « c:identifiant » pour un camp. */
const cleCamp = (id) => "c:" + id;

/** Morceaux d'un projet nettoyé (voir cleanProject) : { cat: texte, c:id: texte, … }. */
function morceauxProjet(p) {
  const cat = {};
  for (const k of Object.keys(p)) if (!SYNC_LOCAL.includes(k)) cat[k] = p[k];
  const m = { cat: jsonStable(cat) };
  for (const [id, c] of Object.entries(p.camps || {})) m[cleCamp(id)] = jsonStable(c);
  return m;
}

/** Clés à envoyer : morceaux dont l'empreinte a changé (ou inconnue), et camps supprimés ici (à marquer supprimés là-bas). */
function morceauxAEnvoyer(morceaux, empreintes) {
  const a = [];
  for (const [k, t] of Object.entries(morceaux))
    if (empreintes[k] !== empreinte(t)) a.push({ cle: k });
  for (const k of Object.keys(empreintes))
    if (k.startsWith("c:") && !(k in morceaux)) a.push({ cle: k, supprime: true });
  return a;
}

/** Message d'erreur si un morceau est trop gros pour être envoyé, sinon "". */
function erreurTaille(morceaux) {
  for (const [k, t] of Object.entries(morceaux))
    if (t.length > SYNC_TAILLE_MAX)
      return k === "cat"
        ? "Le catalogue du groupe est trop volumineux pour être synchronisé."
        : "Un camp est trop volumineux pour être synchronisé.";
  return "";
}

/** Projet reconstruit depuis les morceaux du groupe (textes JSON). `local` : projet nettoyé de cet appareil, dont on garde le logo, la recette et le camp ouverts. */
function projetDepuisGroupe(texteCat, textesCamps, local) {
  const p = JSON.parse(texteCat);
  p.camps = {};
  for (const [id, t] of Object.entries(textesCamps)) p.camps[id] = JSON.parse(t);
  const ids = Object.keys(p.camps);
  if (local) {
    if (local.logo) p.logo = local.logo;
    if (local.cur && p.rec && Object.hasOwn(p.rec, local.cur)) p.cur = local.cur;
    if (local.ccur && Object.hasOwn(p.camps, local.ccur)) p.ccur = local.ccur;
  }
  if (!p.ccur) p.ccur = ids[0];
  return p;
}

/** Historique : au plus une version gardée toutes les 10 minutes pour un même morceau, 20 versions au maximum. */
const HISTORIQUE_PAUSE = 10 * 60 * 1000,
  HISTORIQUE_MAX = 20;

/** Faut-il garder une version du morceau `cle` maintenant ? `hs` : dernier instant de garde connu par morceau. */
const doitGarder = (hs, cle, maintenant) =>
  !hs || !hs[cle] || maintenant - hs[cle] >= HISTORIQUE_PAUSE;

/** Identifiant d'une version gardée : unique par morceau, instant et auteur (pas de doublon si on renvoie deux fois). */
const idHistorique = (cle, le, uid) =>
  cle.replace(":", "-") + "_" + le + "_" + String(uid).slice(0, 6);

/** Identifiants à supprimer pour ne garder que les `max` versions les plus récentes : liste [{ id, le }]. */
function aElaguer(versions, max = HISTORIQUE_MAX) {
  return [...versions]
    .sort((a, b) => b.le - a.le)
    .slice(max)
    .map((v) => v.id);
}
