/* Intendance de camp – Patro Sainte-Suzanne : logique de l'application (script classique, chargé en fin de page). */
const SEC = [
  ["Benjas", "5–10 ans"],
  ["Chevaliers-Étincelles", "10–13 ans"],
  ["Conquérants-Alpines", "13–16 ans"],
  ["Animateurs", "16 ans et +"],
];
const ING = {
  pates: ["Pâtes", "g", 1.4, "spaghetti|pâtes|penne|pasta"],
  riz: ["Riz", "g", 2, "riz"],
  hache: ["Viande hachée", "g", 8.5, "haché"],
  tom: ["Tomates pelées", "g", 1.6, "tomates? pelées|concassées"],
  oig: ["Oignons", "g", 1.5, "oignon"],
  fro: ["Fromage râpé", "g", 7, "râpé"],
  poulet: ["Blanc de poulet", "g", 7.5, "poulet"],
  leg: ["Légumes", "g", 2.2, "courgette|légumes"],
  coco: ["Lait de coco", "ml", 3.5, "coco"],
  pdt: ["Pommes de terre", "g", 1.1, "pommes de terre"],
  sauc: ["Saucisses", "g", 7, "saucisse"],
  car: ["Carottes", "g", 1.2, "carotte"],
  pain: ["Pain", "g", 2.5, "pain"],
  jam: ["Jambon", "g", 12, "jambon"],
  beu: ["Beurre", "g", 9, "beurre"],
  conf: ["Confiture", "g", 3.5, "confiture"],
  cer: ["Céréales", "g", 4, "céréales|corn flakes"],
  lait: ["Lait", "ml", 1.1, "lait"],
  choc: ["Pâte à tartiner", "g", 4, "tartiner"],
  suc: ["Sucre", "g", 1.3, "sucre"],
  subveg: ["Substitut végétarien (steaks, pilons…)", "g", 9, "végétari|vegan|quorn", 1],
  hache_h: ["Viande hachée halal", "g", 11, "halal.*haché|haché.*halal", 1],
  poulet_h: ["Poulet halal", "g", 9.5, "poulet.*halal|halal.*poulet", 1],
  sauc_h: ["Saucisses halal", "g", 10, "saucisse.*halal|halal.*saucisse", 1],
  jam_h: ["Jambon de dinde halal", "g", 14, "jambon.*dinde|dinde.*jambon|halal.*jambon", 1],
  lait_sl: ["Lait sans lactose", "ml", 1.6, "lait.*sans lactose|sans lactose.*lait", 1],
  fro_sl: [
    "Fromage sans lactose",
    "g",
    9,
    "fromage.*sans lactose|sans lactose.*fromage|râpé.*sans lactose",
    1,
  ],
  margar: ["Margarine végétale", "g", 5, "margarine", 1],
  dinde: ["Dinde hachée", "g", 9, "dinde.*haché|haché.*dinde", 1],
  pates_sg: [
    "Pâtes sans gluten",
    "g",
    6,
    "pâtes.*sans gluten|sans gluten.*pâtes|spaghetti.*sans gluten",
    1,
  ],
  pain_sg: ["Pain sans gluten", "g", 8, "pain.*sans gluten|sans gluten.*pain", 1],
};
let DIETS = {
  veg: {
    n: "Végétarien",
    ex: { hache: "subveg", poulet: "subveg", sauc: "subveg", jam: "subveg" },
  },
  halal: {
    n: "Halal (sans porc, viande halal)",
    ex: { hache: "hache_h", poulet: "poulet_h", sauc: "sauc_h", jam: "jam_h" },
  },
  sl: { n: "Sans lactose", ex: { lait: "lait_sl", fro: "fro_sl", beu: "margar", choc: null } },
  sb: { n: "Sans bœuf", ex: { hache: "dinde" } },
  sg: { n: "Sans gluten", ex: { pates: "pates_sg", pain: "pain_sg", cer: null } },
  nut: { n: "Allergie fruits à coque / arachides", ex: { choc: null } },
};
const F = [0.5, 0.75, 1, 1],
  r5 = (v) => Math.max(1, Math.round(v / 5) * 5);
const mk = (d, o) => ({
  desc: d,
  ing: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, F.map((f) => r5(v * f))])),
});
const REC0 = {
  "Spaghetti bolognaise": mk(
    "Faire revenir oignons et viande, ajouter les tomates, laisser mijoter 30 min. Cuire les pâtes, servir avec le fromage râpé.",
    { pates: 100, hache: 120, tom: 150, oig: 30, fro: 15 }
  ),
  "Riz poulet curry-coco": mk(
    "Poulet en dés saisi avec oignons et légumes, lait de coco et curry, mijoter 20 min. Servir sur le riz.",
    { riz: 80, poulet: 120, leg: 150, coco: 50, oig: 20 }
  ),
  "Saucisses, purée, carottes": mk(
    "Cuire les pommes de terre, écraser avec beurre et lait. Carottes à l'eau ou poêlées, saucisses à la poêle.",
    { sauc: 150, pdt: 250, car: 150, beu: 10, lait: 30 }
  ),
  "Croque-monsieur": mk("Pain, jambon, fromage, un peu de beurre. Griller à la poêle ou au four.", {
    pain: 100,
    jam: 40,
    fro: 40,
    beu: 10,
  }),
  "Soupe de légumes + pain": mk(
    "Légumes et pommes de terre en morceaux, cuire 30 min, mixer. Servir avec du pain.",
    { leg: 250, pdt: 80, pain: 60 }
  ),
  "Petit-déjeuner": mk("Pain, beurre, confiture, pâte à tartiner, céréales et lait.", {
    pain: 100,
    beu: 10,
    conf: 20,
    cer: 30,
    lait: 200,
    choc: 15,
  }),
  "Riz au lait (dessert)": mk(
    "Cuire le riz dans le lait sucré à feu doux en remuant, environ 40 min.",
    { lait: 250, riz: 30, suc: 20 }
  ),
};
const CN = {
  "#1f7a3f": "vert",
  "#c0392b": "rouge",
  "#2c6fbb": "bleu",
  "#e08a00": "orange",
  "#7b4fb5": "violet",
  "#c2185b": "rose",
  "#333333": "anthracite",
};
const COLS = ["#1f7a3f", "#c0392b", "#2c6fbb", "#e08a00", "#7b4fb5", "#c2185b", "#333333"],
  DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const DEF = {
  n: [10, 8, 6, 6],
  wa: 10,
  prices: {},
  pn: {},
  rec: REC0,
  meals: [
    ["Vendredi souper", "Spaghetti bolognaise"],
    ["Samedi matin", "Petit-déjeuner"],
    ["Samedi midi", "Croque-monsieur"],
    ["Samedi soir", "Riz poulet curry-coco"],
    ["Dimanche matin", "Petit-déjeuner"],
    ["Dimanche midi", "Saucisses, purée, carottes"],
  ],
  cur: "Spaghetti bolognaise",
  dt: {},
  notes: "",
  mc: COLS[0],
  mt: "Menu du camp",
  md: 1,
  ma: 1,
  hid: [],
  cust: {},
};
/* ---------- validation des données (stockage et import) ---------- */
const ID = /^[A-Za-z0-9_]{1,40}$/,
  HEX = /^#[0-9a-fA-F]{6}$/,
  ISOD = /^\d{4}-\d{2}-\d{2}$/;
const okid = (k) => ID.test(k) && k !== "__proto__",
  obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
const str = (v, max, d) => (typeof v === "string" ? v.slice(0, max) : d || ""),
  num = (v, min, max, d) => {
    v = +v;
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d || 0;
  };
const ent = (o) => (obj(o) ? Object.entries(o).slice(0, 500) : []),
  q4 = (a) => [0, 1, 2, 3].map((i) => num((Array.isArray(a) ? a : [])[i], 0, 1e6));
function cleanCamp(c) {
  if (!obj(c)) return null;
  const o = {
    name: str(c.name, 80, "Camp"),
    start: ISOD.test(c.start) ? c.start : "",
    end: ISOD.test(c.end) ? c.end : "",
    n: q4(c.n).map((v) => Math.min(v, 1e4)),
    wa: num(c.wa, 0, 500, 10),
    dt: {},
    notes: str(c.notes, 5000),
    mt: str(c.mt, 80, "Menu du camp"),
    menu: {},
    types: [],
    off: {},
    col: {},
  };
  for (const [k, v] of ent(c.dt))
    if (okid(k) && Array.isArray(v)) o.dt[k] = q4(v).map((x) => Math.min(x, 1e4));
  for (const t of (Array.isArray(c.types) ? c.types : []).slice(0, 30))
    if (obj(t) && okid(t.k) && typeof t.n === "string")
      o.types.push({ k: t.k, n: t.n.slice(0, 30) });
  for (const [k, v] of ent(c.col))
    if (okid(k) && typeof v === "string" && HEX.test(v)) o.col[k] = v.toLowerCase();
  for (const [j, dm] of ent(c.menu)) {
    if (!/^\d{1,2}$/.test(j) || !obj(dm)) continue;
    o.menu[j] = {};
    for (const [k, a] of ent(dm))
      if (okid(k) && Array.isArray(a))
        o.menu[j][k] = a.filter((r) => typeof r === "string" && r.length <= 100).slice(0, 50);
  }
  for (const [j, a] of ent(c.off))
    if (/^\d{1,2}$/.test(j) && Array.isArray(a))
      o.off[j] = a.filter((k) => typeof k === "string" && okid(k)).slice(0, 40);
  return o;
}
function cleanProject(x) {
  if (!obj(x) || !obj(x.rec) || !(Array.isArray(x.meals) || obj(x.camps)))
    throw new Error("ce fichier n'est pas un projet Intendance PSS (recettes ou camps manquants).");
  const o = {
    rec: {},
    cur: str(x.cur, 100),
    prices: {},
    pn: {},
    cust: {},
    hid: Array.isArray(x.hid)
      ? x.hid.filter((k) => typeof k === "string" && okid(k)).slice(0, 200)
      : [],
  };
  for (const [n, r] of ent(x.rec)) {
    if (!n || n.length > 100 || n === "__proto__" || !obj(r)) continue;
    const R = { desc: str(r.desc, 5000), ing: {} };
    for (const [k, a] of ent(r.ing)) if (okid(k) && Array.isArray(a)) R.ing[k] = q4(a);
    if (obj(r.fx)) {
      R.fx = {};
      for (const [k, v] of ent(r.fx)) if (okid(k) && k in R.ing) R.fx[k] = num(v, 0, 1e7);
    }
    if (obj(r.fa)) {
      R.fa = {};
      for (const [k, v] of ent(r.fa)) if (okid(k) && k in R.ing && +v === 0) R.fa[k] = 0;
    }
    o.rec[n] = R;
  }
  for (const [k, v] of ent(x.prices)) if (okid(k)) o.prices[k] = num(v, 0, 1e5);
  for (const [k, v] of ent(x.pn)) if (okid(k)) o.pn[k] = str(v, 200);
  for (const [k, v] of ent(x.cust)) {
    if (!okid(k) || !Array.isArray(v) || typeof v[0] !== "string" || !v[0].trim()) continue;
    const n = v[0].slice(0, 100);
    let kw = str(v[3], 200);
    try {
      new RegExp(kw);
    } catch (_) {
      kw = "";
    }
    if (!kw) kw = n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    o.cust[k] = [
      n,
      ["g", "ml", "pc"].includes(v[1]) ? v[1] : "g",
      num(v[2], 0, 1e5),
      kw,
      0,
      (Array.isArray(v[5]) ? v[5] : [])
        .filter((d) => typeof d === "string" && okid(d))
        .slice(0, 20),
    ];
  }
  if (obj(x.dd)) {
    o.dd = {};
    for (const [k, v] of ent(x.dd)) {
      if (!okid(k) || !obj(v)) continue;
      const ex = {};
      for (const [a, b] of ent(v.ex))
        if (okid(a) && (b === null || (typeof b === "string" && okid(b)))) ex[a] = b;
      o.dd[k] = { n: str(v.n, 80, "Sans nom"), ex };
    }
  }
  if (
    typeof x.logo === "string" &&
    x.logo.length < 4e5 &&
    /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(x.logo)
  )
    o.logo = x.logo;
  if (x.md !== undefined) o.md = +x.md ? 1 : 0;
  if (x.ma !== undefined) o.ma = +x.ma ? 1 : 0;
  if (obj(x.camps)) {
    o.camps = {};
    for (const [k, c] of ent(x.camps)) {
      if (!okid(k)) continue;
      const cc = cleanCamp(c);
      if (cc) o.camps[k] = cc;
    }
    if (!Object.keys(o.camps).length) throw new Error("aucun camp valide dans ce fichier.");
    o.ccur = typeof x.ccur === "string" && o.camps[x.ccur] ? x.ccur : Object.keys(o.camps)[0];
  } else {
    o.n = q4(x.n).map((v) => Math.min(v, 1e4));
    o.wa = num(x.wa, 0, 500, 10);
    o.notes = str(x.notes, 5000);
    o.mt = str(x.mt, 80, "Menu du camp");
    o.dt = {};
    for (const [k, v] of ent(x.dt))
      if (okid(k) && Array.isArray(v)) o.dt[k] = q4(v).map((z) => Math.min(z, 1e4));
    o.meals = x.meals
      .filter((m) => Array.isArray(m) && typeof m[0] === "string" && typeof m[1] === "string")
      .slice(0, 500)
      .map((m) => [m[0].slice(0, 100), m[1].slice(0, 100)]);
  }
  return o;
}
let S = JSON.parse(JSON.stringify(DEF)),
  badStore = false;
try {
  const x = localStorage.getItem("intendance2");
  if (x) {
    try {
      S = Object.assign(S, cleanProject(JSON.parse(x)));
    } catch (e) {
      badStore = true;
      try {
        localStorage.setItem("intendance2_illisible", x);
      } catch (_) {}
    }
  }
} catch (e) {}
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
const pISO = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};
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
      n: [0, 0, 0, 0],
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
let sfail = 0;
const $ = (i) => document.getElementById(i),
  showWarn = (t) => {
    $("warnt").textContent = t;
    $("warn").hidden = !t;
  },
  save = () => {
    try {
      S.dd = DIETS;
      localStorage.setItem("intendance2", JSON.stringify(S));
      if (sfail) {
        sfail = 0;
        showWarn("");
      }
    } catch (e) {
      if (!sfail) {
        sfail = 1;
        showWarn(
          e && e.name === "QuotaExceededError"
            ? "La mémoire du navigateur est pleine : tes dernières modifications ne sont pas enregistrées. Exporte ton projet (.json) maintenant."
            : "Impossible d'enregistrer sur cet appareil (navigation privée ou stockage bloqué). Exporte ton projet (.json) pour ne rien perdre."
        );
      }
    }
  };
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );
const eur = (v) => v.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
const price = (k) => S.prices[k] ?? ING[k][2],
  per = (k) => (ING[k][1] === "pc" ? 1 : 1000),
  ul = (k) => (ING[k][1] === "ml" ? "L" : ING[k][1] === "pc" ? "pc" : "kg"),
  nn = () => C.n.reduce((a, b) => a + b, 0);
const fxu = (k) => (ING[k][1] === "pc" ? 1 : 1000),
  fxl = (k) => ({ g: "kg", ml: "L", pc: "pièces" })[ING[k][1]];
function qty(k, q) {
  const u = ING[k][1];
  if (u === "pc") return Math.ceil(q) + " pc";
  return q >= 1000 ? (q / 1000).toFixed(2) + (u === "ml" ? " L" : " kg") : Math.round(q) + " " + u;
}
function dl(c, name, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([c], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
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
/* ---------- documents imprimables / partageables ---------- */
const rlum = (c) => {
  const n = parseInt(c.slice(1), 16),
    f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};
const crat = (a, b) => {
    const x = rlum(a),
      y = rlum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  },
  INK = "#1f2a22",
  best = (c) => (crat(c, "#ffffff") >= crat(c, INK) ? "#ffffff" : INK),
  lowc = (c) => HEX.test(c) && Math.max(crat(c, "#ffffff"), crat(c, INK)) < 4.5;
const cvars = (c) => {
  c = HEX.test(c) ? c : COLS[0];
  return `--mc:${c};--mcl:${c}22;--mct:${best(c)}`;
};
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
  return `<div class="mp pvx"><h2>${esc(C.mt || "Menu")}</h2><div class="s">${esc(C.name)} · ${fdate(C.start)} → ${fdate(C.end)} · ${nn()} personnes · Patro Sainte-Suzanne</div><table class="mt"><thead><tr><th>Repas</th><th>Au menu</th>${dsc ? "<th>Description</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function listHTML() {
  const rows = LAST.keys
    .map((k) => {
      const c = (LAST.tot[k] / per(k)) * price(k);
      return `<tr><td class="ck">☐</td><td>${esc(ING[k][0])}</td><td>${qty(k, LAST.tot[k])}</td><td>${price(k) ? eur(price(k)) + "/" + ul(k) : "–"}</td><td>${eur(c)}</td></tr>`;
    })
    .join("");
  return `<div class="mp pvx" style="${cvars()}"><h2>Liste de courses</h2><div class="s">Patro Sainte-Suzanne · ${nn()} personnes · ${filled()} repas · ${new Date().toLocaleDateString("fr-BE")}</div><table class="mt"><thead><tr><th></th><th>Produit</th><th>Quantité</th><th>Prix</th><th>Coût</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Aucun repas</td></tr>'}</tbody></table><p><b>Total : ${eur(LAST.sum)}</b>${nn() ? " · par personne : " + eur(LAST.sum / nn()) : ""}</p></div>`;
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
              `<tr><td>${esc(ING[k][0])} (${ING[k][1]})</td>${R.fx && k in R.fx ? `<td colspan="4"><b>${qty(k, R.fx[k])}</b> au total</td>` : q.map((v) => `<td>${v}</td>`).join("")}</tr>`
          )
          .join("")}</tbody></table>`;
      })
      .join("") || "<p>Aucune recette.</p>") +
    `<p class="s">Quantités par personne, sauf mention « au total ».</p></div>`
  );
}
const txtList = () =>
  "🛒 Liste de courses – Patro Sainte-Suzanne (" +
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
/* ---------- export CSV (Excel en français : séparateur « ; », virgule décimale, UTF-8 avec BOM) ---------- */
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
const SH = {
  list: ["Liste de courses", txtList, listHTML, csvList],
  menu: ["Menu", txtMenu, menuHTML, csvMenu],
  rec: [
    "Recette",
    () => txtRec(S.cur),
    () => recHTML(S.rec[S.cur] ? [S.cur] : []),
    () => csvRec(S.rec[S.cur] ? [S.cur] : []),
  ],
  recs: [
    "Recettes",
    () => Object.keys(S.rec).map(txtRec).join("\n\n"),
    () => recHTML(Object.keys(S.rec)),
    () => csvRec(Object.keys(S.rec)),
  ],
};
const shk = () => SH[$("shw").value];
function printHTML(html) {
  $("pv").innerHTML = html;
  document.body.classList.add("pr");
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      alert("Impression impossible ici : utilise « Fichier HTML » puis imprime le fichier.");
    }
    setTimeout(() => document.body.classList.remove("pr"), 1500);
  }, 80);
}
window.addEventListener("afterprint", () => document.body.classList.remove("pr"));
/* Mise en forme du « Fichier HTML » téléchargé : volontairement autonome (hors ligne, ouvert depuis n'importe quel dossier).
   À garder cohérent avec les règles .mp / .mt de styles.css. */
const DOC_CSS =
  "*{box-sizing:border-box}body{font:16px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2a22;background:#fff;max-width:900px;margin:auto;padding:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
  ".mp{--mc:#1f7a3f;--mcl:#1f7a3f22;--mct:#fff}.mp h2{font-size:1.4rem;margin:0 0 2px;padding-bottom:6px;border-bottom:3px solid var(--mc)}.mp h3{margin:16px 0 2px;break-after:avoid}.s{color:#5c6f62;font-size:.88rem}" +
  ".mt{width:100%;border-collapse:collapse;font-size:.95rem;margin-top:10px}.mt th{background:#2a3b2f;color:#fff;text-align:left;padding:8px 10px}.mt td{padding:7px 10px;border-bottom:1px solid var(--mcl);vertical-align:top}" +
  ".mt tr{break-inside:avoid}.mt tr.day td{background:#dfe8e1;font-weight:700;border-top:2px solid #2a3b2f}.mt tr.sl td{background:var(--mcl)}.mt tr.sl td.sn{background:var(--mc);color:var(--mct);font-weight:700;width:84px}" +
  ".mt .ad{font-size:.8rem;color:#5c6f62;font-style:italic}.mt td.ck{width:1.4em;text-align:center}";
function dlHTML(html, name) {
  dl(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      esc(name) +
      "</title><style>" +
      DOC_CSS +
      "</style></head><body>" +
      html +
      "</body></html>",
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".html",
    "text/html"
  );
}
const shmsg = (t) => {
  $("shm").textContent = t;
  setTimeout(() => ($("shm").textContent = ""), 2500);
};
function shtxt() {
  const t = shk()[1]();
  if (!t.trim()) {
    shmsg("Rien à partager.");
    return "";
  }
  return t;
}
$("plist").onclick = () => printHTML(listHTML());
$("pmenu").onclick = () => printHTML(menuHTML());
$("sp").onclick = () => printHTML(shk()[2]());
$("sd").onclick = () => dlHTML(shk()[2](), "Patro " + shk()[0]);
$("sx").onclick = () => dlCsv(shk()[0], shk()[3]());
$("lcsv").onclick = () => dlCsv("Liste de courses", csvList());
$("sw").onclick = () => {
  const t = shtxt();
  if (t) window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener");
};
$("sm").onclick = () => {
  const t = shtxt();
  if (t)
    location.href =
      "mailto:?subject=" +
      encodeURIComponent("Patro Sainte-Suzanne – " + shk()[0]) +
      "&body=" +
      encodeURIComponent(t);
};
if (!navigator.share) $("sn").style.display = "none";
$("sn").onclick = () => {
  const t = shtxt();
  if (t) navigator.share({ title: "Patro Sainte-Suzanne – " + shk()[0], text: t }).catch(() => {});
};
$("sc").onclick = () => {
  const t = shtxt();
  if (!t) return;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
    () => shmsg("Copié ✅"),
    () => shmsg("Copie impossible")
  );
};
/* ---------- menu : édition, glisser-déposer, couleurs ---------- */
let addDay = -1,
  addT = "",
  delSl = null;
const ALLD = () => [...Array(31).keys()];
const delPanel = (i, k, lab) => {
  const n1 = slotArr(i, k).length,
    n2 = days().reduce((a, d, j) => a + slotArr(j, k).length, 0),
    f = (n) => (n ? ` (${n} plat${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""})` : "");
  return `<div class="zdel"><b>Retirer « ${esc(lab)} »</b> <button class="x" data-dsc="one" data-day="${i}" data-slot="${esc(k)}">Ce jour seulement${f(n1)}</button> <button class="x" data-dsc="all" data-day="${i}" data-slot="${esc(k)}">Tous les jours${f(n2)}</button> <button class="x" data-dsn="1">Annuler</button></div>`;
};
const addPanel = () => {
  const nw = addT === "__new",
    t = C.types.find((x) => x.k === addT);
  return `<div class="nsl">${nw ? '<input data-nn="1" placeholder="Nom (ex. Goûter)" maxlength="30" aria-label="Nom du nouveau repas">' : `<b>${esc(t ? t.n : "")}</b>`}<select data-sc="1" aria-label="Portée : ce jour ou tous les jours"><option value="one">Ce jour seulement</option><option value="all">Tous les jours</option></select><button data-nok="1">Ajouter</button><button class="x" data-nno="1">Annuler</button></div>`;
};
function drawMenu() {
  $("menu").innerHTML = days()
    .map((d, i) => {
      const gone = C.types.filter((t) => hid(i, t.k));
      return `<div class="dcard"><div class="dhd">${esc(dlab(d))}</div>${dtypes(i)
        .map(
          ({ k, n: lab }) =>
            `<div class="zone" data-day="${i}" data-slot="${esc(k)}" style="${cvars(C.col[k])}"><div class="zl"><span>${esc(lab)}</span><button class="zx" data-ds="1" data-day="${i}" data-slot="${esc(k)}" title="Retirer ce repas de ce jour" aria-label="Retirer ${esc(lab)} de ce jour">✕</button></div><div class="zc">${slotArr(
              i,
              k
            )
              .map(
                (r, j) =>
                  `<span class="chip" data-j="${j}"><span class="hd" role="button" tabindex="0" data-day="${i}" data-slot="${esc(k)}" data-j="${j}" aria-label="Déplacer ${esc(r)} avec les flèches du clavier" title="Glisser, ou flèches du clavier : haut/bas pour l'ordre, gauche/droite pour changer de repas">⠿</span><span class="cn">${esc(r)}</span><button class="x" data-rm="1" data-day="${i}" data-slot="${esc(k)}" data-j="${j}" title="Retirer" aria-label="Retirer ${esc(r)} de ${esc(lab)}, ${esc(dlab(d))}">✕</button></span>`
              )
              .join(
                ""
              )}</div><select data-add="1" data-day="${i}" data-slot="${esc(k)}" aria-label="Ajouter un plat : ${esc(lab)}, ${esc(dlab(d))}"><option value="">+ Ajouter un plat…</option>${Object.keys(
              S.rec
            )
              .map((n) => `<option>${esc(n)}</option>`)
              .join(
                ""
              )}</select></div>${delSl && delSl.day === i && delSl.k === k ? delPanel(i, k, lab) : ""}`
        )
        .join(
          ""
        )}<div class="zadd"><select data-as="1" data-day="${i}" aria-label="Ajouter un repas le ${esc(dlab(d))}"><option value="">+ Ajouter un repas…</option>${gone.map((t) => `<option value="${esc(t.k)}">${esc(t.n)}</option>`).join("")}<option value="__new">➕ Nouveau repas…</option></select>${addDay === i && addT ? addPanel() : ""}</div></div>`;
    })
    .join("");
  if (addDay >= 0) {
    const f = $("menu").querySelector("[data-nn]");
    if (f) f.focus();
  }
}
const marr = (i, k) => {
  C.menu[i] = C.menu[i] || {};
  return (C.menu[i][k] = C.menu[i][k] || []);
};
$("menu").addEventListener("change", (e) => {
  const t = e.target;
  if (!t.dataset.add || !t.value) return;
  marr(+t.dataset.day, t.dataset.slot).push(t.value);
  drawMenu();
  calc();
});
$("menu").addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.as === undefined || !t.value) return;
  addDay = +t.dataset.day;
  addT = t.value;
  delSl = null;
  drawMenu();
});
function addSlot(i, scope, name) {
  let k = addT;
  if (k === "__new") {
    name = (name || "").trim();
    if (!name) return;
    k = "x" + Date.now().toString(36);
    const pos = C.types.findIndex((t) => t.k === "s"),
      t = { k, n: name };
    if (pos >= 0) C.types.splice(pos, 0, t);
    else C.types.push(t);
    C.col[k] = COLS.find((c) => !Object.values(C.col).includes(c)) || COLS[3];
    ALLD().forEach((j) => (C.off[j] = C.off[j] || []).push(k));
  }
  (scope === "all" ? ALLD() : [i]).forEach((j) => {
    C.off[j] = (C.off[j] || []).filter((x) => x !== k);
  });
  addDay = -1;
  addT = "";
  drawSw();
  drawMenu();
  calc();
}
function delSlot(i, k, scope) {
  (scope === "all" ? ALLD() : [i]).forEach((j) => {
    if (C.menu[j]) C.menu[j][k] = [];
    const o = (C.off[j] = C.off[j] || []);
    if (!o.includes(k)) o.push(k);
  });
  delSl = null;
  drawMenu();
  calc();
}
const addGo = (t) => {
  const p = t.closest(".nsl"),
    n = p.querySelector("[data-nn]");
  addSlot(addDay, p.querySelector("[data-sc]").value, n ? n.value : "");
};
$("menu").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset.nn !== undefined) addGo(e.target);
});
$("menu").addEventListener("keydown", (e) => {
  const h = e.target.closest && e.target.closest(".hd");
  if (!h || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  const day = +h.dataset.day,
    slot = h.dataset.slot,
    j = +h.dataset.j,
    arr = marr(day, slot);
  let nd = day,
    ns = slot,
    nj = j;
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    nj = j + (e.key === "ArrowUp" ? -1 : 1);
    if (nj < 0 || nj >= arr.length) return;
    [arr[j], arr[nj]] = [arr[nj], arr[j]];
  } else {
    const flat = [];
    days().forEach((d, i) => dtypes(i).forEach((t) => flat.push([i, t.k])));
    const idx = flat.findIndex((f) => f[0] === day && f[1] === slot),
      t = flat[idx + (e.key === "ArrowLeft" ? -1 : 1)];
    if (!t) return;
    const [r] = arr.splice(j, 1),
      dst = marr(t[0], t[1]);
    dst.push(r);
    nd = t[0];
    ns = t[1];
    nj = dst.length - 1;
  }
  const name = marr(nd, ns)[nj],
    ty = C.types.find((x) => x.k === ns);
  drawMenu();
  calc();
  const f = $("menu").querySelector(
    '.hd[data-day="' + nd + '"][data-slot="' + ns + '"][data-j="' + nj + '"]'
  );
  if (f) f.focus();
  say(name + " : " + dlab(days()[nd]) + ", " + (ty ? ty.n : "") + ", position " + (nj + 1));
});
$("menu").addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.nok !== undefined) {
    addGo(t);
    return;
  }
  if (t.dataset.nno !== undefined) {
    addDay = -1;
    addT = "";
    drawMenu();
    return;
  }
  if (t.dataset.ds) {
    delSl = { day: +t.dataset.day, k: t.dataset.slot };
    addDay = -1;
    addT = "";
    drawMenu();
    return;
  }
  if (t.dataset.dsc) {
    delSlot(+t.dataset.day, t.dataset.slot, t.dataset.dsc);
    return;
  }
  if (t.dataset.dsn !== undefined) {
    delSl = null;
    drawMenu();
    return;
  }
  if (!t.dataset.rm) return;
  marr(+t.dataset.day, t.dataset.slot).splice(+t.dataset.j, 1);
  drawMenu();
  calc();
});
let dg = null,
  px = 0,
  py = 0,
  raf = 0;
const tgt = () => {
  const el = document.elementFromPoint(px, py),
    z = el && el.closest && el.closest(".zone");
  if (!z || !$("menu").contains(z)) return null;
  const c = el.closest(".chip");
  return {
    day: +z.dataset.day,
    slot: z.dataset.slot,
    j: c && z.contains(c) ? +c.dataset.j : null,
    z,
  };
};
function dloop() {
  if (!dg) return;
  if (py < 90) scrollBy(0, -14);
  else if (py > innerHeight - 90) scrollBy(0, 14);
  const t = tgt();
  $("menu")
    .querySelectorAll(".zone")
    .forEach((z) => z.classList.toggle("over", !!t && z === t.z));
  raf = requestAnimationFrame(dloop);
}
$("menu").addEventListener("pointerdown", (e) => {
  const h = e.target.closest(".hd");
  if (!h) return;
  e.preventDefault();
  dg = { day: +h.dataset.day, slot: h.dataset.slot, j: +h.dataset.j };
  px = e.clientX;
  py = e.clientY;
  try {
    h.setPointerCapture(e.pointerId);
  } catch (_) {}
  h.closest(".chip").classList.add("drag");
  raf = requestAnimationFrame(dloop);
});
$("menu").addEventListener("pointermove", (e) => {
  px = e.clientX;
  py = e.clientY;
});
function dend(ok) {
  if (!dg) return;
  cancelAnimationFrame(raf);
  const g = dg,
    t = ok ? tgt() : null;
  dg = null;
  if (t && !(t.day === g.day && t.slot === g.slot && t.j === g.j)) {
    const src = marr(g.day, g.slot),
      [r] = src.splice(g.j, 1),
      dst = marr(t.day, t.slot),
      same = t.day === g.day && t.slot === g.slot;
    let at = t.j == null ? dst.length : t.j;
    if (same && at > g.j) at--;
    dst.splice(at, 0, r);
    calc();
  }
  drawMenu();
}
$("menu").addEventListener("pointerup", (e) => {
  px = e.clientX;
  py = e.clientY;
  dend(true);
});
$("menu").addEventListener("pointercancel", () => dend(false));
function drawSw() {
  $("types").innerHTML = C.types
    .map(
      (t, i) =>
        `<div class="trow"><div class="tl"><input class="tn" value="${esc(t.n)}" data-tn="${esc(t.k)}" maxlength="30" aria-label="Nom du repas"><button class="x" data-tu="${esc(t.k)}" title="Monter" aria-label="Monter ${esc(t.n)}"${i ? "" : " disabled"}>▲</button><button class="x" data-td="${esc(t.k)}" title="Descendre" aria-label="Descendre ${esc(t.n)}"${i < C.types.length - 1 ? "" : " disabled"}>▼</button><button class="x" data-tx="${esc(t.k)}" title="Supprimer ce type de repas" aria-label="Supprimer ${esc(t.n)}">🗑</button></div><div class="crow"><span class="sws">${COLS.map((c) => `<button class="sw${c.toLowerCase() === String(C.col[t.k]).toLowerCase() ? " on" : ""}" style="background:${c}" data-c="${c}" data-ck="${esc(t.k)}" title="${CN[c] || c}" aria-label="Couleur ${CN[c] || c} pour ${esc(t.n)}" aria-pressed="${c.toLowerCase() === String(C.col[t.k]).toLowerCase()}"></button>`).join("")}</span><input type="color" data-ci="${esc(t.k)}" value="${esc(C.col[t.k])}" title="Autre couleur" aria-label="Autre couleur pour ${esc(t.n)}"><span class="s cw" style="color:#d33">${lowc(C.col[t.k]) ? "⚠ contraste faible" : ""}</span></div></div>`
    )
    .join("");
}
$("types").addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (d.tn) {
    const t = C.types.find((x) => x.k === d.tn);
    if (t) {
      t.n = e.target.value;
      drawMenu();
      calc();
    }
  } else if (d.ci) {
    C.col[d.ci] = e.target.value;
    e.target
      .closest(".trow")
      .querySelectorAll(".sw")
      .forEach((b) =>
        b.classList.toggle("on", b.dataset.c.toLowerCase() === e.target.value.toLowerCase())
      );
    e.target.closest(".trow").querySelector(".cw").textContent = lowc(e.target.value)
      ? "⚠ contraste faible"
      : "";
    drawMenu();
    calc();
  }
});
$("types").addEventListener("change", (e) => {
  const d = e.target.dataset;
  if (d.tn) {
    const t = C.types.find((x) => x.k === d.tn);
    if (t && !t.n.trim()) {
      t.n = "Repas";
      drawSw();
      drawMenu();
      calc();
    }
  }
});
$("types").addEventListener("click", (e) => {
  const d = e.target.dataset,
    T = C.types;
  if (d.ck) {
    C.col[d.ck] = d.c;
    drawSw();
    drawMenu();
    calc();
    return;
  }
  const mv = (k, s) => {
    const i = T.findIndex((x) => x.k === k),
      j = i + s;
    if (i < 0 || j < 0 || j >= T.length) return;
    [T[i], T[j]] = [T[j], T[i]];
    drawSw();
    drawMenu();
    calc();
  };
  if (d.tu) mv(d.tu, -1);
  else if (d.td) mv(d.td, 1);
  else if (d.tx) {
    const t = T.find((x) => x.k === d.tx);
    if (!t) return;
    if (T.length < 2) {
      alert("Il faut garder au moins un type de repas.");
      return;
    }
    if (!confirm("Supprimer « " + t.n + " » de tous les jours (et les plats qu'il contient) ?"))
      return;
    C.types = T.filter((x) => x.k !== d.tx);
    delete C.col[d.tx];
    Object.values(C.menu).forEach((dm) => delete dm[d.tx]);
    Object.keys(C.off).forEach((j) => (C.off[j] = C.off[j].filter((k) => k !== d.tx)));
    drawSw();
    drawMenu();
    calc();
  }
});
$("mtitle").addEventListener("input", () => {
  C.mt = $("mtitle").value;
  calc();
});
$("mdesc").checked = !!+S.md;
$("madp").checked = !!+S.ma;
$("mdesc").onchange = () => {
  S.md = +$("mdesc").checked;
  calc();
};
$("madp").onchange = () => {
  S.ma = +$("madp").checked;
  calc();
};
/* ---------- camps ---------- */
const cdays = () => {
  const n = days().length;
  $("cdays").textContent =
    n +
    " jour" +
    (n > 1 ? "s" : "") +
    " · " +
    dlab(days()[0]) +
    " → " +
    dlab(days()[n - 1]) +
    (n >= 31 ? " (maximum 31 jours)" : "");
};
function drawCamps() {
  const o = Object.entries(S.camps)
    .map(
      ([k, c]) =>
        `<option value="${esc(k)}"${k === S.ccur ? " selected" : ""}>${esc(c.name)} · ${fdate(c.start)}</option>`
    )
    .join("");
  $("csel").innerHTML = o;
  $("csel2").innerHTML = o;
  $("mcp").innerHTML =
    Object.entries(S.camps)
      .filter(([k]) => k !== S.ccur)
      .map(([k, c]) => `<option value="${esc(k)}">${esc(c.name)} · ${fdate(c.start)}</option>`)
      .join("") || "<option value=''>(aucun autre camp)</option>";
  $("cinfo").textContent = C.name + " · " + fdate(C.start) + " → " + fdate(C.end);
}
function fillCamp() {
  $("cname").value = C.name;
  $("cstart").value = C.start;
  $("cend").value = C.end;
  $("wa").value = C.wa;
  $("mtitle").value = C.mt;
  $("notes").value = C.notes || "";
  document.querySelectorAll("[data-n]").forEach((e) => (e.value = C.n[e.dataset.n]));
  cdays();
}
function setCamp(id) {
  S.ccur = id;
  C = S.camps[id];
  fillCamp();
  drawCamps();
  drawSw();
  drawDiets();
  drawMenu();
  calc();
}
$("csel").onchange = () => setCamp($("csel").value);
$("csel2").onchange = () => setCamp($("csel2").value);
$("cname").addEventListener("input", () => {
  C.name = $("cname").value;
  drawCamps();
  calc();
});
function dchg() {
  if (!pISO(C.start)) C.start = iso(new Date());
  if (!pISO(C.end) || C.end < C.start) C.end = C.start;
  $("cstart").value = C.start;
  $("cend").value = C.end;
  cdays();
  drawMenu();
  drawCamps();
  calc();
}
$("cstart").onchange = () => {
  C.start = $("cstart").value;
  dchg();
};
$("cend").onchange = () => {
  C.end = $("cend").value;
  dchg();
};
$("cnew").onclick = () => {
  const k = "k_" + Date.now().toString(36);
  S.camps[k] = mkCamp("Nouveau camp");
  setCamp(k);
  go("eff");
  $("cname").focus();
  $("cname").select();
};
$("cdup").onclick = () => {
  const k = "k_" + Date.now().toString(36),
    c = JSON.parse(JSON.stringify(C));
  c.name += " (copie)";
  S.camps[k] = c;
  setCamp(k);
  go("eff");
};
$("cdel").onclick = () => {
  if (Object.keys(S.camps).length < 2) {
    alert("Il faut garder au moins un camp.");
    return;
  }
  if (!confirm("Supprimer le camp « " + C.name + " » (dates, effectifs, régimes et menu) ?"))
    return;
  delete S.camps[S.ccur];
  setCamp(Object.keys(S.camps)[0]);
};
$("mcpb").onclick = () => {
  const id = $("mcp").value;
  if (!id || !S.camps[id]) return;
  if (!confirm("Remplacer le menu de ce camp par celui de « " + S.camps[id].name + " » ?")) return;
  const o = JSON.parse(JSON.stringify(S.camps[id]));
  C.menu = o.menu;
  C.types = o.types || DEFT();
  C.col = o.col || { ...SCOL };
  C.off = o.off || {};
  drawSw();
  drawMenu();
  calc();
};
/* ---------- recettes ---------- */
function drawRec() {
  const names = Object.keys(S.rec);
  if (!S.rec[S.cur]) S.cur = names[0] || "";
  $("rsel").innerHTML = names
    .map((d) => `<option${d === S.cur ? " selected" : ""}>${esc(d)}</option>`)
    .join("");
  const R = S.rec[S.cur];
  $("rdesc").value = R ? R.desc : "";
  $("rh").innerHTML =
    "<tr><th>Ingrédient</th>" +
    SEC.map((s) => `<th>${s[0]}<div class="s">${s[1]}</div></th>`).join("") +
    "<th></th></tr>";
  $("rb").innerHTML = R
    ? Object.entries(R.ing)
        .map(([k, q]) => {
          const fx = R.fx && k in R.fx;
          return `<tr><td>${esc(ING[k][0])} (${ING[k][1]})<div><button class="x tg" data-tg="${esc(k)}">${fx ? "→ par personne" : "→ quantité unique"}</button></div></td>${fx ? `<td colspan="4"><input type="number" min="0" step="any" value="${+(R.fx[k] / fxu(k)).toFixed(3)}" data-fx="${esc(k)}" style="width:90px" aria-label="${esc(ING[k][0])} : quantité totale en ${fxl(k)}"> <span class="s">${fxl(k)} au total</span><label style="display:flex;gap:6px;align-items:center;margin-top:4px"><input type="checkbox" data-fa="${esc(k)}"${R.fa && R.fa[k] === 0 ? "" : " checked"} style="width:auto"> adapter aux régimes</label></td>` : q.map((v, i) => `<td><input type="number" min="0" value="${v}" data-k="${esc(k)}" data-s="${i}" aria-label="${esc(ING[k][0])}, ${SEC[i][0]}, par personne"></td>`).join("")}<td><button class="x" data-rm="${esc(k)}" aria-label="Retirer ${esc(ING[k][0])} de la recette" title="Retirer de la recette">✕</button></td></tr>`;
        })
        .join("")
    : "";
  $("radd").innerHTML =
    "<option value=''>+ Ajouter un ingrédient…</option>" +
    Object.entries(ING)
      .filter(([k, v]) => R && !R.ing[k] && !v[4] && !S.hid.includes(k))
      .map(([k, v]) => `<option value="${esc(k)}">${esc(v[0])}</option>`)
      .join("");
}
const PG = {
  eff: "Camp & effectifs",
  reg: "Régimes & allergies",
  menu: "Menu",
  rec: "Recettes",
  cat: "Catalogue de prix",
  list: "Liste de courses",
  sh: "Partager / imprimer",
  pj: "Sauvegarde",
};
const mqW = matchMedia("(min-width:900px)"),
  say = (t) => {
    $("live").textContent = "";
    setTimeout(() => ($("live").textContent = t), 30);
  };
function nav(o) {
  document.body.classList.toggle("nav", !!o);
  $("burger").setAttribute("aria-expanded", !!o);
  syncDrawer(o);
}
function syncDrawer(o) {
  $("drawer").inert = !mqW.matches && !o;
}
mqW.addEventListener("change", () => syncDrawer(document.body.classList.contains("nav")));
function go(g) {
  document.querySelectorAll(".pg").forEach((x) => x.classList.toggle("on", x.id === "g-" + g));
  document.querySelectorAll(".ni").forEach((x) => {
    const on = x.dataset.g === g;
    x.classList.toggle("on", on);
    if (on) x.setAttribute("aria-current", "page");
    else x.removeAttribute("aria-current");
  });
  $("ptitle").textContent = PG[g];
  nav(0);
  window.scrollTo(0, 0);
  try {
    sessionStorage.setItem("pg", g);
  } catch (_) {}
}
$("burger").onclick = () => {
  const o = !document.body.classList.contains("nav");
  nav(o);
  if (o) {
    const f = $("drawer").querySelector(".ni.on") || $("drawer").querySelector(".ni");
    if (f) f.focus();
  }
};
$("scrim").onclick = () => nav(0);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("nav")) {
    nav(0);
    $("burger").focus();
  }
});
$("drawer").addEventListener("click", (e) => {
  const b = e.target.closest(".ni");
  if (b) go(b.dataset.g);
});
$("cnt").innerHTML = SEC.map(
  (s, i) =>
    `<div><label>${s[0]} (${s[1]})</label><input type="number" min="0" data-n="${i}" aria-label="Effectif ${s[0]}"></div>`
).join("");
document.querySelectorAll("[data-n]").forEach((e) =>
  e.addEventListener("input", () => {
    C.n[e.dataset.n] = +e.value || 0;
    calc();
  })
);
$("wa").addEventListener("input", () => {
  C.wa = +$("wa").value || 0;
  calc();
});
$("rsel").onchange = () => {
  S.cur = $("rsel").value;
  drawRec();
};
$("rdesc").onchange = () => {
  if (S.rec[S.cur]) {
    S.rec[S.cur].desc = $("rdesc").value;
    save();
  }
};
$("rb").addEventListener("change", (e) => {
  const d = e.target.dataset,
    R = S.rec[S.cur];
  if (!R) return;
  if (d.k) {
    R.ing[d.k][+d.s] = +e.target.value || 0;
    calc();
  } else if (d.fx && R.fx) {
    R.fx[d.fx] = Math.round(Math.max(0, +e.target.value || 0) * fxu(d.fx) * 1000) / 1000;
    calc();
  } else if (d.fa !== undefined && R.fx) {
    R.fa = R.fa || {};
    if (e.target.checked) delete R.fa[d.fa];
    else R.fa[d.fa] = 0;
    calc();
  }
});
$("rb").addEventListener("click", (e) => {
  const t = e.target.dataset,
    R = S.rec[S.cur];
  if (!R) return;
  if (t.tg) {
    const k = t.tg;
    R.fx = R.fx || {};
    if (k in R.fx) {
      const n = nn(),
        pp = n ? (ING[k][1] === "pc" ? +(R.fx[k] / n).toFixed(2) : Math.round(R.fx[k] / n)) : 0;
      R.ing[k] = [pp, pp, pp, pp];
      delete R.fx[k];
      if (R.fa) delete R.fa[k];
    } else R.fx[k] = Math.round(R.ing[k].reduce((a, q, i) => a + q * C.n[i], 0) * 100) / 100;
    drawRec();
    calc();
  } else if (t.rm) {
    delete R.ing[t.rm];
    if (R.fx) delete R.fx[t.rm];
    if (R.fa) delete R.fa[t.rm];
    drawRec();
    calc();
  }
});
$("radd").onchange = () => {
  const k = $("radd").value;
  if (k && S.rec[S.cur]) {
    S.rec[S.cur].ing[k] = [0, 0, 0, 0];
    drawRec();
    save();
  }
};
$("rnew").onclick = () => {
  $("rform").style.display = "grid";
  $("rname").value = "";
  $("rname").focus();
};
$("rno").onclick = () => {
  $("rform").style.display = "none";
};
$("rok").onclick = () => {
  const n = $("rname").value.trim();
  if (!n) return;
  if (S.rec[n]) {
    $("rname").value = "";
    $("rname").placeholder = "Ce nom existe déjà";
    return;
  }
  S.rec[n] = { desc: "", ing: {} };
  S.cur = n;
  $("rform").style.display = "none";
  drawRec();
  drawMenu();
  save();
};
$("rname").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("rok").click();
});
let dc = 0;
$("rdel").onclick = () => {
  if (!S.rec[S.cur]) return;
  const used = usedIn(S.cur);
  if (used) {
    alert(`Recette utilisée ${used} fois dans les menus (tous camps) : retire-la d'abord du menu.`);
    return;
  }
  if (!dc) {
    dc = 1;
    $("rdel").textContent = "Confirmer ?";
    setTimeout(() => {
      dc = 0;
      $("rdel").textContent = "✕";
    }, 3000);
    return;
  }
  dc = 0;
  $("rdel").textContent = "✕";
  delete S.rec[S.cur];
  drawRec();
  drawMenu();
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
/* ---------- ingrédients (supprimer / restaurer) ---------- */
function rmIng(k) {
  for (const r of Object.values(S.rec)) {
    delete r.ing[k];
    if (r.fx) delete r.fx[k];
    if (r.fa) delete r.fa[k];
  }
  delete S.prices[k];
  delete S.pn[k];
  if (S.cust[k]) {
    delete S.cust[k];
    delete ING[k];
    for (const d in DIETS) {
      const ex = DIETS[d].ex;
      delete ex[k];
      for (const x in ex) if (ex[x] === k) ex[x] = null;
    }
  } else if (!S.hid.includes(k)) S.hid.push(k);
}
$("rclr").onclick = () => {
  if (
    !confirm(
      "Supprimer TOUTES les recettes, tous les ingrédients et les menus de tous les camps ? (Exporte d'abord une sauvegarde. « Réinitialiser » ou « Restaurer » les remettent.)"
    )
  )
    return;
  Object.keys(ING).forEach(rmIng);
  S.rec = {};
  Object.values(S.camps).forEach((c) => (c.menu = {}));
  S.cur = "";
  drawRec();
  drawMenu();
  drawDietEd();
  calc();
};
$("hrs").onclick = () => {
  S.hid = [];
  drawRec();
  drawDietEd();
  calc();
};
/* ---------- catalogue de prix ---------- */
function drawCat() {
  $("ct").innerHTML =
    Object.keys(ING)
      .filter((k) => !S.hid.includes(k))
      .map(
        (k) =>
          `<tr><td>${esc(ING[k][0])}${S.pn[k] ? `<div class="s">↳ ${esc(S.pn[k])}</div>` : ""}</td><td>€/${ING[k][1] === "pc" ? "pièce" : ul(k)}</td><td><input type="number" step="0.05" min="0" value="${price(k)}" data-cp="${esc(k)}" aria-label="Prix de ${esc(ING[k][0])}"></td><td><button class="x" data-chd="${esc(k)}" title="Supprimer cet ingrédient" aria-label="Supprimer ${esc(ING[k][0])}">✕</button></td></tr>`
      )
      .join("") || "<tr><td>Aucun ingrédient.</td></tr>";
}
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
$("file").onchange = (e) => {
  const f = e.target.files[0];
  if (f) {
    const r = new FileReader();
    r.onload = () => {
      $("csv").value = r.result;
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
/* ---------- régimes & allergies (modifiables) ---------- */
if (!C.dt) C.dt = {};
function drawDiets() {
  $("dh").innerHTML = "<tr><th>Régime</th>" + SEC.map((x) => `<th>${x[0]}</th>`).join("") + "</tr>";
  $("db").innerHTML =
    Object.entries(DIETS)
      .map(
        ([k, v]) =>
          `<tr><td>${esc(v.n)}</td>${SEC.map((x, i) => `<td><input type="number" min="0" value="${(C.dt[k] || [])[i] || 0}" data-d="${esc(k)}" data-s="${i}" aria-label="${esc(v.n)} : ${x[0]}"></td>`).join("")}</tr>`
      )
      .join("") || "<tr><td>Aucun régime. Ouvre « Modifier » pour en ajouter.</td></tr>";
}
$("db").addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (d.d) {
    (C.dt[d.d] = C.dt[d.d] || [0, 0, 0, 0])[+d.s] = +e.target.value || 0;
    calc();
  }
});
let dcur = null;
function drawDietEd() {
  const ks = Object.keys(DIETS);
  if (!DIETS[dcur]) dcur = ks[0] || null;
  $("dsel").innerHTML = ks
    .map(
      (k) => `<option value="${esc(k)}"${k === dcur ? " selected" : ""}>${esc(DIETS[k].n)}</option>`
    )
    .join("");
  $("dname").value = dcur ? DIETS[dcur].n : "";
  $("dname").disabled = $("ddel").disabled = $("dradd").disabled = !dcur;
  const vis = (k, sel) => !S.hid.includes(k) || k === sel,
    opt = (sel, none) =>
      (none ? `<option value=""${sel == null ? " selected" : ""}>— retirer —</option>` : "") +
      Object.keys(ING)
        .filter((k) => vis(k, sel))
        .map(
          (k) =>
            `<option value="${esc(k)}"${k === sel ? " selected" : ""}>${esc(ING[k][0])}</option>`
        )
        .join("");
  $("drules").innerHTML = dcur
    ? Object.entries(DIETS[dcur].ex)
        .map(
          ([k, v]) =>
            `<tr><td><select data-ro="${esc(k)}" aria-label="Ingrédient à remplacer">${opt(k)}</select></td><td>→</td><td><select data-rs="${esc(k)}" aria-label="Remplacé par">${opt(v, 1)}</select></td><td><button class="x" data-rx="${esc(k)}" aria-label="Supprimer cette règle" title="Supprimer cette règle">✕</button></td></tr>`
        )
        .join("") || '<tr><td class="s">Aucune règle : ajoutes-en une.</td></tr>'
    : "";
}
$("dsel").onchange = () => {
  dcur = $("dsel").value;
  drawDietEd();
};
$("dname").onchange = () => {
  if (dcur) {
    DIETS[dcur].n = $("dname").value.trim() || "Sans nom";
    drawDietEd();
    drawDiets();
    calc();
  }
};
$("dnew").onclick = () => {
  const k = "d_" + Date.now().toString(36);
  DIETS[k] = { n: "Nouveau régime", ex: {} };
  dcur = k;
  drawDietEd();
  drawDiets();
  calc();
  $("dname").focus();
  $("dname").select();
};
$("ddel").onclick = () => {
  if (!dcur || !confirm("Supprimer le régime « " + DIETS[dcur].n + " » ?")) return;
  delete DIETS[dcur];
  delete C.dt[dcur];
  drawDietEd();
  drawDiets();
  calc();
};
$("dradd").onclick = () => {
  const ex = DIETS[dcur].ex,
    k = Object.keys(ING).find((k) => !(k in ex) && !ING[k][4] && !S.hid.includes(k));
  if (!k) {
    alert("Aucun ingrédient disponible.");
    return;
  }
  ex[k] = null;
  drawDietEd();
  calc();
};
$("drules").addEventListener("change", (e) => {
  const d = e.target.dataset,
    ex = DIETS[dcur].ex;
  if (d.rs !== undefined) ex[d.rs] = e.target.value || null;
  else if (d.ro !== undefined) {
    const nk = e.target.value;
    if (!(nk in ex)) {
      const ne = {};
      for (const [k, v] of Object.entries(ex)) ne[k === d.ro ? nk : k] = v;
      DIETS[dcur].ex = ne;
    }
  }
  drawDietEd();
  calc();
});
$("drules").addEventListener("click", (e) => {
  const k = e.target.dataset.rx;
  if (k) {
    delete DIETS[dcur].ex[k];
    drawDietEd();
    calc();
  }
});
$("notes").onchange = () => {
  C.notes = $("notes").value;
  save();
};
/* ---------- logo ---------- */
if (S.logo) $("logoimg").src = S.logo;
$("logof").onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas"),
        k = Math.min(1, 160 / Math.max(im.width, im.height));
      c.width = im.width * k;
      c.height = im.height * k;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      S.logo = c.toDataURL("image/png");
      $("logoimg").src = S.logo;
      save();
    };
    im.src = r.result;
  };
  r.readAsDataURL(f);
};
/* ---------- ingrédients ajoutés + nettoyage au chargement ---------- */
if (!S.cust) S.cust = {};
if (!Array.isArray(S.hid)) S.hid = [];
for (const k in S.cust) {
  ING[k] = S.cust[k];
  if (!S.dd)
    (S.cust[k][5] || []).forEach((d) => {
      if (DIETS[d]) DIETS[d].ex[k] = null;
    });
}
if (S.dd && typeof S.dd === "object") DIETS = S.dd;
(function sanitize() {
  for (const r of Object.values(S.rec)) {
    if (!r.ing) r.ing = {};
    for (const k of Object.keys(r.ing)) {
      if (!ING[k] || !Array.isArray(r.ing[k])) delete r.ing[k];
      else while (r.ing[k].length < 4) r.ing[k].push(0);
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
    c.n = [0, 1, 2, 3].map((i) => Math.max(0, +(Array.isArray(c.n) ? c.n : [])[i] || 0));
    c.wa = Number.isFinite(+c.wa) ? +c.wa : 10;
    if (!c.dt || typeof c.dt !== "object") c.dt = {};
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
const DMAP = {
  viande: ["veg"],
  porc: ["veg", "halal"],
  boeuf: ["veg", "sb"],
  sl: ["sl"],
  sg: ["sg"],
  nut: ["nut"],
};
$("inew").onclick = () => {
  $("iform").style.display = "grid";
  $("iname").value = "";
  $("iname").focus();
};
$("ino").onclick = () => {
  $("iform").style.display = "none";
};
$("iok").onclick = () => {
  const n = $("iname").value.trim();
  if (!n) return;
  const k = "c_" + Date.now().toString(36);
  const dg = DMAP[$("idiet").value] || [];
  const kw = n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const e = [n, $("iunit").value, 0, kw, 0, dg];
  S.cust[k] = e;
  ING[k] = e;
  dg.forEach((d) => {
    if (DIETS[d]) DIETS[d].ex[k] = null;
  });
  if (S.rec[S.cur]) S.rec[S.cur].ing[k] = [0, 0, 0, 0];
  $("iform").style.display = "none";
  drawRec();
  drawDietEd();
  calc();
};
/* ---------- installation (PWA) ---------- */
let dip = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  dip = e;
  $("inst").style.display = "inline-block";
});
addEventListener("appinstalled", () => {
  $("inst").style.display = "none";
});
$("inst").onclick = () => {
  if (dip) {
    dip.prompt();
    dip.userChoice.finally(() => {
      dip = null;
      $("inst").style.display = "none";
    });
  }
};
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone)
  $("ioshint").style.display = "block";
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol))
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
/* ---------- stockage : avertissement, protection ---------- */
$("warnx").onclick = () => $("exp").click();
$("warnc").onclick = () => showWarn("");
if (badStore)
  showWarn(
    "Les données enregistrées étaient illisibles : une copie brute est conservée dans le navigateur. Importe ta dernière sauvegarde (.json) depuis la page Sauvegarde."
  );
addEventListener(
  "pointerdown",
  () => {
    try {
      navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {});
    } catch (_) {}
  },
  { once: true }
);
/* ---------- projet : export / import / reset ---------- */
$("exp").onclick = () => {
  S.dd = DIETS;
  dl(
    JSON.stringify(S, null, 1),
    "projet-patro-" + new Date().toISOString().slice(0, 10) + ".json",
    "application/json"
  );
};
$("jin").onchange = (e) => {
  const f = e.target.files[0],
    msg = (t) => {
      $("jmsg").textContent = t;
    };
  e.target.value = "";
  if (!f) return;
  msg("");
  if (f.size > 3e6) {
    msg("Import impossible : fichier trop volumineux (3 Mo maximum).");
    return;
  }
  f.text().then((t) => {
    let c;
    try {
      c = cleanProject(JSON.parse(t));
    } catch (err) {
      msg(
        "Import impossible : " +
          (err instanceof SyntaxError ? "ce fichier n'est pas du JSON valide." : err.message)
      );
      return;
    }
    if (!confirm("Remplacer toutes les données actuelles par ce projet ?")) return;
    try {
      localStorage.setItem("intendance2", JSON.stringify(c));
    } catch (err) {
      msg("Import impossible : la mémoire du navigateur est pleine.");
      return;
    }
    location.reload();
  });
};
$("rst").onclick = () => {
  if (confirm("Tout effacer ? Exporte d'abord une sauvegarde.")) {
    localStorage.removeItem("intendance2");
    location.reload();
  }
};
go(
  (() => {
    try {
      const g = sessionStorage.getItem("pg");
      return PG[g] ? g : "eff";
    } catch (_) {
      return "eff";
    }
  })()
);
syncDrawer(false);
fillCamp();
drawCamps();
drawSw();
drawDiets();
drawDietEd();
drawMenu();
drawRec();
calc();
