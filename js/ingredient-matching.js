/* Intendance PSS – Comparaison de noms d'ingrédients : trouver les doublons et les correspondances.
   Données seulement (aucun élément de la page). Script classique : voir l'ordre de chargement dans index.html. */

/** Minuscules et sans accents, pour que « cereales » trouve « Céréales ». */
const plain = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Mots significatifs d'un nom, sans accents ni majuscules ni pluriel : « Pâtes à tartiner » et « pate a tartiner » donnent {pate, tartiner}. */
const motsNom = (t) =>
  new Set(
    plain(t)
      .split(/[^a-z0-9]+/)
      .filter((m) => m.length > 2 && !["des", "les", "aux", "une", "pour"].includes(m))
      .map((m) => (m.length > 3 ? m.replace(/[sx]$/, "") : m))
  );

/** Clé de comparaison d'un nom d'ingrédient : « Pâtes », « pate » et « PÂTE » donnent la même. */
const cleNom = (t) => [...motsNom(t)].sort().join(" ") || plain(t);

/** Ingrédients visibles de même nom (accents, majuscules et pluriel ignorés) : `exact` ont aussi la même unité, `autre` une unité différente. */
function doublonsNom(nom, unite) {
  const c = cleNom(nom),
    memeNom = Object.keys(ING).filter(
      (k) => !S.hid.includes(k) && !ING[k][4] && cleNom(ING[k][0]) === c
    );
  return {
    exact: memeNom.filter((k) => ING[k][1] === unite),
    autre: memeNom.filter((k) => ING[k][1] !== unite),
  };
}

/** Ingrédient du catalogue qui correspond à un nom (« poivron rouge » → « Poivrons »), ou null si aucun ou si plusieurs se valent. */
function ingParNom(nom, exclus, unite) {
  const B = motsNom(nom);
  if (!B.size) return null;
  let best = null,
    score = 0,
    ex = false;
  for (const k of Object.keys(ING)) {
    if (
      S.hid.includes(k) ||
      exclus.has(k) ||
      unite !== { g: "kg", ml: "l", pc: "piece" }[ING[k][1]]
    )
      continue;
    const A = motsNom(ING[k][0]),
      inter = [...A].filter((m) => B.has(m)).length;
    // tous les mots de l'un doivent figurer dans l'autre ; le plus proche l'emporte
    if (!A.size || (inter < A.size && inter < B.size)) continue;
    const sc = inter / Math.max(A.size, B.size);
    if (sc > score) {
      best = k;
      score = sc;
      ex = false;
    } else if (sc === score) ex = true;
  }
  return ex ? null : best;
}
