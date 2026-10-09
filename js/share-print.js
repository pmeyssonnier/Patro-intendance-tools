/* Intendance PSS – Impression, fichier HTML téléchargeable, partage (WhatsApp, mail, copie).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const SH = {
  list: ["Liste de courses", txtList, listHTML, csvList],
  menu: ["Menu", txtMenu, menuHTML, csvMenu],
  prices: ["Catalogue de prix", txtPrices, pricesHTML, csvPrices],
  recs: [
    "Recettes",
    () => recettesTriees().map(txtRec).join("\n\n"),
    () => recHTML(recettesTriees()),
    () => csvRec(recettesTriees()),
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
  "[hidden]{display:none!important}.rmain{min-width:0;overflow-x:auto}.rup{color:#1f7a3f;text-decoration:none;font-size:.8rem}.rnav a,.rbar a{color:#1f7a3f}.rnav h4{margin:12px 0 2px}.rnav ul{margin:2px 0 0;padding-left:1.2em}.rnav li{margin:2px 0}.rnav li a.on{font-weight:700}" +
  ".rbar{position:sticky;top:0;z-index:2;background:#fff;padding:6px 0 8px;border-bottom:1px solid #dfe8e1;margin-bottom:4px}.rchips{display:flex;flex-wrap:wrap;gap:6px}.rchips a{border:1px solid #bcd0c2;border-radius:16px;padding:4px 12px;font-size:.88rem;text-decoration:none;background:#f3f8f4}.rchips a.on{background:#1f7a3f;border-color:#1f7a3f;color:#fff}.rchips a.on .s{color:inherit}.js .rnav h4{display:none}.mt .ad a{color:#1f7a3f}" +
  "@media(min-width:800px){body:has(.rlay){max-width:1200px}.rlay{display:grid;grid-template-columns:280px minmax(0,1fr);gap:18px;align-items:start}.rbar{grid-column:1/-1}.rnav{position:sticky;top:64px;max-height:calc(100vh - 80px);overflow:auto}}" +
  "@media print{.np{display:none}.rlay{display:block}}" +
  ".mt .ad{font-size:.8rem;color:#5c6f62;font-style:italic}.mt td.sn .ad{color:inherit;font-style:normal;font-weight:700}.mt td.ck{width:1.4em;text-align:center}";

/* Navigation du fichier HTML des recettes : choisir un type filtre la liste et les recettes affichées ; choisir une recette n'affiche qu'elle. Sans script, tout reste affiché. */
const NAV_JS =
  '(function(){var d=document;d.body.className+=" js";var recs=[].slice.call(d.querySelectorAll(".rec")),chips=[].slice.call(d.querySelectorAll("[data-t]")),lists=[].slice.call(d.querySelectorAll("[data-l]")),links=[].slice.call(d.querySelectorAll("[data-r]"));' +
  "function showRecs(ids){recs.forEach(function(r){r.hidden=ids.indexOf(r.id)<0})}" +
  'function idsOf(t){var l=d.querySelector(\'[data-l="\'+t+\'"]\');return [].map.call(l.querySelectorAll("[data-r]"),function(a){return a.getAttribute("data-r")})}' +
  'function pickType(t){chips.forEach(function(c){c.classList.toggle("on",c.getAttribute("data-t")===t)});lists.forEach(function(l){l.hidden=l.getAttribute("data-l")!==t});links.forEach(function(a){a.classList.remove("on")});showRecs(idsOf(t))}' +
  'chips.forEach(function(c){c.addEventListener("click",function(e){e.preventDefault();pickType(c.getAttribute("data-t"))})});' +
  'links.forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();var id=a.getAttribute("data-r");links.forEach(function(x){x.classList.toggle("on",x.getAttribute("data-r")===id)});showRecs([id]);if(window.innerWidth<800){var m=d.querySelector(".rmain");if(m)m.scrollIntoView()}})});' +
  'pickType("all")})();';

/** Document HTML complet et autonome (celui du « Fichier HTML » et de l'envoi par WhatsApp, Partager et Mail). */
function docHTML(html, name) {
  return (
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    esc(name) +
    "</title><style>" +
    DOC_CSS +
    "</style></head><body>" +
    html +
    (html.includes("data-recnav") ? "<script>" + NAV_JS + "</script>" : "") +
    "</body></html>"
  );
}

const nomHTML = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".html";

function dlHTML(html, name) {
  dl(docHTML(html, name), nomHTML(name), "text/html");
}

const shmsg = (t) => {
  $("shm").textContent = t;
  setTimeout(() => ($("shm").textContent = ""), 2500);
};

$("plist").onclick = () => printHTML(listHTML());

$("pmenu").onclick = () => printHTML(menuHTML());

$("sp").onclick = () => printHTML(shk()[2]());

$("sd").onclick = () => dlHTML(shk()[2](), "Patro " + shk()[0]);

$("sx").onclick = () => dlCsv(shk()[0], shk()[3]());

$("lcsv").onclick = () => dlCsv("Liste de courses", csvList());

/* Envoi par WhatsApp, Mail ou Partager : un fichier HTML (le même que « Fichier HTML »).
   Le fichier passe par le menu de partage de l'appareil (un simple lien WhatsApp ou mail ne peut pas transporter de fichier).
   Sans partage de fichier (navigateur de bureau qui ne sait pas), le fichier est téléchargé à joindre au message. */
function envoyerHTML(canal) {
  if (!shk()[1]().trim()) return shmsg("Rien à partager.");
  const nom = "Patro " + shk()[0],
    titre = troop() + " – " + shk()[0],
    html = shk()[2](),
    fichier = new File([docHTML(html, nom)], nomHTML(nom), { type: "text/html" }),
    telecharge = () => {
      dlHTML(html, nom);
      shmsg("Fichier téléchargé : joins-le à ton message.");
    };
  if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
    shmsg(
      canal === "wa"
        ? "Choisis WhatsApp dans la liste."
        : canal === "mail"
          ? "Choisis ta messagerie dans la liste."
          : ""
    );
    navigator.share({ files: [fichier], title: titre }).catch((e) => {
      if (e && e.name === "AbortError") return;
      telecharge();
    });
    return;
  }
  telecharge();
  const court = titre + " (fichier HTML en pièce jointe)";
  if (canal === "wa")
    window.open("https://wa.me/?text=" + encodeURIComponent(court), "_blank", "noopener");
  else if (canal === "mail")
    location.href =
      "mailto:?subject=" + encodeURIComponent(titre) + "&body=" + encodeURIComponent(court);
}

$("sw").onclick = () => envoyerHTML("wa");

$("sm").onclick = () => envoyerHTML("mail");

if (!navigator.share) $("sn").style.display = "none";

$("sn").onclick = () => envoyerHTML("autre");
