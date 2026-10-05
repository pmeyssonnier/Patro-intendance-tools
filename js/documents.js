/* Intendance PSS – Documents imprimables et partageables : menu, liste de courses, recettes, textes, exports CSV (Excel).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

function menuHTML() {
  const dsc = +S.md,
    adp = +S.ma;
  let rows = "";
  days().forEach((d, i) => {
    rows += `<tr class="day"><td colspan="${dsc ? 3 : 2}">${esc(dlab(d))}</td></tr>`;
    dtypes(i).forEach(({ k, n: lab }) => {
      const rs = slotArr(i, k);
      const dishes = rs.length
        ? rs
            .map((r) => {
              const ad = adp ? meal(r).adapt : [];
              return `<div><b>${esc(r)}</b>${ad.length ? `<div class="ad">${esc(ad.join(" · "))}</div>` : ""}</div>`;
            })
            .join("")
        : '<span class="ad">–</span>';
      const ds = dsc
        ? `<td>${rs
            .map((r) => esc(S.rec[r] ? S.rec[r].desc : ""))
            .filter(Boolean)
            .join("<br>")}</td>`
        : "";
      rows += `<tr class="sl" style="${cvars(C.col[k])}"><td class="sn">${esc(lab)}</td><td>${dishes}</td>${ds}</tr>`;
    });
  });
  return `<div class="mp pvx"><h2>${esc(C.mt || "Menu")}</h2><div class="s">${esc(C.name)} · ${fdate(C.start)} → ${fdate(C.end)} · ${nn()} personnes · ${esc(troop())}</div><table class="mt"><thead><tr><th>Repas</th><th>Au menu</th>${dsc ? "<th>Description</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function listHTML() {
  const rows = LAST.keys
    .map((k) => {
      const c = (LAST.tot[k] / per(k)) * price(k);
      return `<tr><td class="ck">☐</td><td>${esc(ING[k][0])}</td><td>${qty(k, LAST.tot[k])}</td><td>${price(k) ? eur(price(k)) + "/" + ul(k) : "–"}</td><td>${eur(c)}</td></tr>`;
    })
    .join("");
  return `<div class="mp pvx" style="${cvars()}"><h2>Liste de courses</h2><div class="s">${esc(troop())} · ${nn()} personnes · ${filled()} repas · ${new Date().toLocaleDateString("fr-BE")}</div><table class="mt"><thead><tr><th></th><th>Produit</th><th>Quantité</th><th>Prix</th><th>Coût</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Aucun repas</td></tr>'}</tbody></table><p><b>Total : ${eur(LAST.sum)}</b>${nn() ? " · par personne : " + eur(LAST.sum / nn()) : ""}</p></div>`;
}

function recHTML(names) {
  return (
    `<div class="mp pvx" style="${cvars()}"><h2>Recettes</h2>` +
    (names
      .map((n) => {
        const R = S.rec[n];
        return `<h3 style="margin:16px 0 2px;break-after:avoid">${esc(n)}</h3><div class="s">${esc(R.desc)}</div><table class="mt"><thead><tr><th>Ingrédient</th>${SEC.map((s) => `<th>${esc(s[0])}</th>`).join("")}</tr></thead><tbody>${Object.entries(
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

const txtList = () =>
  "🛒 Liste de courses – " +
  troop() +
  " (" +
  nn() +
  " pers.)\n\n" +
  (LAST.keys.map((k) => "☐ " + ING[k][0] + " : " + qty(k, LAST.tot[k])).join("\n") || "(vide)") +
  "\n\nTotal estimé : " +
  eur(LAST.sum);

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
          .map(({ k, n: lab }) => {
            const rs = slotArr(i, k);
            return rs.length ? "  • " + lab + " : " + rs.join(" + ") : "";
          })
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
        (R.desc ? R.desc + "\n" : "") +
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
  if (u === "pc") return [String(Math.ceil(q)), "pc"];
  return q >= 1000 ? [cn(q / 1000), u === "ml" ? "L" : "kg"] : [String(Math.round(q)), u];
};

function csvList() {
  const r = [
      ["Produit", "Quantité", "Unité", "Prix unitaire (€)", "Prix par", "Coût (€)", "Remarque"],
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
    ]);
  });
  r.push([]);
  r.push(["TOTAL", "", "", "", "", cn(LAST.sum), ""]);
  if (n) r.push(["Par personne", "", "", "", "", cn(LAST.sum / n), ""]);
  r.push([]);
  r.push(["Camp", C.name]);
  r.push(["Dates", fdate(C.start) + " → " + fdate(C.end)]);
  r.push(["Personnes", n]);
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
          R ? R.desc : "",
          meal(x).adapt.join(" | "),
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
