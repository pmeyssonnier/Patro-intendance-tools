/* Intendance PSS – Calcul des quantités d'un plat (effectifs, marge, régimes, quantités uniques).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Quantités et adaptations d’un plat ; pres = présents par section à ce repas (null = toute la troupe). */
function meal(d, pres = null) {
  const R = S.rec[d],
    out = {},
    adapt = [];
  if (!R) return { out, adapt };
  const m = 1 + C.wa / 100,
    // part de chaque section présente (1 = tout le monde) et de la troupe entière
    r = SEC.map((_, i) => (pres && C.n[i] ? pres[i] / C.n[i] : 1)),
    f = pres && nn() ? pres.reduce((a, b) => a + b, 0) / nn() : 1;
  for (const [k, q] of Object.entries(R.ing)) {
    const fixed = R.fx && k in R.fx,
      N = nn();
    if (fixed && (!N || (R.fa && R.fa[k] === 0))) {
      out[k] = (out[k] || 0) + R.fx[k] * f;
      continue;
    }
    const qq = fixed ? SEC.map(() => R.fx[k] / N) : q,
      mm = fixed ? 1 : m;
    for (let i = 0; i < SEC.length; i++) {
      let rest = pres ? pres[i] : C.n[i];
      for (const dk in DIETS) {
        const e = DIETS[dk].ex;
        if (!(k in e)) continue;
        const p = Math.min(rest, ((C.dt[dk] || [])[i] || 0) * r[i]);
        rest -= p;
        const sb = e[k];
        if (sb) out[sb] = (out[sb] || 0) + p * qq[i] * mm;
      }
      out[k] = (out[k] || 0) + rest * qq[i] * mm;
    }
  }
  for (const dk in DIETS) {
    const P = (C.dt[dk] || []).reduce((a, b, i) => a + b * r[i], 0);
    if (!P) continue;
    const t = Object.keys(R.ing)
      .filter(
        (k) => k in DIETS[dk].ex && !(R.fx && k in R.fx && (!nn() || (R.fa && R.fa[k] === 0)))
      )
      .map((k) => ING[k][0] + " → " + (DIETS[dk].ex[k] ? ING[DIETS[dk].ex[k]][0] : "retirer"));
    if (t.length)
      adapt.push(DIETS[dk].n + " ×" + Math.max(1, Math.round(P)) + " : " + t.join(", "));
  }
  return { out, adapt };
}
