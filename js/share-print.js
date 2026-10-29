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

/** iPhone et iPad : Safari ignore l'orientation demandée par la page (@page size) et imprime en portrait. */
const surIOS = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Téléphone ou tablette : l'aperçu d'impression de l'appli elle-même n'y est pas fiable (page vide sur iPhone, même page imprimée sur Android). */
const surTel = () => surIOS() || /Android|Mobile/i.test(navigator.userAgent);

/** Zoom d'impression du menu, de 0,85 à 1 : celui qui remplit le mieux les pages A4 (peu de blanc en bas de la dernière), sans jamais agrandir. Zone utile : 277 × 190 mm en paysage, 190 × 277 mm en portrait. Un document court garde 100 %. */
function zoomImpression(html, paysage = true) {
  const [larg, haut] = paysage ? [277, 190] : [190, 277],
    PX = 96 / 25.4,
    box = document.createElement("div"),
    inner = document.createElement("div");
  box.style.cssText = `position:absolute;left:-99999px;top:0;visibility:hidden;width:${larg * PX}px`;
  inner.innerHTML = html;
  box.appendChild(inner);
  document.body.appendChild(box);
  let meilleur = 1,
    min = Infinity;
  for (let z = 85; z <= 100; z++) {
    inner.style.zoom = z / 100;
    const p = inner.getBoundingClientRect().height / (haut * PX * 0.97),
      score = Math.ceil(p) - p + Math.abs(z - 100) / 100;
    if (score < min - 1e-9) {
      min = score;
      meilleur = z / 100;
    }
  }
  box.remove();
  return meilleur;
}

/** Imprime un document : en portrait à 100 %, sauf le menu (`menu` : paysage avec zoom automatique, en portrait sur iPhone/iPad, où Safari ignore l'orientation de la page). */
function printHTML(html, menu = false, nom = "Impression") {
  if (surTel()) return ouvrirPourImprimer(html, "Patro " + nom, menu);
  const paysage = menu;
  $("pv").innerHTML = html;
  $("pv").style.zoom = menu ? zoomImpression(html, paysage) : 1;
  let st = $("pgsz");
  if (!st) {
    st = document.createElement("style");
    st.id = "pgsz";
    document.head.appendChild(st);
  }
  st.textContent = `@page{size:A4 ${paysage ? "landscape" : "portrait"};margin:10mm}`;
  document.body.classList.add("pr");
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      alert("Impression impossible ici : utilise « Fichier HTML » puis imprime le fichier.");
    }
    // sur téléphone, print() rend la main avant que l'aperçu soit prêt : on garde la mise en page d'impression jusqu'à « afterprint »
    setTimeout(() => document.body.classList.remove("pr"), 30000);
  }, 80);
}

/** Navigateurs intégrés à une application (Google, Facebook, Instagram, Line, WeChat) : ils n'ouvrent pas de nouvel onglet. */
const surNavigateurInterne = () =>
  /GSA\/|FBAN|FBAV|Instagram|Line\/|MicroMessenger/.test(navigator.userAgent);

/** Téléphone : le document s'ouvre seul dans un nouvel onglet (même fichier que « Fichier HTML », mêmes réglages qu'à l'ordinateur) avec un bouton « Imprimer » ; l'impression se fait depuis cet onglet, qui ne contient rien d'autre. Sans nouvel onglet possible (application Google, fenêtre bloquée), le document remplace la page, avec un bouton « Retour à l'appli ». */
function ouvrirPourImprimer(html, nom, menu) {
  if (!surNavigateurInterne()) {
    const url = URL.createObjectURL(
      new Blob([docHTML(html, nom, menu, true)], { type: "text/html" })
    );
    if (window.open(url, "_blank")) {
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      return;
    }
    URL.revokeObjectURL(url);
  }
  document.open();
  document.write(docHTML(html, nom, menu, "retour"));
  document.close();
}

window.addEventListener("afterprint", () => document.body.classList.remove("pr"));

/* Mise en forme du « Fichier HTML » téléchargé : volontairement autonome (hors ligne, ouvert depuis n'importe quel dossier).
   À garder cohérent avec les règles .mp / .mt de styles.css. */
const DOC_CSS =
  "*{box-sizing:border-box}body{font:16px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2a22;background:#fff;max-width:900px;margin:auto;padding:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
  ".mp{--mc:#1f7a3f;--mcl:#1f7a3f22;--mct:#fff}.mp h2{font-size:1.4rem;margin:0 0 2px;padding-bottom:6px;border-bottom:3px solid var(--mc)}.mp h3{margin:16px 0 2px;break-after:avoid}.s{color:#5c6f62;font-size:.88rem}" +
  ".mt{width:100%;border-collapse:collapse;font-size:.95rem;margin-top:10px}.mt th{background:#2a3b2f;color:#fff;text-align:left;padding:8px 10px}.mt td{padding:7px 10px;border-bottom:1px solid var(--mcl);vertical-align:top}" +
  ".mt tr,.mt tbody.dg,.mt td>div{break-inside:avoid;page-break-inside:avoid}.mt tr.day td{background:#dfe8e1;font-weight:700;border-top:2px solid #2a3b2f}.mt tr.sl td{background:var(--mcl)}.mt tr.sl td.sn{background:var(--mc);color:var(--mct);font-weight:700;width:84px}" +
  "[hidden]{display:none!important}.rmain{min-width:0;overflow-x:auto}.rup{color:#1f7a3f;text-decoration:none;font-size:.8rem}.rnav a,.rbar a{color:#1f7a3f}.rnav h4{margin:12px 0 2px}.rnav ul{margin:2px 0 0;padding-left:1.2em}.rnav li{margin:2px 0}.rnav li a.on{font-weight:700}" +
  ".rbar{position:sticky;top:0;z-index:2;background:#fff;padding:6px 0 8px;border-bottom:1px solid #dfe8e1;margin-bottom:4px}.rchips{display:flex;flex-wrap:wrap;gap:6px}.rchips a{border:1px solid #bcd0c2;border-radius:16px;padding:4px 12px;font-size:.88rem;text-decoration:none;background:#f3f8f4}.rchips a.on{background:#1f7a3f;border-color:#1f7a3f;color:#fff}.rchips a.on .s{color:inherit}.js .rnav h4{display:none}.mt .ad a{color:#1f7a3f}" +
  "@media(min-width:800px){body:has(.rlay){max-width:1200px}.rlay{display:grid;grid-template-columns:280px minmax(0,1fr);gap:18px;align-items:start}.rbar{grid-column:1/-1}.rnav{position:sticky;top:64px;max-height:calc(100vh - 80px);overflow:auto}}" +
  "@media print{.np{display:none}.rlay{display:block}}" +
  ".mt .ad{font-size:.8rem;color:#5c6f62;font-style:italic}.mt td.sn .ad{color:inherit;font-style:normal;font-weight:700}.mt td.ck{width:1.4em;text-align:center}" +
  ".mt .q{margin-top:3px;font-size:.82rem;line-height:1.5}.mt .q span+span::before{content:' · ';color:#8a9a8f}.mt .qh{margin-top:4px;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#5c6f62}" +
  ".mt .qb{margin-top:4px;display:grid;grid-template-columns:repeat(auto-fill,minmax(12em,1fr));gap:0 18px;font-size:.82rem}.mt .qb div span{min-width:0;overflow-wrap:anywhere}.mt .qb div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dotted #1f7a3f55;padding:1px 0}.mt .qb b{white-space:nowrap}";

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
function docHTML(html, name, menu = false, bouton = false) {
  // sur téléphone (Android comme iPhone), l'orientation et la taille de la page sont décidées par la fenêtre d'impression du système : le document est mis en page pour du portrait, sans zoom, et à la largeur d'une page A4 (718 px à 96 ppp) pour que Chrome Android ne le réduise pas
  const tel = surTel(),
    paysage = menu && !tel,
    zoom = menu && !tel ? zoomImpression(html, true) : 1,
    viewport = bouton && tel && !surIOS() ? "width=718" : "width=device-width,initial-scale=1",
    android = bouton && tel && !surIOS(),
    // Safari (iPhone) ne sait pas garder une ligne de tableau entière sur une page : chaque repas devient un petit tableau à part, que Safari ne coupe pas
    ios =
      html.includes('class="sl"') && surIOS()
        ? "@media print{.mt,.mt thead,.mt tbody{display:block}.mt thead tr,.mt tbody:not(.dg) tr{display:table;width:100%;table-layout:fixed}.mt tbody:not(.dg) tr{break-inside:avoid;page-break-inside:avoid}.mt tbody.dg{display:table;width:100%;table-layout:fixed;break-inside:avoid;page-break-inside:avoid}.mt tbody.dg tr.day{display:table-caption;caption-side:top}.mt tbody.dg tr.day td{display:block}.mt tr.sl td.sn,.mt thead th:first-child{width:84px}.mt td:nth-child(2):not(:last-child),.mt thead th:nth-child(2):not(:last-child){width:40%}}"
        : "",
    impression =
      `@media print{body{max-width:none;padding:0;zoom:${zoom}}}` +
      ios +
      (android
        ? "@media screen{.np button{font-size:2.2rem;margin:0 8px 12px 0}.np .s{font-size:1.6rem}}"
        : ""),
    page = `@page{size:A4 ${paysage ? "landscape" : "portrait"};margin:10mm}`,
    // Android : la fenêtre d'impression choisit portrait ou paysage ; Chrome imprime avec la largeur de la page (viewport), qu'on règle donc selon le sens choisi
    imp =
      "function imp(o){var p=o=='p';document.querySelector('meta[name=viewport]').content='width='+(p?718:1047);document.getElementById('pgs').textContent='@page{size:A4 '+(p?'portrait':'landscape')+';margin:10mm}';setTimeout(function(){try{print()}catch(e){}},400)}",
    btn = (js, txt, fond) =>
      `<button onclick="${js}" style="font:inherit;font-weight:700;padding:12px 18px;border:0;border-radius:10px;background:${fond};color:#fff">${txt}</button> `;
  return (
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="' +
    viewport +
    '"><title>' +
    esc(name) +
    "</title><style>" +
    DOC_CSS +
    impression +
    '</style><style id="pgs">' +
    page +
    "</style></head><body>" +
    (bouton === "retour"
      ? '<p class="np"><button onclick="location.reload()" style="font:inherit;font-weight:700;padding:12px 18px;border:2px solid #1f7a3f;border-radius:10px;background:#fff;color:#1f7a3f">↩ Retour à l\'appli</button></p>'
      : "") +
    (bouton
      ? '<p class="np">' +
        (android
          ? btn("imp('p')", "🖨️ Imprimer en portrait", "#1f7a3f") +
            btn("imp('l')", "🖨️ Imprimer en paysage", "#2a3b2f") +
            '<br><span class="s">Choisis le même sens (portrait ou paysage) dans la fenêtre d\'impression.</span><script>' +
            imp +
            "</script>"
          : btn("try{print()}catch(e){}", "🖨️ Imprimer / Enregistrer en PDF", "#1f7a3f") +
            '<br><span class="s">Si rien ne s\'ouvre (Chrome sur iPhone) : menu Partager du navigateur, puis « Imprimer » ou « Enregistrer dans Fichiers ».</span>') +
        "</p>"
      : "") +
    html +
    (html.includes("data-recnav") ? "<script>" + NAV_JS + "</script>" : "") +
    "</body></html>"
  );
}

const nomHTML = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".html";

function dlHTML(html, name, menu = false) {
  // iPhone et iPad (Chrome compris) ne téléchargent pas un fichier créé par la page : il s'ouvre dans un onglet, d'où on l'enregistre ou l'imprime par le menu Partager
  if (surIOS()) return ouvrirPourImprimer(html, name, menu);
  dl(docHTML(html, name, menu), nomHTML(name), "text/html");
}

const shmsg = (t) => {
  $("shm").textContent = t;
  setTimeout(() => ($("shm").textContent = ""), 2500);
};

$("plist").onclick = () => printHTML(listHTML(), false, "Liste de courses");

$("pmenu").onclick = () => printHTML(menuHTML(), true, "Menu");

$("sp").onclick = () => printHTML(shk()[2](), $("shw").value === "menu", shk()[0]);

$("sd").onclick = () => dlHTML(shk()[2](), "Patro " + shk()[0], $("shw").value === "menu");

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
    menu = $("shw").value === "menu",
    fichier = new File([docHTML(html, nom, menu)], nomHTML(nom), { type: "text/html" }),
    telecharge = () => {
      dlHTML(html, nom, menu);
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
