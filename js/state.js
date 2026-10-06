/* Intendance PSS – État de l'application : camps (dates, jours, repas), migration des anciennes données, nettoyage au chargement.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

// Sections : celles de la Configuration (S.sec), sinon celles par défaut. SEC est modifié sur place.
if (Array.isArray(S.sec) && S.sec.length) SEC.splice(0, SEC.length, ...S.sec);

S.sec = SEC;

const SL = [
    ["m", "Matin"],
    ["d", "Midi"],
    ["s", "Soir"],
  ],
  DEFT = () => SL.map(([k, n]) => ({ k, n })),
  SCOL = { m: "#e08a00", d: "#1f7a3f", s: "#2c6fbb" },
  WD = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const iso = (d) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");

const pISO = (s) =>
  dateReelle(s) ? new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) : null;

const dd2 = (d) =>
  String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");

const dlab = (d) => WD[d.getDay()] + " " + dd2(d),
  fdate = (s) => {
    const d = pISO(s);
    return d ? dd2(d) + "/" + d.getFullYear() : "?";
  };

function nextDow(w) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  do d.setDate(d.getDate() + 1);
  while (d.getDay() !== w);
  d.setHours(0, 0, 0, 0);
  return d;
}

function mkCamp(name, o) {
  const s = nextDow(5),
    e = new Date(s);
  e.setDate(e.getDate() + 2);
  return Object.assign(
    {
      name,
      start: iso(s),
      end: iso(e),
      n: SEC.map(() => 0),
      wa: 10,
      dt: {},
      notes: "",
      menu: {},
      types: DEFT(),
      off: {},
      col: { ...SCOL },
      mt: "Menu du camp",
    },
    o || {}
  );
}

function legacyCamp(o) {
  const rows = (o.meals || []).map(([l, r]) => {
    const t = String(l).toLowerCase();
    return {
      d: WD.map((x) => x.toLowerCase()).indexOf(t.split(/\s+/)[0]),
      s: /matin|petit/.test(t) ? "m" : /midi|déjeuner|dejeuner|dîner|diner/.test(t) ? "d" : "s",
      r,
    };
  });
  const f = rows.find((x) => x.d >= 0),
    d0 = f ? f.d : 5;
  let max = 0;
  const menu = {};
  rows.forEach((x) => {
    const off = x.d >= 0 ? (x.d - d0 + 7) % 7 : 0;
    max = Math.max(max, off);
    const dm = (menu[off] = menu[off] || {});
    (dm[x.s] = dm[x.s] || []).push(x.r);
  });
  const s = nextDow(d0),
    e = new Date(s);
  e.setDate(e.getDate() + max);
  return mkCamp("Mon camp", {
    start: iso(s),
    end: iso(e),
    n: o.n || [10, 8, 6, 6],
    wa: o.wa ?? 10,
    dt: o.dt || {},
    notes: o.notes || "",
    menu,
    mt: o.mt || "Menu du camp",
  });
}

if (!S.camps || typeof S.camps !== "object" || !Object.keys(S.camps).length) {
  const k = "k_" + Date.now().toString(36);
  S.camps = { [k]: legacyCamp(S) };
  S.ccur = k;
}

["n", "wa", "dt", "notes", "meals", "mc", "mt"].forEach((k) => delete S[k]);

if (!S.camps[S.ccur]) S.ccur = Object.keys(S.camps)[0];

let C = S.camps[S.ccur];

function days() {
  const s = pISO(C.start) || new Date(),
    e = pISO(C.end) || s,
    o = [];
  for (const d = new Date(s); d <= e && o.length < 31; d.setDate(d.getDate() + 1))
    o.push(new Date(d));
  return o.length ? o : [s];
}

const hid = (i, k) => ((C.off || {})[i] || []).includes(k),
  dtypes = (i) => C.types.filter((t) => !hid(i, t.k));

const slotArr = (i, k) => (C.menu[i] || {})[k] || [];

function mealList() {
  const o = [];
  days().forEach((d, i) =>
    dtypes(i).forEach((t) =>
      slotArr(i, t.k).forEach((r) => o.push([dlab(d) + " · " + t.n, r, i, t.k]))
    )
  );
  return o;
}

const filled = () => {
  let n = 0;
  days().forEach((d, i) =>
    dtypes(i).forEach((t) => {
      if (slotArr(i, t.k).length) n++;
    })
  );
  return n;
};

const usedIn = (nm) =>
  Object.values(S.camps).reduce(
    (a, c) =>
      a +
      Object.values(c.menu).reduce(
        (b, dm) =>
          b + Object.values(dm).reduce((x, arr) => x + arr.filter((r) => r === nm).length, 0),
        0
      ),
    0
  );

if (!S.cust) S.cust = {};

if (!Array.isArray(S.hid)) S.hid = [];

/** Nom et unité d'origine des ingrédients de base (avant les modifications de S.ov). */
const ING0 = {};
for (const k in ING) ING0[k] = [ING[k][0], ING[k][1]];

for (const k in S.cust) {
  ING[k] = S.cust[k];
  if (!S.dd)
    (S.cust[k][5] || []).forEach((d) => {
      if (DIETS[d]) DIETS[d].ex[k] = null;
    });
}

if (!S.ov || typeof S.ov !== "object") S.ov = {};

if (!S.cat || typeof S.cat !== "object") S.cat = {};

/** Rayon d'un ingrédient (clé de CATS) : celui choisi, sinon le rayon par défaut des ingrédients de base, sinon « Autre ». */
const catOf = (k) => S.cat[k] || CAT0[k] || "aut";

/** Options d'un choix de rayon, avec le rayon sel sélectionné. */
const optionsCat = (sel) =>
  CATS.map(
    ([c, n]) => `<option value="${c}"${c === sel ? " selected" : ""}>${esc(n)}</option>`
  ).join("");

for (const k in S.ov)
  if (ING0[k] && S.ov[k] && S.ov[k].n) {
    ING[k][0] = S.ov[k].n;
    ING[k][1] = S.ov[k].u;
  }

if (S.dd && typeof S.dd === "object") DIETS = S.dd;

(function sanitize() {
  for (const r of Object.values(S.rec)) {
    if (!r.ing) r.ing = {};
    for (const k of Object.keys(r.ing)) {
      if (!ING[k] || !Array.isArray(r.ing[k])) delete r.ing[k];
      else {
        while (r.ing[k].length < SEC.length) r.ing[k].push(0);
        r.ing[k].length = SEC.length;
      }
    }
    if (r.fx && typeof r.fx === "object") {
      for (const k of Object.keys(r.fx)) {
        if (!(k in r.ing) || !(+r.fx[k] >= 0)) delete r.fx[k];
        else r.fx[k] = +r.fx[k];
      }
    } else delete r.fx;
    if (r.fa && typeof r.fa === "object") {
      for (const k of Object.keys(r.fa)) if (!(r.fx && k in r.fx)) delete r.fa[k];
    } else delete r.fa;
  }
  for (const k of Object.keys(S.cat))
    if (!ING[k] || !CATS.some((c) => c[0] === S.cat[k])) delete S.cat[k];
  for (const d in DIETS) {
    const ex = DIETS[d].ex || (DIETS[d].ex = {});
    for (const k of Object.keys(ex)) {
      if (!ING[k]) delete ex[k];
      else if (ex[k] && !ING[ex[k]]) ex[k] = null;
    }
  }
  for (const c of Object.values(S.camps)) {
    if (typeof c.name !== "string") c.name = "Camp";
    if (!pISO(c.start)) c.start = iso(nextDow(5));
    if (!pISO(c.end) || c.end < c.start) c.end = c.start;
    c.n = SEC.map((_, i) => Math.max(0, +(Array.isArray(c.n) ? c.n : [])[i] || 0));
    c.wa = Number.isFinite(+c.wa) ? +c.wa : 10;
    if (!c.dt || typeof c.dt !== "object") c.dt = {};
    for (const k of Object.keys(c.dt))
      c.dt[k] = SEC.map((_, i) => Math.max(0, +(Array.isArray(c.dt[k]) ? c.dt[k] : [])[i] || 0));
    if (typeof c.notes !== "string") c.notes = "";
    if (typeof c.mt !== "string") c.mt = "Menu du camp";
    if (!Array.isArray(c.types)) c.types = [];
    c.types = c.types.filter((t) => t && typeof t.k === "string" && typeof t.n === "string");
    if (!c.types.length) c.types = DEFT();
    c.col = Object.assign({ ...SCOL }, c.col || {});
    for (const k in c.col) if (String(c.col[k]).toLowerCase() === "#d6457f") c.col[k] = "#c2185b";
    c.types.forEach((t, i) => {
      if (!/^#[0-9a-f]{6}$/i.test(c.col[t.k] || "")) c.col[t.k] = COLS[i % COLS.length];
    });
    if (!c.off || typeof c.off !== "object") c.off = {};
    for (const j of Object.keys(c.off))
      c.off[j] = Array.isArray(c.off[j])
        ? c.off[j].filter((k) => c.types.some((t) => t.k === k))
        : [];
    if (!c.menu || typeof c.menu !== "object") c.menu = {};
    for (const dk of Object.keys(c.menu)) {
      const dm = c.menu[dk];
      for (const k of Object.keys(dm)) {
        if (!c.types.some((t) => t.k === k)) delete dm[k];
        else dm[k] = Array.isArray(dm[k]) ? dm[k].filter((r) => S.rec[r]) : [];
      }
    }
  }
})();
