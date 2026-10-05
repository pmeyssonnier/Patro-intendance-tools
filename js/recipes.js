/* Intendance PSS – Recettes et ingrédients : édition, quantités (par personne ou uniques), ingrédients personnalisés, suppression.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

function drawRec() {
  const names = Object.keys(S.rec);
  if (!S.rec[S.cur]) S.cur = names[0] || "";
  $("rsel").innerHTML = names
    .map((d) => `<option${d === S.cur ? " selected" : ""}>${esc(d)}</option>`)
    .join("");
  const R = S.rec[S.cur];
  $("rdesc").value = R ? R.desc : "";
  $("rh").innerHTML =
    "<tr><th>Ingrédient</th>" +
    SEC.map((s) => `<th>${s[0]}<div class="s">${s[1]}</div></th>`).join("") +
    "<th></th></tr>";
  $("rb").innerHTML = R
    ? Object.entries(R.ing)
        .map(([k, q]) => {
          const fx = R.fx && k in R.fx;
          return `<tr><td>${esc(ING[k][0])} (${ING[k][1]})<div><button class="x tg" data-tg="${esc(k)}">${fx ? "→ par personne" : "→ quantité unique"}</button></div></td>${fx ? `<td colspan="4"><input type="number" min="0" step="any" value="${+(R.fx[k] / fxu(k)).toFixed(3)}" data-fx="${esc(k)}" style="width:90px" aria-label="${esc(ING[k][0])} : quantité totale en ${fxl(k)}"> <span class="s">${fxl(k)} au total</span><label style="display:flex;gap:6px;align-items:center;margin-top:4px"><input type="checkbox" data-fa="${esc(k)}"${R.fa && R.fa[k] === 0 ? "" : " checked"} style="width:auto"> adapter aux régimes</label></td>` : q.map((v, i) => `<td><input type="number" min="0" value="${v}" data-k="${esc(k)}" data-s="${i}" aria-label="${esc(ING[k][0])}, ${SEC[i][0]}, par personne"></td>`).join("")}<td><button class="x" data-rm="${esc(k)}" aria-label="Retirer ${esc(ING[k][0])} de la recette" title="Retirer de la recette">✕</button></td></tr>`;
        })
        .join("")
    : "";
  $("radd").innerHTML =
    "<option value=''>+ Ajouter un ingrédient…</option>" +
    Object.entries(ING)
      .filter(([k, v]) => R && !R.ing[k] && !v[4] && !S.hid.includes(k))
      .map(([k, v]) => `<option value="${esc(k)}">${esc(v[0])}</option>`)
      .join("");
}

$("rsel").onchange = () => {
  S.cur = $("rsel").value;
  drawRec();
};

$("rdesc").onchange = () => {
  if (S.rec[S.cur]) {
    S.rec[S.cur].desc = $("rdesc").value;
    save();
  }
};

$("rb").addEventListener("change", (e) => {
  const d = e.target.dataset,
    R = S.rec[S.cur];
  if (!R) return;
  if (d.k) {
    R.ing[d.k][+d.s] = +e.target.value || 0;
    calc();
  } else if (d.fx && R.fx) {
    R.fx[d.fx] = Math.round(Math.max(0, +e.target.value || 0) * fxu(d.fx) * 1000) / 1000;
    calc();
  } else if (d.fa !== undefined && R.fx) {
    R.fa = R.fa || {};
    if (e.target.checked) delete R.fa[d.fa];
    else R.fa[d.fa] = 0;
    calc();
  }
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
        pp = n ? (ING[k][1] === "pc" ? +(R.fx[k] / n).toFixed(2) : Math.round(R.fx[k] / n)) : 0;
      R.ing[k] = [pp, pp, pp, pp];
      delete R.fx[k];
      if (R.fa) delete R.fa[k];
    } else R.fx[k] = Math.round(R.ing[k].reduce((a, q, i) => a + q * C.n[i], 0) * 100) / 100;
    drawRec();
    calc();
  } else if (t.rm) {
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
    S.rec[S.cur].ing[k] = [0, 0, 0, 0];
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

$("inew").onclick = () => {
  $("iform").style.display = "grid";
  $("iname").value = "";
  $("iname").focus();
};

$("ino").onclick = () => {
  $("iform").style.display = "none";
};

$("iok").onclick = () => {
  const n = $("iname").value.trim();
  if (!n) return;
  const k = "c_" + Date.now().toString(36);
  const dg = DMAP[$("idiet").value] || [];
  const kw = n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const e = [n, $("iunit").value, 0, kw, 0, dg];
  S.cust[k] = e;
  ING[k] = e;
  dg.forEach((d) => {
    if (DIETS[d]) DIETS[d].ex[k] = null;
  });
  if (S.rec[S.cur]) S.rec[S.cur].ing[k] = [0, 0, 0, 0];
  $("iform").style.display = "none";
  drawRec();
  drawDietEd();
  calc();
};
