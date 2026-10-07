/* Intendance PSS – Petits outils partagés : accès au DOM ($), échappement HTML, formats, quantités, téléchargement, contraste des couleurs.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const $ = (i) => document.getElementById(i);

// Date « AAAA-MM-JJ » réelle : « 2026-02-30 » est refusée au lieu d'être décalée au 2 mars.
// Ici (et non dans state.js) car storage.js, chargé avant state.js, en a besoin.
const dateReelle = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
};

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );

/** Description de recette → HTML sûr : **gras**, __souligné__ et retours à la ligne ; tout le reste est échappé. */
const fmtDesc = (t) =>
  esc(t)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/\n/g, "<br>");

/** Description de recette sans les marques de mise en forme (texte à partager, CSV). */
const descTexte = (t) =>
  String(t ?? "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1");

/** Nom de produit sans la marque répétée au début (Colruyt : « EVERYDAY EVERYDAY spaghetti 500g » → « EVERYDAY spaghetti 500g »). */
const nomProduit = (t) =>
  String(t).replace(/^([A-ZÀ-Ý0-9'.&-]+(?: [A-ZÀ-Ý0-9'.&-]+)*?) \1(?= )/, "$1");

/** Adresse d'une fiche produit Colruyt si elle est bien en https://www.colruyt.be/…, sinon "" (un fichier de prix ou de projet ne doit pas pouvoir mettre un autre site, ni javascript:). */
const lienColruyt = (u) =>
  typeof u === "string" &&
  u.length <= 200 &&
  /^https:\/\/www\.colruyt\.be\/[A-Za-z0-9/._~%?=&#:-]*$/.test(u)
    ? u
    : "";

const eur = (v) => v.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });

const price = (k) => S.prices[k] ?? ING[k][2],
  per = (k) => (ING[k][1] === "pc" ? 1 : 1000),
  ul = (k) => (ING[k][1] === "ml" ? "L" : ING[k][1] === "pc" ? "pc" : "kg"),
  troop = () => (S.troop || "").trim() || TROOP0,
  nn = () => C.n.reduce((a, b) => a + b, 0);

/** Nombre saisi dans un champ : fini, entre 0 et `max` (0 si vide ou invalide). Le « min » du HTML n'empêche pas un « -5 » d'arriver au gestionnaire. */
const saisie = (v, max = 1e6) => {
  v = +v;
  return Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0;
};

const fxu = (k) => (ING[k][1] === "pc" ? 1 : 1000),
  fxl = (k) => ({ g: "kg", ml: "L", pc: "pièces" })[ING[k][1]];

/** Arrondi au supérieur sans les erreurs de calcul décimal : 6,000000000000001 (somme de 0,2 × effectifs) ou 2,000001 (2/3 arrondi × 3) donnent 6 et 2, pas 7 et 3. */
const ceilp = (q) => Math.ceil(Math.round(q * 1e4) / 1e4);

function qty(k, q) {
  const u = ING[k][1];
  if (u === "pc") return ceilp(q) + " pc";
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
