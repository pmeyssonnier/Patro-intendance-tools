/* Intendance PSS – Stockage : validation des données (import et chargement), localStorage, avertissement d'enregistrement, export / import / réinitialisation du projet.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const ID = /^[A-Za-z0-9_]{1,40}$/,
  HEX = /^#[0-9a-fA-F]{6}$/;

const okid = (k) => ID.test(k) && k !== "__proto__",
  obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

const str = (v, max, d) => (typeof v === "string" ? v.slice(0, max) : d || ""),
  num = (v, min, max, d) => {
    v = +v;
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d || 0;
  };

const ent = (o) => (obj(o) ? Object.entries(o).slice(0, 500) : []),
  qn = (a, N) => Array.from({ length: N }, (_, i) => num((Array.isArray(a) ? a : [])[i], 0, 1e6));

const MAXSEC = 12;

/** Sections [nom, âges] d'un fichier : 1 à 12, noms non vides ; null si la liste est absente ou inutilisable. */
function cleanSec(a) {
  if (!Array.isArray(a)) return null;
  const l = a
    .filter((s) => Array.isArray(s) && typeof s[0] === "string")
    .slice(0, MAXSEC)
    .map((s, i) => [s[0].trim().slice(0, 40) || "Section " + (i + 1), str(s[1], 30).trim()]);
  return l.length ? l : null;
}

function cleanCamp(c, N) {
  if (!obj(c)) return null;
  const o = {
    name: str(c.name, 80, "Camp"),
    start: dateReelle(c.start) ? c.start : "",
    end: dateReelle(c.end) ? c.end : "",
    n: qn(c.n, N).map((v) => Math.min(v, 1e4)),
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
    if (okid(k) && Array.isArray(v)) o.dt[k] = qn(v, N).map((x) => Math.min(x, 1e4));
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
  const sec = cleanSec(x.sec),
    N = sec ? sec.length : SEC0.length;
  if (sec) o.sec = sec;
  if (typeof x.troop === "string") o.troop = str(x.troop, 60).trim();
  for (const [n, r] of ent(x.rec)) {
    if (!n || n.length > 100 || n === "__proto__" || !obj(r)) continue;
    const R = { desc: str(r.desc, 5000), ing: {} };
    for (const [k, a] of ent(r.ing)) if (okid(k) && Array.isArray(a)) R.ing[k] = qn(a, N);
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
      const cc = cleanCamp(c, N);
      if (cc) o.camps[k] = cc;
    }
    if (!Object.keys(o.camps).length) throw new Error("aucun camp valide dans ce fichier.");
    o.ccur = typeof x.ccur === "string" && o.camps[x.ccur] ? x.ccur : Object.keys(o.camps)[0];
  } else {
    o.n = qn(x.n, N).map((v) => Math.min(v, 1e4));
    o.wa = num(x.wa, 0, 500, 10);
    o.notes = str(x.notes, 5000);
    o.mt = str(x.mt, 80, "Menu du camp");
    o.dt = {};
    for (const [k, v] of ent(x.dt))
      if (okid(k) && Array.isArray(v)) o.dt[k] = qn(v, N).map((z) => Math.min(z, 1e4));
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

let sfail = 0;

const showWarn = (t) => {
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
