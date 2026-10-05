/* Intendance PSS – Configuration : nom de la troupe, logo, sections (noms, âges, ordre, ajout, suppression).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Applique f à chaque tableau indexé par section : effectifs, régimes et quantités des recettes. */
function secArrays(f) {
  for (const c of Object.values(S.camps)) {
    c.n = f(c.n);
    for (const k of Object.keys(c.dt)) c.dt[k] = f(c.dt[k]);
  }
  for (const r of Object.values(S.rec)) for (const k of Object.keys(r.ing)) r.ing[k] = f(r.ing[k]);
}

/** Nom de la troupe et logo affichés dans le menu, le titre de la page et les textes d'aide. */
function drawBrand() {
  $("ttroop").textContent = troop();
  document.title = troop() + " – Intendance de camp";
  $("logoimg").alt = $("logoimg2").alt = "Logo " + troop();
  $("logoimg").src = $("logoimg2").src = S.logo || "assets/logo-pss.jpg";
  $("logor").hidden = !S.logo;
}

function drawSecEd() {
  $("secl").innerHTML = SEC.map(
    (s, i) =>
      `<div class="secrow"><input data-sn="${i}" value="${esc(s[0])}" maxlength="40" aria-label="Nom de la section ${i + 1}"><input data-sa="${i}" value="${esc(s[1])}" maxlength="30" placeholder="ex. 10–13 ans" aria-label="Âges de la section ${i + 1}"><button class="x" data-sm="${i}" data-d="-1" aria-label="Monter ${esc(s[0])}"${i === 0 ? " disabled" : ""}>▲</button><button class="x" data-sm="${i}" data-d="1" aria-label="Descendre ${esc(s[0])}"${i === SEC.length - 1 ? " disabled" : ""}>▼</button><button class="x" data-sx="${i}" aria-label="Supprimer ${esc(s[0])}"${SEC.length < 2 ? " disabled" : ""}>✕</button></div>`
  ).join("");
  $("secadd").disabled = SEC.length >= MAXSEC;
}

/** Réaffiche tout ce qui dépend des sections, et enregistre. */
function secChanged() {
  drawCnt();
  drawDiets();
  drawRec();
  calc();
}

$("tname").value = S.troop || "";

$("tname").addEventListener("input", () => {
  S.troop = $("tname").value.slice(0, 60);
  drawBrand();
  save();
});

$("logor").onclick = () => {
  delete S.logo;
  drawBrand();
  save();
};

$("secl").addEventListener("input", (e) => {
  const d = e.target.dataset;
  if (d.sn !== undefined) SEC[+d.sn][0] = e.target.value;
  else if (d.sa !== undefined) SEC[+d.sa][1] = e.target.value;
  else return;
  secChanged();
});

$("secl").addEventListener("change", (e) => {
  const i = e.target.dataset.sn;
  if (i !== undefined && !SEC[+i][0].trim()) {
    SEC[+i][0] = "Section " + (+i + 1);
    e.target.value = SEC[+i][0];
    secChanged();
  }
});

$("secl").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.sm !== undefined) {
    const i = +b.dataset.sm,
      j = i + +b.dataset.d;
    if (j < 0 || j >= SEC.length) return;
    [SEC[i], SEC[j]] = [SEC[j], SEC[i]];
    secArrays((a) => {
      const r = [...a];
      [r[i], r[j]] = [r[j], r[i]];
      return r;
    });
    secChanged();
    drawSecEd();
    $("secl").querySelector(`[data-sm="${j}"][data-d="${b.dataset.d}"]:not([disabled])`)?.focus();
    say(SEC[j][0] + " : position " + (j + 1) + " sur " + SEC.length);
  } else if (b.dataset.sx !== undefined) {
    const i = +b.dataset.sx;
    if (SEC.length < 2) return;
    if (
      !confirm(
        "Supprimer la section « " +
          SEC[i][0] +
          " » ? Ses effectifs, ses régimes et ses quantités dans les recettes seront perdus."
      )
    )
      return;
    SEC.splice(i, 1);
    secArrays((a) => a.filter((_, k) => k !== i));
    secChanged();
    drawSecEd();
    say("Section supprimée");
  }
});

$("secadd").onclick = () => {
  if (SEC.length >= MAXSEC) return;
  SEC.push(["Section " + (SEC.length + 1), ""]);
  secArrays((a) => [...a, 0]);
  secChanged();
  drawSecEd();
  const l = $("secl").querySelectorAll("[data-sn]");
  l[l.length - 1].focus();
  l[l.length - 1].select();
};
