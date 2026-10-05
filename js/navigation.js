/* Intendance PSS – Navigation : menu latéral, changement de page, logo.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const PG = {
  eff: "Camp & effectifs",
  reg: "Régimes & allergies",
  menu: "Menu",
  rec: "Recettes",
  cat: "Catalogue de prix",
  list: "Liste de courses",
  sh: "Partager / imprimer",
  cfg: "Configuration",
  pj: "Sauvegarde",
};

const mqW = matchMedia("(min-width:900px)"),
  say = (t) => {
    $("live").textContent = "";
    setTimeout(() => ($("live").textContent = t), 30);
  };

function nav(o) {
  document.body.classList.toggle("nav", !!o);
  $("burger").setAttribute("aria-expanded", !!o);
  syncDrawer(o);
}

function syncDrawer(o) {
  $("drawer").inert = !mqW.matches && !o;
}

mqW.addEventListener("change", () => syncDrawer(document.body.classList.contains("nav")));

function go(g) {
  document.querySelectorAll(".pg").forEach((x) => x.classList.toggle("on", x.id === "g-" + g));
  document.querySelectorAll(".ni").forEach((x) => {
    const on = x.dataset.g === g;
    x.classList.toggle("on", on);
    if (on) x.setAttribute("aria-current", "page");
    else x.removeAttribute("aria-current");
  });
  $("ptitle").textContent = PG[g];
  nav(0);
  window.scrollTo(0, 0);
  try {
    sessionStorage.setItem("pg", g);
  } catch (_) {}
}

$("burger").onclick = () => {
  const o = !document.body.classList.contains("nav");
  nav(o);
  if (o) {
    const f = $("drawer").querySelector(".ni.on") || $("drawer").querySelector(".ni");
    if (f) f.focus();
  }
};

$("scrim").onclick = () => nav(0);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("nav")) {
    nav(0);
    $("burger").focus();
  }
});

$("drawer").addEventListener("click", (e) => {
  const b = e.target.closest(".ni");
  if (b) go(b.dataset.g);
});

$("gear").onclick = () => go("cfg");

/** Hauteur de la barre du haut : les titres de tableaux se collent juste en dessous. */
const mesureBarre = () =>
  document.documentElement.style.setProperty(
    "--topH",
    document.querySelector(".top").offsetHeight + "px"
  );

mesureBarre();

addEventListener("resize", mesureBarre);

/** Lit l'image choisie, la réduit (160 px) et en fait le logo ; le même code sert au menu et à la Configuration. */
const choisirLogo = (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas"),
        k = Math.min(1, 160 / Math.max(im.width, im.height));
      c.width = im.width * k;
      c.height = im.height * k;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      S.logo = c.toDataURL("image/png");
      drawBrand();
      save();
    };
    im.src = r.result;
  };
  r.readAsDataURL(f);
};

$("logof").onchange = choisirLogo;

$("logof2").onchange = choisirLogo;
