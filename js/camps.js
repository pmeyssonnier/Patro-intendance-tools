/* Intendance PSS – Camps : choix, dates, effectifs, copie de menu.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const cdays = () => {
  const n = days().length;
  $("cdays").textContent =
    n +
    " jour" +
    (n > 1 ? "s" : "") +
    " · " +
    dlab(days()[0]) +
    " → " +
    dlab(days()[n - 1]) +
    (n >= 31 ? " (maximum 31 jours)" : "");
};

function drawCamps() {
  const o = Object.entries(S.camps)
    .map(
      ([k, c]) =>
        `<option value="${esc(k)}"${k === S.ccur ? " selected" : ""}>${esc(c.name)} · ${fdate(c.start)}</option>`
    )
    .join("");
  $("csel").innerHTML = o;
  $("csel2").innerHTML = o;
  $("mcp").innerHTML =
    Object.entries(S.camps)
      .filter(([k]) => k !== S.ccur)
      .map(([k, c]) => `<option value="${esc(k)}">${esc(c.name)} · ${fdate(c.start)}</option>`)
      .join("") || "<option value=''>(aucun autre camp)</option>";
  $("cinfo").textContent = C.name + " · " + fdate(C.start) + " → " + fdate(C.end);
}

function fillCamp() {
  $("cname").value = C.name;
  $("cstart").value = C.start;
  $("cend").value = C.end;
  $("wa").value = C.wa;
  $("mtitle").value = C.mt;
  $("notes").value = C.notes || "";
  document.querySelectorAll("[data-n]").forEach((e) => (e.value = C.n[e.dataset.n]));
  cdays();
}

function setCamp(id) {
  S.ccur = id;
  C = S.camps[id];
  fillCamp();
  drawCamps();
  drawSw();
  drawDiets();
  drawMenu();
  calc();
}

$("csel").onchange = () => setCamp($("csel").value);

$("csel2").onchange = () => setCamp($("csel2").value);

$("cname").addEventListener("input", () => {
  C.name = $("cname").value;
  drawCamps();
  calc();
});

function dchg() {
  if (!pISO(C.start)) C.start = iso(new Date());
  if (!pISO(C.end) || C.end < C.start) C.end = C.start;
  $("cstart").value = C.start;
  $("cend").value = C.end;
  cdays();
  drawMenu();
  drawCamps();
  calc();
}

$("cstart").onchange = () => {
  C.start = $("cstart").value;
  dchg();
};

$("cend").onchange = () => {
  C.end = $("cend").value;
  dchg();
};

$("cnew").onclick = () => {
  const k = "k_" + Date.now().toString(36);
  S.camps[k] = mkCamp("Nouveau camp");
  setCamp(k);
  go("eff");
  $("cname").focus();
  $("cname").select();
};

$("cdup").onclick = () => {
  const k = "k_" + Date.now().toString(36),
    c = JSON.parse(JSON.stringify(C));
  c.name += " (copie)";
  S.camps[k] = c;
  setCamp(k);
  go("eff");
};

$("cdel").onclick = () => {
  if (Object.keys(S.camps).length < 2) {
    alert("Il faut garder au moins un camp.");
    return;
  }
  if (!confirm("Supprimer le camp « " + C.name + " » (dates, effectifs, régimes et menu) ?"))
    return;
  delete S.camps[S.ccur];
  setCamp(Object.keys(S.camps)[0]);
};

$("mcpb").onclick = () => {
  const id = $("mcp").value;
  if (!id || !S.camps[id]) return;
  if (!confirm("Remplacer le menu de ce camp par celui de « " + S.camps[id].name + " » ?")) return;
  const o = JSON.parse(JSON.stringify(S.camps[id]));
  C.menu = o.menu;
  C.types = o.types || DEFT();
  C.col = o.col || { ...SCOL };
  C.off = o.off || {};
  drawSw();
  drawMenu();
  calc();
};

$("cnt").innerHTML = SEC.map(
  (s, i) =>
    `<div><label>${s[0]} (${s[1]})</label><input type="number" min="0" data-n="${i}" aria-label="Effectif ${s[0]}"></div>`
).join("");

document.querySelectorAll("[data-n]").forEach((e) =>
  e.addEventListener("input", () => {
    C.n[e.dataset.n] = +e.value || 0;
    calc();
  })
);

$("wa").addEventListener("input", () => {
  C.wa = +$("wa").value || 0;
  calc();
});
