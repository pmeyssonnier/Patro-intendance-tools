/* Intendance PSS – Menu du camp : jours et repas, glisser-déposer, repas supplémentaires, couleurs.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

let addDay = -1,
  addT = "",
  delSl = null;

/* Jours repliés (par défaut tous dépliés) ; l'état se garde d'un affichage à l'autre. */
const jFermes = new Set();

const resumeJour = (i) => {
  const ps = dtypes(i).map(({ k }) => slotArr(i, k).length),
    p = ps.reduce((a, n) => a + n, 0);
  return `(${p} plat${p > 1 ? "s" : ""} / ${ps.length} repas)`;
};

const ALLD = () => [...Array(31).keys()];

/** Panneau d'un repas (clic sur son nom) : nom, ordre, couleur, suppression du type, et retrait de ce jour ou de tous les jours. */
const delPanel = (i, k, lab) => {
  const n1 = slotArr(i, k).length,
    n2 = days().reduce((a, d, j) => a + slotArr(j, k).length, 0),
    f = (n) => (n ? ` (${n} plat${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""})` : ""),
    vis = dtypes(i).map((x) => x.k),
    p = vis.indexOf(k),
    col = String(C.col[k]).toLowerCase(),
    pr = presents(i, k),
    ek = esc(k);
  return `<div class="zpan"><div class="tl"><input class="tn" value="${esc(lab)}" data-tn="${ek}" maxlength="30" aria-label="Nom du repas"><button class="x" data-tu="${ek}" data-day="${i}" title="Monter ce repas" aria-label="Monter ${esc(lab)}"${p > 0 ? "" : " disabled"}>▲</button><button class="x" data-td="${ek}" data-day="${i}" title="Descendre ce repas" aria-label="Descendre ${esc(lab)}"${p < vis.length - 1 ? "" : " disabled"}>▼</button><button class="x" data-tx="${ek}" title="Supprimer ce type de repas de tous les jours" aria-label="Supprimer le type de repas ${esc(lab)}">🗑</button></div><div class="crow"><span class="sws">${COLS.map((c) => `<button class="sw${c.toLowerCase() === col ? " on" : ""}" style="background:${c}" data-c="${c}" data-ck="${ek}" title="${CN[c] || c}" aria-label="Couleur ${CN[c] || c} pour ${esc(lab)}" aria-pressed="${c.toLowerCase() === col}"></button>`).join("")}</span><input type="color" data-ci="${ek}" value="${esc(C.col[k])}" title="Autre couleur" aria-label="Autre couleur pour ${esc(lab)}"><span class="s cw" style="color:#d33">${lowc(C.col[k]) ? "⚠ contraste faible" : ""}</span></div><div class="zeff"><b>Effectif de ce repas</b><div class="zsec">${SEC.map((sc, j) => `<label>${esc(sc[0])}<input type="number" min="0" max="${C.n[j] || 0}" step="1" data-pr="${j}" value="${pr ? pr[j] : C.n[j] || 0}" aria-label="Présents ${esc(sc[0])} (sur ${C.n[j] || 0})"><span class="s">sur ${C.n[j] || 0}</span></label>`).join("")}</div><select data-prs aria-label="Portée de l’effectif"><option value="un">Ce repas seulement</option><option value="jour">Tous les repas de ce jour</option><option value="tous">Ce repas, tous les jours</option></select> <button class="x" data-pra="1">Appliquer</button> <button class="x" data-pra="0">Toute la troupe</button><div class="s">Présents par section : les quantités de ce repas sont calculées avec cet effectif (régimes compris).</div><div class="zq" aria-live="polite"></div></div><div class="zdel"><b>Retirer « ${esc(lab)} »</b> <button class="x" data-dsc="one" data-day="${i}" data-slot="${ek}">Ce jour seulement${f(n1)}</button> <button class="x" data-dsc="all" data-day="${i}" data-slot="${ek}">Tous les jours${f(n2)}</button> <button class="x" data-dsn="1">Annuler</button></div></div>`;
};

const ouvert = (i, k) => !!delSl && delSl.day === i && delSl.k === k;

const addPanel = () => {
  const nw = addT === "__new",
    t = C.types.find((x) => x.k === addT);
  return `<div class="nsl">${nw ? '<input data-nn="1" placeholder="Nom (ex. Goûter)" maxlength="30" aria-label="Nom du nouveau repas">' : `<b>${esc(t ? t.n : "")}</b>`}<select data-sc="1" aria-label="Portée : ce jour ou tous les jours"><option value="one">Ce jour seulement</option><option value="all">Tous les jours</option></select><button data-nok="1">Ajouter</button><button class="x" data-nno="1">Annuler</button></div>`;
};

function drawMenu() {
  drawFiltres();
  $("menu").innerHTML = days()
    .map((d, i) => {
      const gone = C.types.filter((t) => hid(i, t.k));
      return `<details class="dcard" data-dj="${i}"${jFermes.has(i) ? "" : " open"}><summary class="dhd"><span class="dn">${esc(dlab(d))}</span><span class="dc">${resumeJour(i)}</span></summary>${dtypes(
        i
      )
        .map(
          ({ k, n: lab }) =>
            `<div class="zone" data-day="${i}" data-slot="${esc(k)}" style="${cvars(C.col[k])}"><div class="zl"><div class="zr"><span class="zh" role="button" tabindex="0" data-day="${i}" data-zk="${esc(k)}" aria-label="Déplacer le repas ${esc(lab)} avec les flèches du clavier" title="Glisser pour changer l’ordre des repas (flèches haut/bas au clavier)">⠿</span><button class="zn" data-ds="1" data-day="${i}" data-slot="${esc(k)}" title="Modifier ce repas : nom, couleur, ordre, retrait" aria-label="Modifier le repas ${esc(lab)}" aria-expanded="${ouvert(i, k)}"><span class="znt">${esc(lab)}</span> <span aria-hidden="true">${ouvert(i, k) ? "▴" : "✎"}</span></button></div><span class="zp${presents(i, k) ? " red" : ""}" title="${presents(i, k) ? `Effectif réduit : ${nbPres(i, k)} présents sur ${nn()}` : "Toute la troupe"}">(${nbPres(i, k)} pers.)</span></div><div class="zc">${slotArr(
              i,
              k
            )
              .map(
                (r, j) =>
                  `<span class="chip" data-j="${j}"><span class="hd" role="button" tabindex="0" data-day="${i}" data-slot="${esc(k)}" data-j="${j}" aria-label="Déplacer ${esc(r)} avec les flèches du clavier" title="Glisser, ou flèches du clavier : haut/bas pour l'ordre, gauche/droite pour changer de repas">⠿</span><span class="cn">${esc(r)}</span><button class="x" data-rm="1" data-day="${i}" data-slot="${esc(k)}" data-j="${j}" title="Retirer" aria-label="Retirer ${esc(r)} de ${esc(lab)}, ${esc(dlab(d))}">✕</button></span>`
              )
              .join(
                ""
              )}</div><select data-add="1" data-day="${i}" data-slot="${esc(k)}" aria-label="Ajouter un plat : ${esc(lab)}, ${esc(dlab(d))}"><option value="">+ Ajouter un plat…</option>${recettesTriees()
              .map((n) => `<option>${esc(n)}</option>`)
              .join(
                ""
              )}</select></div>${delSl && delSl.day === i && delSl.k === k ? delPanel(i, k, lab) : ""}`
        )
        .join(
          ""
        )}<div class="zadd"><select data-as="1" data-day="${i}" aria-label="Ajouter un repas le ${esc(dlab(d))}"><option value="">+ Ajouter un repas…</option>${gone.map((t) => `<option value="${esc(t.k)}">${esc(t.n)}</option>`).join("")}<option value="__new">➕ Nouveau repas…</option></select>${addDay === i && addT ? addPanel() : ""}</div></details>`;
    })
    .join("");
  $("mfold").textContent = jFermes.size < days().length ? "Tout replier" : "Tout déplier";
  if (addDay >= 0) {
    const f = $("menu").querySelector("[data-nn]");
    if (f) f.focus();
  }
}

// « toggle » ne remonte pas : on l'écoute en capture
$("menu").addEventListener(
  "toggle",
  (e) => {
    const i = e.target.dataset.dj;
    if (i === undefined) return;
    if (e.target.open) jFermes.delete(+i);
    else jFermes.add(+i);
    $("mfold").textContent = jFermes.size < days().length ? "Tout replier" : "Tout déplier";
  },
  true
);

$("mfold").onclick = () => {
  if (jFermes.size < days().length) days().forEach((d, i) => jFermes.add(i));
  else jFermes.clear();
  drawMenu();
};

const marr = (i, k) => {
  C.menu[i] = C.menu[i] || {};
  return (C.menu[i][k] = C.menu[i][k] || []);
};

$("menu").addEventListener("change", (e) => {
  const t = e.target;
  if (!t.dataset.add || !t.value) return;
  marr(+t.dataset.day, t.dataset.slot).push(t.value);
  drawMenu();
  calc();
});

$("menu").addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.as === undefined || !t.value) return;
  addDay = +t.dataset.day;
  addT = t.value;
  delSl = null;
  drawMenu();
});

function addSlot(i, scope, name) {
  let k = addT;
  if (k === "__new") {
    name = (name || "").trim();
    if (!name) return;
    k = "x" + Date.now().toString(36);
    const pos = C.types.findIndex((t) => t.k === "s"),
      t = { k, n: name };
    if (pos >= 0) C.types.splice(pos, 0, t);
    else C.types.push(t);
    C.col[k] = COLS.find((c) => !Object.values(C.col).includes(c)) || COLS[3];
    ALLD().forEach((j) => (C.off[j] = C.off[j] || []).push(k));
  }
  (scope === "all" ? ALLD() : [i]).forEach((j) => {
    C.off[j] = (C.off[j] || []).filter((x) => x !== k);
  });
  addDay = -1;
  addT = "";
  drawMenu();
  calc();
}

function delSlot(i, k, scope) {
  (scope === "all" ? ALLD() : [i]).forEach((j) => {
    if (C.menu[j]) C.menu[j][k] = [];
    const o = (C.off[j] = C.off[j] || []);
    if (!o.includes(k)) o.push(k);
  });
  delSl = null;
  drawMenu();
  calc();
}

const addGo = (t) => {
  const p = t.closest(".nsl"),
    n = p.querySelector("[data-nn]");
  addSlot(addDay, p.querySelector("[data-sc]").value, n ? n.value : "");
};

$("menu").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset.nn !== undefined) addGo(e.target);
});

$("menu").addEventListener("keydown", (e) => {
  const h = e.target.closest && e.target.closest(".hd");
  if (!h || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  const day = +h.dataset.day,
    slot = h.dataset.slot,
    j = +h.dataset.j,
    arr = marr(day, slot);
  let nd = day,
    ns = slot,
    nj;
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    nj = j + (e.key === "ArrowUp" ? -1 : 1);
    if (nj < 0 || nj >= arr.length) return;
    [arr[j], arr[nj]] = [arr[nj], arr[j]];
  } else {
    const flat = [];
    days().forEach((d, i) => dtypes(i).forEach((t) => flat.push([i, t.k])));
    const idx = flat.findIndex((f) => f[0] === day && f[1] === slot),
      t = flat[idx + (e.key === "ArrowLeft" ? -1 : 1)];
    if (!t) return;
    const [r] = arr.splice(j, 1),
      dst = marr(t[0], t[1]);
    dst.push(r);
    nd = t[0];
    ns = t[1];
    nj = dst.length - 1;
  }
  const name = marr(nd, ns)[nj],
    ty = C.types.find((x) => x.k === ns);
  drawMenu();
  calc();
  const f = $("menu").querySelector(
    '.hd[data-day="' + nd + '"][data-slot="' + ns + '"][data-j="' + nj + '"]'
  );
  if (f) f.focus();
  say(name + " : " + dlab(days()[nd]) + ", " + (ty ? ty.n : "") + ", position " + (nj + 1));
});

$("menu").addEventListener("click", (e) => {
  const t = e.target.closest("[data-ds]") || e.target;
  if (t.dataset.nok !== undefined) {
    addGo(t);
    return;
  }
  if (t.dataset.nno !== undefined) {
    addDay = -1;
    addT = "";
    drawMenu();
    return;
  }
  if (t.dataset.ds) {
    const same = delSl && delSl.day === +t.dataset.day && delSl.k === t.dataset.slot;
    delSl = same ? null : { day: +t.dataset.day, k: t.dataset.slot };
    addDay = -1;
    addT = "";
    drawMenu();
    return;
  }
  if (t.dataset.dsc) {
    delSlot(+t.dataset.day, t.dataset.slot, t.dataset.dsc);
    return;
  }
  if (t.dataset.dsn !== undefined) {
    delSl = null;
    drawMenu();
    return;
  }
  if (t.dataset.pra !== undefined && delSl) {
    const pan = t.closest(".zpan"),
      v =
        t.dataset.pra === "0"
          ? null
          : SEC.map((_, j) => +pan.querySelector(`[data-pr="${j}"]`).value || 0),
      portee = pan.querySelector("[data-prs]").value;
    const qs = v ? questionsRegime(delSl.day, delSl.k, v) : [];
    if (qs.length) {
      effQ = { day: delSl.day, k: delSl.k, portee, v, qs };
      pan.querySelector(".zq").innerHTML = questionHTML(qs);
      const f = pan.querySelector(".zq select");
      if (f) f.focus();
      return;
    }
    poserEffectif(delSl.day, delSl.k, portee, v, pdConserve(delSl.day, delSl.k, v));
    drawMenu();
    calc();
    say(v ? "Effectif du repas réglé" : "Toute la troupe");
    return;
  }
  if (t.dataset.prq !== undefined && effQ) {
    const pan = t.closest(".zpan"),
      q = effQ;
    if (t.dataset.prq === "0") {
      effQ = null;
      pan.querySelector(".zq").innerHTML = "";
      return;
    }
    const pd = reponsesRegime(pan, q);
    if (typeof pd === "string") {
      pan.querySelector("[data-qe]").textContent = pd;
      return;
    }
    effQ = null;
    poserEffectif(q.day, q.k, q.portee, q.v, pd);
    drawMenu();
    calc();
    say("Effectif du repas réglé, régimes pris en compte");
    return;
  }
  if (t.dataset.ck) {
    C.col[t.dataset.ck] = t.dataset.c;
    majCouleur(t.dataset.ck, true);
    return;
  }
  if (t.dataset.tu || t.dataset.td) {
    const k = t.dataset.tu || t.dataset.td;
    if (monterRepas(+t.dataset.day, k, t.dataset.tu ? -1 : 1)) {
      drawMenu();
      calc();
      const b = $("menu").querySelector(
        `[data-${t.dataset.tu ? "tu" : "td"}="${k}"]:not([disabled])`
      );
      if (b) b.focus();
    }
    return;
  }
  if (t.dataset.tx) {
    const ty = C.types.find((x) => x.k === t.dataset.tx);
    if (!ty) return;
    if (C.types.length < 2) {
      alert("Il faut garder au moins un type de repas.");
      return;
    }
    if (!confirm("Supprimer « " + ty.n + " » de tous les jours (et les plats qu'il contient) ?"))
      return;
    C.types = C.types.filter((x) => x.k !== ty.k);
    delete C.col[ty.k];
    Object.values(C.menu).forEach((dm) => delete dm[ty.k]);
    Object.keys(C.off).forEach((j) => (C.off[j] = C.off[j].filter((k) => k !== ty.k)));
    delSl = null;
    drawMenu();
    calc();
    return;
  }
  if (!t.dataset.rm) return;
  marr(+t.dataset.day, t.dataset.slot).splice(+t.dataset.j, 1);
  drawMenu();
  calc();
});

/* Effectif réduit d'un repas : si des personnes sont retirées d'une section qui a des régimes, on demande si elles en suivent un */
let effQ = null;

/** Personnes de la section j qui suivent le régime dk à ce repas, avant la modification (arrondi). */
const dietBase = (i, k, dk, j) => {
  const p = presents(i, k);
  return Math.round(dietAt(dk, j, p, p && C.n[j] ? p[j] / C.n[j] : 1));
};

/** Sections dont l'effectif baisse alors qu'elles ont des régimes présents à ce repas : [{ j, ret (personnes retirées), diets (régimes possibles) }]. */
function questionsRegime(i, k, v) {
  const p = presents(i, k);
  return SEC.map((_, j) => ({
    j,
    ret: (p ? p[j] : C.n[j] || 0) - Math.min(Math.max(Math.round(v[j]), 0), C.n[j] || 0),
    diets: Object.keys(DIETS).filter((dk) => dietBase(i, k, dk, j) > 0),
  })).filter((q) => q.ret > 0 && q.diets.length);
}

function questionHTML(qs) {
  const opts = (q) =>
    `<option value="">${q.diets.length > 1 ? "Aucun régime" : "Non, aucun régime"}</option>` +
    q.diets
      .map(
        (dk) =>
          `<option value="${esc(dk)}">${q.diets.length > 1 ? "" : "Oui, "}${esc(DIETS[dk].n)}</option>`
      )
      .join("");
  return (
    "<b>Régimes alimentaires</b>" +
    qs
      .map(
        (q) =>
          `<div class="s">${esc(SEC[q.j][0])} : ${q.ret > 1 ? q.ret + " personnes en moins. Lesquelles suivent un régime ?" : q.diets.length > 1 ? "1 personne en moins. Suit-elle un régime, et lequel ?" : "1 personne en moins. Est-elle concernée par le régime « " + esc(DIETS[q.diets[0]].n) + " » ?"}</div>` +
          Array.from(
            { length: q.ret },
            (_, n) =>
              `<label class="s">${q.ret > 1 ? "Personne " + (n + 1) : "Cette personne"} <select data-qj="${q.j}" aria-label="${esc(SEC[q.j][0])}, personne ${n + 1} retirée : régime">${opts(q)}</select></label> `
          ).join("")
      )
      .join("") +
    ' <button class="x" data-prq="1">Valider</button> <button class="x" data-prq="0">Annuler</button><div class="s" data-qe role="alert" style="color:#d33"></div>'
  );
}

/** Présents par régime à ce repas d'après les réponses : { régime: [par section, null = proportionnel] }, ou un message d'erreur. */
function reponsesRegime(pan, q) {
  const pd = JSON.parse(JSON.stringify(C.pd[q.day + "|" + q.k] || {}));
  for (const s of q.qs) {
    const choisis = {};
    pan.querySelectorAll(`select[data-qj="${s.j}"]`).forEach((e) => {
      if (e.value) choisis[e.value] = (choisis[e.value] || 0) + 1;
    });
    for (const dk of s.diets) {
      const base = dietBase(q.day, q.k, dk, s.j);
      if ((choisis[dk] || 0) > base)
        return `${SEC[s.j][0]} : il n'y a que ${base} personne${base > 1 ? "s" : ""} « ${DIETS[dk].n} » à ce repas.`;
      pd[dk] = pd[dk] || SEC.map(() => null);
      pd[dk][s.j] = base - (choisis[dk] || 0);
    }
  }
  return nettoyerPd(pd, q.v);
}

/** Régimes déjà choisis pour ce repas, conservés quand l'effectif change sans retirer personne d'une section à régimes. */
const pdConserve = (i, k, v) => nettoyerPd(JSON.parse(JSON.stringify(C.pd[i + "|" + k] || {})), v);

/** Retire les choix des sections de nouveau au complet et les régimes sans aucun choix ; null s'il ne reste rien. */
function nettoyerPd(pd, v) {
  for (const dk of Object.keys(pd)) {
    pd[dk] = pd[dk].map((x, j) => (v && v[j] >= (C.n[j] || 0) ? null : x));
    if (pd[dk].every((x) => x === null)) delete pd[dk];
  }
  return Object.keys(pd).length ? pd : null;
}

/** Fixe les présents par section (v = tableau) ou rétablit toute la troupe (v = null) : à ce repas, à tous les repas du jour, ou à ce repas tous les jours ; pd : présents par régime à ces repas (voir reponsesRegime). */
function poserEffectif(i, k, portee, v, pd = null) {
  C.pres = C.pres || {};
  const cles =
      portee === "jour"
        ? dtypes(i).map((t) => i + "|" + t.k)
        : portee === "tous"
          ? ALLD()
              .filter((j) => !hid(j, k))
              .map((j) => j + "|" + k)
          : [i + "|" + k],
    tous = !v || v.every((x, j) => x >= (C.n[j] || 0));
  cles.forEach((c) => {
    C.pd = C.pd || {};
    if (tous || !pd) delete C.pd[c];
    else C.pd[c] = JSON.parse(JSON.stringify(pd));
    if (tous) delete C.pres[c];
    else C.pres[c] = v.map((x, j) => Math.min(Math.max(Math.round(x), 0), C.n[j] || 0));
  });
}

/** Place le repas k à la position du repas tk (pour tous les jours : l'ordre des types est commun). */
function deplacerRepas(k, tk) {
  const T = C.types,
    oi = T.findIndex((x) => x.k === k),
    oj = T.findIndex((x) => x.k === tk);
  if (oi < 0 || oj < 0 || oi === oj) return false;
  const [ty] = T.splice(oi, 1),
    at = T.findIndex((x) => x.k === tk);
  T.splice(oj > oi ? at + 1 : at, 0, ty);
  return true;
}

/** Monte (-1) ou descend (+1) un repas par rapport à son voisin visible ce jour-là. */
function monterRepas(i, k, sens) {
  const vis = dtypes(i).map((x) => x.k),
    v = vis[vis.indexOf(k) + sens];
  return v ? deplacerRepas(k, v) : false;
}

/** Couleur d'un repas modifiée : met à jour les zones, les pastilles et l'aperçu sans refermer le panneau ni le sélecteur de couleur. */
function majCouleur(k, pastilles) {
  $("menu")
    .querySelectorAll(".zone")
    .forEach((z) => {
      if (z.dataset.slot === k) z.style.cssText = cvars(C.col[k]);
    });
  const pan = $("menu").querySelector(".zpan");
  if (pan && pastilles)
    pan.querySelectorAll(".sw").forEach((b) => {
      const on = b.dataset.c.toLowerCase() === String(C.col[k]).toLowerCase();
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
  if (pan) {
    const ci = pan.querySelector("[data-ci]");
    if (ci && ci.value.toLowerCase() !== String(C.col[k]).toLowerCase()) ci.value = C.col[k];
    pan.querySelector(".cw").textContent = lowc(C.col[k]) ? "⚠ contraste faible" : "";
  }
  calc();
}

$("menu").addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (d.tn) {
    const ty = C.types.find((x) => x.k === d.tn);
    if (!ty) return;
    ty.n = e.target.value;
    // le nom change dans toutes les zones sans redessiner (le champ garde le focus)
    $("menu")
      .querySelectorAll(".zone")
      .forEach((z) => {
        if (z.dataset.slot === ty.k) z.querySelector(".znt").textContent = ty.n;
      });
    calc();
  } else if (d.ci) {
    C.col[d.ci] = e.target.value;
    majCouleur(d.ci, true);
  }
});

$("menu").addEventListener("change", (e) => {
  const ty = e.target.dataset.tn && C.types.find((x) => x.k === e.target.dataset.tn);
  if (ty && !ty.n.trim()) {
    ty.n = "Repas";
    drawMenu();
    calc();
  }
});

$("menu").addEventListener("keydown", (e) => {
  const h = e.target.closest && e.target.closest(".zh");
  if (!h || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
  e.preventDefault();
  if (!monterRepas(+h.dataset.day, h.dataset.zk, e.key === "ArrowUp" ? -1 : 1)) return;
  drawMenu();
  calc();
  const f = $("menu").querySelector(`.zh[data-day="${h.dataset.day}"][data-zk="${h.dataset.zk}"]`);
  if (f) f.focus();
  say("Repas déplacé");
});

let dz = null,
  rz = 0;

const zoneSous = () => {
  const el = document.elementFromPoint(px, py),
    z = el && el.closest && el.closest(".zone");
  return z && dz && $("menu").contains(z) && +z.dataset.day === dz.day ? z : null;
};

function zloop() {
  if (!dz) return;
  if (py < 90) scrollBy(0, -14);
  else if (py > innerHeight - 90) scrollBy(0, 14);
  const z = zoneSous();
  $("menu")
    .querySelectorAll(".zone")
    .forEach((x) => x.classList.toggle("over", !!z && x === z && x.dataset.slot !== dz.k));
  rz = requestAnimationFrame(zloop);
}

$("menu").addEventListener("pointerdown", (e) => {
  const h = e.target.closest(".zh");
  if (!h) return;
  e.preventDefault();
  dz = { day: +h.dataset.day, k: h.dataset.zk };
  px = e.clientX;
  py = e.clientY;
  try {
    h.setPointerCapture(e.pointerId);
  } catch (_) {}
  h.closest(".zone").classList.add("drag");
  rz = requestAnimationFrame(zloop);
});

function zend(ok) {
  if (!dz) return;
  cancelAnimationFrame(rz);
  const g = dz,
    z = ok ? zoneSous() : null;
  dz = null;
  if (z && z.dataset.slot !== g.k) {
    deplacerRepas(g.k, z.dataset.slot);
    calc();
  }
  drawMenu();
}

$("menu").addEventListener("pointerup", (e) => {
  px = e.clientX;
  py = e.clientY;
  zend(true);
});

$("menu").addEventListener("pointercancel", () => zend(false));

let dg = null,
  px = 0,
  py = 0,
  raf = 0;

const tgt = () => {
  const el = document.elementFromPoint(px, py),
    z = el && el.closest && el.closest(".zone");
  if (!z || !$("menu").contains(z)) return null;
  const c = el.closest(".chip");
  return {
    day: +z.dataset.day,
    slot: z.dataset.slot,
    j: c && z.contains(c) ? +c.dataset.j : null,
    z,
  };
};

function dloop() {
  if (!dg) return;
  if (py < 90) scrollBy(0, -14);
  else if (py > innerHeight - 90) scrollBy(0, 14);
  const t = tgt();
  $("menu")
    .querySelectorAll(".zone")
    .forEach((z) => z.classList.toggle("over", !!t && z === t.z));
  raf = requestAnimationFrame(dloop);
}

$("menu").addEventListener("pointerdown", (e) => {
  const h = e.target.closest(".hd");
  if (!h) return;
  e.preventDefault();
  dg = { day: +h.dataset.day, slot: h.dataset.slot, j: +h.dataset.j };
  px = e.clientX;
  py = e.clientY;
  try {
    h.setPointerCapture(e.pointerId);
  } catch (_) {}
  h.closest(".chip").classList.add("drag");
  raf = requestAnimationFrame(dloop);
});

$("menu").addEventListener("pointermove", (e) => {
  px = e.clientX;
  py = e.clientY;
});

function dend(ok) {
  if (!dg) return;
  cancelAnimationFrame(raf);
  const g = dg,
    t = ok ? tgt() : null;
  dg = null;
  if (t && !(t.day === g.day && t.slot === g.slot && t.j === g.j)) {
    const src = marr(g.day, g.slot),
      [r] = src.splice(g.j, 1),
      dst = marr(t.day, t.slot),
      same = t.day === g.day && t.slot === g.slot;
    let at = t.j == null ? dst.length : t.j;
    if (same && at > g.j) at--;
    dst.splice(at, 0, r);
    calc();
  }
  drawMenu();
}

$("menu").addEventListener("pointerup", (e) => {
  px = e.clientX;
  py = e.clientY;
  dend(true);
});

$("menu").addEventListener("pointercancel", () => dend(false));

$("mtitle").addEventListener("input", () => {
  C.mt = $("mtitle").value;
  calc();
});

$("mdesc").checked = !!+S.md;

$("madp").checked = !!+S.ma;

$("mdesc").onchange = () => {
  S.md = +$("mdesc").checked;
  calc();
};

$("madp").onchange = () => {
  S.ma = +$("madp").checked;
  calc();
};

$("mqty").checked = !!+S.mq;
$("mqs").value = S.ms === "b" ? "b" : "a";
$("mqs").disabled = !+S.mq;

$("mqty").onchange = () => {
  S.mq = +$("mqty").checked;
  $("mqs").disabled = !+S.mq;
  calc();
};

$("mqs").onchange = () => {
  S.ms = $("mqs").value;
  calc();
};

/* Texte des adaptations (régimes) sur le menu imprimable : on clique sur le crayon d'un plat dans l'aperçu pour le remplacer par son propre texte
   (ou le masquer) ; « Texte automatique » rend la main au calcul. Le texte est rangé dans C.adn, sous « jour|repas|plat ». */

/** Plat dont on modifie les adaptations dans l'aperçu : { i, k, idx } ou null. */
let adEdit = null;

/** Ligne des adaptations d'un plat dans l'aperçu : le texte (automatique ou choisi) avec son crayon, ou l'éditeur si ce plat est en cours de modification. */
function adLigne(i, k, idx, r, ad) {
  const d = `data-i="${i}" data-k="${esc(k)}" data-r="${idx}"`;
  if (adEdit && adEdit.i === i && adEdit.k === k && adEdit.idx === idx) {
    const auto = meal(r, presents(i, k)).adapt.join(" · ");
    return `<div class="ade"><textarea id="adtxt" maxlength="400" rows="4" aria-label="Adaptations (régimes) pour ${esc(r)}">${esc(ad.join(" · "))}</textarea><div class="s">Texte automatique : ${auto ? esc(auto) : "aucune adaptation"}</div><button class="x" data-ad="save" ${d}>Enregistrer</button> <button class="x" data-ad="auto" ${d}>Texte automatique</button> <button class="x" data-ad="cancel" ${d}>Annuler</button><div class="s">Vide : aucune ligne pour ce plat.</div></div>`;
  }
  const perso = Object.hasOwn(C.adn || {}, i + "|" + k + "|" + r);
  return `<div class="ad">${ad.length ? esc(ad.join(" · ")) : ""}${perso ? ' <span class="s">(texte modifié)</span>' : ""} <button class="x adb" data-ad="edit" ${d} title="Modifier le texte des adaptations de ce plat" aria-label="Modifier les adaptations de ${esc(r)}">${ad.length ? "✎" : "＋ adaptation"}</button></div>`;
}

$("mprev").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ad]");
  if (!b) return;
  const i = +b.dataset.i,
    k = b.dataset.k,
    idx = +b.dataset.r,
    a = b.dataset.ad,
    r = slotArr(i, k)[idx];
  if (a === "edit") adEdit = { i, k, idx };
  else {
    if (r !== undefined && (a === "save" || a === "auto")) {
      C.adn = C.adn || {};
      const cle = i + "|" + k + "|" + r;
      if (a === "auto") delete C.adn[cle];
      else C.adn[cle] = $("adtxt").value.trim().replace(/\s+/g, " ").slice(0, 400);
    }
    adEdit = null;
  }
  calc();
  if (adEdit && $("adtxt")) $("adtxt").focus();
});
