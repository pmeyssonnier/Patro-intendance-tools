/* Intendance PSS – Doublons et fusion d'ingrédients (doublons déjà utilisés dans des recettes).
   Données seulement (aucun élément de la page). Script classique : voir l'ordre de chargement dans index.html. */

/** Fusionne `src` dans `dst` : quantités des recettes additionnées, prix repris si `dst` n'en a pas, `src` supprimé. Renvoie un message d'erreur, ou "" si c'est fait. */
function fusionnerIng(src, dst) {
  if (!ING[src] || !ING[dst] || src === dst) return "Choisis deux ingrédients différents.";
  if (ING[src][1] !== ING[dst][1])
    return "Les deux ingrédients n'ont pas la même unité : change l'unité de l'un d'eux avant de les fusionner.";
  const fixe = (r, k) => !!r.fx && k in r.fx,
    total = (r, k) => (fixe(r, k) ? r.fx[k] : r.ing[k].reduce((a, q, i) => a + q * C.n[i], 0)),
    ar = (x) => Math.round(x * 1e6) / 1e6;
  const melange = Object.values(S.rec).some(
    (r) => src in r.ing && dst in r.ing && fixe(r, src) !== fixe(r, dst)
  );
  if (melange && !nn())
    return "Une recette mélange quantité unique et quantité par personne : renseigne d'abord les effectifs (page Camps).";
  for (const r of Object.values(S.rec)) {
    if (!(src in r.ing)) continue;
    if (!(dst in r.ing)) {
      r.ing[dst] = r.ing[src];
      if (fixe(r, src)) {
        r.fx[dst] = r.fx[src];
        if (r.fa && src in r.fa) r.fa[dst] = r.fa[src];
      }
    } else if (!fixe(r, src) && !fixe(r, dst)) {
      r.ing[dst] = r.ing[dst].map((v, i) => ar(v + r.ing[src][i]));
    } else {
      r.fx = r.fx || {};
      r.fx[dst] = Math.round((total(r, src) + total(r, dst)) * 100) / 100;
    }
  }
  if (!price(dst) && price(src)) {
    S.prices[dst] = price(src);
    for (const m of [S.pn, S.promo, S.url]) if (src in m) m[dst] = m[src];
  }
  for (const d in DIETS) {
    const ex = DIETS[d].ex;
    for (const x in ex) if (ex[x] === src) ex[x] = x === dst ? null : dst;
  }
  for (const c of Object.values(S.camps))
    if (src in c.extra) c.extra[dst] = (c.extra[dst] || 0) + c.extra[src];
  rmIng(src);
  return "";
}

/** Ingrédients proposés pour la fusion : même unité, les noms identiques (doublons probables) en premier. */
function candidatsFusion(k) {
  return Object.keys(ING)
    .filter((x) => x !== k && !S.hid.includes(x) && !ING[x][4] && ING[x][1] === ING[k][1])
    .sort(
      (a, b) =>
        (cleNom(ING[b][0]) === cleNom(ING[k][0])) - (cleNom(ING[a][0]) === cleNom(ING[k][0])) ||
        ING[a][0].localeCompare(ING[b][0], "fr")
    );
}

/** Groupes d'ingrédients visibles de même nom (accents, majuscules, pluriel ignorés) et de même unité. */
function groupesDoublons() {
  const g = {};
  for (const k of Object.keys(ING))
    if (!S.hid.includes(k) && !ING[k][4]) {
      const cle = cleNom(ING[k][0]) + "|" + ING[k][1];
      (g[cle] = g[cle] || []).push(k);
    }
  return Object.values(g)
    .filter((l) => l.length > 1)
    .map((l) => l.sort((a, b) => ING[a][0].localeCompare(ING[b][0], "fr")));
}

/** Noms identiques mais unités différentes : pas fusionnables tels quels. */
function doublonsUnitesDifferentes() {
  const g = {};
  for (const k of Object.keys(ING))
    if (!S.hid.includes(k) && !ING[k][4])
      (g[cleNom(ING[k][0])] = g[cleNom(ING[k][0])] || []).push(k);
  return Object.values(g).filter((l) => new Set(l.map((k) => ING[k][1])).size > 1);
}

/** Ingrédient supprimé (`src`) et ingrédient gardé (`dst`) pour une fusion entre `a` et `b` ; `inverse` garde `a` au lieu de `b`. */
function sensFusion(a, b, inverse) {
  return inverse ? { src: b, dst: a } : { src: a, dst: b };
}

/** Paires [supprimé, gardé] pour tout fusionner dans `garde`, parmi les ingrédients du groupe de doublons numéro `i`. */
function pairesDansGroupe(i, garde) {
  return (groupesDoublons()[i] || []).filter((k) => k !== garde).map((k) => [k, garde]);
}

/** Fusionne chaque paire [supprimé, gardé] ; s'arrête à la première erreur et renvoie son message ("" si tout est fait). */
function fusionnerPaires(paires) {
  for (const [s, t] of paires) {
    const err = fusionnerIng(s, t);
    if (err) return err;
  }
  return "";
}
