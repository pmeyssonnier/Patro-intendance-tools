/* Intendance PSS – Documents imprimables et partageables : menu, liste de courses, recettes, textes, exports CSV (Excel).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Adaptations (régimes) d'un plat à un repas : le texte choisi par l'utilisateur s'il existe (vide = aucune ligne), sinon le texte automatique. */
function adapteMenu(i, k, r) {
  const o = C.adn || {},
    cle = i + "|" + k + "|" + r;
  if (Object.hasOwn(o, cle)) return o[cle] ? [o[cle]] : [];
  return meal(r, presents(i, k)).adapt;
}

/** `edit` : version de l'aperçu à l'écran, avec le crayon pour modifier le texte des adaptations de chaque plat. */
function menuHTML(edit = false) {
  const dsc = +S.md,
    adp = +S.ma;
  let rows = "";
  days().forEach((d, i) => {
    rows += `<tr class="day"><td colspan="${dsc ? 3 : 2}">${esc(dlab(d))}</td></tr>`;
    dtypes(i).forEach(({ k, n: lab }) => {
      const rs = slotArr(i, k);
      const dishes = rs.length
        ? rs
            .map((r, idx) => {
              const ad = adp ? adapteMenu(i, k, r) : [];
              const ligne = ad.length ? `<div class="ad">${esc(ad.join(" · "))}</div>` : "";
              return `<div><b>${esc(r)}</b>${edit && adp ? adLigne(i, k, idx, r, ad) : ligne}</div>`;
            })
            .join("")
        : '<span class="ad">–</span>';
      const ds = dsc
        ? `<td>${rs
            .map((r) => fmtDesc(S.rec[r] ? S.rec[r].desc : ""))
            .filter(Boolean)
            .join("<br>")}</td>`
        : "";
      rows += `<tr class="sl" style="${cvars(C.col[k])}"><td class="sn">${esc(lab)}<div class="ad">${nbPres(i, k)} pers.</div></td><td>${dishes}</td>${ds}</tr>`;
    });
  });
  return `<div class="mp pvx"><h2>${esc(C.mt || "Menu")}</h2><div class="s">${esc(C.name)} · ${fdate(C.start)} → ${fdate(C.end)} · ${nn()} personnes · ${esc(troop())}</div><table class="mt"><thead><tr><th>Repas</th><th>Au menu</th>${dsc ? "<th>Description</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** Cellule « Produit Colruyt » : libellé du produit retenu, lié à sa fiche, et l'adresse en clair (utile sur papier) ; vide si ni l'un ni l'autre. */
function produitColruytHTML(k) {
  const lien = lienColruyt(S.url[k]),
    nom = prodName(k);
  if (!lien) return esc(nom);
  return `<a href="${esc(lien)}">${esc(nom || "Fiche produit")}</a><div class="ad">${esc(lien)}</div>`;
}

function listHTML() {
  const rows = parRayon(LAST.keys)
    .map(
      ([nom, l]) =>
        (nom ? `<tr><td colspan="6"><b>${esc(nom)}</b></td></tr>` : "") +
        l
          .map((k) => {
            const c = (LAST.tot[k] / per(k)) * price(k);
            return `<tr><td class="ck">☐</td><td>${esc(ING[k][0])}</td><td>${produitColruytHTML(k)}</td><td>${qty(k, LAST.tot[k])}</td><td>${price(k) ? eur(price(k)) + "/" + ul(k) : "–"}</td><td>${eur(c)}</td></tr>`;
          })
          .join("")
    )
    .join("");
  return `<div class="mp pvx" style="${cvars()}"><h2>Liste de courses</h2><div class="s">${esc(troop())} · ${nn()} personnes · ${filled()} repas · ${new Date().toLocaleDateString("fr-BE")}</div><table class="mt"><thead><tr><th></th><th>Produit</th><th>Produit Colruyt</th><th>Quantité</th><th>Prix</th><th>Coût</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Aucun repas</td></tr>'}</tbody></table><p><b>Total : ${eur(LAST.sum)}</b>${nn() ? " · par personne : " + eur(LAST.sum / nn()) : ""}</p></div>`;
}

/** Ingrédients du catalogue de prix, dans l'ordre de la page, sans ceux que l'utilisateur a masqués. */
const catKeys = () => Object.keys(ING).filter((k) => !S.hid.includes(k));

/** Nom du produit retenu (« ↳ » du catalogue), sans la note technique ajoutée par l'import de texte. */
const prodName = (k) =>
  nomProduit(S.pn[k] || "").replace(/ \((?:→ €\/kg ou €\/L calculé|prix pris tel quel)\)$/, "");

const priceUnit = (k) => (ING[k][1] === "pc" ? "pièce" : ul(k));

function pricesHTML() {
  const rows = catKeys()
    .map(
      (k) =>
        `<tr><td>${esc(ING[k][0])}</td><td>${lienColruyt(S.url[k]) ? `<a href="${esc(S.url[k])}">${esc(prodName(k) || "Fiche produit")}</a>` : esc(prodName(k))}</td><td>${price(k) ? eur(price(k)) + "/" + priceUnit(k) : "–"}</td></tr>`
    )
    .join("");
  return `<div class="mp pvx" style="${cvars()}"><h2>Catalogue de prix – prix des ingrédients</h2><div class="s">${esc(troop())} · ${new Date().toLocaleDateString("fr-BE")}</div><table class="mt"><thead><tr><th>Ingrédient</th><th>Produit retenu</th><th>Prix</th></tr></thead><tbody>${rows || '<tr><td colspan="3">Aucun ingrédient</td></tr>'}</tbody></table></div>`;
}

function recHTML(names) {
  return (
    `<div class="mp pvx" style="${cvars()}"><h2>Recettes</h2>` +
    (names
      .map((n) => {
        const R = S.rec[n];
        return `<h3 style="margin:16px 0 2px;break-after:avoid">${esc(n)}</h3>${R.tags && R.tags.length ? `<div class="s">Types et thèmes : ${esc(R.tags.join(" · "))}</div>` : ""}<div class="s">${fmtDesc(R.desc)}</div><table class="mt"><thead><tr><th>Ingrédient</th>${SEC.map((s) => `<th>${esc(s[0])}</th>`).join("")}</tr></thead><tbody>${Object.entries(
          R.ing
        )
          .map(
            ([k, q]) =>
              `<tr><td>${esc(ING[k][0])} (${ING[k][1]})</td>${R.fx && k in R.fx ? `<td colspan="${SEC.length}"><b>${qty(k, R.fx[k])}</b> au total</td>` : q.map((v) => `<td>${v}</td>`).join("")}</tr>`
          )
          .join("")}</tbody></table>`;
      })
      .join("") || "<p>Aucune recette.</p>") +
    `<p class="s">Quantités par personne, sauf mention « au total ».</p></div>`
  );
}

/** Ligne de la liste de courses en texte : quantité, prix, coût, puis le produit Colruyt et son adresse en dessous (si connus). */
function ligneListeTexte(k) {
  const lien = lienColruyt(S.url[k]),
    nom = prodName(k),
    cout = (LAST.tot[k] / per(k)) * price(k);
  return (
    "☐ " +
    ING[k][0] +
    " : " +
    qty(k, LAST.tot[k]) +
    " · " +
    (price(k) ? eur(price(k)) + "/" + ul(k) + " · " + eur(cout) : "prix manquant") +
    (nom ? "\n   Colruyt : " + nom : "") +
    (lien ? "\n   " + lien : "")
  );
}

const txtList = () =>
  "🛒 Liste de courses – " +
  troop() +
  " (" +
  nn() +
  " pers.)\n\n" +
  (parRayon(LAST.keys)
    .map(
      ([nom, l]) => (nom ? "\n" + nom.toUpperCase() + "\n" : "") + l.map(ligneListeTexte).join("\n")
    )
    .join("\n")
    .trim() || "(vide)") +
  "\n\nTotal estimé : " +
  eur(LAST.sum);

const txtPrices = () =>
  "🏷️ Catalogue de prix – " +
  troop() +
  "\n\n" +
  (catKeys()
    .map(
      (k) =>
        "- " +
        ING[k][0] +
        " : " +
        (price(k) ? eur(price(k)) + "/" + priceUnit(k) : "prix manquant") +
        (prodName(k) ? " (" + prodName(k) + ")" : "")
    )
    .join("\n") || "(vide)");

/** Lignes d'un repas en texte : « • Midi : plat + plat », puis, sous chaque plat, sa description et ses adaptations si les cases du menu sont cochées. */
function lignesRepasTexte(i, k, lab) {
  const rs = slotArr(i, k);
  if (!rs.length) return "";
  const plus = rs.flatMap((r) => {
    const d = +S.md && S.rec[r] ? descTexte(S.rec[r].desc) : "",
      ad = +S.ma ? adapteMenu(i, k, r).join(" · ") : "";
    return [
      d && "     " + r + " : " + d.replace(/\n+/g, " "),
      ad && "     " + r + " – adaptations : " + ad,
    ].filter(Boolean);
  });
  return ["  • " + lab + " : " + rs.join(" + "), ...plus].join("\n");
}

const txtMenu = () =>
  "🍽️ " +
  (C.mt || "Menu") +
  " – " +
  C.name +
  " (" +
  fdate(C.start) +
  " → " +
  fdate(C.end) +
  ")\n\n" +
  days()
    .map(
      (d, i) =>
        dlab(d) +
        "\n" +
        dtypes(i)
          .map(({ k, n: lab }) => lignesRepasTexte(i, k, lab))
          .filter(Boolean)
          .join("\n")
    )
    .join("\n\n");

const txtRec = (n) => {
  const R = S.rec[n];
  return R
    ? "📖 " +
        n +
        "\n" +
        (R.tags && R.tags.length ? "Types : " + R.tags.join(", ") + "\n" : "") +
        (R.desc ? descTexte(R.desc) + "\n" : "") +
        "Par personne (" +
        SEC.map((s) => s[0]).join(" / ") +
        ") :\n" +
        Object.entries(R.ing)
          .map(
            ([k, q]) =>
              "- " +
              ING[k][0] +
              " : " +
              (R.fx && k in R.fx ? qty(k, R.fx[k]) + " au total" : q.join(" / ") + " " + ING[k][1])
          )
          .join("\n")
    : "";
};

const cs = (v) => {
  let s = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const cn = (v, d) => (+v).toFixed(d == null ? 2 : d).replace(".", ","),
  cq = (v) => String(v).replace(".", ",");

const csvOut = (rows) => "\uFEFF" + rows.map((r) => r.map(cs).join(";")).join("\r\n") + "\r\n";

const qparts = (k, q) => {
  const u = ING[k][1];
  if (u === "pc") return [String(ceilp(q)), "pc"];
  return q >= 1000 ? [cn(q / 1000), u === "ml" ? "L" : "kg"] : [String(Math.round(q)), u];
};

function csvList() {
  const r = [
      [
        "Produit",
        "Quantité",
        "Unité",
        "Prix unitaire (€)",
        "Prix par",
        "Coût (€)",
        "Remarque",
        "Rayon",
        "Lien produit",
      ],
    ],
    n = nn();
  LAST.keys.forEach((k) => {
    const [q, u] = qparts(k, LAST.tot[k]);
    r.push([
      ING[k][0],
      q,
      u,
      cn(price(k)),
      ul(k),
      cn((LAST.tot[k] / per(k)) * price(k)),
      price(k) ? "" : "prix manquant",
      CATS.find((c) => c[0] === catOf(k))[1],
      lienColruyt(S.url[k]),
    ]);
  });
  r.push([]);
  r.push(["TOTAL", "", "", "", "", cn(LAST.sum), "", "", ""]);
  if (n) r.push(["Par personne", "", "", "", "", cn(LAST.sum / n), "", "", ""]);
  r.push([]);
  r.push(["Camp", C.name]);
  r.push(["Dates", fdate(C.start) + " → " + fdate(C.end)]);
  r.push(["Personnes", n]);
  return csvOut(r);
}

function csvPrices() {
  const r = [
    [
      "Ingrédient",
      "Produit retenu",
      "Unité du prix",
      "Prix (€)",
      "Remarque",
      "Rayon",
      "Lien produit",
    ],
  ];
  catKeys().forEach((k) =>
    r.push([
      ING[k][0],
      prodName(k),
      priceUnit(k),
      cn(price(k)),
      price(k) ? "" : "prix manquant",
      CATS.find((c) => c[0] === catOf(k))[1],
      lienColruyt(S.url[k]),
    ])
  );
  r.push([]);
  r.push(["Troupe", troop()]);
  r.push(["Date", fdate(iso(new Date()))]);
  return csvOut(r);
}

function csvMenu() {
  const r = [["Date", "Jour", "Repas", "Plat", "Description", "Adaptations (régimes)"]];
  days().forEach((d, i) =>
    dtypes(i).forEach((t) =>
      slotArr(i, t.k).forEach((x) => {
        const R = S.rec[x];
        r.push([
          dd2(d) + "/" + d.getFullYear(),
          WD[d.getDay()],
          t.n,
          x,
          R ? descTexte(R.desc) : "",
          adapteMenu(i, t.k, x).join(" | "),
        ]);
      })
    )
  );
  return csvOut(r);
}

function csvRec(names) {
  const r = [
    [
      "Recette",
      "Types et thèmes",
      "Ingrédient",
      "Unité",
      ...SEC.map((s) => s[0] + " (par personne)"),
      "Quantité totale (si unique)",
    ],
  ];
  names.forEach((n) => {
    const R = S.rec[n];
    if (!R) return;
    for (const [k, q] of Object.entries(R.ing)) {
      const fx = R.fx && k in R.fx;
      r.push([
        n,
        (R.tags || []).join(" | "),
        ING[k][0],
        ING[k][1],
        ...(fx ? ["", "", "", ""] : q.map(cq)),
        fx ? cq(R.fx[k]) : "",
      ]);
    }
  });
  return csvOut(r);
}

const slug = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "export";

const csvName = (t) => slug(t) + "-" + slug(C.name) + "-" + iso(new Date()) + ".csv",
  dlCsv = (t, txt) => dl(txt, csvName(t), "text/csv;charset=utf-8");
