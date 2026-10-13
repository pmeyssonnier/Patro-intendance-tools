/* Intendance PSS – Calcul des quantités d'un plat (effectifs, marge, régimes).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Quantités et adaptations d’un plat ; pres = présents par section à ce repas (null = toute la troupe). */
function meal(d, pres = null) {
  const R = S.rec[d],
    out = {},
    adapt = [];
  if (!R) return { out, adapt };
  const m = 1 + C.wa / 100,
    // part de chaque section présente (1 = tout le monde) et de la troupe entière
    r = SEC.map((_, i) => (pres && C.n[i] ? pres[i] / C.n[i] : 1));
  for (const [k, q] of Object.entries(R.ing)) {
    for (let i = 0; i < SEC.length; i++) {
      let rest = pres ? pres[i] : C.n[i];
      for (const dk in DIETS) {
        const e = DIETS[dk].ex;
        if (!(k in e)) continue;
        const p = Math.min(rest, ((C.dt[dk] || [])[i] || 0) * r[i]);
        rest -= p;
        const sb = e[k];
        if (sb) out[sb] = (out[sb] || 0) + p * q[i] * m;
      }
      out[k] = (out[k] || 0) + rest * q[i] * m;
    }
  }
  for (const dk in DIETS) {
    const P = (C.dt[dk] || []).reduce((a, b, i) => a + b * r[i], 0);
    if (!P) continue;
    const t = Object.keys(R.ing)
      .filter((k) => k in DIETS[dk].ex)
      .map((k) => ING[k][0] + " → " + (DIETS[dk].ex[k] ? ING[DIETS[dk].ex[k]][0] : "retirer"));
    if (t.length)
      adapt.push(DIETS[dk].n + " ×" + Math.max(1, Math.round(P)) + " : " + t.join(", "));
  }
  return { out, adapt };
}
