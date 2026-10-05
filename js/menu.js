/* Intendance PSS – Menu du camp : jours et repas, glisser-déposer, repas supplémentaires, couleurs.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

let addDay = -1,
  addT = "",
  delSl = null;

const ALLD = () => [...Array(31).keys()];

const delPanel = (i, k, lab) => {
  const n1 = slotArr(i, k).length,
    n2 = days().reduce((a, d, j) => a + slotArr(j, k).length, 0),
    f = (n) => (n ? ` (${n} plat${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""})` : "");
  return `<div class="zdel"><b>Retirer « ${esc(lab)} »</b> <button class="x" data-dsc="one" data-day="${i}" data-slot="${esc(k)}">Ce jour seulement${f(n1)}</button> <button class="x" data-dsc="all" data-day="${i}" data-slot="${esc(k)}">Tous les jours${f(n2)}</button> <button class="x" data-dsn="1">Annuler</button></div>`;
};

const addPanel = () => {
  const nw = addT === "__new",
    t = C.types.find((x) => x.k === addT);
  return `<div class="nsl">${nw ? '<input data-nn="1" placeholder="Nom (ex. Goûter)" maxlength="30" aria-label="Nom du nouveau repas">' : `<b>${esc(t ? t.n : "")}</b>`}<select data-sc="1" aria-label="Portée : ce jour ou tous les jours"><option value="one">Ce jour seulement</option><option value="all">Tous les jours</option></select><button data-nok="1">Ajouter</button><button class="x" data-nno="1">Annuler</button></div>`;
};

function drawMenu() {
  $("menu").innerHTML = days()
    .map((d, i) => {
      const gone = C.types.filter((t) => hid(i, t.k));
      return `<div class="dcard"><div class="dhd">${esc(dlab(d))}</div>${dtypes(i)
        .map(
          ({ k, n: lab }) =>
            `<div class="zone" data-day="${i}" data-slot="${esc(k)}" style="${cvars(C.col[k])}"><div class="zl"><span>${esc(lab)}</span><button class="zx" data-ds="1" data-day="${i}" data-slot="${esc(k)}" title="Retirer ce repas de ce jour" aria-label="Retirer ${esc(lab)} de ce jour">✕</button></div><div class="zc">${slotArr(
              i,
              k
            )
              .map(
                (r, j) =>
                  `<span class="chip" data-j="${j}"><span class="hd" role="button" tabindex="0" data-day="${i}" data-slot="${esc(k)}" data-j="${j}" aria-label="Déplacer ${esc(r)} avec les flèches du clavier" title="Glisser, ou flèches du clavier : haut/bas pour l'ordre, gauche/droite pour changer de repas">⠿</span><span class="cn">${esc(r)}</span><button class="x" data-rm="1" data-day="${i}" data-slot="${esc(k)}" data-j="${j}" title="Retirer" aria-label="Retirer ${esc(r)} de ${esc(lab)}, ${esc(dlab(d))}">✕</button></span>`
              )
              .join(
                ""
              )}</div><select data-add="1" data-day="${i}" data-slot="${esc(k)}" aria-label="Ajouter un plat : ${esc(lab)}, ${esc(dlab(d))}"><option value="">+ Ajouter un plat…</option>${Object.keys(
              S.rec
            )
              .map((n) => `<option>${esc(n)}</option>`)
              .join(
                ""
              )}</select></div>${delSl && delSl.day === i && delSl.k === k ? delPanel(i, k, lab) : ""}`
        )
        .join(
          ""
        )}<div class="zadd"><select data-as="1" data-day="${i}" aria-label="Ajouter un repas le ${esc(dlab(d))}"><option value="">+ Ajouter un repas…</option>${gone.map((t) => `<option value="${esc(t.k)}">${esc(t.n)}</option>`).join("")}<option value="__new">➕ Nouveau repas…</option></select>${addDay === i && addT ? addPanel() : ""}</div></div>`;
    })
    .join("");
  if (addDay >= 0) {
    const f = $("menu").querySelector("[data-nn]");
    if (f) f.focus();
  }
}

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
  drawSw();
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
    nj = j;
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
  const t = e.target;
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
    delSl = { day: +t.dataset.day, k: t.dataset.slot };
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
  if (!t.dataset.rm) return;
  marr(+t.dataset.day, t.dataset.slot).splice(+t.dataset.j, 1);
  drawMenu();
  calc();
});

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

function drawSw() {
  $("types").innerHTML = C.types
    .map(
      (t, i) =>
        `<div class="trow"><div class="tl"><input class="tn" value="${esc(t.n)}" data-tn="${esc(t.k)}" maxlength="30" aria-label="Nom du repas"><button class="x" data-tu="${esc(t.k)}" title="Monter" aria-label="Monter ${esc(t.n)}"${i ? "" : " disabled"}>▲</button><button class="x" data-td="${esc(t.k)}" title="Descendre" aria-label="Descendre ${esc(t.n)}"${i < C.types.length - 1 ? "" : " disabled"}>▼</button><button class="x" data-tx="${esc(t.k)}" title="Supprimer ce type de repas" aria-label="Supprimer ${esc(t.n)}">🗑</button></div><div class="crow"><span class="sws">${COLS.map((c) => `<button class="sw${c.toLowerCase() === String(C.col[t.k]).toLowerCase() ? " on" : ""}" style="background:${c}" data-c="${c}" data-ck="${esc(t.k)}" title="${CN[c] || c}" aria-label="Couleur ${CN[c] || c} pour ${esc(t.n)}" aria-pressed="${c.toLowerCase() === String(C.col[t.k]).toLowerCase()}"></button>`).join("")}</span><input type="color" data-ci="${esc(t.k)}" value="${esc(C.col[t.k])}" title="Autre couleur" aria-label="Autre couleur pour ${esc(t.n)}"><span class="s cw" style="color:#d33">${lowc(C.col[t.k]) ? "⚠ contraste faible" : ""}</span></div></div>`
    )
    .join("");
}

$("types").addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (d.tn) {
    const t = C.types.find((x) => x.k === d.tn);
    if (t) {
      t.n = e.target.value;
      drawMenu();
      calc();
    }
  } else if (d.ci) {
    C.col[d.ci] = e.target.value;
    e.target
      .closest(".trow")
      .querySelectorAll(".sw")
      .forEach((b) =>
        b.classList.toggle("on", b.dataset.c.toLowerCase() === e.target.value.toLowerCase())
      );
    e.target.closest(".trow").querySelector(".cw").textContent = lowc(e.target.value)
      ? "⚠ contraste faible"
      : "";
    drawMenu();
    calc();
  }
});

$("types").addEventListener("change", (e) => {
  const d = e.target.dataset;
  if (d.tn) {
    const t = C.types.find((x) => x.k === d.tn);
    if (t && !t.n.trim()) {
      t.n = "Repas";
      drawSw();
      drawMenu();
      calc();
    }
  }
});

$("types").addEventListener("click", (e) => {
  const d = e.target.dataset,
    T = C.types;
  if (d.ck) {
    C.col[d.ck] = d.c;
    drawSw();
    drawMenu();
    calc();
    return;
  }
  const mv = (k, s) => {
    const i = T.findIndex((x) => x.k === k),
      j = i + s;
    if (i < 0 || j < 0 || j >= T.length) return;
    [T[i], T[j]] = [T[j], T[i]];
    drawSw();
    drawMenu();
    calc();
  };
  if (d.tu) mv(d.tu, -1);
  else if (d.td) mv(d.td, 1);
  else if (d.tx) {
    const t = T.find((x) => x.k === d.tx);
    if (!t) return;
    if (T.length < 2) {
      alert("Il faut garder au moins un type de repas.");
      return;
    }
    if (!confirm("Supprimer « " + t.n + " » de tous les jours (et les plats qu'il contient) ?"))
      return;
    C.types = T.filter((x) => x.k !== d.tx);
    delete C.col[d.tx];
    Object.values(C.menu).forEach((dm) => delete dm[d.tx]);
    Object.keys(C.off).forEach((j) => (C.off[j] = C.off[j].filter((k) => k !== d.tx)));
    drawSw();
    drawMenu();
    calc();
  }
});

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
