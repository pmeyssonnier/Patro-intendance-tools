/* Intendance PSS – Impression, fichier HTML téléchargeable, partage (WhatsApp, mail, copie).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const SH = {
  list: ["Liste de courses", txtList, listHTML, csvList],
  menu: ["Menu", txtMenu, menuHTML, csvMenu],
  prices: ["Catalogue de prix", txtPrices, pricesHTML, csvPrices],
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
  ".mt .ad{font-size:.8rem;color:#5c6f62;font-style:italic}.mt td.sn .ad{color:inherit;font-style:normal;font-weight:700}.mt td.ck{width:1.4em;text-align:center}";

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
      encodeURIComponent(troop() + " – " + shk()[0]) +
      "&body=" +
      encodeURIComponent(t);
};

if (!navigator.share) $("sn").style.display = "none";

$("sn").onclick = () => {
  const t = shtxt();
  if (t) navigator.share({ title: troop() + " – " + shk()[0], text: t }).catch(() => {});
};

$("sc").onclick = () => {
  const t = shtxt();
  if (!t) return;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
    () => shmsg("Copié ✅"),
    () => shmsg("Copie impossible")
  );
};
