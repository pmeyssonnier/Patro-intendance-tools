/* Intendance PSS – Régimes et allergies : effectifs concernés, règles de remplacement, remarques.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

if (!C.dt) C.dt = {};

function drawDiets() {
  $("dh").innerHTML = "<tr><th>Régime</th>" + SEC.map((x) => `<th>${x[0]}</th>`).join("") + "</tr>";
  $("db").innerHTML =
    Object.entries(DIETS)
      .map(
        ([k, v]) =>
          `<tr><td>${esc(v.n)}</td>${SEC.map((x, i) => `<td><input type="number" min="0" value="${(C.dt[k] || [])[i] || 0}" data-d="${esc(k)}" data-s="${i}" aria-label="${esc(v.n)} : ${x[0]}"></td>`).join("")}</tr>`
      )
      .join("") || "<tr><td>Aucun régime. Ouvre « Modifier » pour en ajouter.</td></tr>";
}

$("db").addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (d.d) {
    (C.dt[d.d] = C.dt[d.d] || [0, 0, 0, 0])[+d.s] = +e.target.value || 0;
    calc();
  }
});

let dcur = null;

function drawDietEd() {
  const ks = Object.keys(DIETS);
  if (!DIETS[dcur]) dcur = ks[0] || null;
  $("dsel").innerHTML = ks
    .map(
      (k) => `<option value="${esc(k)}"${k === dcur ? " selected" : ""}>${esc(DIETS[k].n)}</option>`
    )
    .join("");
  $("dname").value = dcur ? DIETS[dcur].n : "";
  $("dname").disabled = $("ddel").disabled = $("dradd").disabled = !dcur;
  const vis = (k, sel) => !S.hid.includes(k) || k === sel,
    opt = (sel, none) =>
      (none ? `<option value=""${sel == null ? " selected" : ""}>— retirer —</option>` : "") +
      Object.keys(ING)
        .filter((k) => vis(k, sel))
        .map(
          (k) =>
            `<option value="${esc(k)}"${k === sel ? " selected" : ""}>${esc(ING[k][0])}</option>`
        )
        .join("");
  $("drules").innerHTML = dcur
    ? Object.entries(DIETS[dcur].ex)
        .map(
          ([k, v]) =>
            `<tr><td><select data-ro="${esc(k)}" aria-label="Ingrédient à remplacer">${opt(k)}</select></td><td>→</td><td><select data-rs="${esc(k)}" aria-label="Remplacé par">${opt(v, 1)}</select></td><td><button class="x" data-rx="${esc(k)}" aria-label="Supprimer cette règle" title="Supprimer cette règle">✕</button></td></tr>`
        )
        .join("") || '<tr><td class="s">Aucune règle : ajoutes-en une.</td></tr>'
    : "";
}

$("dsel").onchange = () => {
  dcur = $("dsel").value;
  drawDietEd();
};

$("dname").onchange = () => {
  if (dcur) {
    DIETS[dcur].n = $("dname").value.trim() || "Sans nom";
    drawDietEd();
    drawDiets();
    calc();
  }
};

$("dnew").onclick = () => {
  const k = "d_" + Date.now().toString(36);
  DIETS[k] = { n: "Nouveau régime", ex: {} };
  dcur = k;
  drawDietEd();
  drawDiets();
  calc();
  $("dname").focus();
  $("dname").select();
};

$("ddel").onclick = () => {
  if (!dcur || !confirm("Supprimer le régime « " + DIETS[dcur].n + " » ?")) return;
  delete DIETS[dcur];
  delete C.dt[dcur];
  drawDietEd();
  drawDiets();
  calc();
};

$("dradd").onclick = () => {
  const ex = DIETS[dcur].ex,
    k = Object.keys(ING).find((k) => !(k in ex) && !ING[k][4] && !S.hid.includes(k));
  if (!k) {
    alert("Aucun ingrédient disponible.");
    return;
  }
  ex[k] = null;
  drawDietEd();
  calc();
};

$("drules").addEventListener("change", (e) => {
  const d = e.target.dataset,
    ex = DIETS[dcur].ex;
  if (d.rs !== undefined) ex[d.rs] = e.target.value || null;
  else if (d.ro !== undefined) {
    const nk = e.target.value;
    if (!(nk in ex)) {
      const ne = {};
      for (const [k, v] of Object.entries(ex)) ne[k === d.ro ? nk : k] = v;
      DIETS[dcur].ex = ne;
    }
  }
  drawDietEd();
  calc();
});

$("drules").addEventListener("click", (e) => {
  const k = e.target.dataset.rx;
  if (k) {
    delete DIETS[dcur].ex[k];
    drawDietEd();
    calc();
  }
});

$("notes").onchange = () => {
  C.notes = $("notes").value;
  save();
};
