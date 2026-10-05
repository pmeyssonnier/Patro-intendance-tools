/* Intendance PSS – Catalogue de prix : saisie et import de produits (CSV / texte).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Minuscules et sans accents, pour que « cereales » trouve « Céréales ». */
const plain = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function drawCat() {
  const q = plain($("cfilt").value.trim());
  const keys = Object.keys(ING).filter(
    (k) => !S.hid.includes(k) && (!q || plain(ING[k][0] + " " + (S.pn[k] || "")).includes(q))
  );
  $("ct").innerHTML =
    keys
      .map(
        (k) =>
          `<tr><td>${esc(ING[k][0])}${S.pn[k] ? `<div class="s">↳ ${esc(S.pn[k])}</div>` : ""}</td><td>€/${ING[k][1] === "pc" ? "pièce" : ul(k)}</td><td><input type="number" step="0.05" min="0" value="${price(k)}" data-cp="${esc(k)}" aria-label="Prix de ${esc(ING[k][0])}"></td><td><button class="x" data-chd="${esc(k)}" title="Supprimer cet ingrédient" aria-label="Supprimer ${esc(ING[k][0])}">✕</button></td></tr>`
      )
      .join("") ||
    `<tr><td>${q ? "Aucun ingrédient ne correspond au filtre." : "Aucun ingrédient."}</td></tr>`;
}

$("cfilt").addEventListener("input", drawCat);

$("ct").addEventListener("change", (e) => {
  const k = e.target.dataset.cp;
  if (k) {
    S.prices[k] = +e.target.value || 0;
    delete S.pn[k];
    calc();
  }
});

$("ct").addEventListener("click", (e) => {
  const k = e.target.dataset.chd;
  if (!k || !confirm("Supprimer « " + ING[k][0] + " » (et le retirer des recettes) ?")) return;
  rmIng(k);
  drawRec();
  drawDietEd();
  calc();
});

$("csvx").onclick = () =>
  dl(
    "Spaghetti Boni 500g;1,39\nRiz long grain Boni 1kg;1,95\nLait demi-écrémé 1L;1,05\nHaché pur bœuf 500g;4,99\nJambon cuit 4 tranches 200g;2,89\n",
    "exemple-prix.csv",
    "text/csv"
  );

let pendingJson = null; // prix JSON lus, appliqués au clic sur « Importer »

/** Lit un JSON de prix (format Colruyt) : renvoie { lignes: [[id, prix, nom]], ignores, date, source } ou null. */
function parsePrixJson(txt) {
  let j;
  try {
    j = JSON.parse(txt.replace(/^\uFEFF/, ""));
  } catch (e) {
    return null;
  }
  if (!j || typeof j.ingredients !== "object" || j.ingredients === null) return null;
  const unit = { g: "kg", ml: "l", pc: "piece" };
  const lignes = [];
  let ignores = 0;
  for (const k in j.ingredients) {
    const x = j.ingredients[k],
      p = x && +x.prix_unitaire;
    if (!ING[k] || !(p > 0) || String(x.unite).toLowerCase() !== unit[ING[k][1]]) {
      ignores++;
      continue;
    }
    const pr = x.produit || {};
    lignes.push([k, +p.toFixed(2), [pr.marque, pr.nom].filter(Boolean).join(" ")]);
  }
  return {
    lignes,
    ignores,
    date: String(j.date_maj || "").slice(0, 10),
    source: j.source || "JSON",
  };
}

$("csv").addEventListener("input", () => {
  pendingJson = null;
});

$("file").onchange = (e) => {
  const f = e.target.files[0];
  $("fname").textContent = f ? f.name : "Aucun fichier choisi";
  if (f) {
    const r = new FileReader();
    r.onload = () => {
      pendingJson = null;
      const pj = /\.json$/i.test(f.name) ? parsePrixJson(r.result) : null;
      if (/\.json$/i.test(f.name) && !pj) {
        $("csv").value = "";
        $("impmsg").textContent =
          "Fichier JSON de prix non reconnu (clé « ingredients » attendue).";
        return;
      }
      if (!pj) {
        $("csv").value = r.result;
        return;
      }
      pendingJson = pj;
      $("csv").value = pj.lignes
        .map(
          (l) =>
            `${ING[l[0]][0]} : ${price(l[0]).toFixed(2)} → ${l[1].toFixed(2)} €/${ING[l[0]][1] === "pc" ? "pièce" : ul(l[0])}`
        )
        .join("\n");
      const d = pj.date.split("-").reverse().join("/");
      $("impmsg").textContent =
        `${pj.source}${d ? ", " + d : ""} : ${pj.lignes.length} prix prêts` +
        (pj.ignores ? ` (${pj.ignores} ignorés)` : "") +
        ". Vérifie l'aperçu puis clique sur « Importer ».";
    };
    r.readAsText(f);
  }
};

const EXCL = {
  lait: "coco|riz au|chocolat|sans lactose",
  riz: "au lait|galette|soufflé",
  pain: "épice|sans gluten|grillé|burger",
  beu: "cacahu|arachide",
  suc: "sans sucre|glace|vanill",
  fro: "sans lactose",
  pates: "sans gluten|tartiner",
  hache: "dinde|halal|végétari",
  poulet: "halal|végétari",
  sauc: "halal|végétari",
  jam: "dinde|halal",
};

function perUnit(name, p) {
  const m = name.match(/(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|ml)\b/i);
  if (!m) return null;
  const q =
    (m[1] ? +m[1] : 1) *
    parseFloat(m[2].replace(",", ".")) *
    { kg: 1000, g: 1, l: 1000, cl: 10, ml: 1 }[m[3].toLowerCase()];
  return q ? (p / q) * 1000 : null;
}

$("imp").onclick = () => {
  if (pendingJson) {
    const pj = pendingJson;
    pendingJson = null;
    pj.lignes.forEach(([k, p, n]) => {
      S.prices[k] = p;
      if (n) S.pn[k] = n;
      else delete S.pn[k];
    });
    const d = pj.date.split("-").reverse().join("/");
    $("impmsg").textContent =
      `${pj.lignes.length} prix chargés (${pj.source}${d ? ", " + d : ""}).` +
      (pj.ignores ? ` ${pj.ignores} ignorés.` : "");
    calc();
    return;
  }
  const items = [];
  $("csv")
    .value.split(/\r?\n/)
    .forEach((l) => {
      const m = l.match(/^(.*?)[;\t,]\s*"?€?\s*(\d+(?:[.,]\d+)?)"?\s*€?\s*$/);
      if (m) {
        const n = m[1].replace(/"/g, "").trim(),
          p = parseFloat(m[2].replace(",", ".")),
          u = perUnit(n, p);
        items.push([n, u ?? p, u != null]);
      }
    });
  let hit = 0;
  for (const k in ING) {
    const re = new RegExp(ING[k][3], "i"),
      ex = EXCL[k] ? new RegExp(EXCL[k], "i") : null;
    const c = items
      .filter((i) => re.test(i[0]) && !(ex && ex.test(i[0])))
      .sort((a, b) => a[1] - b[1])[0];
    if (c) {
      S.prices[k] = +c[1].toFixed(2);
      S.pn[k] = c[0] + (c[2] ? " (→ €/kg ou €/L calculé)" : " (prix pris tel quel)");
      hit++;
    }
  }
  $("impmsg").textContent =
    `${items.length} produits lus, ${hit} ingrédients reliés. Vérifie les ↳ dans les tableaux.`;
  calc();
};
