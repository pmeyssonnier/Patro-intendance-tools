/* Intendance PSS – Liste de courses et budget : calcul global (calc) et affichage.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

let LAST = { keys: [], tot: {}, sum: 0, pm: [] };

/** Regroupe les ingrédients de la liste par rayon, dans l'ordre du magasin : [[nom du rayon, [clés]], …]. Un seul groupe sans titre si le regroupement est désactivé. */
function parRayon(keys) {
  if (S.gl === false) return [["", keys]];
  const g = [];
  for (const [c, nom] of CATS) {
    const l = keys.filter((k) => catOf(k) === c);
    if (l.length) g.push([nom, l]);
  }
  return g;
}

function calc() {
  const tot = {},
    pm = [];
  mealList().forEach(([l, d]) => {
    const r = meal(d);
    let c = 0;
    for (const k in r.out) {
      tot[k] = (tot[k] || 0) + r.out[k];
      c += (r.out[k] / per(k)) * price(k);
    }
    pm.push([l, d, c, r.adapt]);
  });
  let sum = 0;
  const keys = Object.keys(tot)
    .filter((k) => tot[k] > 0)
    .sort((a, b) => ING[a][0].localeCompare(ING[b][0], "fr"));
  // regroupée par rayon, la liste suit l'ordre des rayons (aussi dans les documents partagés, imprimés et exportés)
  const groupes = parRayon(keys);
  keys.splice(0, keys.length, ...groupes.flatMap(([, l]) => l));
  $("lgrp").checked = S.gl !== false;
  $("list").innerHTML =
    groupes
      .map(
        ([nom, l]) =>
          (nom ? `<tr class="grp"><td colspan="4"><b>${esc(nom)}</b></td></tr>` : "") +
          l
            .map((k) => {
              const c = (tot[k] / per(k)) * price(k);
              sum += c;
              return `<tr><td>${esc(ING[k][0])}${price(k) ? "" : '<div class="s" style="color:#d33">⚠ prix manquant</div>'}${S.pn[k] ? `<div class="s">↳ ${esc(nomProduit(S.pn[k]))}</div>` : ""}</td><td>${qty(k, tot[k])}</td><td><input type="number" step="0.05" min="0" value="${price(k)}" class="${price(k) ? "" : "nop"}" data-p="${esc(k)}" aria-label="Prix de ${esc(ING[k][0])}"></td><td>${eur(c)}</td></tr>`;
            })
            .join("")
      )
      .join("") || "<tr><td>Aucun repas</td></tr>";
  LAST = { keys, tot, sum, pm };
  const n = nn();
  $("tot").textContent = eur(sum);
  $("ntot").textContent = eur(sum);
  $("pp").textContent = n ? eur(sum / n) : "–";
  const miss = keys.filter((k) => !price(k)).length;
  $("np2").textContent =
    n +
    " personnes · " +
    filled() +
    " repas" +
    (miss ? " · ⚠ " + miss + " prix à renseigner (total sous-estimé)" : "");
  $("np2").style.color = miss ? "#d33" : "";
  $("pm").innerHTML = pm
    .map(
      (r) =>
        `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${eur(r[2])}</td><td class="s" style="white-space:normal">${esc(r[3].join(" · "))}</td></tr>`
    )
    .join("");
  $("mprev").innerHTML = menuHTML();
  drawCat();
  save();
}

$("lgrp").onchange = () => {
  if ($("lgrp").checked) delete S.gl;
  else S.gl = false;
  calc();
};

$("list").addEventListener("change", (e) => {
  const k = e.target.dataset.p;
  if (k) {
    S.prices[k] = +e.target.value || 0;
    delete S.pn[k];
    calc();
  }
});
