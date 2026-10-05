/* Intendance PSS – Liste de courses et budget : calcul global (calc) et affichage.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

let LAST = { keys: [], tot: {}, sum: 0, pm: [] };

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
  $("list").innerHTML =
    keys
      .map((k) => {
        const c = (tot[k] / per(k)) * price(k);
        sum += c;
        return `<tr><td>${esc(ING[k][0])}${price(k) ? "" : '<div class="s" style="color:#d33">⚠ prix manquant</div>'}${S.pn[k] ? `<div class="s">↳ ${esc(S.pn[k])}</div>` : ""}</td><td>${qty(k, tot[k])}</td><td><input type="number" step="0.05" min="0" value="${price(k)}" class="${price(k) ? "" : "nop"}" data-p="${esc(k)}" aria-label="Prix de ${esc(ING[k][0])}"></td><td>${eur(c)}</td></tr>`;
      })
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

$("list").addEventListener("change", (e) => {
  const k = e.target.dataset.p;
  if (k) {
    S.prices[k] = +e.target.value || 0;
    delete S.pn[k];
    calc();
  }
});
