/* Intendance PSS – Liste de courses et budget : calcul global (calc) et affichage.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

let LAST = { keys: [], tot: {}, sum: 0, pm: [] };

/** Économie possible sur un ingrédient si la promotion s'applique à toute la quantité achetée (le budget garde le prix normal). */
const economie = (k, q) => {
  const x = promoDe(k);
  return x ? ((price(k) - x.p) * q) / per(k) : 0;
};

/** Ligne « 🏷️ promo » sous un ingrédient (catalogue, liste de courses) ; "" s'il n'y en a pas. */
const etiquettePromo = (k, q) => {
  const x = promoDe(k);
  if (!x) return "";
  const gain = q ? ` · économie possible ≈ ${eur(economie(k, q))}` : "";
  return `<div class="s promo">🏷️ promo : ${eur(x.p)}/${ING[k][1] === "pc" ? "pièce" : ul(k)}${x.t ? " (" + esc(x.t) + ")" : ""}${gain}</div>`;
};

/** Regroupe des ingrédients par rayon, dans l'ordre du magasin : [[nom du rayon, [clés]], …]. Un seul groupe sans titre si le regroupement est désactivé (par défaut : l'option de la liste de courses). */
function parRayon(keys, groupe = S.gl !== false) {
  if (!groupe) return [["", keys]];
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
  // articles ajoutés à la main (hors recettes) : ils comptent dans la liste et le total, pas dans le coût par repas
  for (const k in C.extra) if (ING[k]) tot[k] = (tot[k] || 0) + C.extra[k];
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
              return `<tr><td>${esc(ING[k][0])}${price(k) ? "" : '<div class="s" style="color:#d33">⚠ prix manquant</div>'}${produitLien(k)}${etiquettePromo(k, tot[k])}</td><td>${qty(k, tot[k])}</td><td><input type="number" step="0.05" min="0" value="${price(k)}" class="${price(k) ? "" : "nop"}" data-p="${esc(k)}" aria-label="Prix de ${esc(ING[k][0])}"></td><td>${eur(c)}</td></tr>`;
            })
            .join("")
      )
      .join("") || "<tr><td>Aucun repas</td></tr>";
  LAST = { keys, tot, sum, pm };
  drawExtras();
  const eco = keys.reduce((a, k) => a + economie(k, tot[k]), 0);
  $("ecow").hidden = !(eco > 0.005);
  $("eco").textContent = eur(eco);
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
    delete S.promo[k];
    delete S.url[k];
    calc();
  }
});

/* Articles hors recettes (liquide vaisselle, boissons, sacs poubelle…) : des ingrédients du catalogue, avec une quantité propre au camp (C.extra) */

/** Libellé de l'unité de saisie d'un article (le catalogue compte en g / ml / pièces, la saisie en kg / L / pièces). */
const uniteArticle = (k) => ({ g: "kg", ml: "L", pc: "pièce(s)" })[ING[k][1]];

/** Tableau des articles ajoutés au camp en cours, avec leur quantité modifiable. */
function drawExtras() {
  const ks = Object.keys(C.extra)
    .filter((k) => ING[k])
    .sort((a, b) => ING[a][0].localeCompare(ING[b][0], "fr"));
  $("xl").innerHTML = ks
    .map(
      (k) =>
        `<tr><td>${esc(ING[k][0])}</td><td class="nw"><input type="number" min="0" step="any" value="${+(C.extra[k] / fxu(k)).toFixed(3)}" data-xq="${esc(k)}" aria-label="${esc(ING[k][0])} : quantité en ${uniteArticle(k)}"> <span class="s">${uniteArticle(k)}</span></td><td><button class="x" data-xd="${esc(k)}" aria-label="Retirer ${esc(ING[k][0])} de la liste" title="Retirer de la liste">✕</button></td></tr>`
    )
    .join("");
  $("xlw").hidden = !ks.length;
}

$("xok").onclick = () => {
  const nom = $("xn").value.trim().replace(/\s+/g, " "),
    unite = $("xu").value,
    q = +$("xq").value,
    p = +$("xp").value,
    msg = (t) => ($("xm").textContent = t);
  if (!nom) return msg("Donne un nom à l'article.");
  if (!(q > 0)) return msg("Indique une quantité supérieure à 0.");
  let k = doublonsNom(nom, unite).exact[0];
  const neuf = !k;
  if (neuf) {
    k = createIng(nom, unite, "", $("xc").value);
    S.art[k] = 1;
  }
  if (p > 0) {
    S.prices[k] = p;
    delete S.pn[k];
    delete S.promo[k];
    delete S.url[k];
  }
  C.extra[k] = Math.round((C.extra[k] || 0) + q * fxu(k) * 1000) / 1000;
  $("xn").value = "";
  $("xq").value = "1";
  $("xp").value = "";
  msg(neuf ? "" : "« " + ING[k][0] + " » existe déjà dans le catalogue : repris.");
  neuf ? refreshIng() : calc();
  $("xn").focus();
};

$("xn").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("xok").click();
});

$("xl").addEventListener("change", (e) => {
  const k = e.target.dataset.xq;
  if (!k) return;
  const v = Math.max(0, +e.target.value || 0) * fxu(k);
  if (v > 0) C.extra[k] = Math.round(v * 1000) / 1000;
  else delete C.extra[k];
  calc();
});

$("xl").addEventListener("click", (e) => {
  const k = e.target.dataset.xd;
  if (!k) return;
  delete C.extra[k];
  calc();
});

$("xc").innerHTML = optionsCat("aut");
