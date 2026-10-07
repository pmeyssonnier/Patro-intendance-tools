/* Intendance PSS – Régimes et allergies : effectifs concernés, règles de remplacement, remarques.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

if (!C.dt) C.dt = {};

/* Téléphone : une liste, un seul régime déplié à la fois ; ordinateur (≥ 900 px) : tableau. */
const mqRg = matchMedia("(min-width:900px)");
let rgOpen = null;

const nbDt = (k) => (C.dt[k] || []).reduce((a, v) => a + (+v || 0), 0);

function drawDiets() {
  const ks = Object.keys(DIETS),
    vide = "<tr><td>Aucun régime. Ouvre « Modifier » pour en ajouter.</td></tr>",
    val = (k, i) => (C.dt[k] || [])[i] || 0,
    ef = (i) => `<span class="ef" data-ef="${i}">(${C.n[i] || 0})</span>`;
  if (!DIETS[rgOpen]) rgOpen = ks[0] || null;
  $("dtab").hidden = !mqRg.matches;
  $("dlist").hidden = mqRg.matches;
  if (mqRg.matches) {
    $("dlist").innerHTML = "";
    $("dh").innerHTML =
      "<tr><th>Régime</th>" +
      SEC.map((x, i) => `<th>${esc(x[0])} ${ef(i)}</th>`).join("") +
      "</tr>";
    $("db").innerHTML =
      ks
        .map(
          (k) =>
            `<tr><td>${esc(DIETS[k].n)}</td>${SEC.map((x, i) => `<td><input type="number" min="0" value="${val(k, i)}" data-d="${esc(k)}" data-s="${i}" aria-label="${esc(DIETS[k].n)} : ${esc(x[0])}"></td>`).join("")}</tr>`
        )
        .join("") || vide;
    checkDiets();
    return;
  }
  $("dh").innerHTML = $("db").innerHTML = "";
  $("dlist").innerHTML =
    ks
      .map(
        (k) =>
          `<details class="rg" data-rg="${esc(k)}"${k === rgOpen ? " open" : ""}><summary><span>${esc(DIETS[k].n)} <b class="rgn" data-rn="${esc(k)}"${nbDt(k) ? "" : " hidden"}>(${nbDt(k)})</b></span></summary>${SEC.map((x, i) => `<label class="rgl"><span>${esc(x[0])}<small>${esc(x[1])}</small> ${ef(i)}</span><input type="number" min="0" value="${val(k, i)}" data-d="${esc(k)}" data-s="${i}" aria-label="${esc(DIETS[k].n)} : ${esc(x[0])}"></label>`).join("")}</details>`
      )
      .join("") || "<p class='s'>Aucun régime. Ouvre « Modifier » pour en ajouter.</p>";
  checkDiets();
}

/* Cohérence avec les effectifs : un régime ne peut pas concerner plus de personnes que l'effectif de la section
   (erreur, champ en rouge) ; le cumul des régimes peut le dépasser si une personne en cumule plusieurs (info). */
function checkDiets() {
  const ks = Object.keys(DIETS),
    val = (k, i) => (C.dt[k] || [])[i] || 0,
    err = [],
    inf = [];
  document.querySelectorAll("#g-reg input[data-d]").forEach((el) => {
    const bad = val(el.dataset.d, +el.dataset.s) > (C.n[+el.dataset.s] || 0);
    el.classList.toggle("bad", bad);
    el.setAttribute("aria-invalid", bad ? "true" : "false");
  });
  document.querySelectorAll("#g-reg [data-ef]").forEach((el) => {
    el.textContent = `(${C.n[+el.dataset.ef] || 0})`;
  });
  document.querySelectorAll("#dlist details.rg").forEach((el) => {
    const k = el.dataset.rg;
    el.classList.toggle(
      "bad",
      SEC.some((s, i) => val(k, i) > (C.n[i] || 0))
    );
  });
  SEC.forEach((s, i) => {
    const n = C.n[i] || 0;
    let sur = false,
      tot = 0;
    for (const k of ks) {
      const v = val(k, i);
      tot += v;
      if (v > n) {
        sur = true;
        err.push(
          `${DIETS[k].n}, ${s[0]} : ${v} personne${v > 1 ? "s" : ""} pour un effectif de ${n}.`
        );
      }
    }
    if (!sur && tot > n)
      inf.push(
        `${s[0]} : ${tot} régimes ou allergies pour ${n} personne${n > 1 ? "s" : ""} (normal si certaines cumulent plusieurs régimes).`
      );
  });
  $("dwarn").innerHTML =
    err.map((t) => `<p class="derr">⚠️ ${esc(t)}</p>`).join("") +
    inf.map((t) => `<p class="s">ℹ️ ${esc(t)}</p>`).join("");
}

mqRg.addEventListener("change", drawDiets);

function saisieRegime(e) {
  const d = e.target.dataset;
  if (d.d) {
    (C.dt[d.d] = C.dt[d.d] || SEC.map(() => 0))[+d.s] = saisie(e.target.value, 1e4);
    const n = document.querySelector(`[data-rn="${CSS.escape(d.d)}"]`);
    if (n) {
      n.textContent = `(${nbDt(d.d)})`;
      n.hidden = !nbDt(d.d);
    }
    checkDiets();
    calc();
  }
}

$("db").addEventListener("input", saisieRegime);
$("dlist").addEventListener("input", saisieRegime);

// un seul régime déplié à la fois (l'événement « toggle » ne remonte pas : on l'écoute en capture)
$("dlist").addEventListener(
  "toggle",
  (e) => {
    const k = e.target.dataset.rg;
    if (!k) return;
    if (e.target.open) {
      rgOpen = k;
      $("dlist")
        .querySelectorAll("details.rg[open]")
        .forEach((x) => {
          if (x !== e.target) x.open = false;
        });
    } else if (rgOpen === k) rgOpen = null;
  },
  true
);

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
    k = Object.keys(ING).find((k) => !(k in ex) && !ING[k][4] && !S.art[k] && !S.hid.includes(k));
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
