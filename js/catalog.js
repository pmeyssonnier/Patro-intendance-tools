/* Intendance PSS – Catalogue de prix : saisie et import de produits (CSV / texte).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Minuscules et sans accents, pour que « cereales » trouve « Céréales ». */
const plain = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Ingrédient en cours de modification dans le catalogue (identifiant) ou null. */
let catEdit = null;

const catUnits = [
  ["g", "g (prix au kg)"],
  ["ml", "ml (prix au L)"],
  ["pc", "pièce (prix à la pièce)"],
];

/** Recettes qui utilisent un ingrédient. */
const recettesDe = (k) =>
  Object.entries(S.rec)
    .filter(([, r]) => k in r.ing)
    .map(([n]) => n);

const famille = (u) => (u === "pc" ? "pc" : "poids");

/** Régimes concernés par « Attention régime » (ceux de DMAP) dans lesquels un ingrédient a une règle. */
const dietsDMAP = [...new Set(Object.values(DMAP).flat())];

/** « Attention régime » actuelle d'un ingrédient (clé de DMAP, "" pour aucune), ou "perso" si ses règles ne correspondent à aucun choix. */
function regimeActuel(k) {
  const en = dietsDMAP.filter((d) => DIETS[d] && k in DIETS[d].ex);
  for (const [cle, ds] of [["", []], ...Object.entries(DMAP)]) {
    const a = ds.filter((d) => DIETS[d]);
    if (a.length === en.length && a.every((d) => en.includes(d))) return cle;
  }
  return "perso";
}

/** Choix « Attention régime » : mêmes options que le formulaire d'ajout de la page Recettes (+ « Personnalisé » si les règles actuelles n'en font pas partie). */
const optionsRegime = (cle) =>
  $("idiet").innerHTML.replace(`value="${cle}"`, `value="${cle}" selected`) +
  (cle === "perso" ? '<option value="perso" selected>Personnalisé (voir Régimes)</option>' : "");

/** Texte d'avertissement affiché pendant la modification d'un ingrédient (nouvelle unité et nouvelle attention régime choisies ou non). */
function editInfo(k, unite, dg) {
  const rec = recettesDe(k),
    u0 = ING[k][1];
  let t = rec.length
    ? `Utilisé dans ${rec.length} recette${rec.length > 1 ? "s" : ""} : ${rec.slice(0, 5).join(", ")}${rec.length > 5 ? "…" : ""}. Le nouveau nom s'affichera partout (recettes, liste de courses, documents).`
    : "Pas utilisé dans une recette.";
  if (unite !== u0) {
    if (famille(unite) !== famille(u0))
      t += rec.length
        ? " ⚠ Changement impossible : g/ml ⇄ pièce n'est pas permis tant que l'ingrédient est dans une recette."
        : " Le prix de cet ingrédient sera remis à zéro (unité différente).";
    else
      t +=
        " g ⇄ ml : quantités et prix sont conservés (le prix devient par L au lieu de par kg, ou l'inverse).";
  }
  if (dg !== undefined && dg !== "perso" && dg !== regimeActuel(k)) {
    const nouveau = DMAP[dg] || [],
      perdus = dietsDMAP.filter((d) => DIETS[d] && DIETS[d].ex[k] && !nouveau.includes(d));
    if (perdus.length)
      t += ` ⚠ Les remplacements actuels seront supprimés pour : ${perdus.map((d) => DIETS[d].n).join(", ")}.`;
  }
  return t;
}

/** Applique une « Attention régime » à un ingrédient : crée ou retire ses règles dans les régimes concernés. */
function appliquerRegime(k, dg) {
  const voulus = DMAP[dg] || [];
  for (const d of dietsDMAP) {
    if (!DIETS[d]) continue;
    if (voulus.includes(d)) {
      if (!(k in DIETS[d].ex)) DIETS[d].ex[k] = null;
    } else delete DIETS[d].ex[k];
  }
  if (S.cust[k]) S.cust[k][5] = [...voulus];
}

/** Valide et applique un nouveau nom / une nouvelle unité. Renvoie un message d'erreur, ou "" si c'est fait. */
function editIng(k, nom, unite, dg, cat) {
  nom = nom.trim().replace(/\s+/g, " ");
  if (!nom) return "Le nom ne peut pas être vide.";
  if (nom.length > 100) return "Nom trop long (100 caractères au plus).";
  const ancien = ING[k][0],
    u0 = ING[k][1],
    cle = (t) => [...motsNom(t)].sort().join(" ") || plain(t);
  if (cle(nom) !== cle(ancien)) {
    const dbl = Object.keys(ING).find((x) => x !== k && cle(ING[x][0]) === cle(nom));
    if (dbl)
      return `Un ingrédient s'appelle déjà « ${ING[dbl][0]} » (majuscules, accents et pluriel comptent pour pareil).`;
  }
  const autre = famille(unite) !== famille(u0);
  if (autre && recettesDe(k).length)
    return "L'unité ne peut pas passer de g/ml à pièce (ni l'inverse) : l'ingrédient est utilisé dans des recettes. Retire-le d'abord des recettes.";
  ING[k][0] = nom;
  ING[k][1] = unite;
  if (S.cust[k]) {
    // mots-clés de l'import de texte : ils suivent le nom quand ils venaient de l'ancien nom
    const kw = (t) => t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (ING[k][3] === kw(ancien)) ING[k][3] = kw(nom);
  } else if (nom === ING0[k][0] && unite === ING0[k][1]) delete S.ov[k];
  else S.ov[k] = { n: nom, u: unite };
  if (autre) {
    S.prices[k] = 0;
    delete S.pn[k];
    delete S.promo[k];
    delete S.url[k];
  }
  if (dg !== undefined && dg !== "perso" && dg !== regimeActuel(k)) appliquerRegime(k, dg);
  if (CATS.some((c) => c[0] === cat)) {
    if (cat === (CAT0[k] || "aut")) delete S.cat[k];
    else S.cat[k] = cat;
  }
  return "";
}

function refreshIng() {
  catEdit = null;
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

/** Les lignes du tableau des prix pour des ingrédients (avec, pour celui en cours de modification, sa ligne d'édition). */
function lignesCat(keys) {
  return keys
    .map(
      (k) =>
        (catEdit === k
          ? `<tr class="ced"><td colspan="4"><div class="g"><div><label>Nom</label><input type="text" value="${esc(ING[k][0])}" data-en="${esc(k)}" aria-label="Nom de l'ingrédient" maxlength="100"></div><div><label>Unité</label><select data-eu="${esc(k)}" aria-label="Unité de l'ingrédient">${catUnits.map(([u, l]) => `<option value="${u}"${u === ING[k][1] ? " selected" : ""}>${l}</option>`).join("")}</select></div><div><label>Attention régime</label><select data-eg="${esc(k)}" aria-label="Attention régime de l'ingrédient">${optionsRegime(regimeActuel(k))}</select></div><div><label>Rayon</label><select data-ec="${esc(k)}" aria-label="Rayon de l'ingrédient">${optionsCat(catOf(k))}</select></div><div style="align-self:end"><button data-eok="${esc(k)}">Valider</button> <button class="x" data-eno="${esc(k)}">Annuler</button>${S.ov[k] ? ` <button class="x" data-ers="${esc(k)}">Rétablir « ${esc(ING0[k][0])} »</button>` : ""}</div></div><div class="s" data-ei="${esc(k)}" role="status">${esc(editInfo(k, ING[k][1]))}</div></td></tr>`
          : "") +
        `<tr><td>${esc(ING[k][0])}${produitLien(k)}${etiquettePromo(k)}</td><td>€/${ING[k][1] === "pc" ? "pièce" : ul(k)}</td><td><input type="number" step="0.05" min="0" value="${price(k)}" data-cp="${esc(k)}" aria-label="Prix de ${esc(ING[k][0])}"></td><td><button class="x" data-ced="${esc(k)}" title="Modifier le nom ou l'unité" aria-label="Modifier ${esc(ING[k][0])}">✎</button> <button class="x" data-chd="${esc(k)}" title="Supprimer cet ingrédient" aria-label="Supprimer ${esc(ING[k][0])}">✕</button></td></tr>`
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
    S.prices[k] = +e.target.value || 0;
    delete S.pn[k];
    delete S.promo[k]; // le prix saisi à la main n'est plus celui du produit en promotion
    delete S.url[k]; // ni celui du produit dont on gardait le lien
    calc();
  }
});

$("ct").addEventListener("change", (e) => {
  const k = e.target.dataset.eu || e.target.dataset.eg;
  if (!k) return;
  const ligne = $("ct").querySelector(`[data-en="${k}"]`).closest("tr");
  ligne.querySelector("[data-ei]").textContent = editInfo(
    k,
    ligne.querySelector("[data-eu]").value,
    ligne.querySelector("[data-eg]").value
  );
});

$("ct").addEventListener("click", (e) => {
  const d = e.target.dataset;
  if (d.ced) {
    catEdit = d.ced;
    drawCat();
    return;
  }
  if (d.eno) {
    catEdit = null;
    drawCat();
    return;
  }
  if (d.eok || d.ers) {
    const k = d.eok || d.ers,
      ligne = $("ct").querySelector(`[data-en="${k}"]`).closest("tr"),
      nom = d.ers ? ING0[k][0] : ligne.querySelector("[data-en]").value,
      unite = d.ers ? ING0[k][1] : ligne.querySelector("[data-eu]").value,
      dg = d.ers ? undefined : ligne.querySelector("[data-eg]").value,
      cat = d.ers ? undefined : ligne.querySelector("[data-ec]").value,
      err = editIng(k, nom, unite, dg, cat);
    if (err) ligne.querySelector("[data-ei]").textContent = "⚠ " + err;
    else refreshIng();
    return;
  }
  const k = e.target.dataset.chd;
  if (!k) return;
  const rec = recettesDe(k);
  if (rec.length) {
    alert(
      "Suppression impossible : « " +
        ING[k][0] +
        " » est utilisé dans " +
        (rec.length > 1 ? rec.length + " recettes" : "une recette") +
        " (" +
        rec.join(", ") +
        "). Retire-le d'abord de la recette."
    );
    return;
  }
  if (!confirm("Supprimer « " + ING[k][0] + " » ?")) return;
  rmIng(k);
  drawRec();
  drawDietEd();
  calc();
});

/** Exporte les prix du catalogue en .json, au format que « Choisir un fichier » sait relire. */
$("cexp").onclick = () => {
  const unit = { g: "kg", ml: "l", pc: "piece" },
    ingredients = {};
  Object.keys(ING)
    .filter((k) => !S.hid.includes(k))
    .forEach((k) => {
      ingredients[k] = {
        nom: ING[k][0],
        categorie: catOf(k),
        unite: unit[ING[k][1]],
        prix_unitaire: price(k),
        produit: {
          nom: prodName(k),
        },
      };
    });
  const jour = new Date().toISOString().slice(0, 10);
  dl(
    JSON.stringify(
      { source: "Export du catalogue de prix", date_maj: jour + "T00:00:00", ingredients },
      null,
      2
    ),
    "catalogue-prix-" + jour + ".json",
    "application/json"
  );
};

$("csvx").onclick = () =>
  dl(
    "Spaghetti Boni 500g;1,39\nRiz long grain Boni 1kg;1,95\nLait demi-écrémé 1L;1,05\nHaché pur bœuf 500g;4,99\nJambon cuit 4 tranches 200g;2,89\n",
    "exemple-prix.csv",
    "text/csv"
  );

let pendingJson = null; // prix JSON lus, appliqués au clic sur « Importer »
let pendingInconnus = []; // produits du JSON absents du catalogue, ajoutés avec le bouton sous leur liste

/** Mots significatifs d'un nom, sans accents ni majuscules ni pluriel : « Pâtes à tartiner » et « pate a tartiner » donnent {pate, tartiner}. */
const motsNom = (t) =>
  new Set(
    plain(t)
      .split(/[^a-z0-9]+/)
      .filter((m) => m.length > 2 && !["des", "les", "aux", "une", "pour"].includes(m))
      .map((m) => (m.length > 3 ? m.replace(/[sx]$/, "") : m))
  );

/** Ingrédient du catalogue qui correspond à un nom (« poivron rouge » → « Poivrons »), ou null si aucun ou si plusieurs se valent. */
function ingParNom(nom, exclus, unite) {
  const B = motsNom(nom);
  if (!B.size) return null;
  let best = null,
    score = 0,
    ex = false;
  for (const k of Object.keys(ING)) {
    if (
      S.hid.includes(k) ||
      exclus.has(k) ||
      unite !== { g: "kg", ml: "l", pc: "piece" }[ING[k][1]]
    )
      continue;
    const A = motsNom(ING[k][0]),
      inter = [...A].filter((m) => B.has(m)).length;
    // tous les mots de l'un doivent figurer dans l'autre ; le plus proche l'emporte
    if (!A.size || (inter < A.size && inter < B.size)) continue;
    const sc = inter / Math.max(A.size, B.size);
    if (sc > score) {
      best = k;
      score = sc;
      ex = false;
    } else if (sc === score) ex = true;
  }
  return ex ? null : best;
}

/** Lit un JSON de prix (format Colruyt) : renvoie { lignes: [[id, prix, nom, via]], ignores, date, source } ou null.
    Un ingrédient est relié par son identifiant ; à défaut, par son nom (« nom » ou « requete » du JSON). */
function parsePrixJson(txt) {
  let j;
  try {
    j = JSON.parse(txt.replace(/^\uFEFF/, ""));
  } catch (e) {
    return null;
  }
  if (!j || typeof j.ingredients !== "object" || j.ingredients === null) return null;
  const unit = { g: "kg", ml: "l", pc: "piece" };
  const lignes = [],
    inconnus = [],
    pris = new Set(Object.keys(j.ingredients).filter((k) => ING[k]));
  let ignores = 0;
  const produit = (x) => {
    const pr = x.produit || {};
    // Colruyt met déjà la marque au début du nom (« EVERYDAY spaghetti 500g ») : ne pas la doubler
    const nom = String(pr.nom || ""),
      marque = String(pr.marque || "");
    return nomProduit(
      (marque && !nom.toLowerCase().startsWith(marque.toLowerCase())
        ? marque + " " + nom
        : nom
      ).trim()
    );
  };
  for (const cle in j.ingredients) {
    const x = j.ingredients[cle] || {},
      p = +x.prix_unitaire,
      u = String(x.unite).toLowerCase();
    let k = ING[cle] ? cle : null,
      via = "";
    if (!k && p > 0) {
      const nom = x.nom || x.requete;
      k = nom ? ingParNom(nom, pris, u) : null;
      if (k) {
        pris.add(k);
        via = String(nom);
      }
    }
    if (!k || !(p > 0) || u !== unit[ING[k][1]]) {
      // produit absent du catalogue mais exploitable : proposé à l'ajout
      const nom = String(x.nom || x.requete || "").trim(),
        unPc = { kg: "g", l: "ml", piece: "pc" }[u];
      const existe = ["kg", "l", "piece"].some((v) => ingParNom(nom, new Set(), v));
      if (!k && p > 0 && nom && unPc && nom.length <= 100 && !existe) {
        inconnus.push({
          nom,
          unite: unPc,
          prix: +p.toFixed(2),
          produit: produit(x),
          categorie: String(x.categorie || ""),
          lien: lienColruyt(x.lien),
          promo:
            x.promo && +x.promo.prix_unitaire > 0 && +x.promo.prix_unitaire < p
              ? {
                  p: +(+x.promo.prix_unitaire).toFixed(2),
                  t: String(x.promo.texte || "").slice(0, 60),
                }
              : null,
        });
      } else ignores++;
      continue;
    }
    lignes.push([
      k,
      +p.toFixed(2),
      produit(x),
      via,
      CATS.some((c) => c[0] === x.categorie) ? x.categorie : "",
      // promotion du fichier : seulement si elle est moins chère que le prix normal
      x.promo && +x.promo.prix_unitaire > 0 && +x.promo.prix_unitaire < p
        ? { p: +(+x.promo.prix_unitaire).toFixed(2), t: String(x.promo.texte || "").slice(0, 60) }
        : null,
      lienColruyt(x.lien),
    ]);
  }
  return {
    lignes,
    inconnus,
    ignores,
    date: String(j.date_maj || "").slice(0, 10),
    source: j.source || "JSON",
  };
}

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
            `<label><input type="checkbox" data-pn="${i}" checked> ${esc(u.nom)} — ${u.prix.toFixed(2)} €/${u.unite === "pc" ? "pièce" : u.unite === "g" ? "kg" : "L"}</label>`
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

/** Crée au catalogue les produits cochés de la liste (avec leur prix), sans les mettre dans une recette ; renvoie le nombre ajouté. */
function ajouterInconnus() {
  const idx = [...$("pnew").querySelectorAll("[data-pn]:checked")].map((c) => +c.dataset.pn);
  idx.forEach((i) => {
    const u = pendingInconnus[i],
      k = createIng(u.nom, u.unite, "", u.categorie);
    S.prices[k] = u.prix;
    if (u.promo) S.promo[k] = u.promo;
    if (u.lien) S.url[k] = u.lien;
    if (u.produit) S.pn[k] = u.produit;
  });
  pendingInconnus = pendingInconnus.filter((_, i) => !idx.includes(i));
  return idx.length;
}

$("pnew").addEventListener("click", (e) => {
  if (e.target.id === "padd") {
    const n = ajouterInconnus();
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
  drawInconnus();
});

/** Charge le contenu d'un fichier de prix (CSV, texte ou JSON) dans l'aperçu ; le JSON n'est appliqué qu'au clic sur « Importer ». */
function chargerPrix(nom, texte) {
  pendingJson = null;
  pendingInconnus = [];
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
    const res = await fetch("prix/prix_colruyt.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    texte = await res.text();
  } catch {
    $("impmsg").textContent =
      "Aucun fichier de prix publié pour le moment (ou pas de connexion). Charge un fichier avec « Choisir un fichier ».";
    return;
  }
  $("fname").textContent = "prix_colruyt.json (publié)";
  chargerPrix("prix_colruyt.json", texte);
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

/** Fin d'un import : le résultat reste affiché sur la page et la fenêtre se referme, sauf s'il reste des produits absents à ajouter. */
function finImport() {
  $("impres").textContent = $("impmsg").textContent;
  if (!pendingInconnus.length) fermerImportPrix();
}

$("imp").onclick = () => {
  if (pendingJson) {
    const pj = pendingJson;
    pendingJson = null;
    pj.lignes.forEach(([k, p, n, , cat, promo, lien]) => {
      if (promo) S.promo[k] = promo;
      else delete S.promo[k];
      if (lien) S.url[k] = lien;
      else delete S.url[k];
      // le rayon du fichier ne sert que pour un ingrédient qui n'en a pas encore (ni choisi, ni par défaut)
      if (cat && !S.cat[k] && !CAT0[k]) S.cat[k] = cat;
      S.prices[k] = p;
      if (n) S.pn[k] = n;
      else delete S.pn[k];
    });
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
      delete S.promo[k];
      delete S.url[k];
      S.pn[k] = c[0] + (c[2] ? " (→ €/kg ou €/L calculé)" : " (prix pris tel quel)");
      hit++;
    }
  }
  $("impmsg").textContent =
    `${items.length} produits lus, ${hit} ingrédients reliés. Vérifie les ↳ dans les tableaux.`;
  finImport();
  calc();
};

/* Insérer un ingrédient depuis le catalogue (sans l'ajouter à une recette) */
$("cins").onclick = () => {
  $("cinf").style.display = "grid";
  $("cinn").value = "";
  $("cinp").value = "";
  $("cing").innerHTML = optionsRegime("");
  $("cinc").value = "aut";
  $("cinn").focus();
};

$("cinno").onclick = () => {
  $("cinf").style.display = "none";
};

$("cinok").onclick = () => {
  const nom = $("cinn").value.trim().replace(/\s+/g, " "),
    cle = (t) => [...motsNom(t)].sort().join(" ") || plain(t);
  if (!nom) return ($("cinm").textContent = "Donne un nom à l'ingrédient.");
  const dbl = Object.keys(ING).find((x) => cle(ING[x][0]) === cle(nom));
  if (dbl) return ($("cinm").textContent = `Un ingrédient s'appelle déjà « ${ING[dbl][0]} ».`);
  const k = createIng(nom, $("cinu").value, $("cing").value, $("cinc").value),
    p = +$("cinp").value;
  if (p > 0) S.prices[k] = p;
  $("cinf").style.display = "none";
  $("cinm").textContent = "« " + nom + " » ajouté.";
  setTimeout(() => ($("cinm").textContent = ""), 2500);
  refreshIng();
};

$("cinc").innerHTML = optionsCat("aut");
$("icat").innerHTML = optionsCat("aut");
