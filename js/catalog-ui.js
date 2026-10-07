/* Intendance PSS – Catalogue de prix : affichage et interactions (tableau, import, ingrédients, fusion, doublons).
   Seul fichier du catalogue qui touche aux éléments de la page : la logique est dans ingredient-matching.js,
   ingredients.js, ingredient-merge.js et price-import.js. Script classique : voir l'ordre de chargement dans index.html. */

/** Ingrédient en cours de modification dans le catalogue (identifiant) ou null. */
let catEdit = null;

/** Ingrédient en modification dans la page Recettes (identifiant) ou null. */
let recEdit = null;

const catUnits = [
  ["g", "g (prix au kg)"],
  ["ml", "ml (prix au L)"],
  ["pc", "pièce (prix à la pièce)"],
];

/** Choix « Attention régime » : mêmes options que le formulaire d'ajout de la page Recettes (+ « Personnalisé » si les règles actuelles n'en font pas partie). */
const OPTIONS_REGIME = $("ingg").innerHTML;
const optionsRegime = (cle) =>
  OPTIONS_REGIME.replace(`value="${cle}"`, `value="${cle}" selected`) +
  (cle === "perso" ? '<option value="perso" selected>Personnalisé (voir Régimes)</option>' : "");

function refreshIng() {
  catEdit = recEdit = null;
  drawRec();
  drawDietEd();
  drawMenu();
  calc();
}

/** Rayon choisi dans la liste de filtre du catalogue ("" = tous). */
let catRayon = "";

/** Remplit la liste des rayons (triée par ordre alphabétique, avec le nombre d'ingrédients) en gardant le choix en cours. */
function majListeRayons() {
  const n = {};
  for (const k of Object.keys(ING)) if (!S.hid.includes(k)) n[catOf(k)] = (n[catOf(k)] || 0) + 1;
  const total = Object.values(n).reduce((a, b) => a + b, 0);
  if (catRayon && !CATS.some((c) => c[0] === catRayon)) catRayon = "";
  $("crayon").innerHTML =
    `<option value="">Tous les rayons (${total})</option>` +
    [...CATS]
      .sort((a, b) => a[1].localeCompare(b[1], "fr"))
      .map(
        ([cle, nom]) =>
          `<option value="${cle}"${cle === catRayon ? " selected" : ""}>${esc(nom)} (${n[cle] || 0})</option>`
      )
      .join("");
}

function drawCat() {
  majListeRayons();
  // l'exemple ne sert qu'à démarrer : inutile dès que des produits sont déjà associés aux ingrédients
  $("csvx").style.display = Object.values(S.pn).some(Boolean) ? "none" : "";
  const q = plain($("cfilt").value.trim());
  const keys = Object.keys(ING).filter(
    (k) =>
      !S.hid.includes(k) &&
      (!catRayon || catOf(k) === catRayon) &&
      (!q || plain(ING[k][0] + " " + (S.pn[k] || "")).includes(q))
  );
  $("ct").innerHTML =
    lignesCat(keys) ||
    `<tr><td>${q || catRayon ? "Aucun ingrédient ne correspond au filtre." : "Aucun ingrédient."}</td></tr>`;
}

/** Fiche de modification d'un ingrédient (nom, unité, prix, régime, rayon, boutons), la même dans le catalogue et dans les recettes.
    `boutons` : HTML ajouté au début de la rangée de boutons (ex. « → quantité unique » sur la page Recettes). */
function ficheIngredient(k, boutons = "") {
  return `<div class="fw"><div class="edg"><div class="eg-nom"><label>Nom</label><input type="text" value="${esc(ING[k][0])}" data-en="${esc(k)}" aria-label="Nom de l'ingrédient" maxlength="100"></div><div class="eg-uni"><label>Unité</label><select data-eu="${esc(k)}" aria-label="Unité de l'ingrédient">${catUnits.map(([u, l]) => `<option value="${u}"${u === ING[k][1] ? " selected" : ""}>${l}</option>`).join("")}</select></div><div class="eg-prix"><label>Prix (€)</label><input type="number" step="0.05" min="0" value="${price(k)}" data-ep="${esc(k)}" aria-label="Prix de l'ingrédient"></div><div class="eg-reg"><label>Attention régime</label><select data-eg="${esc(k)}" aria-label="Attention régime de l'ingrédient">${optionsRegime(regimeActuel(k))}</select></div><div class="eg-ray"><label>Rayon</label><select data-ec="${esc(k)}" aria-label="Rayon de l'ingrédient">${optionsCat(catOf(k))}</select></div></div><div class="s" data-ei="${esc(k)}" role="status">${esc(editInfo(k, ING[k][1]))}</div><div class="eg-btn">${boutons}<button data-eok="${esc(k)}">Valider</button><button class="x" data-edel="${esc(k)}">Effacer</button><button class="x" data-emg="${esc(k)}">Fusionner</button><button class="x" data-eno="${esc(k)}">Annuler</button>${S.ov[k] ? `<button class="x" data-ers="${esc(k)}">Rétablir « ${esc(ING0[k][0])} »</button>` : ""}</div></div>`;
}

/** Les lignes du tableau des prix pour des ingrédients (avec, pour celui en cours de modification, sa ligne d'édition). */
function lignesCat(keys) {
  return keys
    .map(
      (k) =>
        (catEdit === k ? `<tr class="ced"><td colspan="4">${ficheIngredient(k)}</td></tr>` : "") +
        `<tr><td>${esc(ING[k][0])}<div class="s manq" style="color:#d33"${price(k) ? " hidden" : ""}>⚠ prix manquant</div>${produitLien(k)}${etiquettePromo(k)}</td><td>€/${ING[k][1] === "pc" ? "pièce" : ul(k)}</td><td><input type="number" step="0.05" min="0" value="${price(k)}" class="${price(k) ? "" : "nop"}" data-cp="${esc(k)}" aria-label="Prix de ${esc(ING[k][0])}"></td><td><button class="x" data-ced="${esc(k)}" title="Modifier, fusionner ou supprimer cet ingrédient" aria-label="Modifier ${esc(ING[k][0])}">✎</button></td></tr>`
    )
    .join("");
}

$("cfilt").addEventListener("input", drawCat);

$("crayon").onchange = () => {
  catRayon = $("crayon").value;
  drawCat();
};

$("ct").addEventListener("change", (e) => {
  const k = e.target.dataset.cp;
  if (k) {
    poserPrix(k, saisie(e.target.value, 1e5));
    e.target.classList.toggle("nop", !price(k));
    e.target.closest("tr").querySelector(".manq").hidden = !!price(k);
    calc();
  }
});

/** Branche la fiche de modification sur un tableau : `racine` le contient, `ouvrir(k)` l'ouvre (null : ferme), `redessiner()` redessine la page. */
function brancherFiche(racine, ouvrir, redessiner) {
  racine.addEventListener("change", (e) => {
    const k = e.target.dataset.eu || e.target.dataset.eg;
    if (!k) return;
    const ligne = racine.querySelector(`[data-en="${k}"]`).closest("tr");
    ligne.querySelector("[data-ei]").textContent = editInfo(
      k,
      ligne.querySelector("[data-eu]").value,
      ligne.querySelector("[data-eg]").value
    );
  });

  racine.addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-ced]"),
      d = bouton ? bouton.dataset : e.target.dataset;
    if (d.ced) {
      // un seul ingrédient en modification à la fois ; un second clic sur le même le referme (page Recettes)
      ouvrir(racine === $("rb") && recEdit === d.ced ? null : d.ced);
      redessiner();
      return;
    }
    if (d.eno) {
      ouvrir(null);
      redessiner();
      return;
    }
    if (d.eok || d.ers) {
      const k = d.eok || d.ers,
        ligne = racine.querySelector(`[data-en="${k}"]`).closest("tr"),
        champP = ligne.querySelector("[data-ep]"),
        nom = d.ers ? ING0[k][0] : ligne.querySelector("[data-en]").value,
        unite = d.ers ? ING0[k][1] : ligne.querySelector("[data-eu]").value,
        dg = d.ers ? undefined : ligne.querySelector("[data-eg]").value,
        cat = d.ers ? undefined : ligne.querySelector("[data-ec]").value,
        err = editIng(k, nom, unite, dg, cat);
      if (err) ligne.querySelector("[data-ei]").textContent = "⚠ " + err;
      else {
        // prix modifié dans la fenêtre de modification (comme dans le tableau : il remplace le produit retenu)
        if (!d.ers && champP.value !== champP.defaultValue) poserPrix(k, saisie(champP.value, 1e5));
        refreshIng();
      }
      return;
    }
    if (d.emg) return ouvrirFusion(d.emg);
    const k = d.edel;
    if (!k) return;
    const refus = refusSuppression(k);
    if (refus) {
      alert(refus);
      return;
    }
    if (!confirm("Supprimer « " + ING[k][0] + " » ?")) return;
    rmIng(k);
    catEdit = recEdit = null;
    drawRec();
    drawDietEd();
    calc();
  });
}

brancherFiche($("ct"), (k) => (catEdit = k), drawCat);
brancherFiche($("rb"), (k) => (recEdit = k), drawRec);

/** Exporte les prix du catalogue en .json, au format que « Choisir un fichier » sait relire. */
$("cexp").onclick = () => {
  const jour = new Date().toISOString().slice(0, 10);
  dl(catalogueJson(jour), "catalogue-prix-" + jour + ".json", "application/json");
};

$("csvx").onclick = () =>
  dl(
    "Spaghetti Boni 500g;1,39\nRiz long grain Boni 1kg;1,95\nLait demi-écrémé 1L;1,05\nHaché pur bœuf 500g;4,99\nJambon cuit 4 tranches 200g;2,89\n",
    "exemple-prix.csv",
    "text/csv"
  );

/** Produits du JSON absents du catalogue : cases à cocher pour les ajouter à l'import. */
function drawInconnus() {
  const z = $("pnew"),
    liste = pendingInconnus;
  z.hidden = !liste.length;
  z.innerHTML = liste.length
    ? `<p class="s"><b>${liste.length} produit${liste.length > 1 ? "s" : ""} absent${liste.length > 1 ? "s" : ""} de ton catalogue.</b> Décoche ceux dont tu n'as pas besoin (ils ne sont pas ajoutés aux recettes) : <button class="x" id="pall">Tout cocher / décocher</button></p>` +
      liste
        .map(
          (u, i) =>
            `<label><input type="checkbox" data-pn="${i}" checked> ${esc(u.nom)} — ${u.prix.toFixed(2)} €/${u.unite === "pc" ? "pièce" : u.unite === "g" ? "kg" : "L"}</label>${u.lien ? ` <a href="${esc(u.lien)}" target="_blank" rel="noopener noreferrer" title="Ouvrir la fiche du produit sur colruyt.be">🔗</a>` : ""}`
        )
        .join("<br>") +
      `<p><button id="padd"></button></p>`
    : "";
  majBoutonAjout();
}

/** Libellé du bouton sous la liste : « Ajouter ces 7 produits » (ceux qui sont cochés). */
function majBoutonAjout() {
  const b = $("padd");
  if (!b) return;
  const n = $("pnew").querySelectorAll("[data-pn]:checked").length;
  b.disabled = !n;
  b.textContent = n
    ? `➕ Ajouter ${n > 1 ? "ces " + n + " produits" : "ce produit"}`
    : "Aucun produit coché";
}

/** Crée au catalogue les produits cochés de la liste ; renvoie le nombre ajouté. */
function ajouterCoches() {
  return ajouterInconnus(
    [...$("pnew").querySelectorAll("[data-pn]:checked")].map((c) => +c.dataset.pn)
  );
}

$("pnew").addEventListener("click", (e) => {
  if (e.target.id === "padd") {
    const n = ajouterCoches();
    drawInconnus();
    $("impmsg").textContent =
      `${n} ingrédient${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""} au catalogue.`;
    $("impres").textContent = $("impmsg").textContent;
    refreshIng();
    if (!pendingInconnus.length) fermerImportPrix();
    return;
  }
  if (e.target.id !== "pall") return;
  const cases = [...$("pnew").querySelectorAll("[data-pn]")],
    tout = cases.some((c) => !c.checked);
  cases.forEach((c) => (c.checked = tout));
  majBoutonAjout();
});

$("pnew").addEventListener("change", majBoutonAjout);

$("csv").addEventListener("input", () => {
  pendingJson = null;
  pendingInconnus = [];
  masquerComparaison();
  drawInconnus();
});

/** Aperçu détaillé d'un fichier de prix JSON : ce qui change (prix, produit, rayon, promo, lien) par rapport au catalogue actuel. */
function drawComparaison(pj) {
  const { lignes, avantB, apresB } = comparerPrix(pj),
    pct = (x) => (x > 0 ? "+" : "") + x.toFixed(1).replace(".", ",") + " %",
    unite = (k) => (ING[k][1] === "pc" ? "pièce" : ul(k));
  const n = (f) => lignes.filter(f).length,
    puces = [
      ["🔺", n((l) => l.etat === "hausse"), "hausse", "hausses"],
      ["🔻", n((l) => l.etat === "baisse"), "baisse", "baisses"],
      ["＝", n((l) => l.etat === "egal"), "inchangé", "inchangés"],
      ["🆕", n((l) => l.etat === "nouveau"), "prix renseigné", "prix renseignés"],
      ["🏷️", n((l) => l.promo), "promo", "promos"],
      ["📂", n((l) => l.rayon), "rayon renseigné", "rayons renseignés"],
      ["🔗", n((l) => l.lien), "lien produit", "liens produit"],
      [
        "🛒",
        n((l) => l.produit && l.produitAvant && l.produit !== l.produitAvant),
        "produit changé",
        "produits changés",
      ],
    ]
      .filter(([, c]) => c)
      .map(([i, c, un, pl]) => `<span>${i} ${c} ${c > 1 ? pl : un}</span>`)
      .join("");
  const budget =
    Math.abs(apresB - avantB) > 0.004
      ? `<p class="s">Budget de la liste de courses : ${eur(avantB)} → <b>${eur(apresB)}</b> (${apresB > avantB ? "+" : "−"}${eur(Math.abs(apresB - avantB))})</p>`
      : "";
  const nom = (l) => esc(ING[l.k][0]);
  $("cmp").innerHTML =
    `<div class="cmpc">${puces}</div>${budget}` +
    `<label class="s" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="cmpseul" style="width:auto"${$("cmp").classList.contains("seul") ? " checked" : ""}> Voir seulement ce qui change</label>` +
    `<div class="cmpl">${lignes
      .map((l) => {
        const badge =
          l.etat === "egal"
            ? "inchangé"
            : l.etat === "nouveau"
              ? "nouveau prix"
              : `${l.etat === "hausse" ? "🔺" : "🔻"} ${pct(l.pct)}`;
        const prod = l.produit
          ? l.lien
            ? `<a href="${esc(l.lien)}" target="_blank" rel="noopener noreferrer">↳ ${esc(l.produit)} 🔗</a>`
            : `↳ ${esc(l.produit)}`
          : l.lien
            ? `<a href="${esc(l.lien)}" target="_blank" rel="noopener noreferrer">🔗 Fiche produit</a>`
            : "";
        const plus = [
          l.produit && l.produitAvant && l.produit !== l.produitAvant
            ? `produit changé (avant : ${esc(l.produitAvant)})`
            : "",
          l.rayon ? `rayon : ${esc(CATS.find((c) => c[0] === l.rayon)[1])}` : "",
          l.promo
            ? `🏷️ promo ${eur(l.promo.p)}/${unite(l.k)}${l.promo.t ? " (" + esc(l.promo.t) + ")" : ""}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return `<div class="cmpi ${l.etat}"><div class="cmph"><b>${nom(l)}</b><span class="cmpd">${badge}</span></div><div class="s">${l.avant > 0 ? eur(l.avant) + " → " : ""}<b>${eur(l.p)}</b>/${unite(l.k)}</div>${prod ? `<div class="s">${prod}</div>` : ""}${plus ? `<div class="s">${plus}</div>` : ""}</div>`;
      })
      .join("")}</div>`;
  $("cmp").hidden = false;
  $("csv").hidden = true;
}

$("cmp").addEventListener("change", (e) => {
  if (e.target.id === "cmpseul") $("cmp").classList.toggle("seul", e.target.checked);
});

/** Revient à la zone de texte (CSV / liste collée) : l'aperçu détaillé du JSON est masqué. */
function masquerComparaison() {
  $("cmp").hidden = true;
  $("cmp").innerHTML = "";
  $("csv").hidden = false;
}

/** Charge le contenu d'un fichier de prix (CSV, texte ou JSON) dans l'aperçu ; le JSON n'est appliqué qu'au clic sur « Importer ». */
function chargerPrix(nom, texte) {
  pendingJson = null;
  pendingInconnus = [];
  masquerComparaison();
  drawInconnus();
  const json = /\.json$/i.test(nom);
  const pj = json ? parsePrixJson(texte) : null;
  if (json && !pj) {
    $("csv").value = "";
    $("impmsg").textContent = "Fichier JSON de prix non reconnu (clé « ingredients » attendue).";
    return;
  }
  if (!pj) {
    $("csv").value = texte;
    return;
  }
  pendingJson = pj;
  pendingInconnus = pj.inconnus;
  drawInconnus();
  drawComparaison(pj);
  $("csv").value = pj.lignes
    .map(
      (l) =>
        `${ING[l[0]][0]} : ${price(l[0]).toFixed(2)} → ${l[1].toFixed(2)} €/${ING[l[0]][1] === "pc" ? "pièce" : ul(l[0])}` +
        (l[3] ? ` (relié par le nom : « ${l[3]} »)` : "")
    )
    .join("\n");
  const d = pj.date.split("-").reverse().join("/");
  $("impmsg").textContent =
    `${pj.source}${d ? ", " + d : ""} : ${pj.lignes.length} prix prêts` +
    (pj.ignores ? ` (${pj.ignores} ignorés)` : "") +
    (pj.inconnus.length
      ? `, ${pj.inconnus.length} absents du catalogue (liste sous l’aperçu)`
      : "") +
    ". Vérifie l'aperçu puis clique sur « Importer ».";
}

/** Ouvre la fenêtre d'import (messages et aperçu vides). */
function ouvrirImportPrix() {
  $("impmsg").textContent = "";
  $("impres").textContent = "";
  if (!$("impdlg").open) $("impdlg").showModal();
}

/** Referme la fenêtre d'import : l'état de l'aperçu est remis à zéro par l'événement « close ». */
function fermerImportPrix() {
  if ($("impdlg").open) $("impdlg").close();
}

// quelle que soit la façon de fermer (Importer, Annuler, Échap), on repart d'une fenêtre vide
$("impdlg").addEventListener("close", () => {
  pendingJson = null;
  pendingInconnus = [];
  masquerComparaison();
  $("csv").value = "";
  $("file").value = "";
  $("fname").textContent = "Aucun fichier choisi";
  drawInconnus();
});

// un clic sur le fond (hors de la fenêtre) la referme
$("impdlg").addEventListener("click", (e) => {
  const r = $("impdlg").getBoundingClientRect();
  if (
    e.target === $("impdlg") &&
    (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
  )
    fermerImportPrix();
});

$("file2").onclick = () => $("file").click();
$("iopen").onclick = ouvrirImportPrix;
$("impno").onclick = fermerImportPrix;

$("file").onchange = (e) => {
  const f = e.target.files[0];
  if (f && !$("impdlg").open) ouvrirImportPrix();
  $("fname").textContent = f ? f.name : "Aucun fichier choisi";
  if (f) {
    const r = new FileReader();
    r.onload = () => chargerPrix(f.name, r.result);
    r.readAsText(f);
  }
};

/** Récupère le dernier fichier de prix publié avec l'appli (aucun service externe appelé, aucun crédit consommé). */
$("pfetch").onclick = async () => {
  ouvrirImportPrix();
  $("impmsg").textContent = "Récupération des prix…";
  let texte;
  try {
    texte = await lirePrixPublies();
  } catch {
    $("impmsg").textContent =
      "Aucun fichier de prix publié pour le moment (ou pas de connexion). Charge un fichier avec « Choisir un fichier ».";
    return;
  }
  $("fname").textContent = "prix_colruyt.json (publié)";
  chargerPrix("prix_colruyt.json", texte);
};

/** Fin d'un import : le résultat reste affiché sur la page et la fenêtre se referme, sauf s'il reste des produits absents à ajouter. */
function finImport() {
  $("impres").textContent = $("impmsg").textContent;
  if (!pendingInconnus.length) fermerImportPrix();
}

$("imp").onclick = () => {
  if (pendingJson) {
    const pj = pendingJson;
    pendingJson = null;
    masquerComparaison();
    appliquerPrixJson(pj);
    const d = pj.date.split("-").reverse().join("/");
    $("impmsg").textContent =
      `${pj.lignes.length} prix chargés (${pj.source}${d ? ", " + d : ""}).` +
      (pj.ignores ? ` ${pj.ignores} ignorés.` : "") +
      (pendingInconnus.length
        ? ` ${pendingInconnus.length} produits absents restent à ajouter avec le bouton sous la liste.`
        : "");
    finImport();
    calc();
    return;
  }
  const r = importerCsv($("csv").value);
  $("impmsg").textContent =
    `${r.lus} produits lus, ${r.relies} ingrédients reliés. Vérifie les ↳ dans les tableaux.`;
  finImport();
  calc();
};

/* Nouvel ingrédient : une seule fenêtre, ouverte depuis le catalogue (« Insérer ») ou depuis une recette (« Nouvel ingrédient ») */
const uniteTexte = { g: "en poids, g", ml: "en liquide, ml", pc: "à la pièce" };

/** true : la fenêtre a été ouverte depuis la page Recettes, l'ingrédient créé est aussi ajouté à la recette affichée. */
let ingVersRecette = false;

function ouvrirIngredient(versRecette) {
  ingVersRecette = !!versRecette && !!S.rec[S.cur];
  $("ingn").value = "";
  $("ingp").value = "";
  $("ingu").value = "g";
  $("ingg").innerHTML = OPTIONS_REGIME;
  $("ingc").value = "aut";
  $("ingctx").textContent = ingVersRecette
    ? `Il sera aussi ajouté à la recette « ${S.cur} ».`
    : "Il sera ajouté au catalogue, sans être mis dans une recette.";
  $("ingm").textContent = "";
  $("ingdup").hidden = true;
  if (!$("ingdlg").open) $("ingdlg").showModal();
  $("ingn").focus();
}

function fermerIngredient() {
  if ($("ingdlg").open) $("ingdlg").close();
}

/** Crée l'ingrédient saisi (prix facultatif) et, depuis une recette, l'y ajoute. */
function creerDepuisFenetre(nom, unite) {
  ajouterIngredient(
    nom,
    unite,
    $("ingg").value,
    $("ingc").value,
    saisie($("ingp").value, 1e5),
    ingVersRecette ? S.cur : null
  );
  fermerIngredient();
  $("cinm").textContent = "« " + nom + " » ajouté.";
  setTimeout(() => ($("cinm").textContent = ""), 2500);
  refreshIng();
}

/** Contrôle le nom (et l'unité) puis crée l'ingrédient ; `confirme` = l'utilisateur a accepté de créer un doublon. */
function validerIngredient(confirme) {
  const nom = $("ingn").value.trim().replace(/\s+/g, " "),
    unite = $("ingu").value;
  if (!nom) return ($("ingm").textContent = "Donne un nom à l'ingrédient.");
  $("ingm").textContent = "";
  const d = doublonsNom(nom, unite);
  if (!confirme && (d.exact.length || d.autre.length)) {
    const k = d.exact[0] || d.autre[0];
    $("ingdupt").textContent = d.exact.length
      ? `« ${ING[k][0]} » existe déjà (${uniteTexte[unite]}). Créer quand même un ingrédient en double ?`
      : `« ${ING[k][0]} » existe déjà, mais ${uniteTexte[ING[k][1]]} (toi : ${uniteTexte[unite]}). Créer quand même un deuxième ingrédient ?`;
    // depuis une recette : on peut reprendre l'ingrédient existant (même avec une autre unité : la quantité sera dans son unité)
    $("inguse").hidden = !ingVersRecette;
    $("inguse").dataset.k = k;
    $("inguse").textContent =
      `Utiliser « ${ING[k][0]} »` + (ING[k][1] === unite ? "" : ` (${uniteTexte[ING[k][1]]})`);
    $("ingdup").hidden = false;
    return;
  }
  creerDepuisFenetre(nom, unite);
}

$("cins").onclick = () => ouvrirIngredient(false);
$("inew").onclick = () => ouvrirIngredient(true);
$("ingno").onclick = fermerIngredient;
$("ingok").onclick = () => validerIngredient(false);
$("ingforce").onclick = () => validerIngredient(true);
$("ingback").onclick = () => {
  $("ingdup").hidden = true;
  $("ingn").focus();
};
$("inguse").onclick = () => {
  if (ingVersRecette) utiliserIngredient($("inguse").dataset.k, S.cur);
  fermerIngredient();
  refreshIng();
};
// changer le nom ou l'unité annule l'avertissement de doublon
["ingn", "ingu"].forEach((i) => $(i).addEventListener("input", () => ($("ingdup").hidden = true)));
$("ingn").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("ingok").click();
});
$("ingdlg").addEventListener("click", (e) => {
  const r = $("ingdlg").getBoundingClientRect();
  if (
    e.target === $("ingdlg") &&
    (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
  )
    fermerIngredient();
});

/* Fusion de deux ingrédients (doublons déjà utilisés dans des recettes) */

/** Ingrédient en cours de fusion (celui dont on a cliqué sur ⇄). */
let fusionDepuis = null;

/** Texte de la fenêtre de fusion selon l'autre ingrédient et le sens choisis. */
function majFusion() {
  const a = fusionDepuis,
    b = $("mgb").value;
  if (!ING[a] || !ING[b]) return;
  const { src, dst } = sensFusion(a, b, $("mgs2").checked),
    rec = recettesDe(src);
  $("mgl1").textContent = `Garder « ${ING[b][0]} » (« ${ING[a][0]} » est supprimé)`;
  $("mgl2").textContent = `Garder « ${ING[a][0]} » (« ${ING[b][0]} » est supprimé)`;
  $("mgp").textContent =
    `« ${ING[src][0]} » ${rec.length ? "est utilisé dans " + rec.join(", ") + " : ses quantités vont dans" : "n'est dans aucune recette ; il sera supprimé et"} « ${ING[dst][0]} »${rec.length ? "" : " est conservé"}.`;
  $("mgm").textContent = "";
}

function ouvrirFusion(k) {
  const cand = candidatsFusion(k);
  fusionDepuis = k;
  $("mga").textContent = ING[k][0];
  $("mgb").innerHTML = cand
    .map(
      (x) =>
        `<option value="${esc(x)}">${esc(ING[x][0])}${cleNom(ING[x][0]) === cleNom(ING[k][0]) ? " — doublon probable" : ""}</option>`
    )
    .join("");
  $("mgs1").checked = true;
  $("mgok").disabled = !cand.length;
  if (cand.length) majFusion();
  else {
    $("mgl1").textContent = $("mgl2").textContent = "";
    $("mgp").textContent = "";
    $("mgm").textContent = "Aucun autre ingrédient n'a la même unité.";
  }
  if (!$("mgdlg").open) $("mgdlg").showModal();
}

/* Vérifier les doublons : liste les ingrédients de même nom et de même unité, avec le choix du sens de la fusion (A → B ou B → A) */

const nbRecettes = (k) => {
  const n = recettesDe(k).length;
  return n ? ` · ${n} recette${n > 1 ? "s" : ""}` : "";
};

function drawDoublons() {
  const gs = groupesDoublons(),
    autres = doublonsUnitesDifferentes();
  $("dpl").innerHTML =
    gs
      .map((l, i) => {
        const infos = l
          .map(
            (k) =>
              `<div class="s">« ${esc(ING[k][0])} » (${esc(ING[k][1])})${esc(nbRecettes(k))}</div>`
          )
          .join("");
        const boutons =
          l.length === 2
            ? l
                .map(
                  (k, j) =>
                    `<button class="x" data-dsrc="${esc(k)}" data-ddst="${esc(l[1 - j])}">« ${esc(ING[k][0])} » → « ${esc(ING[l[1 - j]][0])} »</button>`
                )
                .join("")
            : l
                .map(
                  (k) =>
                    `<button class="x" data-dall="${esc(k)}" data-dgrp="${i}">Tout dans « ${esc(ING[k][0])} »</button>`
                )
                .join("");
        return `<div class="dpg">${infos}<div class="row2">${boutons}</div></div>`;
      })
      .join("") ||
    '<p class="s">✅ Aucun doublon : chaque ingrédient a un nom et une unité différents.</p>';
  $("dpm").textContent = autres.length
    ? "Même nom mais unités différentes (non fusionnables tels quels, change l'unité de l'un avec ✎ d'abord) : " +
      autres.map((l) => l.map((k) => `« ${ING[k][0]} » (${ING[k][1]})`).join(" / ")).join(" ; ")
    : "";
}

$("cdbl").onclick = () => {
  drawDoublons();
  if (!$("dpdlg").open) $("dpdlg").showModal();
};
$("dpno").onclick = () => $("dpdlg").close();
$("dpdlg").addEventListener("click", (e) => {
  const r = $("dpdlg").getBoundingClientRect();
  if (
    e.target === $("dpdlg") &&
    (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
  )
    $("dpdlg").close();
});
$("dpl").addEventListener("click", (e) => {
  const d = e.target.dataset;
  let paires;
  if (d.dsrc) paires = [[d.dsrc, d.ddst]];
  else if (d.dall) paires = pairesDansGroupe(+d.dgrp, d.dall);
  else return;
  if (!paires.length) return;
  const nomsSrc = paires.map(([s]) => `« ${ING[s][0]} »`).join(", ");
  if (
    !confirm(`Fusionner ${nomsSrc} dans « ${ING[paires[0][1]][0]} » ? Cette action est définitive.`)
  )
    return;
  const err = fusionnerPaires(paires);
  if (err) $("dpm").textContent = err;
  refreshIng();
  const msg = $("dpm").textContent;
  drawDoublons();
  if (msg) $("dpm").textContent = msg;
});

$("mgb").onchange = majFusion;
$("mgs1").onchange = $("mgs2").onchange = majFusion;
$("mgno").onclick = () => $("mgdlg").close();
$("mgok").onclick = () => {
  const { src, dst } = sensFusion(fusionDepuis, $("mgb").value, $("mgs2").checked),
    nomSrc = ING[src][0],
    nomDst = ING[dst][0],
    err = fusionnerIng(src, dst);
  if (err) return ($("mgm").textContent = err);
  $("mgdlg").close();
  $("cinm").textContent = `« ${nomSrc} » fusionné dans « ${nomDst} ».`;
  setTimeout(() => ($("cinm").textContent = ""), 3500);
  refreshIng();
};

$("ingc").innerHTML = optionsCat("aut");
