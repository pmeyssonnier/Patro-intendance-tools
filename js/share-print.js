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
