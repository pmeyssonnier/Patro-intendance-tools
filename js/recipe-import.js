/* Intendance PSS – Import d'une recette : on colle les données « ld+json » (schema.org Recipe) d'une page de recettes ;
   aperçu ligne par ligne (ingrédient reconnu, nouveau ou ignoré), puis création de la recette en quantités par personne.
   Aucun site n'est appelé : l'appli ne lit que ce que l'utilisateur colle.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const FRACTIONS = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

/** Valeur d'un nombre écrit « 400 », « 1,5 », « 1/2 », « 1 1/2 » ou « ½ ». */
function nombreRecette(t) {
  if (t in FRACTIONS) return FRACTIONS[t];
  let tot = 0;
  for (const p of t.trim().split(/\s+/)) {
    const f = p.match(/^(\d+)\/(\d+)$/);
    tot += f ? +f[1] / +f[2] : parseFloat(p.replace(",", "."));
  }
  return tot;
}

/** Unités reconnues après la quantité : [début de texte, facteur, unité de l'appli]. */
const UNITES_RECETTE = [
  [/^(?:kg|kilos?)(?![\p{L}])\.?/iu, 1000, "g"],
  [/^(?:g|gr|grammes?)(?![\p{L}])\.?/iu, 1, "g"],
  [/^(?:l|litres?)(?![\p{L}])\.?/iu, 1000, "ml"],
  [/^dl(?![\p{L}])\.?/iu, 100, "ml"],
  [/^cl(?![\p{L}])\.?/iu, 10, "ml"],
  [/^ml(?![\p{L}])\.?/iu, 1, "ml"],
  [/^(?:c\.?\s*à\.?\s*s(?:oupe)?(?![\p{L}])\.?|cuill?[èe]res?\s+à\s+soupe|càs)/iu, 15, "ml"],
  [
    /^(?:c\.?\s*à\.?\s*c(?:af[ée])?(?![\p{L}])\.?|cuill?[èe]res?\s+à\s+(?:caf[ée]|th[ée])|càc)/iu,
    5,
    "ml",
  ],
  [
    /^(?:gousses?|tranches?|branches?|bottes?|bo[iî]tes?|sachets?|feuilles?|brins?|pi[èe]ces?|pots?|tiges?|barquettes?)(?![\p{L}])\.?/iu,
    1,
    "pc",
  ],
];

const NOMBRE = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔])`;
const DEBUT_LIGNE = new RegExp(`^${NOMBRE}(?:\\s*(?:-|à|ou)\\s*${NOMBRE})?\\s*(.*)$`, "iu");

/** Une ligne d'ingrédient (« 400 g gyros de volaille ») : { txt, q, u, nom }. q est en g, ml ou pièces ; q et u valent null s'il n'y a pas de quantité (« sel »). */
function ligneRecette(txt) {
  const t = String(txt)
    .replace(/\p{Zs}/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const m = t.match(DEBUT_LIGNE);
  let q = null,
    u = null,
    reste = t;
  if (m) {
    // une fourchette (« 2 à 3 ») : on prend la plus grande valeur, par prudence pour les achats
    q = Math.max(nombreRecette(m[1]), m[2] ? nombreRecette(m[2]) : 0);
    reste = m[3];
    u = "pc";
    for (const [re, f, unite] of UNITES_RECETTE) {
      const r = reste.match(re);
      if (r) {
        q *= f;
        u = unite;
        reste = reste.slice(r[0].length).trim();
        break;
      }
    }
    q = Math.round(q * 1000) / 1000;
  }
  const nom = reste
    .replace(/^(?:de la |de l[’']|de |du |des |d[’'])\s*/i, "")
    .split(/[,(;]/)[0]
    .trim();
  return {
    txt: t,
    q: q > 0 ? q : null,
    u: q > 0 ? u : null,
    nom: nom.charAt(0).toUpperCase() + nom.slice(1),
  };
}

/** Durée ISO 8601 (« PT1H30M ») en texte (« 1 h 30 »), ou "". */
function dureeRecette(iso) {
  const m = String(iso || "").match(/^P(?:T(?:(\d+)H)?(?:(\d+)M)?)$/);
  if (!m || (!m[1] && !m[2])) return "";
  return (m[1] ? m[1] + " h" + (m[2] ? " " + m[2].padStart(2, "0") : "") : m[2] + " min").trim();
}

/** Texte des étapes (chaîne, liste de chaînes, HowToStep ou HowToSection), sans balises ni lignes vides. */
function etapesRecette(x) {
  const out = [];
  const lire = (e) => {
    if (!e) return;
    if (typeof e === "string") out.push(e);
    else if (Array.isArray(e)) e.forEach(lire);
    else if (e.itemListElement) lire(e.itemListElement);
    else if (e.text) out.push(String(e.text));
  };
  lire(x);
  return out
    .map((s) =>
      s
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

/** Cherche la recette (« @type »: « Recipe ») dans ce que l'utilisateur a collé : blocs <script ld+json>, JSON seul ou page entière. Renvoie l'objet ou null. */
function chercherRecette(texte) {
  const blocs = [...String(texte).matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1]
  );
  if (!blocs.length) blocs.push(String(texte));
  const est = (x) => x && typeof x === "object" && [].concat(x["@type"] || []).includes("Recipe");
  const parcourir = (d) => {
    if (Array.isArray(d)) return d.map(parcourir).find(Boolean) || null;
    if (!d || typeof d !== "object") return null;
    return est(d) ? d : parcourir(d["@graph"]);
  };
  for (const b of blocs) {
    try {
      const r = parcourir(JSON.parse(b.trim()));
      if (r) return r;
    } catch {
      /* bloc qui n'est pas du JSON : suivant */
    }
  }
  return null;
}

/** Liste d'ingrédients collée à la main (une ligne par ingrédient), pour les pages sans données « Recipe » (articles, sites sans ld+json). Renvoie une recette au même format que le ld+json, ou null. */
function recetteDepuisListe(texte) {
  const t = String(texte);
  // du code (JSON, balises) n'est pas une liste d'ingrédients
  if (/<script|<\/?[a-z][^>]*>/i.test(t) || /^\s*[{[]/.test(t)) return null;
  const lignes = t
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-–•*·▪►✓]+/u, "").trim())
    .filter((l) => l && !/:$/.test(l));
  if (lignes.length < 2 || !lignes.some((l) => ligneRecette(l).q)) return null;
  return { name: "Recette importée", recipeYield: "4", recipeIngredient: lignes };
}

/** Rayon probable d'un nouvel ingrédient d'après son nom (clé de CATS) ; « aut » si rien ne correspond. */
function categorieProbable(nom) {
  const t = plain(nom);
  const regles = [
    ["sur", /surgel|congel|glace/],
    ["boi", /\beau\b|jus|limonade|soda|cola|biere|vin\b|sirop|cafe|boisson/],
    ["boul", /pain|baguette|bagel|brioche|croissant|pita|wrap|tortilla|pistolet|croque/],
    ["fri", /jambon|saucisse|lard|bacon|chorizo|saucisson|salami|vegetari|vegan|quorn|tofu|seitan/],
    [
      "bou",
      /viande|boeuf|porc|poulet|dinde|volaille|jambon|saucisse|lard|bacon|hache|steak|poisson|saumon|thon|cabillaud|crevette|merguez|gyros|kebab|veau|agneau|chorizo|saucisson|salami/,
    ],
    [
      "lai",
      /lait|fromage|beurre|creme|yaourt|oeuf|mozzarella|emmental|parmesan|margarine|skyr|mascarpone|ricotta|gruyere|cheddar/,
    ],
    [
      "fl",
      /legume|fruit|pomme|poire|banane|citron|orange|tomate|oignon|\bail\b|carotte|salade|laitue|courgette|poivron|champignon|avocat|concombre|aubergine|brocoli|chou|epinard|persil|basilic|herbe|echalote|potiron|poireau|celeri|radis|fraise|framboise|raisin|germe/,
    ],
    [
      "epi",
      /pate|riz|farine|sucre|\bsel\b|poivre|huile|vinaigre|conserve|sauce|moutarde|ketchup|mayonnaise|chocolat|biscuit|cereale|confiture|miel|epice|muscade|chapelure|semoule|couscous|lentille|haricot|pois chiche|mais|noix|amande|cacahu|tartiner|bouillon|concentre|levure/,
    ],
  ];
  return (regles.find(([, re]) => re.test(t)) || ["aut"])[0];
}

/** Mots-clés d'attention régime (mêmes clés que « Attention régime » d'un ingrédient ajouté à la main) pour un nouvel ingrédient. */
function regimeProbable(nom) {
  const t = plain(nom);
  if (/porc|jambon|lard|bacon|saucisse|chorizo|saucisson/.test(t)) return "porc";
  if (/boeuf|hache|bifteck|steak/.test(t)) return "boeuf";
  if (
    /volaille|poulet|dinde|gyros|viande|veau|agneau|canard|poisson|thon|saumon|crevette|cabillaud|merguez|kebab/.test(
      t
    )
  )
    return "viande";
  if (/noix|noisette|amande|cacahu|arachide|pistache|praline|tartiner/.test(t)) return "nut";
  if (
    /pain|bagel|pate|farine|wrap|pita|biscuit|semoule|couscous|tortilla|baguette|pizza|gnocchi|cereale/.test(
      t
    )
  )
    return "sg";
  if (
    /lait|fromage|beurre|creme|yaourt|mozzarella|emmental|parmesan|gruyere|cheddar|mascarpone|ricotta/.test(
      t
    )
  )
    return "sl";
  return "";
}

/** Ingrédient du catalogue pour une ligne : même famille d'unité (poids/liquide ou pièce), pas un substitut. Renvoie { k, exact } ou null. */
function ingPourLigne(L) {
  for (const u of L.u === "pc" ? ["piece"] : ["kg", "l"]) {
    const k = ingParNom(L.nom, new Set(), u);
    if (k && !ING[k][4])
      return {
        k,
        exact: [...motsNom(L.nom)].sort().join() === [...motsNom(ING[k][0])].sort().join(),
      };
  }
  return null;
}

/** Un ingrédient du catalogue de la même famille que celle de la ligne ? (g et ml se valent, pas la pièce.) */
const memeFamille = (k, L) => (ING[k][1] === "pc") === (L.u === "pc");

let RI = null; // recette en cours d'import : { nom, n, url, desc, temps, etapes, avecEtapes, lignes }

/** Aperçu de l'import : titre, nombre de personnes, une carte par ligne d'ingrédient, boutons. */
function drawImport() {
  const z = $("rimv");
  if (!RI) {
    z.innerHTML = "";
    return;
  }
  // partie fixe (nom, personnes, étapes, boutons) : elle n'est pas redessinée quand une ligne change,
  // sinon un clic sur « Créer la recette » juste après avoir saisi le nom serait perdu
  z.innerHTML = `<div class="g"><div><label>Nom de la recette</label><input id="rimnom" value="${esc(RI.nom)}" maxlength="100" aria-label="Nom de la recette importée"></div>
<div><label>Nombre de personnes de la recette</label><input id="rimn" type="number" min="1" step="1" value="${RI.n}" aria-label="Nombre de personnes de la recette"></div></div>
${RI.desc ? `<p class="s">${esc(RI.desc)}</p>` : ""}
<p class="s">Les quantités sont ramenées <b>par personne</b> (identiques pour toutes les sections d'âge : ajuste-les ensuite dans la recette).</p><div id="rimlig"></div>
<label style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" id="rimet" style="width:auto"${RI.avecEtapes ? " checked" : ""}> Reprendre aussi les ${RI.etapes.length} étapes de préparation dans la description (texte du site : respecte ses conditions d'utilisation)</label>
<p><button id="rimok">Créer la recette</button> <button id="rimann" class="x">Annuler</button></p>`;
  drawLignes();
}

/** Les lignes d'ingrédients de l'aperçu (seule partie redessinée quand on change un choix). */
function drawLignes() {
  const regimes = OPTIONS_REGIME;
  const cand = Object.keys(ING)
    .filter((k) => !ING[k][4] && !S.art[k] && !S.hid.includes(k))
    .sort((a, b) => ING[a][0].localeCompare(ING[b][0], "fr"));
  const lignes = RI.lignes
    .map((L, i) => {
      const opts =
        `<option value="+"${L.mode === "+" ? " selected" : ""}>➕ Nouvel ingrédient</option>` +
        `<option value="-"${L.mode === "-" ? " selected" : ""}>Ignorer cette ligne</option>` +
        cand
          .map(
            (k) =>
              `<option value="${esc(k)}"${L.mode === k ? " selected" : ""}>${esc(ING[k][0])} (${ING[k][1]})</option>`
          )
          .join("");
      const nouveau = L.mode === "+";
      const pp = L.q > 0 && RI.n > 0 ? Math.round((L.q / RI.n) * 1e4) / 1e4 : 0;
      const alerte =
        L.mode !== "+" && L.mode !== "-" && L.q > 0 && !memeFamille(L.mode, L)
          ? `<div class="s" style="color:#d33">⚠ « ${esc(ING[L.mode][0])} » se compte en ${ING[L.mode][1]}, la recette en ${L.u} : choisis un autre ingrédient ou « Nouvel ingrédient ».</div>`
          : "";
      const autre = L.autre
        ? `<div class="s">Existe déjà en ${ING[L.autre][1]} : « ${esc(ING[L.autre][0])} ».</div>`
        : "";
      return `<div class="rimpl"><div><b>${esc(L.txt)}</b></div>
<div class="rimpr"><select data-ri="${i}" data-f="mode" aria-label="Ingrédient pour : ${esc(L.txt)}">${opts}</select>
<input type="number" min="0" step="any" value="${L.q ?? ""}" data-ri="${i}" data-f="q" aria-label="Quantité totale : ${esc(L.txt)}" style="width:90px"> <span class="s">${L.u || ""} au total${pp ? ` = ${pp} ${L.u}/pers.` : ""}</span></div>
${
  nouveau
    ? `<div class="rimpr"><input type="text" value="${esc(L.nomNouveau)}" data-ri="${i}" data-f="nomNouveau" aria-label="Nom du nouvel ingrédient : ${esc(L.txt)}" maxlength="100"><select data-ri="${i}" data-f="dg" aria-label="Attention régime : ${esc(L.txt)}">${regimes.replace(`value="${L.dg}"`, `value="${L.dg}" selected`)}</select><select data-ri="${i}" data-f="cat" aria-label="Rayon : ${esc(L.txt)}">${optionsCat(L.cat)}</select></div>`
    : ""
}${L.q ? "" : `<div class="s">Sans quantité : ignorée (ex. sel, poivre).</div>`}${autre}${alerte}</div>`;
    })
    .join("");
  $("rimlig").innerHTML = lignes;
}

/** Description de la recette créée : présentation, durée, source, et éventuellement les étapes. */
function descriptionImport() {
  const parts = [];
  if (RI.desc) parts.push(RI.desc);
  parts.push(`Pour ${RI.n} personnes${RI.temps ? " · " + RI.temps : ""}`);
  parts.push(RI.url ? "Source : " + RI.url : "Source : recette importée");
  let d = parts.join("\n");
  if (RI.avecEtapes && RI.etapes.length)
    d += "\n\nPréparation :\n" + RI.etapes.map((e, i) => `${i + 1}. ${e}`).join("\n");
  return d.slice(0, 5000);
}

/** Crée la recette (et les nouveaux ingrédients) d'après l'aperçu ; renvoie un message d'erreur ou "" si tout est bon. */
function creerRecetteImportee() {
  const nom = RI.nom.trim();
  if (!nom) return "Donne un nom à la recette.";
  if (nom.length > 100) return "Nom de recette trop long (100 caractères au plus).";
  if (S.rec[nom]) return "Une recette porte déjà ce nom : change-le.";
  if (!(RI.n >= 1)) return "Indique le nombre de personnes de la recette (1 ou plus).";
  const prises = RI.lignes.filter((L) => L.mode !== "-" && L.q > 0);
  if (!prises.length)
    return "Aucune ligne à importer : choisis un ingrédient pour au moins une ligne.";
  for (const L of prises) {
    if (L.mode === "+" && !L.nomNouveau.trim())
      return `Donne un nom au nouvel ingrédient : ${L.txt}`;
    if (L.mode !== "+" && !memeFamille(L.mode, L))
      return `Unité différente pour « ${L.txt} » : choisis un autre ingrédient ou « Nouvel ingrédient ».`;
  }
  const ing = {};
  for (const L of prises) {
    const k = L.mode === "+" ? createIng(L.nomNouveau.trim(), L.u, L.dg, L.cat) : L.mode;
    const pp = Math.round((L.q / RI.n) * 1e6) / 1e6;
    ing[k] = SEC.map((_, i) => Math.round((((ing[k] || [])[i] || 0) + pp) * 1e6) / 1e6);
  }
  S.rec[nom] = { desc: descriptionImport(), ing };
  S.cur = nom;
  return "";
}

$("rimp").onclick = () => {
  $("rimpf").style.display = $("rimpf").style.display === "none" ? "block" : "none";
  $("rimm").textContent = "";
};

/** Referme la zone d'import sans rien créer, et la vide. */
function fermerImport() {
  RI = null;
  drawImport();
  $("rimt").value = "";
  $("rimu").value = "";
  $("rimm").textContent = "";
  $("rimpf").style.display = "none";
}

$("rimfer").onclick = fermerImport;

$("rimlire").onclick = () => {
  const r = chercherRecette($("rimt").value) || recetteDepuisListe($("rimt").value);
  if (!r || !Array.isArray(r.recipeIngredient) || !r.recipeIngredient.length) {
    RI = null;
    drawImport();
    $("rimm").textContent =
      'Aucune recette trouvée. Colle le bloc <script type="application/ld+json"> de la page s\'il contient « Recipe » ; sinon (article, page sans données de recette) colle la liste des ingrédients, une ligne par ingrédient.';
    return;
  }
  const n =
    parseInt(
      []
        .concat(r.recipeYield || 4)
        .join(" ")
        .match(/\d+/)?.[0] || "4",
      10
    ) || 4;
  RI = {
    nom: String(r.name || "Recette importée")
      .trim()
      .slice(0, 100),
    n,
    url: $("rimu").value.trim().slice(0, 300),
    desc: String(r.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 600),
    temps: dureeRecette(r.totalTime || r.cookTime),
    etapes: etapesRecette(r.recipeInstructions),
    avecEtapes: false,
    lignes: r.recipeIngredient
      .map(String)
      .filter((t) => t.trim())
      .map((t) => {
        const L = ligneRecette(t),
          m = L.q && L.nom ? ingPourLigne(L) : null,
          // même nom mais autre unité (« Pain » en g, « 4 pains ») : on le signale sans le proposer
          autre =
            L.q && !m
              ? ["kg", "l", "piece"]
                  .map((u) => ingParNom(L.nom, new Set(), u))
                  .find((k) => k && !ING[k][4])
              : null;
        return {
          ...L,
          mode: !L.q ? "-" : m ? m.k : "+",
          nomNouveau: L.nom,
          dg: regimeProbable(L.nom),
          cat: categorieProbable(L.nom),
          autre: autre && !memeFamille(autre, L) ? autre : null,
        };
      }),
  };
  $("rimm").textContent =
    `${RI.lignes.length} lignes lues${r["@type"] ? "" : " (liste d'ingrédients : donne le nom de la recette et le nombre de personnes)"}. Vérifie chaque ingrédient puis crée la recette.`;
  drawImport();
};

$("rimv").addEventListener("change", (e) => {
  const d = e.target.dataset;
  if (!RI) return;
  if (e.target.id === "rimnom") RI.nom = e.target.value;
  else if (e.target.id === "rimn") RI.n = Math.max(0, parseInt(e.target.value, 10) || 0);
  else if (e.target.id === "rimet") RI.avecEtapes = e.target.checked;
  else if (d.ri !== undefined) {
    const L = RI.lignes[+d.ri];
    if (d.f === "q") L.q = +e.target.value > 0 ? +e.target.value : null;
    else L[d.f] = e.target.value;
  }
  if (e.target.id !== "rimnom" && e.target.id !== "rimet") drawLignes();
});

$("rimv").addEventListener("click", (e) => {
  if (e.target.id === "rimann") fermerImport();
  else if (e.target.id === "rimok" && RI) {
    const err = creerRecetteImportee();
    if (err) {
      $("rimm").textContent = "⚠ " + err;
      return;
    }
    const nom = S.cur;
    RI = null;
    drawImport();
    $("rimt").value = "";
    $("rimu").value = "";
    $("rimpf").style.display = "none";
    refreshIng();
    $("rimm").textContent =
      `Recette « ${nom} » créée : ajuste les quantités par section d'âge si besoin.`;
  }
});
