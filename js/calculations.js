/* Intendance PSS – Calcul des quantités d'un plat (effectifs, marge, régimes, quantités uniques).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

function meal(d) {
  const R = S.rec[d],
    out = {},
    adapt = [];
  if (!R) return { out, adapt };
  const m = 1 + C.wa / 100;
  for (const [k, q] of Object.entries(R.ing)) {
    const fixed = R.fx && k in R.fx,
      N = nn();
    if (fixed && (!N || (R.fa && R.fa[k] === 0))) {
      out[k] = (out[k] || 0) + R.fx[k];
      continue;
    }
    const qq = fixed ? [0, 1, 2, 3].map(() => R.fx[k] / N) : q,
      mm = fixed ? 1 : m;
    for (let i = 0; i < 4; i++) {
      let rest = C.n[i];
      for (const dk in DIETS) {
        const e = DIETS[dk].ex;
        if (!(k in e)) continue;
        const p = Math.min(rest, (C.dt[dk] || [])[i] || 0);
        rest -= p;
        const sb = e[k];
        if (sb) out[sb] = (out[sb] || 0) + p * qq[i] * mm;
      }
      out[k] = (out[k] || 0) + rest * qq[i] * mm;
    }
  }
  for (const dk in DIETS) {
    const P = (C.dt[dk] || []).reduce((a, b) => a + b, 0);
    if (!P) continue;
    const t = Object.keys(R.ing)
      .filter(
        (k) => k in DIETS[dk].ex && !(R.fx && k in R.fx && (!nn() || (R.fa && R.fa[k] === 0)))
      )
      .map((k) => ING[k][0] + " → " + (DIETS[dk].ex[k] ? ING[DIETS[dk].ex[k]][0] : "retirer"));
    if (t.length) adapt.push(DIETS[dk].n + " ×" + P + " : " + t.join(", "));
  }
  return { out, adapt };
}
