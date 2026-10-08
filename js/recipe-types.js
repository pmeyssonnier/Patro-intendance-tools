/* Intendance PSS – Types et thèmes des recettes : étiquettes (Entrée, Plat, Dessert, Chaud, Froid, Italien…), proposition d'après la description,
   tri alphabétique de la liste des recettes et filtre « visible ou pas » par type / thème.
   Une recette porte une liste d'étiquettes libres (R.tags). Le filtre est un réglage de l'appareil (il n'est pas enregistré dans le projet).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Étiquettes proposées d'office (types de plat, puis thèmes) ; on peut en créer d'autres dans la fiche de la recette. */
const TYPES0 = [
  "Petit-déjeuner",
  "Entrée",
  "Plat",
  "Dessert",
  "Goûter",
  "Chaud",
  "Froid",
  "Végétarien",
  "Italien",
  "Asiatique",
  "Barbecue / feu de camp",
];

const TYPE_MAX = 24, // longueur d'une étiquette
  TYPES_PAR_RECETTE = 10,
  SANS_TYPE = "__sans__", // « Sans type » dans le filtre
  CLE_FILTRE = "pss-types-filtre";

const collateur = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

/** Noms de recettes par ordre alphabétique (sans tenir compte des accents ni des majuscules). L'ordre enregistré dans le projet n'est pas modifié. */
const recettesTriees = (noms = Object.keys(S.rec)) =>
  [...noms].sort((a, b) => collateur.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0));

/** Étiquette propre : espaces réduits, longueur limitée. */
const nomType = (t) =>
  String(t ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, TYPE_MAX);

/** Étiquettes proposées : la liste modifiée par l'utilisateur (S.types) ou, à défaut, celle d'origine. */
const typesProposes = () => (Array.isArray(S.types) ? S.types : TYPES0);

/** Étiquettes connues : la liste proposée, puis les autres utilisées par au moins une recette (par ordre alphabétique). */
function tagsConnus() {
  const base = typesProposes(),
    vus = new Set(base.map(plain)),
    autres = [];
  for (const R of Object.values(S.rec))
    for (const t of R.tags || [])
      if (!vus.has(plain(t))) {
        vus.add(plain(t));
        autres.push(t);
      }
  return [...base, ...recettesTriees(autres)];
}

/** Orthographe d'une étiquette : celle d'une étiquette déjà connue si elle ne diffère que par les accents ou les majuscules. */
const canonType = (t) => tagsConnus().find((x) => plain(x) === plain(t)) || nomType(t);

const MOTS_VIANDE =
  /viande|boeuf|porc|poulet|dinde|jambon|lardon|saucisse|steak|poisson|thon|saumon|merguez|bacon|hache|volaille|agneau|veau|canard|nugget|chorizo|crevette|saucisson|cordon/;

/** Étiquettes qui paraissent convenir à une recette d'après son nom, sa description et ses ingrédients (hors celles qu'elle porte déjà). */
function typesProbables(nom, desc, ingredients, deja = []) {
  const t = plain([nom, descTexte(desc), ...ingredients].join(" "));
  const a = (re) => re.test(t),
    o = [];
  if (a(/petit[- ]?dej|confiture|cereale|tartiner|muesli|porridge/)) o.push("Petit-déjeuner");
  if (a(/\bsalade(?! de fruit)|soupe|velout|crudite|taboule|entree|gaspacho/)) o.push("Entrée");
  if (
    a(
      /gateau|mousse|\btarte|crepe|compote|glace|chocolat|flan|brownie|cookie|crumble|dessert|riz au lait|pudding|sorbet|muffin|salade de fruits/
    )
  )
    o.push("Dessert");
  if (a(/gouter|biscuit|collation|pain d.epice|gaufre/)) o.push("Goûter");
  if (!o.some((x) => ["Petit-déjeuner", "Entrée", "Dessert", "Goûter"].includes(x)) && t.trim())
    o.push("Plat");
  // chaud ou froid : une mention de froid l'emporte, sinon la cuisson fait un plat chaud
  if (a(/\bfroid|sans cuisson|glace|sorbet|\bfrais\b|salade|crudite|gaspacho/)) o.push("Froid");
  else if (
    a(
      /mijot|griller|cuire|\bfour\b|poele|chaud|gratin|saisir|saisi|bouill|chauffer|faire revenir|frire|roti/
    )
  )
    o.push("Chaud");
  if (
    t.trim() &&
    ingredients.length &&
    !a(MOTS_VIANDE) &&
    (o.includes("Plat") || o.includes("Entrée"))
  )
    o.push("Végétarien");
  if (
    a(
      /\bpates|spaghet|tagliatel|lasagn|parmesan|mozzarella|pizza|bolognais|pesto|risotto|penne|macaroni|carbonara|ravioli|basilic/
    )
  )
    o.push("Italien");
  if (
    a(
      /curry|nouille|\bwok\b|\bsoja|gingembre|cantonais|sushi|\bnems?\b|pad thai|coco|teriyaki|asiat/
    )
  )
    o.push("Asiatique");
  if (a(/barbecue|braise|feu de camp|brochette|papillote/)) o.push("Barbecue / feu de camp");
  const prises = new Set(deja.map(plain)),
    connus = new Set(tagsConnus().map(plain));
  return o.filter((x) => !prises.has(plain(x)) && connus.has(plain(x)));
}

/* ---- Gérer la liste des types et thèmes ---- */

/** Enregistre la liste dans le projet (S.types), ou l'oublie quand elle est identique à celle d'origine. */
function memoriserTypes(liste) {
  if (JSON.stringify(liste) === JSON.stringify(TYPES0)) delete S.types;
  else S.types = liste;
}

/** Nombre de recettes qui portent une étiquette. */
const nbRecettesType = (t) =>
  Object.values(S.rec).filter((R) => (R.tags || []).some((x) => plain(x) === plain(t))).length;

/** Remplace une étiquette (ou la retire si `nouveau` est vide) dans toutes les recettes et dans le filtre. */
function remplacerTypeDansRecettes(ancien, nouveau) {
  for (const R of Object.values(S.rec)) {
    if (!(R.tags || []).some((x) => plain(x) === plain(ancien))) continue;
    const l = [];
    for (const x of R.tags) {
      const y = plain(x) === plain(ancien) ? nouveau : x;
      if (y && !l.some((z) => plain(z) === plain(y))) l.push(y);
    }
    if (l.length) R.tags = l;
    else delete R.tags;
  }
  filtreTypes = [
    ...new Set(filtreTypes.map((f) => (plain(f) === plain(ancien) ? nouveau : f)).filter(Boolean)),
  ];
  memoriserFiltre();
}

/** Message d'erreur si `nom` ne convient pas comme étiquette (vide, déjà prise par une autre), sinon "". */
function erreurNomType(nom, sauf) {
  if (!nom) return "Le nom ne peut pas être vide.";
  const pris = tagsConnus().find((t) => plain(t) === plain(nom) && plain(t) !== plain(sauf || ""));
  return pris ? `« ${pris} » existe déjà.` : "";
}

/** Ajoute une étiquette à la liste proposée. Renvoie un message d'erreur, ou "". */
function ajouterTypeListe(nom) {
  nom = nomType(nom);
  const err = erreurNomType(nom);
  if (err) return err;
  const l = tagsConnus();
  if (l.length >= 60) return "60 types au plus.";
  memoriserTypes([...l, nom]);
  return "";
}

/** Renomme une étiquette partout (liste, recettes, filtre). Renvoie un message d'erreur, ou "". */
function renommerType(ancien, nom) {
  nom = nomType(nom);
  if (nom === ancien) return "";
  const err = erreurNomType(nom, ancien);
  if (err) return err;
  memoriserTypes(tagsConnus().map((t) => (t === ancien ? nom : t)));
  remplacerTypeDansRecettes(ancien, nom);
  return "";
}

/** Supprime une étiquette de la liste et de toutes les recettes qui la portent. */
function supprimerTypeListe(t) {
  memoriserTypes(tagsConnus().filter((x) => x !== t));
  remplacerTypeDansRecettes(t, "");
}

/** Monte (-1) ou descend (+1) une étiquette dans la liste proposée. */
function deplacerType(t, sens) {
  const l = tagsConnus(),
    i = l.indexOf(t),
    j = i + sens;
  if (i < 0 || j < 0 || j >= l.length) return false;
  [l[i], l[j]] = [l[j], l[i]];
  memoriserTypes(l);
  return true;
}

/* ---- Filtre « visible ou pas » ---- */

/** Étiquettes cochées dans le filtre (SANS_TYPE pour les recettes sans étiquette) ; vide = tout est visible. */
let filtreTypes = (() => {
  try {
    const a = JSON.parse(localStorage.getItem(CLE_FILTRE));
    return Array.isArray(a) ? a.filter((t) => typeof t === "string").slice(0, 30) : [];
  } catch (_) {
    return [];
  }
})();

function memoriserFiltre() {
  try {
    localStorage.setItem(CLE_FILTRE, JSON.stringify(filtreTypes));
  } catch (_) {
    /* réglage de l'appareil : sans stockage, le filtre dure jusqu'au rechargement */
  }
}

/** Une recette passe-t-elle le filtre ? Elle doit porter au moins une des étiquettes cochées. */
function recetteVisible(nom) {
  if (!filtreTypes.length) return true;
  const tags = (S.rec[nom] && S.rec[nom].tags) || [];
  if (!tags.length) return filtreTypes.includes(SANS_TYPE);
  return tags.some((t) => filtreTypes.some((f) => plain(f) === plain(t)));
}

/** Recettes proposées dans les listes, par ordre alphabétique et selon le filtre ; `garder` (la recette ouverte) reste toujours dans la liste. */
const recettesAffichees = (garder = "") =>
  recettesTriees(Object.keys(S.rec).filter((n) => n === garder || recetteVisible(n)));

/** Barre du filtre : une pastille par étiquette utilisée (avec son nombre de recettes), « Sans type », et la proposition d'étiquettes. */
function htmlFiltre() {
  const noms = Object.keys(S.rec),
    compte = {};
  let sans = 0;
  for (const n of noms) {
    const tags = S.rec[n].tags || [];
    if (!tags.length) sans++;
    for (const t of tags) compte[plain(t)] = (compte[plain(t)] || 0) + 1;
  }
  const utilises = tagsConnus().filter((t) => compte[plain(t)]);
  // une étiquette qui n'est plus utilisée ne doit pas faire disparaître des recettes
  filtreTypes = filtreTypes.filter((t) => (t === SANS_TYPE ? sans > 0 : compte[plain(t)]));
  if (!noms.length) return "";
  const pastille = (cle, texte, n) =>
    `<button type="button" class="chip${filtreTypes.includes(cle) ? " on" : ""}" data-ft="${esc(cle)}" aria-pressed="${filtreTypes.includes(cle)}">${esc(texte)} <span class="s">(${n})</span></button>`;
  const visibles = noms.filter(recetteVisible).length;
  let h = "";
  if (utilises.length)
    h += `<div class="chips" role="group" aria-label="Filtrer les recettes par type ou thème"><span class="s">Afficher :</span>${utilises.map((t) => pastille(t, t, compte[plain(t)])).join("")}${sans ? pastille(SANS_TYPE, "Sans type", sans) : ""}</div>`;
  if (filtreTypes.length)
    h += `<div class="s">${visibles} recette${visibles > 1 ? "s" : ""} sur ${noms.length} : celles qui portent au moins un des types cochés. <button type="button" class="x" data-ftc="1">Tout afficher</button></div>`;
  if (sans)
    h += `<div class="s"><button type="button" class="x" data-ftp="1">💡 Proposer des types pour les ${sans} recette${sans > 1 ? "s" : ""} sans type</button></div>`;
  return h ? `<div class="rfiltre">${h}</div>` : "";
}

/** Redessine la barre du filtre (page Recettes). */
function drawFiltres() {
  const h = htmlFiltre();
  $("rfilt").innerHTML = h;
}

/** Applique à chaque recette sans type les étiquettes proposées d'après son contenu. Renvoie le nombre de recettes complétées. */
function proposerTypes() {
  let n = 0;
  for (const [nom, R] of Object.entries(S.rec)) {
    if ((R.tags || []).length) continue;
    const p = typesProbables(
      nom,
      R.desc,
      Object.keys(R.ing).map((k) => (ING[k] ? ING[k][0] : k))
    ).slice(0, TYPES_PAR_RECETTE);
    if (p.length) {
      R.tags = p;
      n++;
    }
  }
  return n;
}

function surFiltre(e) {
  const b = e.target.closest("[data-ft], [data-ftc], [data-ftp]");
  if (!b) return;
  if (b.dataset.ftc) filtreTypes = [];
  else if (b.dataset.ftp) {
    const n = Object.values(S.rec).filter((R) => !(R.tags || []).length).length;
    if (
      !confirm(
        `Ajouter les types proposés d'après le nom, la description et les ingrédients à ${n} recette${n > 1 ? "s" : ""} sans type ? Tu pourras les modifier une par une dans la fiche de chaque recette.`
      )
    )
      return;
    const fait = proposerTypes();
    save();
    $("remsg").textContent = fait
      ? `Types proposés ajoutés à ${fait} recette${fait > 1 ? "s" : ""}.`
      : "Rien à proposer : les descriptions sont trop courtes.";
  } else {
    const t = b.dataset.ft;
    filtreTypes = filtreTypes.includes(t)
      ? filtreTypes.filter((x) => x !== t)
      : [...filtreTypes, t];
  }
  memoriserFiltre();
  drawRec();
  drawMenu();
}

$("rfilt").addEventListener("click", surFiltre);

/* ---- Types et thèmes de la recette ouverte ---- */

/** Pastilles de la recette ouverte : chaque étiquette connue se coche ou se décoche ; les propositions d'après la description s'ajoutent d'un clic. */
function drawTags() {
  const R = S.rec[S.cur];
  if (!R) {
    $("rtags").innerHTML = "";
    $("rtsum").textContent = "";
    return;
  }
  const mes = R.tags || [],
    sug = typesProbables(
      S.cur,
      R.desc,
      Object.keys(R.ing).map((k) => (ING[k] ? ING[k][0] : k)),
      mes
    );
  const pastille = (t) => {
    const on = mes.some((x) => plain(x) === plain(t));
    return `<button type="button" class="chip${on ? " on" : ""}" data-rt="${esc(t)}" aria-pressed="${on}">${esc(t)}</button>`;
  };
  $("rtsum").textContent = mes.length ? mes.join(", ") : "aucun";
  $("rtags").innerHTML =
    `<div class="s">(touche pour cocher ou décocher ; sert à filtrer la liste des recettes)</div>` +
    `<div class="chips">${tagsConnus().map(pastille).join("")}</div>` +
    (sug.length
      ? `<div class="chips"><span class="s">💡 D'après la description :</span>${sug.map((t) => `<button type="button" class="chip sug" data-rts="${esc(t)}" aria-label="Ajouter le type ${esc(t)}">＋ ${esc(t)}</button>`).join("")}<button type="button" class="x" data-rtall="1">Tout ajouter</button></div>`
      : "") +
    `<div class="row" style="grid-template-columns:1fr auto"><input id="tnew" maxlength="${TYPE_MAX}" placeholder="Nouveau mot-clé (ex. Barbecue, sans four…)" aria-label="Nouveau mot-clé, type ou thème de recette"><button type="button" class="x" id="tadd">＋ Ajouter</button></div>`;
}

/** Coche ou décoche une étiquette de la recette ouverte (ou l'ajoute si `forcer`). */
function basculerType(t, forcer) {
  const R = S.rec[S.cur];
  t = canonType(t);
  if (!R || !nomType(t)) return;
  const a = R.tags || [],
    i = a.findIndex((x) => plain(x) === plain(t));
  if (i >= 0 && !forcer) a.splice(i, 1);
  else if (i < 0) {
    if (a.length >= TYPES_PAR_RECETTE) {
      $("rdmsg").style.color = "#d33";
      $("rdmsg").textContent = `${TYPES_PAR_RECETTE} types au plus par recette.`;
      return;
    }
    a.push(t);
  }
  if (a.length) R.tags = a;
  else delete R.tags;
  save();
  drawRec();
  drawMenu();
}

function ajouterTypeSaisi() {
  const t = nomType($("tnew").value);
  if (t) basculerType(t, true);
}

$("rtags").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rt], [data-rts], [data-rtall], #tadd");
  if (!b) return;
  if (b.id === "tadd") ajouterTypeSaisi();
  else if (b.dataset.rtall) {
    const R = S.rec[S.cur];
    for (const t of typesProbables(
      S.cur,
      R.desc,
      Object.keys(R.ing).map((k) => (ING[k] ? ING[k][0] : k)),
      R.tags || []
    ))
      basculerType(t, true);
  } else basculerType(b.dataset.rt || b.dataset.rts, !!b.dataset.rts);
});

$("rtags").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "tnew") {
    e.preventDefault();
    ajouterTypeSaisi();
  }
});

/** Types, thèmes et mots-clés repliables (réglage retenu dans ce navigateur). */
try {
  if (localStorage.getItem("pss-tags-repliee") === "1") $("rtd").open = false;
} catch {
  /* sans stockage : la zone reste dépliée */
}

$("rtd").addEventListener("toggle", () => {
  try {
    localStorage.setItem("pss-tags-repliee", $("rtd").open ? "0" : "1");
  } catch {
    /* sans stockage : l'état n'est pas retenu */
  }
});

/* ---- Fenêtre « Gérer les types » ---- */

function drawTypesListe() {
  $("tyl").innerHTML = tagsConnus()
    .map((t, i, l) => {
      const n = nbRecettesType(t);
      return `<div class="tyrow"><input data-tyn="${esc(t)}" value="${esc(t)}" maxlength="${TYPE_MAX}" aria-label="Nom du type ${esc(t)}"><span class="s">${n} recette${n > 1 ? "s" : ""}</span><button class="x" data-tyu="${esc(t)}" aria-label="Monter ${esc(t)}"${i ? "" : " disabled"}>▲</button><button class="x" data-tyd="${esc(t)}" aria-label="Descendre ${esc(t)}"${i < l.length - 1 ? "" : " disabled"}>▼</button><button class="x" data-tyx="${esc(t)}" aria-label="Supprimer ${esc(t)}" title="Supprimer ce type">🗑</button></div>`;
    })
    .join("");
}

/** Redessine tout ce qui montre les types, après un changement de la liste. */
function apresTypes() {
  save();
  drawTypesListe();
  drawRec();
  drawMenu();
}

$("rtypes").onclick = () => {
  $("tym").textContent = "";
  $("tyn").value = "";
  drawTypesListe();
  if (!$("tydlg").open) $("tydlg").showModal();
};

$("tyno").onclick = () => $("tydlg").close();

$("tyok").onclick = () => {
  const err = ajouterTypeListe($("tyn").value);
  $("tym").textContent = err;
  if (err) return;
  $("tyn").value = "";
  apresTypes();
};

$("tyn").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("tyok").click();
});

$("tyre").onclick = () => {
  if (
    !confirm(
      "Rétablir la liste d'origine ? Les types que tu as ajoutés à des recettes restent proposés tant qu'une recette les porte."
    )
  )
    return;
  delete S.types;
  $("tym").textContent = "";
  apresTypes();
};

$("tyl").addEventListener("change", (e) => {
  const t = e.target.dataset.tyn;
  if (t === undefined) return;
  const err = renommerType(t, e.target.value);
  $("tym").textContent = err;
  if (err) e.target.value = t;
  else apresTypes();
});

$("tyl").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset.tyn !== undefined) e.target.blur();
});

$("tyl").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tyu], [data-tyd], [data-tyx]");
  if (!b) return;
  $("tym").textContent = "";
  if (b.dataset.tyx) {
    const t = b.dataset.tyx,
      n = nbRecettesType(t);
    if (n && !confirm(`Supprimer « ${t} » ? Il sera retiré de ${n} recette${n > 1 ? "s" : ""}.`))
      return;
    supprimerTypeListe(t);
  } else deplacerType(b.dataset.tyu || b.dataset.tyd, b.dataset.tyu ? -1 : 1);
  apresTypes();
});
