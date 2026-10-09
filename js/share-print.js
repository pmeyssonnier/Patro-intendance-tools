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

function dlHTML(html, name) {
  dl(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      esc(name) +
      "</title><style>" +
      DOC_CSS +
      "</style></head><body>" +
      html +
      (html.includes("data-recnav") ? "<script>" + NAV_JS + "</script>" : "") +
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

/* Longueur d'un lien : les messageries coupent les textes trop longs (WhatsApp, et surtout les logiciels de mail : environ 2 000 caractères une fois encodé).
   Au-delà, on envoie le début (coupé à une fin de ligne), et le texte complet est copié pour être collé à la suite. */
const LIEN_MAX = { wa: 3000, mail: 1800 };

/** Texte à mettre dans un lien : entier s'il est assez court, sinon coupé à une fin de ligne avec une mention. Renvoie { texte, coupe }. */
function texteDeLien(t, max, reste) {
  if (encodeURIComponent(t).length <= max) return { texte: t, coupe: false };
  const fin = "\n… (suite : colle le texte complet, copié)",
    place = max - encodeURIComponent(fin).length - reste;
  let n = t.length;
  while (n > 0 && encodeURIComponent(t.slice(0, n)).length > place) n = Math.floor(n * 0.9);
  const cut = t.lastIndexOf("\n", n);
  return { texte: t.slice(0, cut > 0 ? cut : n) + fin, coupe: true };
}

/** Lien WhatsApp (wa.me) et lien mail pour un texte, avec le texte réellement envoyé. */
function lienWhatsApp(t) {
  const r = texteDeLien(t, LIEN_MAX.wa, "https://wa.me/?text=".length);
  return { url: "https://wa.me/?text=" + encodeURIComponent(r.texte), coupe: r.coupe };
}

function lienMail(t, sujet) {
  const debut = "mailto:?subject=" + encodeURIComponent(sujet) + "&body=",
    r = texteDeLien(t, LIEN_MAX.mail, debut.length);
  return { url: debut + encodeURIComponent(r.texte), coupe: r.coupe };
}

/** Copie un texte : API moderne, sinon repli par un champ temporaire (navigateurs intégrés à une appli, pages sans HTTPS). Résout true si c'est copié. */
function copierTexte(t) {
  const repli = () => {
    const a = document.createElement("textarea");
    a.value = t;
    a.setAttribute("readonly", "");
    a.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(a);
    a.select();
    try {
      return document.execCommand("copy");
    } catch (_) {
      return false;
    } finally {
      a.remove();
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText)
    return navigator.clipboard.writeText(t).then(
      () => true,
      () => repli()
    );
  return Promise.resolve(repli());
}

$("sw").onclick = () => {
  const t = shtxt();
  if (!t) return;
  const l = lienWhatsApp(t);
  if (l.coupe && navigator.share) {
    // texte trop long pour un lien : le menu de partage du téléphone passe le texte entier à WhatsApp, sans passer par une adresse
    shmsg("Texte long : choisis WhatsApp dans la liste.");
    navigator.share({ title: troop() + " – " + shk()[0], text: t }).catch((e) => {
      if (e && e.name !== "AbortError") shmsg("Partage impossible : utilise « Copier ».");
    });
    return;
  }
  if (l.coupe)
    copierTexte(t).then((ok) =>
      shmsg(
        ok
          ? "Texte long : début envoyé, texte complet copié."
          : "Texte long : seul le début est envoyé."
      )
    );
  window.open(l.url, "_blank", "noopener");
};

$("sm").onclick = () => {
  const t = shtxt();
  if (!t) return;
  const l = lienMail(t, troop() + " – " + shk()[0]);
  if (l.coupe)
    copierTexte(t).then((ok) =>
      shmsg(
        ok
          ? "Texte long : début dans le mail, texte complet copié."
          : "Texte long : seul le début est dans le mail."
      )
    );
  else shmsg("Pas de messagerie qui s'ouvre ? Utilise « Copier ».");
  location.href = l.url;
};

if (!navigator.share) $("sn").style.display = "none";

$("sn").onclick = () => {
  const t = shtxt();
  if (!t) return;
  navigator.share({ title: troop() + " – " + shk()[0], text: t }).catch((e) => {
    if (e && e.name !== "AbortError") shmsg("Partage impossible : utilise « Copier ».");
  });
};

$("sc").onclick = () => {
  const t = shtxt();
  if (!t) return;
  copierTexte(t).then((ok) => shmsg(ok ? "Copié ✅" : "Copie impossible"));
};
