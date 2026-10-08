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

/** Étiquettes connues : celles d'origine, puis les autres utilisées par au moins une recette (par ordre alphabétique). */
function tagsConnus() {
  const vus = new Set(TYPES0.map(plain)),
    autres = [];
  for (const R of Object.values(S.rec))
    for (const t of R.tags || [])
      if (!vus.has(plain(t))) {
        vus.add(plain(t));
        autres.push(t);
      }
  return [...TYPES0, ...recettesTriees(autres)];
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
  const prises = new Set(deja.map(plain));
  return o.filter((x) => !prises.has(plain(x)));
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

/** Redessine la barre du filtre (page Recettes et page Menu). */
function drawFiltres() {
  const h = htmlFiltre();
  $("rfilt").innerHTML = $("mfilt").innerHTML = h;
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

$("mfilt").addEventListener("click", surFiltre);

/* ---- Types et thèmes de la recette ouverte ---- */

/** Pastilles de la recette ouverte : chaque étiquette connue se coche ou se décoche ; les propositions d'après la description s'ajoutent d'un clic. */
function drawTags() {
  const R = S.rec[S.cur];
  if (!R) {
    $("rtags").innerHTML = "";
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
  $("rtags").innerHTML =
    `<div><b>Types et thèmes</b> <span class="s">(touche pour cocher ou décocher ; sert à filtrer la liste des recettes)</span></div>` +
    `<div class="chips">${tagsConnus().map(pastille).join("")}</div>` +
    (sug.length
      ? `<div class="chips"><span class="s">💡 D'après la description :</span>${sug.map((t) => `<button type="button" class="chip sug" data-rts="${esc(t)}" aria-label="Ajouter le type ${esc(t)}">＋ ${esc(t)}</button>`).join("")}<button type="button" class="x" data-rtall="1">Tout ajouter</button></div>`
      : "") +
    `<div class="row" style="grid-template-columns:1fr auto"><input id="tnew" maxlength="${TYPE_MAX}" placeholder="Nouveau type ou thème (ex. Barbecue)" aria-label="Nouveau type ou thème de recette"><button type="button" class="x" id="tadd">＋ Ajouter</button></div>`;
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
      $("remsg").textContent = `${TYPES_PAR_RECETTE} types au plus par recette.`;
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
