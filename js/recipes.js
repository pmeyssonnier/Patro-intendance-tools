/* Intendance PSS – Recettes et ingrédients : édition, quantités (par personne ou uniques), ingrédients personnalisés, suppression.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Dernières valeurs « X pour N personnes » saisies, par recette et ingrédient (elles restent affichées après « Appliquer »). */
const RATIO = {};
const ratioKey = (k) => S.cur + "|" + k;

/** « X pour N personnes » en mode quantité unique : le total (X ÷ N × effectif) remplace la quantité unique. */
function ratioForm(k) {
  const u = ING[k][1],
    r = RATIO[ratioKey(k)] || { q: "", n: "1" };
  return `<div class="rtf"><span class="s">ou</span> <input type="text" inputmode="decimal" value="${esc(r.q)}" placeholder="500" data-rq="${esc(k)}" aria-label="${esc(ING[k][0])} : quantité"> <span class="s">${u}</span> <span>pour</span> <input type="text" inputmode="numeric" value="${esc(r.n)}" data-rn="${esc(k)}" aria-label="${esc(ING[k][0])} : nombre de personnes"> <span>personne(s)</span> <button class="x" data-ra="${esc(k)}">Appliquer</button><div class="s" data-rp="${esc(k)}" role="status">${ratioPreview(k, nbr(r.q), nbr(r.n))}</div></div>`;
}

/** Nombre saisi dans un champ texte, virgule ou point (« 0,5 »). */
const nbr = (v) => parseFloat(String(v).replace(",", "."));

/** Total d'un ingrédient pour « q pour n personnes » avec l'effectif actuel, en unité de base (g, ml, pièce). */
const ratioTotal = (q, n) => Math.round((q / n) * nn() * 1000) / 1000;

function ratioPreview(k, q, n) {
  if (!(q >= 0) || !(n > 0))
    return "Ex. : 500 g pour 5 personnes, ou 100 g pour 1 personne (par personne).";
  const N = nn();
  return N
    ? `= ${qty(k, ratioTotal(q, n))} pour ${N} personnes (${Math.round((q / n) * 1e6) / 1e6} ${ING[k][1]} par personne)`
    : "Renseigne d'abord les effectifs (page « Camp & effectifs »).";
}

/** Mode édition du nom et de la description : { nom, desc } de la recette au moment où il a commencé (pour « Annuler »), ou null. */
let EDIT = null;

function drawRec() {
  const names = Object.keys(S.rec);
  if (!Object.hasOwn(S.rec, S.cur)) S.cur = names[0] || "";
  // changer de recette ou en supprimer une referme le mode édition
  if (EDIT && EDIT.nom !== S.cur) {
    EDIT = null;
    $("reform").style.display = "none";
  }
  $("rsel").innerHTML = names
    .map((d) => `<option${d === S.cur ? " selected" : ""}>${esc(d)}</option>`)
    .join("");
  const R = S.rec[S.cur];
  if (!R || !(recEdit in R.ing)) recEdit = null;
  $("rdesc").value = R ? R.desc : "";
  // la description n'est modifiable que dans le mode édition (✎) ; sinon on la lit mise en forme (gras, souligné)
  $("rdesc").readOnly = !EDIT;
  $("rdesc").style.display = $("rtb").style.display = EDIT ? "" : "none";
  $("rdv").style.display = EDIT ? "none" : "";
  $("rdv").innerHTML =
    R && R.desc
      ? fmtDesc(R.desc)
      : '<span class="s">Aucune description. Clique sur ✎ pour en ajouter une.</span>';
  $("rdesc").placeholder =
    EDIT || !R ? "" : "Aucune description. Clique sur ✎ pour en ajouter une.";
  $("rh").innerHTML =
    "<tr><th>Ingrédient</th>" +
    SEC.map(
      (s) => `<th>${esc(s[0]).replace(/-/g, "-<wbr>")}<div class="s">${esc(s[1])}</div></th>`
    ).join("") +
    "<th></th></tr>";
  $("rb").innerHTML = R
    ? Object.entries(R.ing)
        .map(([k, q]) => {
          const fx = R.fx && k in R.fx;
          const ouvert = recEdit === k,
            nom = `${esc(ING[k][0])} (${ING[k][1]})`;
          return `<tr data-rk="${esc(k)}"><td><div class="ibox"><span class="ih" role="button" tabindex="0" data-ih="${esc(k)}" aria-label="Déplacer ${esc(ING[k][0])} avec les flèches du clavier" title="Glisser pour changer l’ordre des ingrédients (flèches haut/bas au clavier)">⠿</span><button class="ib" data-ced="${esc(k)}" aria-expanded="${ouvert}" title="Modifier cet ingrédient : nom, unité, prix, régime, rayon, quantité unique" aria-label="Modifier ${esc(ING[k][0])}"><span class="ibt">${nom}</span> <span aria-hidden="true">${ouvert ? "▴" : "✎"}</span></button></div></td>${fx ? `<td colspan="${SEC.length}"><input type="number" min="0" step="any" value="${+(R.fx[k] / fxu(k)).toFixed(3)}" data-fx="${esc(k)}" style="width:90px" aria-label="${esc(ING[k][0])} : quantité totale en ${fxl(k)}"> <span class="s">${fxl(k)} au total</span>${ratioForm(k)}<label style="display:flex;gap:6px;align-items:center;margin-top:4px"><input type="checkbox" data-fa="${esc(k)}"${R.fa && R.fa[k] === 0 ? "" : " checked"} style="width:auto"> adapter aux régimes</label></td>` : q.map((v, i) => `<td><input type="number" min="0" step="any" value="${v}" data-k="${esc(k)}" data-s="${i}" aria-label="${esc(ING[k][0])}, ${esc(SEC[i][0])}, par personne"></td>`).join("")}<td><button class="x" data-rm="${esc(k)}" aria-label="Retirer ${esc(ING[k][0])} de la recette" title="Retirer de la recette">✕</button></td></tr>${ouvert ? `<tr class="ced"><td colspan="${SEC.length + 2}">${ficheIngredient(k, `<button class="x tg" data-tg="${esc(k)}">${fx ? "→ par personne" : "→ quantité unique"}</button>`)}</td></tr>` : ""}`;
        })
        .join("")
    : "";
  $("radd").innerHTML =
    "<option value=''>+ Ajouter un ingrédient…</option>" +
    Object.entries(ING)
      .filter(([k, v]) => R && !R.ing[k] && !v[4] && !S.art[k] && !S.hid.includes(k))
      .sort((a, b) => a[1][0].localeCompare(b[1][0], "fr"))
      .map(([k, v]) => `<option value="${esc(k)}">${esc(v[0])}</option>`)
      .join("");
}

$("rsel").onchange = () => {
  S.cur = $("rsel").value;
  drawRec();
};

/** Enregistre la description au fil de la saisie (et pas seulement quand le champ perd le focus : sur téléphone, on quitte souvent la page sans cela). */
function saveDesc() {
  if (S.rec[S.cur]) {
    S.rec[S.cur].desc = $("rdesc").value;
    save();
  }
}

/** Met en gras (**…**) ou souligne (__…__) la sélection de la description ; refait le geste pour l'enlever. Sans sélection, place les marques autour du curseur. */
function mettreEnForme(type) {
  const m = type === "b" ? "**" : "__",
    ta = $("rdesc"),
    v = ta.value,
    s = ta.selectionStart,
    e = ta.selectionEnd,
    sel = v.slice(s, e);
  let nv, ns, ne;
  if (v.slice(s - 2, s) === m && v.slice(e, e + 2) === m) {
    nv = v.slice(0, s - 2) + sel + v.slice(e + 2);
    ns = s - 2;
    ne = e - 2;
  } else if (sel.length > 4 && sel.startsWith(m) && sel.endsWith(m)) {
    nv = v.slice(0, s) + sel.slice(2, -2) + v.slice(e);
    ns = s;
    ne = e - 4;
  } else {
    nv = v.slice(0, s) + m + sel + m + v.slice(e);
    ns = s + 2;
    ne = e + 2;
  }
  ta.value = nv;
  ta.focus();
  ta.setSelectionRange(ns, ne);
  saveDesc();
}

$("rtb").addEventListener("click", (e) => {
  const b = e.target.closest("[data-fmt]");
  if (b && EDIT) mettreEnForme(b.dataset.fmt);
});

$("rdesc").addEventListener("keydown", (e) => {
  if (!EDIT || !(e.ctrlKey || e.metaKey) || e.altKey) return;
  const t = e.key.toLowerCase() === "b" ? "b" : e.key.toLowerCase() === "u" ? "u" : "";
  if (!t) return;
  e.preventDefault();
  mettreEnForme(t);
});

$("rdesc").onchange = saveDesc;
$("rdesc").oninput = saveDesc;

/** Renomme une recette : garde sa place dans la liste et met à jour les menus de tous les camps. Renvoie un message d'erreur ou "". */
function renameRecipe(ancien, nom) {
  nom = nom.trim().replace(/\s+/g, " ");
  if (!S.rec[ancien]) return "Recette introuvable.";
  if (!nom) return "Le nom ne peut pas être vide.";
  if (nom.length > 100) return "Nom trop long (100 caractères au plus).";
  if (nom === ancien) return "";
  if (nom === "__proto__" || S.rec[nom]) return "Une recette porte déjà ce nom.";
  const rec = {};
  for (const [n, r] of Object.entries(S.rec)) rec[n === ancien ? nom : n] = r;
  S.rec = rec;
  if (S.cur === ancien) S.cur = nom;
  // les menus (de tous les camps) désignent les recettes par leur nom
  for (const c of Object.values(S.camps)) {
    for (const jour of Object.values(c.menu))
      for (const k in jour)
        if (Array.isArray(jour[k])) jour[k] = jour[k].map((n) => (n === ancien ? nom : n));
    // les textes d'adaptations du menu imprimable sont rangés sous « jour|repas|plat »
    const adn = {};
    for (const [cle, texte] of Object.entries(c.adn || {})) {
      const p = cle.split("|");
      adn[p.length > 2 && p.slice(2).join("|") === ancien ? p[0] + "|" + p[1] + "|" + nom : cle] =
        texte;
    }
    c.adn = adn;
  }
  for (const k of Object.keys(RATIO))
    if (k.startsWith(ancien + "|")) {
      RATIO[nom + k.slice(ancien.length)] = RATIO[k];
      delete RATIO[k];
    }
  return "";
}

$("redit").onclick = () => {
  if (!S.rec[S.cur] || EDIT) return;
  EDIT = { nom: S.cur, desc: S.rec[S.cur].desc };
  $("reform").style.display = "grid";
  $("remsg").textContent = "";
  $("rename").value = S.cur;
  drawRec();
  $("rename").focus();
  $("rename").select();
};

/** Referme le mode édition ; avec « restaurer », la description reprend sa valeur d'avant. */
function finEdition(restaurer) {
  if (EDIT && restaurer && S.rec[EDIT.nom]) {
    S.rec[EDIT.nom].desc = EDIT.desc;
    save();
  }
  EDIT = null;
  $("reform").style.display = "none";
  $("remsg").textContent = "";
  drawRec();
}

$("reno").onclick = () => finEdition(true);

$("reok").onclick = () => {
  const err = renameRecipe(S.cur, $("rename").value);
  if (err) {
    $("remsg").textContent = "⚠ " + err;
    return;
  }
  EDIT = null;
  finEdition(false);
  drawMenu();
  calc();
};

$("rename").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("reok").click();
  else if (e.key === "Escape") $("reno").click();
});

/** Place l'ingrédient `k` à la place de `cible` dans la recette `R` (l'ordre des clés de `R.ing` est celui de l'affichage et il est enregistré). */
function deplacerIngredient(R, k, cible) {
  const cles = Object.keys(R.ing),
    de = cles.indexOf(k),
    vers = cles.indexOf(cible);
  if (de < 0 || vers < 0 || de === vers) return false;
  cles.splice(de, 1);
  cles.splice(vers, 0, k);
  const q = { ...R.ing };
  for (const c of Object.keys(R.ing)) delete R.ing[c];
  for (const c of cles) R.ing[c] = q[c];
  return true;
}

/** Ingrédient voisin (haut: -1, bas: +1) dans la recette affichée, ou undefined. */
const voisinIngredient = (k, sens) => {
  const cles = Object.keys(S.rec[S.cur].ing);
  return cles[cles.indexOf(k) + sens];
};

$("rb").addEventListener("keydown", (e) => {
  const h = e.target.closest && e.target.closest(".ih");
  if (!h || (e.key !== "ArrowUp" && e.key !== "ArrowDown") || !S.rec[S.cur]) return;
  e.preventDefault();
  const k = h.dataset.ih,
    v = voisinIngredient(k, e.key === "ArrowUp" ? -1 : 1);
  if (!v || !deplacerIngredient(S.rec[S.cur], k, v)) return;
  save();
  drawRec();
  const f = $("rb").querySelector(`.ih[data-ih="${CSS.escape(k)}"]`);
  if (f) f.focus();
  say("Ingrédient déplacé");
});

/** Glisser une poignée ⠿ : l'ingrédient prend la place de la ligne sous le doigt ou le curseur. */
let di = null,
  dix = 0,
  diy = 0,
  dir = 0;

const ligneSous = () => {
  const el = document.elementFromPoint(dix, diy),
    tr = el && el.closest && el.closest("#rb tr[data-rk]");
  return tr && di ? tr : null;
};

function iloop() {
  if (!di) return;
  if (diy < 90) scrollBy(0, -14);
  else if (diy > innerHeight - 90) scrollBy(0, 14);
  const tr = ligneSous();
  $("rb")
    .querySelectorAll("tr")
    .forEach((x) => x.classList.toggle("over", !!tr && x === tr && x.dataset.rk !== di.k));
  dir = requestAnimationFrame(iloop);
}

$("rb").addEventListener("pointerdown", (e) => {
  const h = e.target.closest(".ih");
  if (!h) return;
  e.preventDefault();
  di = { k: h.dataset.ih };
  dix = e.clientX;
  diy = e.clientY;
  try {
    h.setPointerCapture(e.pointerId);
  } catch (_) {}
  h.closest("tr").classList.add("drag");
  dir = requestAnimationFrame(iloop);
});

function iend(ok) {
  if (!di) return;
  cancelAnimationFrame(dir);
  const g = di,
    tr = ok ? ligneSous() : null;
  di = null;
  if (tr && S.rec[S.cur] && deplacerIngredient(S.rec[S.cur], g.k, tr.dataset.rk)) save();
  drawRec();
}

$("rb").addEventListener("pointermove", (e) => {
  dix = e.clientX;
  diy = e.clientY;
});

$("rb").addEventListener("pointerup", (e) => {
  dix = e.clientX;
  diy = e.clientY;
  iend(true);
});

$("rb").addEventListener("pointercancel", () => iend(false));

$("rb").addEventListener("change", (e) => {
  const d = e.target.dataset,
    R = S.rec[S.cur];
  if (!R) return;
  if (d.k) {
    R.ing[d.k][+d.s] = saisie(e.target.value);
    calc();
  } else if (d.fx && R.fx) {
    R.fx[d.fx] = Math.round(saisie(e.target.value) * fxu(d.fx) * 1000) / 1000;
    calc();
  } else if (d.fa !== undefined && R.fx) {
    R.fa = R.fa || {};
    if (e.target.checked) delete R.fa[d.fa];
    else R.fa[d.fa] = 0;
    calc();
  }
});

$("rb").addEventListener("input", (e) => {
  const d = e.target.dataset,
    box = e.target.closest(".rtf");
  if (!box || (d.rq === undefined && d.rn === undefined)) return;
  const k = d.rq ?? d.rn,
    qv = box.querySelector("[data-rq]").value,
    nv = box.querySelector("[data-rn]").value;
  RATIO[ratioKey(k)] = { q: qv, n: nv };
  box.querySelector("[data-rp]").textContent = ratioPreview(k, nbr(qv), nbr(nv));
});

$("rb").addEventListener("click", (e) => {
  const t = e.target.dataset,
    R = S.rec[S.cur];
  if (!R) return;
  if (t.tg) {
    const k = t.tg;
    R.fx = R.fx || {};
    if (k in R.fx) {
      const n = nn(),
        pp = n ? Math.round((R.fx[k] / n) * 1e6) / 1e6 : 0;
      R.ing[k] = SEC.map(() => pp);
      delete R.fx[k];
      if (R.fa) delete R.fa[k];
    } else R.fx[k] = Math.round(R.ing[k].reduce((a, q, i) => a + q * C.n[i], 0) * 100) / 100;
    drawRec();
    calc();
  } else if (t.ra) {
    const box = e.target.closest(".rtf"),
      q = nbr(box.querySelector("[data-rq]").value),
      n = nbr(box.querySelector("[data-rn]").value);
    if (!(q >= 0) || !(n > 0)) return;
    if (!nn() || !R.fx || !(t.ra in R.fx)) return;
    RATIO[ratioKey(t.ra)] = {
      q: box.querySelector("[data-rq]").value,
      n: box.querySelector("[data-rn]").value,
    };
    R.fx[t.ra] = ratioTotal(q, n);
    drawRec();
    calc();
  } else if (t.rm) {
    if (!confirm("Retirer « " + ING[t.rm][0] + " » de la recette « " + S.cur + " » ?")) return;
    delete R.ing[t.rm];
    if (R.fx) delete R.fx[t.rm];
    if (R.fa) delete R.fa[t.rm];
    drawRec();
    calc();
  }
});

$("radd").onchange = () => {
  const k = $("radd").value;
  if (k && S.rec[S.cur]) {
    S.rec[S.cur].ing[k] = SEC.map(() => 0);
    drawRec();
    save();
  }
};

$("rnew").onclick = () => {
  $("rform").style.display = "grid";
  $("rname").value = "";
  $("rname").focus();
};

$("rno").onclick = () => {
  $("rform").style.display = "none";
};

$("rok").onclick = () => {
  const n = $("rname").value.trim();
  if (!n) return;
  if (n.length > 100) {
    $("rname").value = "";
    $("rname").placeholder = "Nom trop long (100 caractères au plus)";
    return;
  }
  if (S.rec[n]) {
    $("rname").value = "";
    $("rname").placeholder = "Ce nom existe déjà";
    return;
  }
  S.rec[n] = { desc: "", ing: {} };
  S.cur = n;
  $("rform").style.display = "none";
  drawRec();
  drawMenu();
  save();
};

$("rname").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("rok").click();
});

let dc = 0;

$("rdel").onclick = () => {
  if (!S.rec[S.cur]) return;
  const used = usedIn(S.cur);
  if (used) {
    alert(`Recette utilisée ${used} fois dans les menus (tous camps) : retire-la d'abord du menu.`);
    return;
  }
  if (!dc) {
    dc = 1;
    $("rdel").textContent = "Confirmer ?";
    setTimeout(() => {
      dc = 0;
      $("rdel").textContent = "✕";
    }, 3000);
    return;
  }
  dc = 0;
  $("rdel").textContent = "✕";
  delete S.rec[S.cur];
  drawRec();
  drawMenu();
  calc();
};

function rmIng(k) {
  for (const r of Object.values(S.rec)) {
    delete r.ing[k];
    if (r.fx) delete r.fx[k];
    if (r.fa) delete r.fa[k];
  }
  delete S.prices[k];
  delete S.pn[k];
  delete S.cat[k];
  delete S.promo[k];
  delete S.url[k];
  delete S.art[k];
  for (const c of Object.values(S.camps)) delete c.extra[k];
  if (S.cust[k]) {
    delete S.cust[k];
    delete ING[k];
    for (const d in DIETS) {
      const ex = DIETS[d].ex;
      delete ex[k];
      for (const x in ex) if (ex[x] === k) ex[x] = null;
    }
  } else if (!S.hid.includes(k)) S.hid.push(k);
}

$("rclr").onclick = () => {
  if (
    !confirm(
      "Supprimer TOUTES les recettes, tous les ingrédients et les menus de tous les camps ? (Exporte d'abord une sauvegarde. « Réinitialiser » ou « Restaurer » les remettent.)"
    )
  )
    return;
  Object.keys(ING).forEach(rmIng);
  S.rec = {};
  Object.values(S.camps).forEach((c) => (c.menu = {}));
  S.cur = "";
  drawRec();
  drawMenu();
  drawDietEd();
  calc();
};

$("hrs").onclick = () => {
  S.hid = [];
  drawRec();
  drawDietEd();
  calc();
};

const DMAP = {
  viande: ["veg"],
  porc: ["veg", "halal"],
  boeuf: ["veg", "sb"],
  sl: ["sl"],
  sg: ["sg"],
  nut: ["nut"],
};

/** Crée un ingrédient ajouté à la main (identifiant c_…) ; dgKey = « attention régime » (viande, porc, boeuf, sl, sg, nut). Renvoie son identifiant. */
function createIng(n, unit, dgKey, cat) {
  let k = "c_" + Date.now().toString(36);
  while (ING[k]) k += "a";
  const dg = DMAP[dgKey] || [];
  const kw = n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const e = [n, unit, 0, kw, 0, dg];
  S.cust[k] = e;
  ING[k] = e;
  if (cat !== "aut" && CATS.some((c) => c[0] === cat)) S.cat[k] = cat; // « Autre » est le rayon par défaut : rien à enregistrer
  dg.forEach((d) => {
    if (DIETS[d]) DIETS[d].ex[k] = null;
  });
  return k;
}
