const { test, expect } = require("@playwright/test");
const {
  basculerQuantite,
  ouvrir,
  aller,
  telecharger,
  importer,
  montant,
  deplierRegime,
  URL: URL_APPLI,
} = require("./helpers");

test("la page s'ouvre sans erreur avec le camp d'exemple", async ({ page }) => {
  const erreurs = await ouvrir(page);
  await expect(page).toHaveTitle(/Intendance de camp/);
  await expect(page.locator("footer")).toContainText(
    "Outil fait par le Patro Sainte-Suzanne pour les patros"
  );
  await expect(page.locator("#cname")).toHaveValue("Mon camp");
  expect(await page.locator("#list tr").count()).toBeGreaterThan(5);
  // valeurs par défaut complètes : S.cust existe dès le premier lancement
  expect(await page.evaluate(() => typeof S.cust)).toBe("object");
  expect(erreurs).toEqual([]);
});

test("les fichiers de l'application (styles, script, logo) sont tous chargés", async ({ page }) => {
  const echecs = [];
  page.on("requestfailed", (r) => echecs.push(r.url()));
  page.on("response", (r) => {
    if (r.status() >= 400) echecs.push(r.url());
  });
  await ouvrir(page);
  await page.waitForLoadState("networkidle");
  expect(echecs).toEqual([]);
  // la feuille de styles est appliquée (le tiroir est en position fixe) et le logo s'affiche
  expect(await page.locator("#drawer").evaluate((d) => getComputedStyle(d).position)).toBe("fixed");
  expect(
    await page.locator("#logoimg").evaluate((i) => i.complete && i.naturalWidth)
  ).toBeGreaterThan(100);
});

test("le numéro de version est affiché en bas du menu", async ({ page }) => {
  await ouvrir(page);
  // sur téléphone, le menu est replié : on l'ouvre
  if (await page.locator("#burger").isVisible()) await page.locator("#burger").click();
  const version = require("../package.json").version;
  await expect(page.locator("#appver")).toBeVisible();
  await expect(page.locator("#appver")).toHaveText("(version " + version + ")");
  await expect(page.locator("footer")).toContainText("(version " + version + ")");
  // c'est le dernier élément du menu
  expect(await page.locator("#drawer").evaluate((d) => d.lastElementChild.id)).toBe("appver");
});

test("les scripts et le style portent le numéro de version (évite les fichiers périmés en cache)", async () => {
  const version = require("../package.json").version;
  const html = require("fs").readFileSync(
    require("path").join(__dirname, "..", "index.html"),
    "utf8"
  );
  const liens = [...html.matchAll(/(?:src|href)="((?:js\/[^"]+\.js|styles\.css)[^"]*)"/g)].map(
    (m) => m[1]
  );
  expect(liens.length).toBe(25);
  for (const l of liens)
    expect(l).toMatch(new RegExp("\\?v=" + version.replace(/\./g, "\\.") + "$"));
});

test("chaque page du menu s'affiche", async ({ page }) => {
  await ouvrir(page);
  const titres = {
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
  for (const [id, titre] of Object.entries(titres)) {
    await aller(page, id);
    await expect(page.locator("#ptitle")).toHaveText(titre);
    await expect(page.locator(".pg.on")).toHaveCount(1);
  }
});

test("camp : les dates donnent les jours du menu", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "eff");
  await page.locator("#cstart").fill("2026-03-20");
  await page.locator("#cstart").dispatchEvent("change");
  await page.locator("#cend").fill("2026-03-22");
  await page.locator("#cend").dispatchEvent("change");
  await aller(page, "menu");
  await expect(page.locator(".dhd .dn")).toHaveText([
    "Vendredi 20/03",
    "Samedi 21/03",
    "Dimanche 22/03",
  ]);
});

test("menu : ajouter un plat augmente le budget", async ({ page }) => {
  await ouvrir(page);
  const avant = montant(await page.locator("#tot").innerText());
  await aller(page, "menu");
  await page
    .locator('select[data-add][data-day="0"][data-slot="m"]')
    .selectOption("Spaghetti bolognaise");
  await aller(page, "list");
  expect(montant(await page.locator("#tot").innerText())).toBeGreaterThan(avant);
});

test("menu : un repas supplémentaire pour tous les jours, retiré d'un seul", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "menu");
  await page.locator('select[data-as][data-day="0"]').selectOption("__new");
  await page.locator("input[data-nn]").fill("Goûter");
  await page.locator("select[data-sc]").selectOption("all");
  await page.locator("button[data-nok]").click();
  const jours = await page.locator(".dcard").count();
  await expect(page.locator(".zl", { hasText: "Goûter" })).toHaveCount(jours);
  // retirer le goûter du premier jour seulement
  await page
    .locator(".dcard")
    .first()
    .locator(".zone", { hasText: "Goûter" })
    .locator(".zn")
    .click();
  await page.locator('button[data-dsc="one"]').click();
  await expect(page.locator(".zl", { hasText: "Goûter" })).toHaveCount(jours - 1);
});

test("menu : un plat se déplace au clavier d'un repas à l'autre", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "menu");
  const poignee = page.locator('.zone[data-day="1"][data-slot="m"] .hd').first();
  await poignee.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.locator('.zone[data-day="1"][data-slot="d"] .cn', { hasText: "Petit-déjeuner" })
  ).toHaveCount(1);
  await expect(page.locator("#live")).toContainText("Petit-déjeuner");
});

test("recette : une quantité unique est répartie entre les régimes", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "reg");
  // 3 personnes sans gluten (2 chez les Conquérants, 1 chez les animateurs)
  await deplierRegime(page, "sg");
  await page.locator('input[data-d="sg"][data-s="2"]').fill("2");
  await page.locator('input[data-d="sg"][data-s="3"]').fill("1");
  await aller(page, "rec");
  await page.locator("#rsel").selectOption("Croque-monsieur");
  await basculerQuantite(page, page.locator('#rb tr[data-rk="pain"]'));
  await page.locator('input[data-fx="pain"]').fill("5");
  await page.locator('input[data-fx="pain"]').dispatchEvent("change");
  const sortie = await page.evaluate(() => meal("Croque-monsieur").out);
  expect(Math.round(sortie.pain)).toBe(4500); // 27 personnes sur 30
  expect(Math.round(sortie.pain_sg)).toBe(500); // 3 personnes sur 30
  await page.locator('input[data-fa="pain"]').uncheck();
  const sans = await page.evaluate(() => meal("Croque-monsieur").out);
  expect(Math.round(sans.pain)).toBe(5000);
  expect(sans.pain_sg).toBeUndefined();
});

test("régimes : l'adaptation apparaît dans le menu imprimable", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "reg");
  await deplierRegime(page, "veg");
  await page.locator('input[data-d="veg"][data-s="0"]').fill("2");
  await aller(page, "menu");
  await expect(page.locator("#mprev")).toContainText("Végétarien ×2");
});

test("sauvegarde : export puis import redonne les mêmes données", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "eff");
  await page.locator("#cname").fill("Camp de test");
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  expect(fichier.nom).toMatch(/^projet-patro-\d{4}-\d{2}-\d{2}\.json$/);
  const projet = JSON.parse(fichier.texte);
  await importer(page, fichier.chemin);
  await expect(page.locator("#cname")).toHaveValue("Camp de test");
  const apres = await page.evaluate(() => JSON.parse(localStorage.getItem("intendance2")));
  expect(Object.keys(apres.rec)).toEqual(Object.keys(projet.rec));
});

test("sauvegarde : un fichier invalide est refusé sans toucher aux données", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "pj");
  const avant = await page.evaluate(() => localStorage.getItem("intendance2"));
  await page.locator("#jin").setInputFiles({
    name: "mauvais.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"a":1}'),
  });
  await expect(page.locator("#jmsg")).toContainText("Import impossible");
  expect(await page.evaluate(() => localStorage.getItem("intendance2"))).toBe(avant);
});

/** Exporte le projet, remplace les dates du premier camp, réimporte et renvoie les dates affichées. */
async function importerAvecDates(page, start, end) {
  await aller(page, "pj");
  const projet = JSON.parse((await telecharger(page, "#exp")).texte);
  const camp = Object.values(projet.camps)[0];
  camp.start = start;
  camp.end = end;
  await importer(page, {
    name: "dates.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(projet)),
  });
  return page.evaluate(() => ({
    start: C.start,
    end: C.end,
    champ: $("cstart").value,
    jours: days().length,
  }));
}

test("import : des dates impossibles sont remplacées, pas décalées", async ({ page }) => {
  await ouvrir(page);
  for (const [start, end] of [
    ["2026-99-99", "2026-99-99"],
    ["2026-02-30", "2026-03-02"],
    ["2027-02-29", "2027-03-02"],
    ["2026-13-01", "2026-13-05"],
    ["0000-01-01", "0050-01-01"],
  ]) {
    const r = await importerAvecDates(page, start, end);
    // la date de départ n'est ni conservée ni « corrigée » en une autre date : elle est remplacée par une date réelle
    expect(r.start, start).not.toBe(start);
    expect(await page.evaluate((d) => iso(pISO(d)) === d, r.start), start).toBe(true);
    expect(r.champ).toBe(r.start);
    expect(r.end >= r.start).toBe(true);
    expect(r.jours).toBeGreaterThanOrEqual(1);
  }
});

test("import : les dates réelles sont conservées (jour bissextile compris)", async ({ page }) => {
  await ouvrir(page);
  const r = await importerAvecDates(page, "2028-02-28", "2028-03-01");
  expect(r).toMatchObject({ start: "2028-02-28", end: "2028-03-01", jours: 3 });
});

test("sécurité : un fichier piégé n'exécute aucun script", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  const piege = JSON.parse(fichier.texte);
  const id = Object.keys(piege.camps)[0];
  piege.camps['k"><img src=x onerror="window.__pwn=1">'] = piege.camps[id];
  piege.camps[id].types[0].n = "<img src=x onerror=__pwn=2>";
  piege.camps[id].name = '<img src=x onerror="window.__pwn=3">';
  await importer(page, {
    name: "piege.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(piege)),
  });
  await aller(page, "menu");
  await aller(page, "list");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__pwn)).toBeUndefined();
  expect(await page.locator('img[src="x"]').count()).toBe(0);
});

test("fichier HTML téléchargé : autonome et mis en forme", async ({ page, browser }) => {
  await ouvrir(page);
  await aller(page, "sh");
  await page.locator("#shw").selectOption("menu");
  const fichier = await telecharger(page, "#sd");
  expect(fichier.nom).toMatch(/\.html$/);
  expect(fichier.texte).not.toMatch(/<script|<link/); // aucune dépendance externe
  const autre = await browser.newPage();
  await autre.setContent(fichier.texte);
  expect(await autre.locator(".mt tr.day").count()).toBeGreaterThan(0);
  // l'étiquette « Matin » garde sa couleur orange dans le fichier téléchargé
  const fond = await autre
    .locator("tr.sl td.sn", { hasText: "Matin" })
    .first()
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(fond).toBe("rgb(224, 138, 0)");
  await autre.close();
});

test("export CSV : accents, virgules et total identiques à l'appli", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "list");
  const totalAffiche = montant(await page.locator("#tot").innerText());
  const csv = await telecharger(page, "#lcsv");
  expect(csv.nom).toMatch(/^liste-de-courses-.*\.csv$/);
  expect([...csv.octets.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8 pour Excel
  const lignes = csv.texte.replace(/^\uFEFF/, "").split("\r\n");
  expect(lignes[0]).toBe(
    "Produit;Quantité;Unité;Prix unitaire (€);Prix par;Coût (€);Remarque;Rayon;Lien produit"
  );
  const total = lignes.find((l) => l.startsWith("TOTAL;"));
  expect(parseFloat(total.split(";")[5].replace(",", "."))).toBeCloseTo(totalAffiche, 2);
});

test("stockage : un bandeau prévient quand l'enregistrement échoue", async ({ page }) => {
  await ouvrir(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      const e = new Error("plein");
      e.name = "QuotaExceededError";
      throw e;
    };
  });
  await aller(page, "eff");
  await page.locator('[data-n="0"]').fill("31");
  await expect(page.locator("#warn")).toBeVisible();
  await expect(page.locator("#warnt")).toContainText("mémoire du navigateur est pleine");
});

test("accessibilité : tous les boutons et champs ont un nom", async ({ page }) => {
  await ouvrir(page);
  for (const id of ["eff", "reg", "menu", "rec", "cat", "list", "sh", "pj"]) {
    await aller(page, id);
    const sansNom = await page.evaluate(() => {
      const nom = (el) => {
        if ((el.getAttribute("aria-label") || "").trim()) return true;
        if (el.id && document.querySelector(`label[for="${el.id}"]`)) return true;
        const l = el.closest("label");
        if (l && l.textContent.replace(el.value || "", "").trim()) return true;
        return el.tagName === "BUTTON" && /[A-Za-zÀ-ÿ0-9]/.test(el.textContent);
      };
      return [...document.querySelectorAll("button,input:not([type=hidden]),select,textarea")]
        .filter((el) => el.offsetParent !== null && !el.closest("[hidden]") && !nom(el))
        .map((el) => el.outerHTML.slice(0, 80));
    });
    expect(sansNom, `page ${id}`).toEqual([]);
  }
});

test("configuration : nom de la troupe affiché dans le menu, le titre et les documents", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cfg");
  await page.locator("#tname").fill("Patro Saint-Jean");
  await expect(page.locator("#ttroop")).toHaveText("Patro Saint-Jean");
  await expect(page).toHaveTitle("Patro Saint-Jean – Intendance de camp");
  await page.reload();
  await expect(page.locator("#ttroop")).toHaveText("Patro Saint-Jean");
  await aller(page, "sh");
  await page.locator("#shw").selectOption("list");
  await page.locator("#sc").click();
  expect(await page.evaluate(() => troop())).toBe("Patro Saint-Jean");
  // nom vide : retour au nom par défaut
  await aller(page, "cfg");
  await page.locator("#tname").fill("");
  await expect(page.locator("#ttroop")).toHaveText("Patro Sainte-Suzanne");
});

test("configuration : sections renommées, triées, ajoutées et supprimées partout", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  await aller(page, "eff");
  await page.locator('[data-n="0"]').fill("11");
  await page.locator('[data-n="1"]').fill("7");
  await aller(page, "cfg");
  await expect(page.locator("#secl .secrow")).toHaveCount(4);
  // renommer + changer les âges
  await page.locator('[data-sn="0"]').fill("Louveteaux");
  await page.locator('[data-sa="0"]').fill("8–11 ans");
  await aller(page, "eff");
  await expect(page.locator("#cnt label").first()).toHaveText("Louveteaux (8–11 ans)");
  // trier : la 1re passe en 2e position, avec ses effectifs
  await aller(page, "cfg");
  await page.locator('[data-sm="0"][data-d="1"]').click();
  await expect(page.locator('[data-sn="1"]')).toHaveValue("Louveteaux");
  await aller(page, "eff");
  await expect(page.locator('[data-n="0"]')).toHaveValue("7");
  await expect(page.locator('[data-n="1"]')).toHaveValue("11");
  await aller(page, "rec");
  await expect(page.locator("#rh th").nth(2)).toContainText("Louveteaux");
  // ajouter : une colonne de plus dans les recettes
  await aller(page, "cfg");
  await page.locator("#secadd").click();
  await expect(page.locator("#secl .secrow")).toHaveCount(5);
  await aller(page, "rec");
  expect(await page.locator("#rb tr").first().locator("input[type=number]").count()).toBe(5);
  // supprimer la nouvelle section, puis la 1re : 3 colonnes, effectifs recalculés
  await aller(page, "cfg");
  await page.locator('[data-sx="4"]').click();
  await page.locator('[data-sx="0"]').click();
  await expect(page.locator("#secl .secrow")).toHaveCount(3);
  await aller(page, "eff");
  await expect(page.locator("#cnt input")).toHaveCount(3);
  await expect(page.locator('[data-n="0"]')).toHaveValue("11");
  // tout est enregistré
  await page.reload();
  await aller(page, "eff");
  await expect(page.locator("#cnt input")).toHaveCount(3);
  await aller(page, "reg");
  await expect(page.locator('input[data-d="veg"]')).toHaveCount(3);
  // la dernière section ne peut pas être supprimée
  await aller(page, "cfg");
  await page.locator('[data-sx="0"]').click();
  await page.locator('[data-sx="0"]').click();
  await expect(page.locator("#secl .secrow")).toHaveCount(1);
  await expect(page.locator('[data-sx="0"]')).toBeDisabled();
  expect(erreurs).toEqual([]);
});

test("configuration : les quantités suivent la section quand on la déplace", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "rec");
  const avant = await page
    .locator("#rb tr")
    .first()
    .locator("input[type=number]")
    .evaluateAll((l) => l.map((i) => i.value));
  await aller(page, "cfg");
  await page.locator('[data-sm="3"][data-d="-1"]').click();
  await aller(page, "rec");
  const apres = await page
    .locator("#rb tr")
    .first()
    .locator("input[type=number]")
    .evaluateAll((l) => l.map((i) => i.value));
  expect(apres).toEqual([avant[0], avant[1], avant[3], avant[2]]);
});

test("configuration : un projet exporté garde troupe et sections, un ancien fichier reçoit les 4 sections", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cfg");
  await page.locator("#tname").fill("Troupe test");
  await page.locator('[data-sx="3"]').click();
  const json = await page.evaluate(() => JSON.parse(JSON.stringify(S)));
  expect(json.troop).toBe("Troupe test");
  expect(json.sec.length).toBe(3);
  const net = await page.evaluate((x) => {
    const y = cleanProject(x);
    delete x.sec;
    const z = cleanProject(x);
    return [
      y.sec.length,
      Object.values(y.camps)[0].n.length,
      z.sec,
      Object.values(z.camps)[0].n.length,
    ];
  }, json);
  expect(net).toEqual([3, 3, undefined, 4]);
});

test("recettes : la taille des champs reste stable quand le nombre de sections change", async ({
  page,
}) => {
  await ouvrir(page);
  const largeur = async () => {
    await aller(page, "rec");
    return page
      .locator("#rb tr")
      .first()
      .locator("input[type=number]")
      .first()
      .evaluate((i) => i.getBoundingClientRect().width);
  };
  const avant = await largeur();
  await aller(page, "cfg");
  for (let i = 0; i < 4; i++) await page.locator("#secadd").click();
  const apres = await largeur();
  expect(avant).toBeGreaterThanOrEqual(60);
  expect(Math.abs(apres - avant)).toBeLessThan(1);
});

test("effectifs : les champs d'une même ligne sont alignés", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "eff");
  await page.setViewportSize({ width: 390, height: 800 });
  const bas = await page
    .locator("#cnt input")
    .evaluateAll((l) => l.map((i) => Math.round(i.getBoundingClientRect().bottom)));
  expect(bas[0]).toBe(bas[1]);
  expect(bas[2]).toBe(bas[3]);
});

test("tableaux longs : la ligne de titre reste visible quand on défile", async ({ page }) => {
  await ouvrir(page);
  await page.setViewportSize({ width: 390, height: 300 });
  // recettes : le cadre du tableau défile, le titre reste en haut du cadre
  await aller(page, "rec");
  const rec = await page.evaluate(() => {
    const w = document.getElementById("rb").closest(".w");
    w.scrollTop = 80;
    return [
      w.scrollHeight > w.clientHeight,
      Math.round(w.querySelector("th").getBoundingClientRect().top - w.getBoundingClientRect().top),
    ];
  });
  expect(rec[0], "recettes : défile").toBe(true);
  expect(rec[1], "recettes : titre collé en haut").toBeLessThan(3);
  // catalogue et liste de courses : la page défile, le titre se colle sous la barre du haut
  for (const [g, id] of [
    ["cat", "ct"],
    ["list", "list"],
  ]) {
    await aller(page, g);
    const r = await page.evaluate((id) => {
      const t = document.getElementById(id).closest("table");
      window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY + 120);
      return [
        Math.round(t.querySelector("th").getBoundingClientRect().top),
        document.querySelector(".top").offsetHeight,
      ];
    }, id);
    expect(Math.abs(r[0] - r[1]), g + " : titre sous la barre du haut").toBeLessThan(3);
  }
});

test("menu : le camp n'est pas répété en haut", async ({ page }) => {
  await ouvrir(page);
  await expect(page.locator("#cinfo")).toHaveCount(0);
  await expect(page.locator("#csel")).toBeVisible();
});

test("régimes : sur téléphone, un seul régime déplié à la fois avec son total", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "reg");
  if (page.viewportSize().width >= 900) {
    await expect(page.locator("#dh th")).toHaveCount(5);
    await expect(page.locator("#dlist details")).toHaveCount(0);
    return;
  }
  await expect(page.locator("#dh th")).toHaveCount(0);
  await expect(page.locator("details.rg[open]")).toHaveCount(1);
  await expect(page.locator('details.rg[data-rg="veg"]')).toHaveAttribute("open", "");
  await page.locator('input[data-d="veg"][data-s="0"]').fill("2");
  await page.locator('input[data-d="veg"][data-s="3"]').fill("1");
  await expect(page.locator('[data-rn="veg"]')).toHaveText("(3)");
  // en ouvrir un autre referme le premier
  await deplierRegime(page, "sg");
  await expect(page.locator("details.rg[open]")).toHaveCount(1);
  await expect(page.locator('details.rg[data-rg="sg"]')).toHaveAttribute("open", "");
  // replié, le total reste visible derrière le nom du régime
  await expect(page.locator('details.rg[data-rg="veg"] summary')).toContainText("Végétarien (3)");
  // les valeurs saisies sont conservées et sans débordement horizontal
  await page.reload();
  await aller(page, "reg");
  await expect(page.locator('[data-rn="veg"]')).toHaveText("(3)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  );
});

test("catalogue : le bouton de fichier de l'appli affiche le nom du fichier choisi", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await expect(page.locator("#fname")).toHaveText("Aucun fichier choisi");
  await page.locator("#file").setInputFiles({
    name: "prix-magasin.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Riz long grain 1kg;1,95\n"),
  });
  await expect(page.locator("#fname")).toHaveText("prix-magasin.csv");
  await expect(page.locator("#csv")).toHaveValue(/Riz long grain/);
});

test("catalogue : un JSON de prix s'applique après aperçu, par identifiant", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  const json = {
    source: "Colruyt",
    date_maj: "2026-10-05T00:00:00",
    ingredients: {
      pates: {
        unite: "kg",
        prix_unitaire: 1.89,
        produit: { marque: "Boni", nom: "Spaghetti 500g" },
      },
      riz: {
        unite: "kg",
        prix_unitaire: 0.89,
        produit: { marque: "EVERYDAY", nom: "EVERYDAY riz long grain 2kg" }, // marque déjà dans le nom
      },
      lait: { unite: "kg", prix_unitaire: 1.05 }, // unité incompatible : ignoré
      inconnu: { unite: "kg", prix_unitaire: 2 }, // identifiant absent : ignoré
    },
  };
  await page.locator("#file").setInputFiles({
    name: "prix_colruyt.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(json)),
  });
  await expect(page.locator("#csv")).toHaveValue(/→ 1\.89 €\/kg/);
  await expect(page.locator("#impmsg")).toContainText("2 prix prêts (2 ignorés)");
  await expect(page.locator('input[data-cp="pates"]')).not.toHaveValue("1.89"); // pas encore appliqué
  await page.locator("#imp").click();
  await expect(page.locator("#impmsg")).toContainText("2 prix chargés (Colruyt, 05/10/2026)");
  await expect(page.locator('input[data-cp="pates"]')).toHaveValue("1.89");
  await expect(page.locator("#ct")).toContainText("Boni Spaghetti 500g");
  await expect(page.locator("#ct")).toContainText("↳ EVERYDAY riz long grain 2kg");
  await expect(page.locator("#ct")).not.toContainText("EVERYDAY EVERYDAY");
});

test("catalogue : le CSV de départ relie les 31 ingrédients de base", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#file").setInputFiles("exemples/prix_depart.csv");
  await expect(page.locator("#csv")).toHaveValue(/Spaghetti Boni 1kg;1,40/);
  await page.locator("#imp").click();
  await expect(page.locator("#impmsg")).toContainText("31 ingrédients reliés");
  await expect(page.locator('input[data-cp="pates"]')).toHaveValue("1.4");
  await expect(page.locator('input[data-cp="hache_h"]')).toHaveValue("11");
});

test("catalogue : le filtre cherche dans le nom de l'ingrédient et du produit", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  const lignes = page.locator("#ct tr");
  const total = await lignes.count();
  await page.locator("#cfilt").fill("cereales"); // sans accent
  await expect(lignes).toHaveCount(1);
  await expect(lignes.first()).toContainText("Céréales");
  // le nom d'un produit importé est cherché aussi
  await page.locator("#cfilt").fill("");
  await page.locator("#iopen").click();
  await page.locator("#csv").fill("Spaghetti Boni 500g;1,39");
  await page.locator("#imp").click();
  await page.locator("#cfilt").fill("boni");
  await expect(lignes).toHaveCount(1);
  await expect(lignes.first()).toContainText("Pâtes");
  // un prix saisi sous un filtre ne le vide pas, et sans résultat un message s'affiche
  await lignes.first().locator("input").fill("2");
  await lignes.first().locator("input").press("Tab");
  await expect(page.locator("#cfilt")).toHaveValue("boni");
  await page.locator("#cfilt").fill("zzzz");
  await expect(page.locator("#ct")).toContainText("Aucun ingrédient ne correspond");
  await page.locator("#cfilt").fill("");
  await expect(lignes).toHaveCount(total);
});

test("catalogue : l'export du catalogue se relit tel quel", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#iopen").click();
  await page.locator("#csv").fill("Spaghetti Boni 500g;1,39");
  await page.locator("#imp").click();
  await page.locator('input[data-cp="riz"]').fill("2.5");
  await page.locator('input[data-cp="riz"]').press("Tab");
  const f = await telecharger(page, "#cexp");
  expect(f.nom).toMatch(/^catalogue-prix-\d{4}-\d{2}-\d{2}\.json$/);
  const j = JSON.parse(f.texte);
  expect(j.ingredients.pates).toMatchObject({ unite: "kg", prix_unitaire: 2.78 });
  expect(j.ingredients.pates.produit.nom).toBe("Spaghetti Boni 500g");
  expect(j.ingredients.riz.prix_unitaire).toBe(2.5);
  expect(j.ingredients.lait.unite).toBe("l");
  // le fichier exporté se recharge dans le catalogue sans rien ignorer
  await page.locator("#file").setInputFiles({
    name: f.nom,
    mimeType: "application/json",
    buffer: Buffer.from(f.octets),
  });
  await expect(page.locator("#impmsg")).toContainText(/\d+ prix prêts\./);
  await expect(page.locator("#impmsg")).not.toContainText("ignorés");
});

test("partager : le catalogue de prix se partage, s'imprime et s'exporte", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#iopen").click();
  await page.locator("#csv").fill("Spaghetti Boni 500g;1,39");
  await page.locator("#imp").click();
  await aller(page, "sh");
  await expect(page.locator('#shw option[value="prices"]')).toHaveText(
    "Catalogue de prix – prix des ingrédients"
  );
  await page.locator("#shw").selectOption("prices");
  // fichier CSV (Excel) : une ligne par ingrédient, avec le produit retenu et le prix
  const csv = await telecharger(page, "#sx");
  expect(csv.nom).toMatch(/^catalogue-de-prix-.*\.csv$/);
  const lignes = csv.texte.replace(/^\uFEFF/, "").split("\r\n");
  expect(lignes[0]).toBe(
    "Ingrédient;Produit retenu;Unité du prix;Prix (€);Remarque;Rayon;Lien produit"
  );
  expect(lignes).toContain("Pâtes;Spaghetti Boni 500g;kg;2,78;;Épicerie & conserves;"); // note technique de l'import retirée
  expect(lignes).toContain("Lait;;L;1,10;;Frais (produits laitiers, œufs);");
  // fichier HTML
  const html = await telecharger(page, "#sd");
  expect(html.texte).toContain("Catalogue de prix – prix des ingrédients");
  expect(html.texte).toContain("Spaghetti Boni 500g");
  // texte copié
  await page
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"])
    .catch(() => {});
  await page.locator("#sc").click();
  await expect(page.locator("#shm")).not.toHaveText("Rien à partager.");
});

test("les pièces sont arrondies au supérieur sans erreur de calcul décimal", async ({ page }) => {
  await ouvrir(page);
  const r = await page.evaluate(() => {
    ING.t_pain = ["Pain test", "pc", 1, "pain", 0];
    // 10 × 0,2 + 8 × 0,2 + 6 × 0,2 + 6 × 0,2 vaut 6,000000000000001 en calcul décimal
    const somme = [10, 8, 6, 6].reduce((t, n) => t + n * 0.2, 0);
    return [
      somme > 6,
      qty("t_pain", somme),
      qty("t_pain", 6.01),
      qty("t_pain", 0.2),
      qparts("t_pain", somme),
    ];
  });
  expect(r).toEqual([true, "6 pc", "7 pc", "1 pc", ["6", "pc"]]);
});

test("recettes : « 1 pour 5 personnes » donne la quantité unique, puis la quantité par personne", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  await page.locator("#inew").click();
  await page.locator("#ingn").fill("Baguette");
  await page.locator("#ingu").selectOption("pc");
  await page.locator("#ingok").click();
  const ligne = () => page.locator("#rb tr", { hasText: "Baguette" });
  // pas de saisie par ratio en mode « par personne » : elle est dans le mode « quantité unique »
  await expect(ligne().locator("[data-rq]")).toHaveCount(0);
  await basculerQuantite(page, ligne()); // → quantité unique
  const N = await page.evaluate(() => nn());
  // par défaut : champ quantité vide et « 1 personne » (= quantité par personne), pas de valeur d'exemple
  await expect(ligne().locator("[data-rq]")).toHaveValue("");
  await expect(ligne().locator("[data-rn]")).toHaveValue("1");
  await ligne().locator("[data-rq]").fill("1");
  await ligne().locator("[data-rn]").fill("5");
  await expect(ligne().locator("[data-rp]")).toContainText(
    "= " + Math.ceil(N / 5 - 1e-9) + " pc pour " + N + " personnes"
  );
  await ligne().locator("[data-ra]").click();
  await expect(ligne().locator("[data-fx]")).toHaveValue(String(N / 5));
  // les valeurs saisies restent affichées après « Appliquer », avec le même calcul
  await expect(ligne().locator("[data-rq]")).toHaveValue("1");
  await expect(ligne().locator("[data-rn]")).toHaveValue("5");
  await expect(ligne().locator("[data-rp]")).toContainText("= " + N / 5 + " pc pour " + N);
  // « → par personne » répartit : 1/5 = 0,2 dans chaque section
  await basculerQuantite(page, ligne());
  const champs = ligne().locator("input[data-s]");
  await expect(champs).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(champs.nth(i)).toHaveValue("0.2");
  // la virgule française est acceptée : 0,5 pour 4 personnes = 0,125 par personne
  await basculerQuantite(page, ligne());
  await ligne().locator("[data-rq]").fill("0,5");
  await ligne().locator("[data-rn]").fill("4");
  await ligne().locator("[data-ra]").click();
  await basculerQuantite(page, ligne());
  await expect(ligne().locator("input[data-s]").first()).toHaveValue("0.125");
});

test("recettes : « 500 g pour 5 personnes » donne 100 g par personne et le total en kg", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  const premiere = () => page.locator("#rb tr").first();
  await basculerQuantite(page, premiere()); // → quantité unique
  const N = await page.evaluate(() => nn());
  await premiere().locator("[data-rq]").fill("500");
  await premiere().locator("[data-rn]").fill("5");
  const attendu =
    "= " + ((100 * N) / 1000).toFixed(2) + " kg pour " + N + " personnes (100 g par personne)";
  await expect(premiere().locator("[data-rp]")).toContainText(attendu);
  await premiere().locator("[data-ra]").click();
  await expect(premiere().locator("[data-fx]")).toHaveValue(String((100 * N) / 1000));
  // après « Appliquer », le formulaire garde 500 / 5 et l'aperçu reste identique
  await expect(premiere().locator("[data-rq]")).toHaveValue("500");
  await expect(premiere().locator("[data-rn]")).toHaveValue("5");
  await expect(premiere().locator("[data-rp]")).toContainText(attendu);
});

test("recettes : passer de « quantité unique » à « par personne » garde le total, sans arrondi à l'entier", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  const premiere = () => page.locator("#rb tr").first();
  await basculerQuantite(page, premiere()); // → quantité unique
  await premiere().locator("[data-fx]").fill("1"); // 1 kg au total
  await premiere().locator("[data-fx]").press("Tab");
  await basculerQuantite(page, premiere()); // → par personne
  const { vals, N, nbSec } = await page.evaluate(() => {
    const k = Object.keys(S.rec[S.cur].ing)[0];
    return { vals: S.rec[S.cur].ing[k], N: nn(), nbSec: SEC.length };
  });
  expect(vals).toHaveLength(nbSec);
  // 1 000 g répartis : 33,333333 g par personne (et non 33 g, qui ferait 990 g)
  expect(vals[0]).toBeCloseTo(1000 / N, 5);
  // la même valeur dans chaque section
  expect(vals.every((v) => Math.abs(v - 1000 / N) < 1e-5)).toBe(true);
});

test("recettes : le passage à « par personne » suit le nombre de sections", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cfg");
  await page.locator('[data-sx="3"]').click();
  await page.locator('[data-sx="2"]').click(); // 2 sections restantes
  await aller(page, "rec");
  const premiere = () => page.locator("#rb tr").first();
  await basculerQuantite(page, premiere());
  await basculerQuantite(page, premiere());
  await expect(premiere().locator("input[data-s]")).toHaveCount(2);
});

test("catalogue : un JSON sans identifiant connu est relié par le nom de l'ingrédient", async ({
  page,
}) => {
  await ouvrir(page);
  // un ingrédient ajouté à la main (identifiant propre à l'appareil)
  await aller(page, "rec");
  await page.locator("#inew").click();
  await page.locator("#ingn").fill("Poivrons");
  await page.locator("#ingu").selectOption("pc");
  await page.locator("#ingok").click();
  await aller(page, "cat");
  const json = {
    source: "Colruyt",
    date_maj: "2026-10-06T00:00:00",
    ingredients: {
      x1: { nom: "Pains", unite: "kg", prix_unitaire: 1.12, produit: { nom: "pain blanc 800g" } },
      x2: { requete: "Pate à tartiner", unite: "kg", prix_unitaire: 2.64 },
      x3: { nom: "poivron rouge", unite: "piece", prix_unitaire: 0.56 },
      x4: { nom: "sauce tomate", unite: "kg", prix_unitaire: 3 }, // aucun ingrédient correspondant
      x5: { nom: "pains", unite: "piece", prix_unitaire: 1 }, // mauvaise unité
    },
  };
  await page.locator("#file").setInputFiles({
    name: "p.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(json)),
  });
  const apercu = page.locator("#csv");
  await expect(apercu).toHaveValue(/Pain : .* → 1\.12 €\/kg \(relié par le nom : « Pains »\)/);
  await expect(apercu).toHaveValue(
    /Pâte à tartiner : .* → 2\.64 €\/kg \(relié par le nom : « Pate à tartiner »\)/
  );
  await expect(apercu).toHaveValue(
    /Poivrons : .* → 0\.56 €\/pièce \(relié par le nom : « poivron rouge »\)/
  );
  await expect(page.locator("#impmsg")).toContainText(
    "3 prix prêts (1 ignorés), 1 absents du catalogue"
  );
  await page.locator("#imp").click();
  await expect(page.locator('input[data-cp="pain"]')).toHaveValue("1.12");
  await expect(page.locator('input[data-cp="choc"]')).toHaveValue("2.64");
  await expect(page.locator("#ct tr", { hasText: "Poivrons" }).locator("input")).toHaveValue(
    "0.56"
  );
});

test("catalogue : renommer un ingrédient de base le change partout, et se rétablit", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator('#ct [data-ced="pain"]').click();
  await expect(page.locator(`[data-ei="pain"]`)).toContainText("Utilisé dans 3 recettes");
  await page.locator('[data-en="pain"]').fill("Pains");
  await page.locator('[data-eok="pain"]').click();
  await expect(page.locator("#ct")).toContainText("Pains");
  // le nom est repris dans les recettes ; les quantités ne bougent pas
  await aller(page, "list");
  expect(await page.evaluate(() => ING.pain[0])).toBe("Pains");
  // enregistré : il survit à un rechargement
  await page.reload();
  expect(await page.evaluate(() => ING.pain[0])).toBe("Pains");
  await aller(page, "cat");
  await page.locator('#ct [data-ced="pain"]').click();
  await page.locator('[data-ers="pain"]').click(); // rétablir « Pain »
  expect(await page.evaluate(() => [ING.pain[0], Object.keys(S.ov).length])).toEqual(["Pain", 0]);
});

test("catalogue : l'unité d'un ingrédient utilisé en recette ne passe pas de g à pièce", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  // « Pâtes » est utilisé dans la recette d'exemple
  await page.locator('#ct [data-ced="pates"]').click();
  await page.locator('[data-eu="pates"]').selectOption("pc");
  await expect(page.locator('[data-ei="pates"]')).toContainText("Changement impossible");
  await page.locator('[data-eok="pates"]').click();
  await expect(page.locator('[data-ei="pates"]')).toContainText("⚠");
  expect(await page.evaluate(() => ING.pates[1])).toBe("g");
  // g → ml reste permis : quantités et prix conservés
  const avant = await page.evaluate(() => [S.rec[S.cur].ing.pates.slice(), price("pates")]);
  await page.locator('[data-eu="pates"]').selectOption("ml");
  await page.locator('[data-eok="pates"]').click();
  const apres = await page.evaluate(() => [
    ING.pates[1],
    S.rec[S.cur].ing.pates.slice(),
    price("pates"),
  ]);
  expect(apres).toEqual(["ml", avant[0], avant[1]]);
});

test("catalogue : un ingrédient inutilisé peut changer d'unité (prix remis à zéro) mais pas de nom en double", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#cins").click();
  await page.locator("#ingn").fill("Poivrons");
  await page.locator("#ingu").selectOption("g");
  await page.locator("#ingp").fill("2.78");
  await page.locator("#ingok").click();
  const k = await page.evaluate(() => Object.keys(S.cust)[0]);
  await page.locator(`#ct [data-ced="${k}"]`).click();
  // nom déjà pris (le pluriel et les accents comptent pour pareil)
  await page.locator(`[data-en="${k}"]`).fill("pâtes");
  await page.locator(`[data-eok="${k}"]`).click();
  await expect(page.locator(`[data-ei="${k}"]`)).toContainText("s'appelle déjà « Pâtes »");
  // pièce : permis car aucune recette ne l'utilise ; le prix repart à zéro
  await page.locator(`[data-en="${k}"]`).fill("Poivron");
  await page.locator(`[data-eu="${k}"]`).selectOption("pc");
  await page.locator(`[data-eok="${k}"]`).click();
  expect(await page.evaluate((id) => [ING[id][0], ING[id][1], price(id)], k)).toEqual([
    "Poivron",
    "pc",
    0,
  ]);
});

test("catalogue : « Insérer un ingrédient » ne l'ajoute à aucune recette", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#cins").click();
  await page.locator("#ingn").fill("Courgettes");
  await page.locator("#ingp").fill("1.99");
  await page.locator("#ingok").click();
  await expect(page.locator("#ct")).toContainText("Courgettes");
  const r = await page.evaluate(() => {
    const k = Object.keys(S.cust)[0];
    return [price(k), Object.values(S.rec).some((x) => k in x.ing)];
  });
  expect(r).toEqual([1.99, false]);
  // il est proposé dans la liste « + Ajouter un ingrédient » des recettes
  await aller(page, "rec");
  await expect(page.locator('#radd option:text("Courgettes")')).toHaveCount(1);
});

test("catalogue : un nom modifié survit à l'export puis à l'import du projet", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator('#ct [data-ced="pain"]').click();
  await page.locator('[data-en="pain"]').fill("Pain gris");
  await page.locator('[data-eok="pain"]').click();
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  expect(JSON.parse(fichier.texte).ov.pain).toEqual({ n: "Pain gris", u: "g" });
  await importer(page, fichier.chemin);
  expect(await page.evaluate(() => ING.pain[0])).toBe("Pain gris");
});

test("catalogue : un JSON non reconnu ne modifie rien", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#file").setInputFiles({
    name: "x.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"a":1}'),
  });
  await expect(page.locator("#impmsg")).toContainText("non reconnu");
});

test("recettes : en-têtes lisibles sur ordinateur, réduits sur téléphone", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "rec");
  const taille = await page
    .locator("#rh th")
    .nth(1)
    .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  if (page.viewportSize().width >= 900) expect(taille).toBeGreaterThan(12);
  else expect(taille).toBeLessThan(11);
});

test("menu : chaque jour se replie et affiche son nombre de plats et de repas", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "menu");
  const jour = page.locator(".dcard").first();
  await expect(jour).toHaveAttribute("open", "");
  const resume = jour.locator(".dc");
  await expect(resume).toHaveText(/^\(\d+ plats? \/ \d+ repas\)$/);
  // 1 plat pour 3 repas prévus : le menu reste à compléter
  await expect(resume).toHaveText("(1 plat / 3 repas)");
  const avant = await resume.textContent();
  // ajouter un plat met le résumé à jour
  await jour.locator('select[data-add][data-slot="m"]').selectOption({ index: 1 });
  await expect(page.locator(".dcard").first().locator(".dc")).not.toHaveText(avant);
  // replier : les repas disparaissent, le résumé reste, l'état survit à un nouvel affichage
  // l'appli retient l'état replié dans l'événement « toggle », qui arrive juste après le clic :
  // on l'attend, sinon un nouvel affichage immédiat ré-ouvre le jour (course entre clic et toggle)
  await page.evaluate(() => {
    window.__toggle = new Promise((r) =>
      document.getElementById("menu").addEventListener("toggle", () => setTimeout(r), {
        capture: true,
        once: true,
      })
    );
  });
  await page.locator(".dcard").first().locator("summary").click();
  await page.evaluate(() => window.__toggle);
  await expect(page.locator(".dcard").first().locator(".zone").first()).toBeHidden();
  await expect(page.locator(".dcard").first().locator(".dc")).toBeVisible();
  await page
    .locator(".dcard")
    .nth(1)
    .locator('select[data-add][data-slot="m"]')
    .selectOption({ index: 1 });
  await expect(page.locator(".dcard").first()).not.toHaveAttribute("open", "");
  // tout replier / tout déplier
  await page.locator("#mfold").click();
  await expect(page.locator(".dcard[open]")).toHaveCount(0);
  await expect(page.locator("#mfold")).toHaveText("Tout déplier");
  await page.locator("#mfold").click();
  await expect(page.locator(".dcard[open]")).toHaveCount(await page.locator(".dcard").count());
});

test("menu : la liste « copier le menu d'un autre camp » occupe toute la largeur sur téléphone", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "menu");
  if (page.viewportSize().width >= 560) return;
  const l = await page.evaluate(() => {
    const s = document.getElementById("mcp").getBoundingClientRect(),
      c = document.getElementById("menu").getBoundingClientRect();
    return { s: s.width, c: c.width };
  });
  expect(l.s).toBeGreaterThan(l.c - 4);
});

test("régimes : un régime ne peut pas dépasser l'effectif de la section", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "reg");
  await expect(page.locator("#dwarn")).toHaveText("");
  // effectif des Benjas : 10 par défaut
  await deplierRegime(page, "veg");
  const champ = page.locator('input[data-d="veg"][data-s="0"]');
  await champ.fill("12");
  await expect(champ).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#dwarn .derr")).toContainText(
    "Végétarien, Benjas : 12 personnes pour un effectif de 10"
  );
  // 10 pour 10 : accepté
  await champ.fill("10");
  await expect(champ).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator("#dwarn .derr")).toHaveCount(0);
  // le cumul de plusieurs régimes au-dessus de l'effectif reste une simple information
  await deplierRegime(page, "sl");
  await page.locator('input[data-d="sl"][data-s="0"]').fill("3");
  await expect(page.locator("#dwarn .derr")).toHaveCount(0);
  await expect(page.locator("#dwarn")).toContainText("13 régimes ou allergies pour 10 personnes");
  // baisser l'effectif en dessous d'un régime déclenche l'erreur, le relever la retire
  await aller(page, "eff");
  await page.locator('[data-n="0"]').fill("8");
  await aller(page, "reg");
  await expect(page.locator("#dwarn .derr")).toContainText(
    "Végétarien, Benjas : 10 personnes pour un effectif de 8"
  );
  await aller(page, "eff");
  await page.locator('[data-n="0"]').fill("10");
  await aller(page, "reg");
  await expect(page.locator("#dwarn .derr")).toHaveCount(0);
});

test("régimes : l'effectif de la section est affiché entre parenthèses et suit les changements", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "reg");
  await deplierRegime(page, "veg");
  const ef = page.locator('#g-reg [data-ef="0"]:visible').first();
  await expect(ef).toHaveText("(10)");
  await aller(page, "eff");
  await page.locator('[data-n="0"]').fill("12");
  await aller(page, "reg");
  await expect(page.locator('#g-reg [data-ef="0"]:visible').first()).toHaveText("(12)");
});

test("liste de courses : quantité, prix et coût sont alignés à droite", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "list");
  const al = await page.evaluate(() => {
    const th = [...document.querySelectorAll("#g-list thead th")].map(
        (e) => getComputedStyle(e).textAlign
      ),
      td = [...document.querySelector("#list tr:not(.grp)").children].map(
        (e) => getComputedStyle(e).textAlign
      );
    return { th, td };
  });
  expect(al.th.slice(1)).toEqual(["right", "right", "right"]);
  expect(al.td.slice(1)).toEqual(["right", "right", "right"]);
  // les colonnes de chiffres s'alignent sur le même bord droit d'une ligne à l'autre
  const bords = await page.evaluate(() =>
    [...document.querySelectorAll("#list tr:not(.grp)")]
      .slice(0, 4)
      .map((r) => Math.round(r.lastElementChild.getBoundingClientRect().right))
  );
  expect(new Set(bords).size).toBe(1);
});

test("catalogue : seule la colonne des prix est alignée à droite", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  const al = await page.evaluate(() => ({
    th: [...document.querySelectorAll("#g-cat thead th")].map((e) => getComputedStyle(e).textAlign),
    td: [...document.querySelectorAll("#ct tr:first-child td")].map(
      (e) => getComputedStyle(e).textAlign
    ),
  }));
  expect(al.th[2]).toBe("right");
  expect(al.td[2]).toBe("right");
  expect(al.th[0]).not.toBe("right");
  expect(al.td[1]).not.toBe("right");
});

test("catalogue : un ingrédient utilisé dans une recette ne peut pas être supprimé", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  const messages = [];
  page.on("dialog", (d) => messages.push(d.type() + ":" + d.message()));
  await page.locator('#ct [data-ced="pain"]').click();
  await page.locator('#ct [data-edel="pain"]').click();
  await expect.poll(() => messages.length).toBe(1);
  expect(messages[0]).toContain("alert:Suppression impossible");
  expect(await page.evaluate(() => "pain" in ING && !S.hid.includes("pain"))).toBe(true);
  // un ingrédient inséré au catalogue, sans recette, se supprime
  await page.locator("#cins").click();
  await page.locator("#ingn").fill("Sirop");
  await page.locator("#ingok").click();
  await page.locator('#ct [data-ced^="c_"]').click();
  await page.locator('#ct [data-edel^="c_"]').click();
  await expect.poll(() => messages.length).toBe(2);
  expect(messages[1]).toContain("confirm:Supprimer");
  await expect(page.locator("#ct")).not.toContainText("Sirop");
});

/** Les tests ouvrent l'appli en file:// : on remplace fetch pour simuler le fichier de prix publié. */
async function simulerPrixPublies(page, status, corps) {
  await page.evaluate(
    ([st, c]) => {
      window.fetch = async () => new Response(JSON.stringify(c), { status: st });
    },
    [status, corps]
  );
}

test("catalogue : « Récupérer les derniers prix » lit le fichier publié, sans rien appliquer avant « Importer »", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  const avant = await page.evaluate(() => price("pain"));
  await simulerPrixPublies(page, 200, {
    source: "Colruyt",
    date_maj: "2026-10-03",
    ingredients: { pain: { unite: "kg", prix_unitaire: 4.5 } },
  });
  await page.locator("#pfetch").click();
  await expect(page.locator("#impmsg")).toContainText("1 prix prêts");
  await expect(page.locator("#impmsg")).toContainText("03/10/2026");
  expect(await page.evaluate(() => price("pain"))).toBe(avant);
  await page.locator("#imp").click();
  expect(await page.evaluate(() => price("pain"))).toBe(4.5);
});

test("catalogue : sans fichier publié, « Récupérer les derniers prix » l'explique", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await simulerPrixPublies(page, 404, "");
  await page.locator("#pfetch").click();
  await expect(page.locator("#impmsg")).toContainText("Aucun fichier de prix publié");
});

test("catalogue : l'import JSON propose d'ajouter les produits absents, sans les mettre en recette", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await simulerPrixPublies(page, 200, {
    source: "Colruyt",
    date_maj: "2026-10-03",
    ingredients: {
      pain: { unite: "kg", prix_unitaire: 4.5 },
      x1: { nom: "Spéculoos", unite: "kg", prix_unitaire: 3.2, produit: { nom: "Lotus 400g" } },
      x2: { nom: "Sirop de grenadine", unite: "l", prix_unitaire: 2.1 },
      x3: { unite: "kg", prix_unitaire: 1 },
    },
  });
  const avant = await page.evaluate(() => Object.keys(ING).length);
  await page.locator("#pfetch").click();
  await expect(page.locator("#pnew")).toContainText("2 produits absents de ton catalogue");
  // le bouton sous la liste ajoute les produits cochés (tous, au départ)
  await expect(page.locator("#padd")).toHaveText("➕ Ajouter ces 2 produits");
  await page.locator('#pnew [data-pn="1"]').uncheck();
  await expect(page.locator("#padd")).toHaveText("➕ Ajouter ce produit");
  // « Importer » n'applique que les prix des ingrédients connus : rien n'est ajouté au catalogue
  await page.locator("#imp").click();
  expect(await page.evaluate(() => Object.keys(ING).length)).toBe(avant);
  expect(await page.evaluate(() => price("pain"))).toBe(4.5);
  await expect(page.locator("#padd")).toBeVisible();
  await page.locator("#padd").click();
  await expect(page.locator("#impmsg")).toContainText("1 ingrédient ajouté");
  expect(await page.evaluate(() => Object.keys(ING).length)).toBe(avant + 1);
  const ajoute = await page.evaluate(() => {
    const k = Object.keys(S.cust).find((c) => ING[c][0] === "Spéculoos");
    return [ING[k][1], price(k), S.pn[k], Object.values(S.rec).some((r) => k in r.ing)];
  });
  expect(ajoute).toEqual(["g", 3.2, "Lotus 400g", false]);
  await expect(page.locator("#ct")).toContainText("Spéculoos");
  // le produit décoché reste proposé
  await expect(page.locator("#pnew")).toContainText("1 produit absent de ton catalogue");
  await expect(page.locator("#pnew")).toContainText("Sirop de grenadine");
});

test("catalogue : la marque répétée « EVERYDAY EVERYDAY » n'est affichée qu'une fois", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.evaluate(() => {
    S.pn.pates = "EVERYDAY EVERYDAY spaghetti 500g";
    S.pn.pdt = "POTATO CHEF POTATO CHEF pommes de terre 4kg";
    S.pn.cer = "EVERYDAY Corn flakes 750g";
    drawCat();
  });
  const t = await page.locator("#ct").innerText();
  expect(t).toContain("↳ EVERYDAY spaghetti 500g");
  expect(t).toContain("↳ POTATO CHEF pommes de terre 4kg");
  expect(t).toContain("↳ EVERYDAY Corn flakes 750g");
  expect(t).not.toContain("EVERYDAY EVERYDAY");
  expect(await page.evaluate(() => prodName("pates"))).toBe("EVERYDAY spaghetti 500g");
});

test("catalogue : « Télécharger un exemple » disparaît dès que des produits sont associés", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#iopen").click();
  await expect(page.locator("#csvx")).toBeVisible();
  await page.evaluate(() => {
    S.pn.pain = "Pain blanc 800g";
    drawCat();
  });
  await expect(page.locator("#csvx")).toBeHidden();
  await page.evaluate(() => {
    delete S.pn.pain;
    drawCat();
  });
  await expect(page.locator("#csvx")).toBeVisible();
});

test("catalogue : l'import s'ouvre dans une fenêtre, Importer l'applique et la ferme, Annuler la ferme", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await expect(page.locator("#impdlg")).toBeHidden();
  await page.locator("#iopen").click();
  await expect(page.locator("#impdlg")).toBeVisible();
  await page.locator("#impno").click();
  await expect(page.locator("#impdlg")).toBeHidden();
  await page.locator("#iopen").click();
  await page.locator("#csv").fill("Spaghetti Boni 500g;1,39");
  await page.locator("#imp").click();
  await expect(page.locator("#impdlg")).toBeHidden();
  await expect(page.locator("#impres")).not.toHaveText("");
  await page.locator("#iopen").click();
  await expect(page.locator("#csv")).toHaveValue("");
});

test("catalogue : « Choisir un fichier » ouvre la fenêtre d'import", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#file").setInputFiles({
    name: "prix.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Spaghetti Boni 500g;1,39"),
  });
  await expect(page.locator("#impdlg")).toBeVisible();
  await expect(page.locator("#fname")).toContainText("prix.csv");
});

test("catalogue : un prix manquant est signalé en rouge, comme dans la liste de courses", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  const champ = page.locator('input[data-cp="pates"]');
  const ligne = page.locator("#ct tr", { has: champ });
  await expect(ligne.locator(".manq")).toBeHidden();
  await expect(champ).not.toHaveClass(/nop/);
  await champ.fill("0");
  await champ.press("Tab");
  await expect(ligne.locator(".manq")).toBeVisible();
  await expect(champ).toHaveClass(/nop/);
  await champ.fill("1.4");
  await champ.press("Tab");
  await expect(ligne.locator(".manq")).toBeHidden();
  await expect(champ).not.toHaveClass(/nop/);
});

const BAGEL = `<script type="application/ld+json">{
  "@context": "http://schema.org",
  "@type": "Recipe",
  "recipeIngredient": ["400 g gyros de volaille", "1  avocat", "2  jeunes oignons", "2  tomates", "40 g mélange de germes",
    "170 g fromage frais", "4  bagels au sésame", "1 c. à soupe huile d’olive", " poivre noir", " sel"],
  "cookTime": "PT25M", "totalTime": "PT25M", "recipeYield": "4",
  "description": "Ce bagel au sésame plaira aussi aux enfants.",
  "name": "Bagel au gyros de volaille et avocat",
  "recipeInstructions": [{ "@type": "HowToStep", "text": "" }, { "@type": "HowToStep", "text": "Préchauffez le four à 200 °C." }]
}</script>`;

test("import de recette : les lignes d'ingrédients sont converties en g, ml ou pièces", async ({
  page,
}) => {
  await ouvrir(page);
  const lire = (t) => page.evaluate((x) => ligneRecette(x), t);
  expect(await lire("400 g gyros de volaille")).toMatchObject({
    q: 400,
    u: "g",
    nom: "Gyros de volaille",
  });
  expect(await lire("1  avocat")).toMatchObject({ q: 1, u: "pc", nom: "Avocat" });
  expect(await lire("1 c. à soupe huile d’olive")).toMatchObject({
    q: 15,
    u: "ml",
    nom: "Huile d’olive",
  });
  expect(await lire("2 c. à café de sel fin")).toMatchObject({ q: 10, u: "ml", nom: "Sel fin" });
  expect(await lire("1,5 kg de pommes de terre")).toMatchObject({
    q: 1500,
    u: "g",
    nom: "Pommes de terre",
  });
  expect(await lire("25 cl de crème, fraîche")).toMatchObject({ q: 250, u: "ml", nom: "Crème" });
  expect(await lire("1/2 litre de lait")).toMatchObject({ q: 500, u: "ml", nom: "Lait" });
  expect(await lire("2 gousses d'ail")).toMatchObject({ q: 2, u: "pc", nom: "Ail" });
  expect(await lire("2 à 3 oignons")).toMatchObject({ q: 3, u: "pc", nom: "Oignons" });
  expect(await lire(" poivre noir")).toMatchObject({ q: null, u: null, nom: "Poivre noir" });
  expect(await page.evaluate(() => dureeRecette("PT1H30M"))).toBe("1 h 30");
  expect(await page.evaluate(() => dureeRecette("PT25M"))).toBe("25 min");
});

test("import de recette : aperçu, correspondances puis création par personne", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "rec");
  await page.locator("#rimp").click();
  await page.locator("#rimt").fill(BAGEL);
  await page.locator("#rimu").fill("https://www.colruyt.be/fr/recettes/bagel");
  await page.locator("#rimlire").click();
  await expect(page.locator("#rimm")).toContainText("10 lignes lues");
  await expect(page.locator("#rimnom")).toHaveValue("Bagel au gyros de volaille et avocat");
  await expect(page.locator("#rimn")).toHaveValue("4");
  // sel et poivre n'ont pas de quantité : ignorés ; le reste devient de nouveaux ingrédients
  const modes = await page
    .locator('#rimv select[data-f="mode"]')
    .evaluateAll((l) => l.map((s) => s.value));
  expect(modes.slice(-2)).toEqual(["-", "-"]);
  expect(modes.slice(0, 2)).toEqual(["+", "+"]);
  await page.locator("#rimok").click();
  await expect(page.locator("#rimm")).toContainText("Bagel au gyros de volaille et avocat");
  const r = await page.evaluate(() => {
    const R = S.rec["Bagel au gyros de volaille et avocat"],
      par = (nom) => {
        const k = Object.keys(R.ing).find((c) => ING[c][0] === nom);
        return k ? [ING[k][1], R.ing[k]] : null;
      };
    return {
      nb: Object.keys(R.ing).length,
      sections: SEC.length,
      gyros: par("Gyros de volaille"),
      avocat: par("Avocat"),
      huile: par("Huile d’olive"),
      desc: R.desc,
      cur: S.cur,
    };
  });
  expect(r.nb).toBe(8);
  expect(r.gyros).toEqual(["g", Array(r.sections).fill(100)]);
  expect(r.avocat).toEqual(["pc", Array(r.sections).fill(0.25)]);
  expect(r.huile).toEqual(["ml", Array(r.sections).fill(3.75)]);
  expect(r.desc).toContain("Pour 4 personnes · 25 min");
  expect(r.desc).toContain("Source : https://www.colruyt.be/fr/recettes/bagel");
  expect(r.desc).not.toContain("Préchauffez");
  expect(r.cur).toBe("Bagel au gyros de volaille et avocat");
  // les nouveaux ingrédients de viande sont signalés aux régimes
  expect(
    await page.evaluate(
      () =>
        DIETS.veg.ex[Object.keys(S.cust).find((c) => ING[c][0] === "Gyros de volaille")] === null
    )
  ).toBe(true);
});

test("import de recette : ingrédient existant reconnu, étapes facultatives, erreurs claires", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  await page.locator("#rimp").click();
  await page.locator("#rimt").fill("pas une recette");
  await page.locator("#rimlire").click();
  await expect(page.locator("#rimm")).toContainText("Aucune recette trouvée");
  const json = {
    "@graph": [
      {
        "@type": ["Recipe"],
        name: "Spaghetti express",
        recipeYield: ["4", "4 personnes"],
        recipeIngredient: ["500 g de pâtes", "2 pains"],
        recipeInstructions: "Cuire les pâtes.",
      },
    ],
  };
  await page.locator("#rimt").fill(JSON.stringify(json));
  await page.locator("#rimlire").click();
  const premier = page.locator('#rimv select[data-f="mode"]').first();
  await expect(premier).toHaveValue("pates"); // « Pâtes » existe déjà
  // « 2 pains » se compte en pièces alors que « Pain » est en g : proposé en nouvel ingrédient, avec rappel
  await expect(page.locator("#rimv")).toContainText("Existe déjà en g");
  // choisir un ingrédient d'une autre famille d'unité est refusé
  await page.locator('#rimv select[data-f="mode"]').nth(1).selectOption("pain");
  await expect(page.locator("#rimv")).toContainText("se compte en g");
  await page.locator("#rimok").click();
  await expect(page.locator("#rimm")).toContainText("Unité différente");
  await page.locator('#rimv select[data-f="mode"]').nth(1).selectOption("+");
  await page.locator("#rimet").check();
  await page.locator("#rimok").click();
  const R = await page.evaluate(() => S.rec["Spaghetti express"]);
  expect(R.ing.pates[0]).toBe(125);
  expect(R.desc).toContain("Préparation :\n1. Cuire les pâtes.");
  // un nom déjà pris est refusé
  await page.locator("#rimp").click();
  await page.locator("#rimt").fill(JSON.stringify(json));
  await page.locator("#rimlire").click();
  await page.locator("#rimok").click();
  await expect(page.locator("#rimm")).toContainText("porte déjà ce nom");
});

test("import de recette : une page sans « Recipe » (article) est refusée, sa liste d'ingrédients collée est lue", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  await page.locator("#rimp").click();
  // un article : du ld+json sans recette
  await page
    .locator("#rimt")
    .fill(
      '<script type="application/ld+json">{"@graph":[{"@type":"NewsArticle","headline":"Croquettes","width":309}]}</script>'
    );
  await page.locator("#rimlire").click();
  await expect(page.locator("#rimm")).toContainText("colle la liste des ingrédients");
  // la liste copiée sur la page, une ligne par ingrédient
  await page
    .locator("#rimt")
    .fill(
      [
        "800 g de pommes de terre à chair farineuse type Bintje",
        "40 g de beurre doux",
        "2 jaunes d'œufs",
        "1/2 càc de noix de muscade râpée",
        "Sel et poivre du moulin",
        "1 l d'huile de friture pour la cuisson (tournesol ou arachide)",
        "Pour la panure croustillante :",
        "• 100 g de farine tamisée",
        "1 càs d'huile d'olive",
      ].join("\n")
    );
  await page.locator("#rimlire").click();
  await expect(page.locator("#rimm")).toContainText("8 lignes lues (liste d'ingrédients");
  await page.locator("#rimnom").fill("Croquettes de pommes de terre");
  await page.locator("#rimn").fill("4");
  await page.locator("#rimok").click();
  const R = await page.evaluate(() => {
    const r = S.rec["Croquettes de pommes de terre"],
      v = (nom) => {
        const k = Object.keys(r.ing).find((c) => ING[c][0].startsWith(nom));
        return k ? [ING[k][1], r.ing[k][0]] : null;
      };
    return {
      nb: Object.keys(r.ing).length,
      pdt: v("Pommes de terre"),
      beurre: v("Beurre"),
      muscade: v("Noix de muscade"),
      friture: v("Huile de friture"),
      farine: v("Farine"),
    };
  });
  expect(R.nb).toBe(7);
  expect(R.pdt).toEqual(["g", 200]);
  expect(R.muscade).toEqual(["ml", 0.625]);
  expect(R.friture).toEqual(["ml", 250]);
  expect(R.farine).toEqual(["g", 25]);
});

test("catalogue : modifier un ingrédient propose les mêmes champs que l'ajout, dont « Attention régime »", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  // ajout avec une attention régime
  await page.locator("#cins").click();
  await page.locator("#ingn").fill("Chipolatas");
  await page.locator("#ingg").selectOption("porc");
  await page.locator("#ingok").click();
  const k = await page.evaluate(() => Object.keys(S.cust).find((c) => ING[c][0] === "Chipolatas"));
  expect(await page.evaluate((c) => [c in DIETS.veg.ex, c in DIETS.halal.ex], k)).toEqual([
    true,
    true,
  ]);
  // la modification montre les mêmes champs, avec la valeur actuelle
  await page.locator(`#ct [data-ced="${k}"]`).click();
  await expect(page.locator(`[data-en="${k}"]`)).toHaveValue("Chipolatas");
  await expect(page.locator(`[data-eu="${k}"]`)).toHaveValue("g");
  await expect(page.locator(`[data-eg="${k}"]`)).toHaveValue("porc");
  // porc → lactose : les règles végétarien et halal disparaissent, celle du lactose apparaît
  await page.locator(`[data-eg="${k}"]`).selectOption("sl");
  await page.locator(`[data-eok="${k}"]`).click();
  expect(
    await page.evaluate(
      (c) => [c in DIETS.veg.ex, c in DIETS.halal.ex, c in DIETS.sl.ex, ING[c][5]],
      k
    )
  ).toEqual([false, false, true, ["sl"]]);
  // c'est enregistré
  await page.reload();
  expect(await page.evaluate((c) => c in DIETS.sl.ex && !(c in DIETS.veg.ex), k)).toBe(true);
});

test("catalogue : changer l'attention régime d'un ingrédient de base prévient que ses remplacements seront supprimés", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  const avant = await page.evaluate(() => [
    regimeActuel("pain"),
    Object.keys(DIETS).filter((d) => DIETS[d].ex.pain),
  ]);
  await page.locator('#ct [data-ced="pain"]').click();
  await expect(page.locator('[data-eg="pain"]')).toHaveValue(avant[0]);
  await page.locator('[data-eg="pain"]').selectOption("");
  if (avant[1].length)
    await expect(page.locator('[data-ei="pain"]')).toContainText("⚠ Les remplacements actuels");
  await page.locator('[data-eok="pain"]').click();
  expect(
    await page.evaluate(() =>
      Object.keys(DIETS).filter((d) => d in DIETS && "pain" in DIETS[d].ex && dietsDMAP.includes(d))
    )
  ).toEqual([]);
});

test("rayons : ingrédients de base classés, liste groupée par rayon, choix modifiable", async ({
  page,
}) => {
  await ouvrir(page);
  expect(
    await page.evaluate(() => [
      catOf("pain"),
      catOf("lait"),
      catOf("jam"),
      catOf("pdt"),
      catOf("hache"),
    ])
  ).toEqual(["boul", "lai", "fri", "fl", "bou"]);
  await aller(page, "list");
  // groupée (par défaut) : des titres de rayon, dans l'ordre du magasin
  const titres = await page.locator("#list tr.grp").allInnerTexts();
  expect(titres.length).toBeGreaterThan(2);
  const ordre = await page.evaluate(
    (t) => t.map((x) => CATS.findIndex((c) => c[1] === x.trim())),
    titres
  );
  expect(ordre).toEqual([...ordre].sort((a, b) => a - b));
  expect(await page.evaluate(() => LAST.keys.length)).toBeGreaterThan(5);
  // « Frais » et « Frigo » sont deux rayons distincts
  expect(
    await page.evaluate(() => CATS.map((c) => c[0]).filter((c) => c === "lai" || c === "fri"))
  ).toEqual(["fri", "lai"]);
  // dégroupée : plus de titres, ordre alphabétique
  await page.locator("#lgrp").uncheck();
  await expect(page.locator("#list tr.grp")).toHaveCount(0);
  const noms = await page.locator("#list tr td:first-child").allInnerTexts();
  const tries = [...noms].sort((a, b) => a.localeCompare(b, "fr"));
  expect(noms.map((n) => n.split("\n")[0])).toEqual(tries.map((n) => n.split("\n")[0]));
  await page.locator("#lgrp").check();
  // changer le rayon d'un ingrédient dans le catalogue, enregistré
  await aller(page, "cat");
  await page.locator('#ct [data-ced="pain"]').click();
  await page.locator('[data-ec="pain"]').selectOption("sur");
  await page.locator('[data-eok="pain"]').click();
  expect(await page.evaluate(() => [catOf("pain"), S.cat.pain])).toEqual(["sur", "sur"]);
  await page.reload();
  expect(await page.evaluate(() => catOf("pain"))).toBe("sur");
  // revenir au rayon d'origine retire le choix enregistré
  await aller(page, "cat");
  await page.locator('#ct [data-ced="pain"]').click();
  await page.locator('[data-ec="pain"]').selectOption("boul");
  await page.locator('[data-eok="pain"]').click();
  expect(await page.evaluate(() => "pain" in S.cat)).toBe(false);
});

test("rayons : ajout au catalogue et en recette, export CSV, export du catalogue", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#cins").click();
  await page.locator("#ingn").fill("Glace vanille");
  await page.locator("#ingc").selectOption("sur");
  await page.locator("#ingok").click();
  const k = await page.evaluate(() =>
    Object.keys(S.cust).find((c) => ING[c][0] === "Glace vanille")
  );
  expect(await page.evaluate((c) => catOf(c), k)).toBe("sur");
  // depuis la page Recettes
  await aller(page, "rec");
  await page.locator("#inew").click();
  await page.locator("#ingn").fill("Eau gazeuse");
  await page.locator("#ingc").selectOption("boi");
  await page.locator("#ingok").click();
  const k2 = await page.evaluate(() =>
    Object.keys(S.cust).find((c) => ING[c][0] === "Eau gazeuse")
  );
  expect(await page.evaluate((c) => catOf(c), k2)).toBe("boi");
  // un ingrédient sans rayon choisi est dans « Autre »
  await aller(page, "cat");
  await page.locator("#cins").click();
  await page.locator("#ingn").fill("Machin");
  await page.locator("#ingok").click();
  expect(
    await page.evaluate(() => catOf(Object.keys(S.cust).find((c) => ING[c][0] === "Machin")))
  ).toBe("aut");
  // le rayon est dans l'export du catalogue
  const exp = await telecharger(page, "#cexp");
  expect(JSON.parse(exp.texte).ingredients[k].categorie).toBe("sur");
  expect(JSON.parse(exp.texte).ingredients.pain.categorie).toBe("boul");
  // la suppression d'un ingrédient nettoie son rayon
  await page.evaluate((c) => {
    rmIng(c);
  }, k);
  expect(await page.evaluate((c) => c in S.cat, k)).toBe(false);
});

test("rayons : un projet exporté puis importé garde les rayons", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator('#ct [data-ced="pain"]').click();
  await page.locator('[data-ec="pain"]').selectOption("fri");
  await page.locator('[data-eok="pain"]').click();
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  expect(JSON.parse(fichier.texte).cat).toEqual({ pain: "fri" });
  await importer(page, fichier.chemin);
  expect(await page.evaluate(() => catOf("pain"))).toBe("fri");
});

test("import de recette : rayon deviné pour les nouveaux ingrédients, modifiable", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  await page.locator("#rimp").click();
  await page
    .locator("#rimt")
    .fill(
      "2 pains\n400 g gyros de volaille\n150 g chorizo\n1 yaourt grec\n3 carottes rapees\n1 boite de maïs\n1 truc"
    );
  await page.locator("#rimlire").click();
  const rayons = await page
    .locator('#rimv select[data-f="cat"]')
    .evaluateAll((l) => l.map((s) => s.value));
  expect(rayons.slice(0, 3)).toEqual(["boul", "bou", "fri"]);
  await page.locator('#rimv select[data-f="cat"]').nth(2).selectOption("lai");
  await page.locator("#rimnom").fill("Test rayons");
  await page.locator("#rimok").click();
  expect(
    await page.evaluate(() => {
      const r = S.rec["Test rayons"];
      return Object.keys(r.ing).map((k) => [ING[k][0], catOf(k)]);
    })
  ).toEqual(
    expect.arrayContaining([
      ["Gyros de volaille", "bou"],
      ["Chorizo", "lai"],
    ])
  );
});

test("recettes : la liste « Ajouter un ingrédient » est triée par ordre alphabétique", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  await page.evaluate(() => {
    createIng("Abricots", "g", "", "fl");
    createIng("Zeste", "g", "", "fl");
    drawRec();
  });
  const noms = (await page.locator("#radd option").allInnerTexts()).slice(1);
  expect(noms.length).toBeGreaterThan(5);
  expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, "fr")));
  expect(noms[0]).toBe("Abricots");
});

test("rayons : le champ « categorie » du fichier de prix est repris sans écraser un choix existant", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#cins").click();
  await page.locator("#ingn").fill("Spéculoos");
  await page.locator("#ingok").click();
  const json = {
    source: "Colruyt",
    date_maj: "2026-10-06",
    ingredients: {
      pain: { unite: "kg", prix_unitaire: 1.1, categorie: "sur" }, // rayon par défaut déjà connu : inchangé
      x1: { nom: "Spéculoos", unite: "kg", prix_unitaire: 3.2, categorie: "epi" },
      x2: { nom: "Sirop de grenadine", unite: "l", prix_unitaire: 2.1, categorie: "boi" },
      x3: { nom: "Truc", unite: "kg", prix_unitaire: 2, categorie: "n'importe quoi" },
    },
  };
  await page.locator("#file").setInputFiles({
    name: "p.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(json)),
  });
  await page.locator("#imp").click();
  await page.locator("#padd").click();
  const r = await page.evaluate(() => {
    const k = (n) => Object.keys(S.cust).find((c) => ING[c][0] === n);
    return [catOf("pain"), catOf(k("Spéculoos")), catOf(k("Sirop de grenadine")), catOf(k("Truc"))];
  });
  expect(r).toEqual(["boul", "epi", "boi", "aut"]);
});

test("sauvegarde : l'export du projet affiche un message, et propose de copier si le téléchargement échoue", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await ouvrir(page);
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  expect(JSON.parse(fichier.texte).rec).toBeTruthy();
  await expect(page.locator("#jmsg")).toContainText("préparé");
  // téléchargement bloqué : message clair au lieu d'un échec silencieux
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new Error("blocage simulé");
    };
  });
  await page.locator("#exp").click();
  await expect(page.locator("#jmsg")).toContainText("Téléchargement impossible (blocage simulé)");
  // projet impossible à sérialiser : message, pas de silence
  await page.evaluate(() => {
    S.boucle = S;
  });
  await page.locator("#exp").click();
  await expect(page.locator("#jmsg")).toContainText("Export impossible");
  await page.evaluate(() => {
    delete S.boucle;
  });
  // copie dans le presse-papiers
  await page.locator("#expc").click();
  await expect(page.locator("#jmsg")).toContainText(/Projet copié|Copie impossible/);
});

test("recettes : renommer une recette garde sa place, ses ingrédients et son menu ; la description s'enregistre en tapant", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  const avant = await page.evaluate(() => ({
    noms: Object.keys(S.rec),
    total: LAST.sum,
    ing: Object.keys(S.rec["Spaghetti bolognaise"].ing),
  }));
  await page.locator("#redit").click();
  await expect(page.locator("#rename")).toHaveValue("Spaghetti bolognaise");
  // un nom déjà pris ou vide est refusé
  await page.locator("#rename").fill("Croque-monsieur");
  await page.locator("#reok").click();
  await expect(page.locator("#remsg")).toContainText("porte déjà ce nom");
  await page.locator("#rename").fill("   ");
  await page.locator("#reok").click();
  await expect(page.locator("#remsg")).toContainText("ne peut pas être vide");
  await page.locator("#rename").fill("Spaghetti maison");
  await page.locator("#reok").click();
  await expect(page.locator("#rsel")).toHaveValue("Spaghetti maison");
  const apres = await page.evaluate(() => ({
    noms: Object.keys(S.rec),
    total: LAST.sum,
    ing: Object.keys(S.rec["Spaghetti maison"].ing),
    cur: S.cur,
    menus: JSON.stringify(S.camps),
  }));
  expect(apres.noms).toEqual(
    avant.noms.map((n) => (n === "Spaghetti bolognaise" ? "Spaghetti maison" : n))
  );
  expect(apres.ing).toEqual(avant.ing);
  expect(apres.total).toBeCloseTo(avant.total, 6); // le menu suit : le budget ne change pas
  expect(apres.cur).toBe("Spaghetti maison");
  expect(apres.menus).toContain("Spaghetti maison");
  expect(apres.menus).not.toContain("Spaghetti bolognaise");
  // Échap annule
  await page.locator("#redit").click();
  await page.locator("#rename").fill("Autre");
  await page.locator("#rename").press("Escape");
  await expect(page.locator("#reform")).toBeHidden();
  expect(await page.evaluate(() => S.cur)).toBe("Spaghetti maison");
  // la description est enregistrée dès la frappe (mode édition), sans quitter le champ
  await page.locator("#redit").click();
  await page.locator("#rdesc").fill("Nouvelle description de la recette");
  await page.reload();
  expect(await page.evaluate(() => S.rec["Spaghetti maison"].desc)).toBe(
    "Nouvelle description de la recette"
  );
  expect(await page.evaluate(() => S.cur)).toBe("Spaghetti maison");
});

test("thème : un bouton à côté de la configuration bascule entre clair et sombre, et se souvient du choix", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await ouvrir(page);
  const fond = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme || "");
  // le bouton est juste à côté de la configuration : dans la barre du haut (téléphone), dans le menu (ordinateur)
  expect(await page.evaluate(() => document.querySelector("#theme").nextElementSibling.id)).toBe(
    "gear"
  );
  expect(
    await page.evaluate(() => document.querySelector("#theme2").previousElementSibling.dataset.g)
  ).toBe("cfg");
  const bouton = async () => {
    if (await page.locator("#burger").isVisible()) await page.locator("#theme").click();
    else await page.locator("#theme2").click();
  };
  expect(await theme()).toBe("");
  expect(await fond()).toBe("rgb(234, 244, 236)"); // clair, comme l'appareil
  await bouton();
  expect(await theme()).toBe("dark");
  expect(await fond()).toBe("rgb(20, 32, 25)");
  await expect(page.locator("#theme2")).toHaveAttribute("aria-label", "Passer en mode clair");
  // le choix survit au rechargement, sans flash clair
  await page.reload();
  expect(await theme()).toBe("dark");
  expect(await fond()).toBe("rgb(20, 32, 25)");
  await bouton();
  expect(await theme()).toBe("light");
  expect(await fond()).toBe("rgb(234, 244, 236)");
  // sur un appareil en mode sombre, le premier clic passe en clair
  await page.evaluate(() => localStorage.removeItem("pss-theme"));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  expect(await fond()).toBe("rgb(20, 32, 25)");
  await bouton();
  expect(await theme()).toBe("light");
  expect(await fond()).toBe("rgb(234, 244, 236)");
});

test("thème sombre : titres de rayon et ligne d'édition restent lisibles (fond sombre, pas de bandeau blanc)", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await ouvrir(page);
  const lum = (css) => {
    // « rgb(20, 32, 25) » (0 à 255) ou « color(srgb 0.08 0.12 0.1) » (0 à 1), selon que la couleur est mélangée ou non
    const [r, g, b] = css
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number),
      max = css.startsWith("color(") ? 1 : 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / max;
  };
  await aller(page, "list");
  const titre = await page
    .locator("#list tr.grp td")
    .first()
    .evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color]);
  expect(lum(titre[0])).toBeLessThan(0.35); // fond sombre
  expect(lum(titre[1])).toBeGreaterThan(0.6); // texte clair
  await aller(page, "cat");
  await page.locator('#ct [data-ced="pain"]').click();
  const edition = await page
    .locator("#ct tr.ced td")
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(lum(edition)).toBeLessThan(0.35);
  // en clair, le fond reste un bandeau vert très clair
  await page.emulateMedia({ colorScheme: "light" });
  await aller(page, "list");
  const clair = await page
    .locator("#list tr.grp td")
    .first()
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(lum(clair)).toBeGreaterThan(0.8);
});

test("import de recette : « Annuler » à côté de « Lire la recette » referme la zone sans rien créer", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  const avant = await page.evaluate(() => Object.keys(S.rec).length);
  await page.locator("#rimp").click();
  await expect(page.locator("#rimpf")).toBeVisible();
  await page.locator("#rimt").fill("2 pains\n400 g gyros de volaille");
  await page.locator("#rimu").fill("https://exemple.be/recette");
  await page.locator("#rimlire").click();
  await expect(page.locator("#rimv")).toContainText("Créer la recette");
  await page.locator("#rimfer").click();
  await expect(page.locator("#rimpf")).toBeHidden();
  await expect(page.locator("#rimt")).toHaveValue("");
  await expect(page.locator("#rimu")).toHaveValue("");
  await expect(page.locator("#rimv")).toBeEmpty();
  expect(await page.evaluate(() => Object.keys(S.rec).length)).toBe(avant);
  // sans avoir lu de recette, le bouton referme aussi la zone
  await page.locator("#rimp").click();
  await expect(page.locator("#rimpf")).toBeVisible();
  await page.locator("#rimfer").click();
  await expect(page.locator("#rimpf")).toBeHidden();
});

test("recettes : retirer un ingrédient d'une recette demande une confirmation", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  const nb = () => page.evaluate(() => Object.keys(S.rec[S.cur].ing).length);
  const avant = await nb();
  const messages = [];
  page.removeAllListeners("dialog");
  let accepter = false;
  page.on("dialog", (d) => {
    messages.push(d.type() + ":" + d.message());
    return accepter ? d.accept() : d.dismiss();
  });
  // refusé : rien ne change
  await page.locator("#rb [data-rm]").first().click();
  expect(messages).toHaveLength(1);
  expect(messages[0]).toMatch(/^confirm:Retirer « .+ » de la recette « Spaghetti bolognaise » \?$/);
  expect(await nb()).toBe(avant);
  // accepté : l'ingrédient est retiré
  accepter = true;
  await page.locator("#rb [data-rm]").first().click();
  expect(await nb()).toBe(avant - 1);
});

test("thème : changer de mode ne fait pas disparaître la page affichée", async ({ page }) => {
  await ouvrir(page);
  for (const id of ["rec", "list", "cat"]) {
    await aller(page, id);
    const visible = () => page.locator(`#g-${id}.on`).isVisible();
    expect(await visible()).toBe(true);
    // téléphone : bouton de la barre du haut ; ordinateur : bouton du menu
    if (await page.locator("#burger").isVisible()) {
      await page.locator("#theme").click();
      expect(await visible()).toBe(true);
      await page.locator("#burger").click();
    }
    await page.locator("#theme2").click();
    expect(await page.evaluate(() => document.querySelectorAll(".pg.on").length)).toBe(1);
    expect(
      await page.evaluate((g) => document.querySelector(`#g-${g}`).classList.contains("on"), id)
    ).toBe(true);
  }
});

test("recettes : la description est verrouillée hors du mode édition (✎), et « Annuler » la restaure", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "rec");
  const desc = () => page.evaluate(() => S.rec[S.cur].desc);
  const avant = await desc();
  // verrouillée par défaut
  await expect(page.locator("#rdesc")).toHaveJSProperty("readOnly", true);
  await page.locator("#rdesc").click();
  await page.keyboard.type("XYZ");
  expect(await desc()).toBe(avant);
  // mode édition : modifiable
  await page.locator("#redit").click();
  await expect(page.locator("#rdesc")).toHaveJSProperty("readOnly", false);
  await page.locator("#rdesc").fill("Texte provisoire");
  expect(await desc()).toBe("Texte provisoire");
  // Annuler : retour à la description d'avant, de nouveau verrouillée
  await page.locator("#reno").click();
  expect(await desc()).toBe(avant);
  await expect(page.locator("#rdesc")).toHaveValue(avant);
  await expect(page.locator("#rdesc")).toHaveJSProperty("readOnly", true);
  await expect(page.locator("#reform")).toBeHidden();
  // Enregistrer : la nouvelle description reste, verrouillée
  await page.locator("#redit").click();
  await page.locator("#rdesc").fill("Description finale");
  await page.locator("#reok").click();
  expect(await desc()).toBe("Description finale");
  await expect(page.locator("#rdesc")).toHaveJSProperty("readOnly", true);
  // changer de recette referme le mode édition
  await page.locator("#redit").click();
  await page.locator("#rsel").selectOption({ index: 1 });
  await expect(page.locator("#rdesc")).toHaveJSProperty("readOnly", true);
  await expect(page.locator("#reform")).toBeHidden();
});

test("catalogue : une liste déroulante triée filtre les prix des ingrédients par rayon", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  // la liste des rayons est triée par ordre alphabétique, avec les effectifs, « Tous les rayons » en tête
  const options = await page.locator("#crayon option").allInnerTexts();
  expect(options[0]).toMatch(/^Tous les rayons \(\d+\)$/);
  const noms = options.slice(1).map((o) => o.replace(/ \(\d+\)$/, ""));
  expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, "fr")));
  expect(noms).toHaveLength(9);
  const total = await page.locator("#ct tr").count();
  // choisir un rayon ne garde que ses ingrédients
  await page.locator("#crayon").selectOption("boul");
  await expect(page.locator("#ct tr")).toHaveCount(2); // Pain et Pain sans gluten
  await expect(page.locator("#ct")).toContainText("Pain sans gluten");
  expect(await page.locator("#crayon option:checked").innerText()).toBe("Boulangerie (2)");
  // il se combine avec le filtre texte
  await page.locator("#cfilt").fill("gluten");
  await expect(page.locator("#ct tr")).toHaveCount(1);
  await page.locator("#cfilt").fill("riz");
  await expect(page.locator("#ct")).toContainText("Aucun ingrédient ne correspond au filtre.");
  await page.locator("#cfilt").fill("");
  // la modification (✎) fonctionne dans la liste filtrée ; changer le rayon met les effectifs à jour
  await page.locator('#ct [data-ced="pain"]').click();
  await page.locator('[data-ec="pain"]').selectOption("sur");
  await page.locator('[data-eok="pain"]').click();
  await expect(page.locator("#ct tr")).toHaveCount(1);
  expect(await page.locator("#crayon option:checked").innerText()).toBe("Boulangerie (1)");
  await page.locator("#crayon").selectOption("sur");
  await expect(page.locator("#ct")).toContainText("Pain");
  // « Tous les rayons » rétablit toute la liste
  await page.locator("#crayon").selectOption("");
  await expect(page.locator("#ct tr")).toHaveCount(total);
  // les documents restent complets, avec la colonne « Rayon » dans le CSV
  expect(await page.evaluate(() => csvPrices())).toContain(";Surgelés");
});

const importerPrix = async (page, ingredients) => {
  await page.locator("#file").setInputFiles({
    name: "p.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ source: "Colruyt", date_maj: "2026-10-06", ingredients })),
  });
  await page.locator("#imp").click();
};

test("promotions : affichées dans la liste et le catalogue, sans changer le budget", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await importerPrix(page, {
    pain: { unite: "kg", prix_unitaire: 1.12 },
    riz: { unite: "kg", prix_unitaire: 0.89 },
  });
  const sans = await page.evaluate(() => LAST.sum);
  await importerPrix(page, {
    pain: {
      unite: "kg",
      prix_unitaire: 1.12,
      promo: { prix_unitaire: 1.0, texte: "1,00 € au lieu de 1,12 €" },
    },
    riz: {
      unite: "kg",
      prix_unitaire: 0.89,
      promo: { prix_unitaire: 0.95, texte: "pas moins cher" },
    },
  });
  expect(await page.evaluate(() => S.promo)).toEqual({
    pain: { p: 1, t: "1,00 € au lieu de 1,12 €" },
  });
  // le budget garde le prix normal
  expect(await page.evaluate(() => LAST.sum)).toBeCloseTo(sans, 6);
  // catalogue : étiquette sous le produit
  await expect(page.locator("#ct tr", { hasText: "Pain" }).first()).toContainText(
    "🏷️ promo : 1,00"
  );
  await expect(page.locator("#ct tr", { hasText: "Riz" }).first()).not.toContainText("🏷️");
  // liste de courses : étiquette avec l'économie possible, et total des économies
  await aller(page, "list");
  const gain = await page.evaluate(() => economie("pain", LAST.tot.pain));
  expect(gain).toBeGreaterThan(0);
  await expect(page.locator("#list tr", { hasText: "Pain" }).first()).toContainText("🏷️ promo");
  await expect(page.locator("#ecow")).toBeVisible();
  expect(await page.evaluate(() => (+LAST.tot.pain / 1000) * (1.12 - 1.0))).toBeCloseTo(gain, 6);
  // un prix saisi à la main n'est plus celui du produit en promotion : l'étiquette disparaît
  await page.locator('#list input[data-p="pain"]').fill("1.5");
  await page.locator('#list input[data-p="pain"]').press("Tab");
  expect(await page.evaluate(() => "pain" in S.promo)).toBe(false);
  await expect(page.locator("#ecow")).toBeHidden();
});

test("promotions : enregistrées dans le projet, nettoyées à la suppression d'un ingrédient", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await importerPrix(page, {
    pain: { unite: "kg", prix_unitaire: 1.12, promo: { prix_unitaire: 1.0, texte: "promo" } },
  });
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  expect(JSON.parse(fichier.texte).promo).toEqual({ pain: { p: 1, t: "promo" } });
  await importer(page, fichier.chemin);
  expect(await page.evaluate(() => S.promo)).toEqual({ pain: { p: 1, t: "promo" } });
  // un fichier de projet abîmé : promo non numérique ou identifiant invalide ignorés
  const abime = JSON.parse(fichier.texte);
  abime.promo = { pain: { p: "x" }, "a b": { p: 1 }, riz: { p: -2 } };
  expect(await page.evaluate((x) => cleanProject(x).promo, abime)).toEqual({});
  // supprimer un ingrédient ajouté à la main efface sa promotion
  const k = await page.evaluate(() => {
    const c = createIng("Test promo", "g", "", "aut");
    S.prices[c] = 2;
    S.promo[c] = { p: 1, t: "" };
    rmIng(c);
    return c;
  });
  expect(await page.evaluate((c) => c in S.promo, k)).toBe(false);
});

test("catalogue : la liste des rayons est deux fois plus large, sans changer de hauteur ni de texte", async ({
  page,
}) => {
  await ouvrir(page);
  await page.setViewportSize({ width: 400, height: 800 }); // le bouton « Gérer les rayons » passe dessous
  await aller(page, "cat");
  const t = await page.evaluate(() => {
    const e = document.querySelector("#crayon"),
      r = e.getBoundingClientRect();
    return [
      r.width,
      r.height,
      getComputedStyle(e).fontSize,
      document.querySelector("#cfilt").getBoundingClientRect().width,
    ];
  });
  expect(Math.abs(t[0] - t[3])).toBeLessThan(2); // aussi large que le filtre : environ le double de l'ancienne largeur
  expect(t[1]).toBeLessThan(45); // hauteur d'origine (37 px)
  expect(t[2]).toBe("16px"); // texte d'origine
});

test("liens produit : la fiche Colruyt est cliquable dans le catalogue et la liste, sans autre site", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await importerPrix(page, {
    pain: {
      unite: "kg",
      prix_unitaire: 1.12,
      produit: { nom: "EVERYDAY pain blanc 800g" },
      lien: "https://www.colruyt.be/fr/produits/14502",
    },
    riz: {
      unite: "kg",
      prix_unitaire: 0.89,
      produit: { nom: "Riz long grain" },
      lien: "https://evil.example/riz",
    },
    lait: { unite: "l", prix_unitaire: 0.85, lien: "javascript:alert(1)" },
  });
  // seule l'adresse en https://www.colruyt.be/… est gardée
  expect(await page.evaluate(() => S.url)).toEqual({
    pain: "https://www.colruyt.be/fr/produits/14502",
  });
  const lien = page.locator('#ct a[href="https://www.colruyt.be/fr/produits/14502"]');
  await expect(lien).toHaveCount(1);
  await expect(lien).toContainText("EVERYDAY pain blanc 800g");
  expect(await lien.getAttribute("target")).toBe("_blank");
  expect(await lien.getAttribute("rel")).toBe("noopener noreferrer");
  await expect(page.locator("#ct a[href]")).toHaveCount(1);
  // liste de courses
  await aller(page, "list");
  await expect(
    page.locator('#list a[href="https://www.colruyt.be/fr/produits/14502"]')
  ).toHaveCount(1);
  // documents : CSV avec la colonne « Lien produit », HTML du catalogue avec le lien
  expect(await page.evaluate(() => csvPrices())).toContain(
    ";https://www.colruyt.be/fr/produits/14502"
  );
  expect(await page.evaluate(() => pricesHTML())).toContain(
    '<a href="https://www.colruyt.be/fr/produits/14502">'
  );
  // un prix saisi à la main : le lien disparaît
  await page.locator('#list input[data-p="pain"]').fill("1.5");
  await page.locator('#list input[data-p="pain"]').press("Tab");
  expect(await page.evaluate(() => "pain" in S.url)).toBe(false);
});

test("liens produit : enregistrés dans le projet, adresses étrangères refusées à l'import", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await importerPrix(page, {
    pain: { unite: "kg", prix_unitaire: 1.12, lien: "https://www.colruyt.be/fr/produits/14502" },
  });
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  expect(JSON.parse(fichier.texte).url).toEqual({
    pain: "https://www.colruyt.be/fr/produits/14502",
  });
  await importer(page, fichier.chemin);
  expect(await page.evaluate(() => S.url)).toEqual({
    pain: "https://www.colruyt.be/fr/produits/14502",
  });
  const abime = JSON.parse(fichier.texte);
  abime.url = {
    pain: "https://www.colruyt.be.evil.example/x",
    riz: "http://www.colruyt.be/fr/produits/1",
    lait: "javascript:alert(1)",
    sucre: "https://www.colruyt.be/fr/produits/<script>",
  };
  expect(await page.evaluate((x) => cleanProject(x).url, abime)).toEqual({});
});

/** Ouvre la fenêtre « Nouvel ingrédient » depuis la page demandée (« cat » ou « rec ») et valide un nom / une unité. */
async function ajouterIngredient(page, depuis, nom, unite) {
  await aller(page, depuis);
  await page.locator(depuis === "cat" ? "#cins" : "#inew").click();
  await page.locator("#ingn").fill(nom);
  await page.locator("#ingu").selectOption(unite);
  await page.locator("#ingok").click();
}

test("nouvel ingrédient : un seul formulaire (catalogue et recettes), qui ajoute à la recette seulement depuis les recettes", async ({
  page,
}) => {
  await ouvrir(page);
  await ajouterIngredient(page, "cat", "Sirop", "ml");
  await expect(page.locator("#ingdlg")).not.toBeVisible();
  const [nb, rec] = await page.evaluate(() => [
    Object.keys(S.cust).length,
    S.rec[S.cur] ? Object.keys(S.rec[S.cur].ing).length : -1,
  ]);
  expect(nb).toBe(1);
  await ajouterIngredient(page, "rec", "Sucre glace", "g");
  expect(await page.evaluate(() => Object.keys(S.cust).length)).toBe(2);
  expect(
    await page.evaluate(() =>
      Object.keys(S.rec[S.cur].ing).some((k) => ING[k][0] === "Sucre glace")
    )
  ).toBe(true);
  expect(
    await page.evaluate(() => Object.keys(S.rec[S.cur].ing).some((k) => ING[k][0] === "Sirop"))
  ).toBe(false);
  expect(rec).toBeGreaterThan(0);
});

test("nouvel ingrédient : un nom déjà pris (même à l'accent ou au pluriel près) demande confirmation, aussi pour une autre unité", async ({
  page,
}) => {
  await ouvrir(page);
  // « Pâtes » existe en grammes : « pate » en grammes = doublon exact
  await ajouterIngredient(page, "cat", "pate", "g");
  await expect(page.locator("#ingdup")).toBeVisible();
  await expect(page.locator("#ingdupt")).toContainText("« Pâtes » existe déjà");
  expect(await page.evaluate(() => Object.keys(S.cust).length)).toBe(0);
  // « Modifier » referme l'avertissement sans rien créer
  await page.locator("#ingback").click();
  await expect(page.locator("#ingdup")).toBeHidden();
  // autre unité : avertissement différent, qui parle de l'unité de l'existant
  await page.locator("#ingu").selectOption("pc");
  await page.locator("#ingok").click();
  await expect(page.locator("#ingdupt")).toContainText("mais en poids");
  // depuis le catalogue, pas d'« Utiliser » (rien à ajouter à une recette)
  await expect(page.locator("#inguse")).toBeHidden();
  expect(await page.evaluate(() => Object.keys(S.cust).length)).toBe(0);
  // créer quand même
  await page.locator("#ingforce").click();
  await expect(page.locator("#ingdlg")).not.toBeVisible();
  expect(await page.evaluate(() => Object.values(S.cust).map((e) => [e[0], e[1]]))).toEqual([
    ["pate", "pc"],
  ]);
  // un nom nouveau ne demande rien
  await ajouterIngredient(page, "cat", "Cannelle", "g");
  await expect(page.locator("#ingdlg")).not.toBeVisible();
});

test("nouvel ingrédient depuis une recette : « Utiliser l'existant » ajoute l'ingrédient du catalogue sans en créer un", async ({
  page,
}) => {
  await ouvrir(page);
  await ajouterIngredient(page, "cat", "Sirop", "ml");
  await aller(page, "rec");
  await page.locator("#inew").click();
  await page.locator("#ingn").fill("sirops");
  await page.locator("#ingu").selectOption("ml");
  await page.locator("#ingok").click();
  await expect(page.locator("#inguse")).toBeVisible();
  await page.locator("#inguse").click();
  expect(await page.evaluate(() => Object.keys(S.cust).length)).toBe(1);
  expect(
    await page.evaluate(() => Object.keys(S.rec[S.cur].ing).some((k) => ING[k][0] === "Sirop"))
  ).toBe(true);
});

test("catalogue : deux doublons utilisés dans des recettes se fusionnent (quantités additionnées, prix gardé, un seul reste)", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  await page.evaluate(() => {
    const a = createIng("Huile d'olive", "ml", "", "aut"),
      b = createIng("huile olive", "ml", "", "aut");
    S.prices[b] = 6;
    S.rec[S.cur].ing[a] = SEC.map(() => 10);
    S.rec[S.cur].ing[b] = SEC.map(() => 5);
    window.__ids = [a, b];
    refreshIng();
  });
  const [a, b] = await page.evaluate(() => window.__ids);
  // b (huile olive, avec prix) est fusionné dans a (sans prix) : a garde son nom et reprend le prix de b
  await page.locator(`#ct [data-ced="${b}"]`).click();
  await page.locator(`#ct [data-emg="${b}"]`).click();
  await expect(page.locator("#mgdlg")).toBeVisible();
  await expect(page.locator("#mgb")).toContainText("doublon probable");
  await page.locator("#mgb").selectOption(a);
  await page.locator("#mgs1").check(); // garder « a », « b » est supprimé
  await page.locator("#mgok").click();
  await expect(page.locator("#mgdlg")).not.toBeVisible();
  const etat = await page.evaluate(
    ([a, b]) => ({
      aExiste: !!ING[a],
      bExiste: !!ING[b],
      q: S.rec[S.cur].ing[a],
      prix: S.prices[a],
      bDansRecette: b in S.rec[S.cur].ing,
    }),
    [a, b]
  );
  expect(etat.bExiste).toBe(false);
  expect(etat.aExiste).toBe(true);
  expect(etat.bDansRecette).toBe(false);
  expect(etat.q.every((v) => v === 15)).toBe(true);
  expect(etat.prix).toBe(6);
});

test("catalogue : la fusion peut garder l'autre sens, refuse deux unités différentes et additionne les quantités uniques", async ({
  page,
}) => {
  await ouvrir(page);
  const r = await page.evaluate(() => {
    const a = createIng("Lait entier", "ml", "", "aut"),
      b = createIng("lait entier", "ml", "", "aut"),
      c = createIng("Lait pièce", "pc", "", "aut");
    S.rec[S.cur].ing[a] = SEC.map(() => 10);
    S.rec[S.cur].ing[b] = SEC.map(() => 0);
    S.rec[S.cur].fx = { ...(S.rec[S.cur].fx || {}), [a]: 1000, [b]: 500 };
    const unites = fusionnerIng(a, c);
    const ok = fusionnerIng(a, b);
    return { unites, ok, aGone: !ING[a], total: S.rec[S.cur].fx[b], b: !!ING[b] };
  });
  expect(r.unites).toContain("pas la même unité");
  expect(r.ok).toBe("");
  expect(r.aGone).toBe(true);
  expect(r.b).toBe(true);
  expect(r.total).toBe(1500);
});

test("catalogue : un seul bouton ✎ ouvre la modification (Nom large, prix, Effacer, Fusionner, Annuler)", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  // plus de boutons de fusion ni de suppression sur la ligne : un seul bouton ✎
  expect(await page.locator('#ct tr:has([data-cp="pates"]) button').count()).toBe(1);
  await page.locator('#ct [data-ced="pates"]').click();
  const largeur = (sel) =>
    page.locator(sel).evaluate((e) => Math.round(e.getBoundingClientRect().width));
  // le champ Nom est au moins aussi large que Régime (toute la largeur sur téléphone)
  expect(await largeur('[data-en="pates"]')).toBeGreaterThanOrEqual(
    await largeur('[data-eg="pates"]')
  );
  expect(await largeur('[data-en="pates"]')).toBeGreaterThan(150);
  // Nom, Unité et Prix sont sur la première ligne (ordinateur) ; Régime et Rayon plus bas
  const y = (sel) => page.locator(sel).evaluate((e) => Math.round(e.getBoundingClientRect().top));
  expect(await y('[data-eg="pates"]')).toBeGreaterThan(await y('[data-en="pates"]'));
  expect(await y('[data-ec="pates"]')).toBe(await y('[data-eg="pates"]'));
  // le prix se modifie ici
  await page.locator('[data-ep="pates"]').fill("1.23");
  await page.locator('[data-eok="pates"]').click();
  expect(await page.evaluate(() => price("pates"))).toBe(1.23);
  // les boutons du bas
  await page.locator('#ct [data-ced="pates"]').click();
  await expect(page.locator('[data-edel="pates"]')).toBeVisible();
  await expect(page.locator('[data-emg="pates"]')).toBeVisible();
  await page.locator('[data-emg="pates"]').click();
  await expect(page.locator("#mgdlg")).toBeVisible();
  await page.locator("#mgno").click();
  await page.locator('[data-eno="pates"]').click();
  await expect(page.locator('[data-en="pates"]')).toHaveCount(0);
});

test("nouvel ingrédient depuis une recette : « Utiliser » est aussi proposé quand l'unité diffère, et reprend l'ingrédient existant", async ({
  page,
}) => {
  await ouvrir(page);
  await ajouterIngredient(page, "cat", "Huile d'olive", "ml");
  await aller(page, "rec");
  await page.locator("#inew").click();
  await page.locator("#ingn").fill("huile d'olive");
  await page.locator("#ingu").selectOption("pc");
  await page.locator("#ingok").click();
  await expect(page.locator("#ingdupt")).toContainText("mais en liquide");
  await expect(page.locator("#inguse")).toBeVisible();
  await expect(page.locator("#inguse")).toContainText(
    "Utiliser « Huile d'olive » (en liquide, ml)"
  );
  await page.locator("#inguse").click();
  expect(await page.evaluate(() => Object.keys(S.cust).length)).toBe(1);
  expect(
    await page.evaluate(() =>
      Object.keys(S.rec[S.cur].ing).some((k) => ING[k][0] === "Huile d'olive" && ING[k][1] === "ml")
    )
  ).toBe(true);
});

test("liste de courses : des articles hors recettes (liquide vaisselle…) s'ajoutent, comptent dans le total et se retirent", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "list");
  const total = () => page.evaluate(() => LAST.sum);
  const avant = await total();
  await page.locator("#xn").fill("Liquide vaisselle");
  await page.locator("#xq").fill("2");
  await page.locator("#xp").fill("2.5");
  await page.locator("#xok").click();
  // dans la liste, avec son prix, et le total augmente de 2 × 2,50 €
  const ligne = page.locator("#list tr", { hasText: "Liquide vaisselle" });
  await expect(ligne).toHaveCount(1);
  expect(Math.round(((await total()) - avant) * 100) / 100).toBe(5);
  // il n'est pas proposé dans les ingrédients d'une recette, mais il est dans le catalogue
  await aller(page, "rec");
  expect(await page.locator("#radd option", { hasText: "Liquide vaisselle" }).count()).toBe(0);
  await aller(page, "cat");
  await expect(page.locator("#ct tr", { hasText: "Liquide vaisselle" })).toHaveCount(1);
  // il reste après rechargement de la page
  await page.reload();
  await aller(page, "list");
  await expect(page.locator("#list tr", { hasText: "Liquide vaisselle" })).toHaveCount(1);
  // la quantité se modifie dans le tableau des articles ; 0 retire l'article
  const q = page.locator("#xl input[data-xq]");
  await q.fill("3");
  await q.press("Tab");
  expect(Math.round(((await total()) - avant) * 100) / 100).toBe(7.5);
  // il est dans le projet exporté et revient à l'import
  await aller(page, "pj");
  const fichier = await telecharger(page, "#exp");
  const projet = JSON.parse(fichier.texte);
  const k = Object.keys(projet.art)[0];
  expect(Object.values(projet.camps)[0].extra[k]).toBe(3);
  await importer(page, fichier.chemin);
  expect(await page.evaluate(() => Object.values(C.extra))).toEqual([3]);
  // retirer l'article
  await aller(page, "list");
  await page.locator("#xl [data-xd]").click();
  await expect(page.locator("#list tr", { hasText: "Liquide vaisselle" })).toHaveCount(0);
  expect(Math.round(((await total()) - avant) * 100) / 100).toBe(0);
});

test("liste de courses : un article au nom déjà connu (même unité) reprend l'ingrédient du catalogue, en kg ou en litres", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "list");
  const nb = await page.evaluate(() => Object.keys(ING).length);
  await page.locator("#xn").fill("pate");
  await page.locator("#xu").selectOption("g");
  await page.locator("#xq").fill("1.5");
  await page.locator("#xok").click();
  await expect(page.locator("#xm")).toContainText("existe déjà");
  expect(await page.evaluate(() => Object.keys(ING).length)).toBe(nb);
  expect(await page.evaluate(() => C.extra.pates)).toBe(1500);
  // un nom vide ou une quantité nulle sont refusés
  await page.locator("#xq").fill("0");
  await page.locator("#xn").fill("Sacs poubelle");
  await page.locator("#xok").click();
  await expect(page.locator("#xm")).toContainText("quantité");
  expect(await page.evaluate(() => Object.keys(ING).length)).toBe(nb);
});

test("catalogue : « Vérifier les doublons » liste les doublons et fusionne dans le sens choisi (A → B ou B → A)", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  // rien à signaler au départ
  await page.locator("#cdbl").click();
  await expect(page.locator("#dpdlg")).toBeVisible();
  await expect(page.locator("#dpl")).toContainText("Aucun doublon");
  await page.locator("#dpno").click();
  // deux doublons (A utilisé en recette) et un nom identique avec une autre unité
  await page.evaluate(() => {
    const a = createIng("Huile d'olive", "ml", "", "aut"),
      b = createIng("huile olive", "ml", "", "aut");
    createIng("Huile olives", "pc", "", "aut");
    S.rec[S.cur].ing[a] = SEC.map(() => 10);
    S.prices[b] = 6;
    window.__ids = [a, b];
    refreshIng();
  });
  const [a, b] = await page.evaluate(() => window.__ids);
  await page.locator("#cdbl").click();
  await expect(page.locator("#dpl .dpg")).toHaveCount(1);
  await expect(page.locator("#dpl")).toContainText("« Huile d'olive »");
  await expect(page.locator("#dpl")).toContainText("1 recette");
  // l'unité différente est signalée à part
  await expect(page.locator("#dpm")).toContainText("unités différentes");
  // « huile olive » → « Huile d'olive » : le doublon b disparaît, a garde son nom et reprend le prix
  await page.locator(`#dpl [data-dsrc="${b}"][data-ddst="${a}"]`).click();
  await expect(page.locator("#dpl")).toContainText("Aucun doublon");
  const etat = await page.evaluate(([a, b]) => [!!ING[a], !!ING[b], S.prices[a]], [a, b]);
  expect(etat).toEqual([true, false, 6]);
  await page.locator("#dpno").click();
  // refuser la confirmation ne change rien
  await page.evaluate(() => {
    window.__d = [createIng("Sel fin", "g", "", "aut"), createIng("sel fin", "g", "", "aut")];
    refreshIng();
  });
  const [d1, d2] = await page.evaluate(() => window.__d);
  await page.locator("#cdbl").click();
  page.removeAllListeners("dialog");
  page.on("dialog", (d) => d.dismiss());
  await page.locator(`#dpl [data-dsrc="${d1}"]`).click();
  expect(await page.evaluate(([x, y]) => [!!ING[x], !!ING[y]], [d1, d2])).toEqual([true, true]);
});

test("import de prix : l'aperçu compare les anciens et nouveaux prix (hausses, baisses, nouveaux, promos, liens) et le budget", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  const ancien = await page.evaluate(() => ({ pain: price("pain"), riz: price("riz") }));
  await page.locator("#iopen").click();
  await page.locator("#file").setInputFiles({
    name: "p.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        source: "Colruyt",
        date_maj: "2026-10-07",
        ingredients: {
          pain: {
            unite: "kg",
            prix_unitaire: +(ancien.pain * 1.5).toFixed(2),
            lien: "https://www.colruyt.be/fr/produits/14502",
            produit: { nom: "Pain gris" },
            categorie: "boul",
          },
          riz: { unite: "kg", prix_unitaire: ancien.riz },
          pates: {
            unite: "kg",
            prix_unitaire: 0.5,
            promo: { prix_unitaire: 0.4, texte: "2+1" },
          },
        },
      })
    ),
  });
  const cmp = page.locator("#cmp");
  await expect(cmp).toBeVisible();
  await expect(page.locator("#csv")).toBeHidden();
  await expect(cmp.locator(".cmpc")).toContainText("1 hausse");
  await expect(cmp.locator(".cmpc")).toContainText("1 baisse");
  await expect(cmp.locator(".cmpc")).toContainText("1 inchangé");
  await expect(cmp.locator(".cmpc")).toContainText("1 promo");
  await expect(cmp.locator(".cmpc")).toContainText("1 lien produit");
  await expect(cmp).toContainText("Budget de la liste de courses");
  // le lien du produit est cliquable (nouvel onglet) vers colruyt.be
  const lien = cmp.locator('a[href="https://www.colruyt.be/fr/produits/14502"]');
  await expect(lien).toHaveAttribute("target", "_blank");
  await expect(lien).toContainText("Pain gris");
  // « voir seulement ce qui change » masque les inchangés
  await expect(cmp.locator(".cmpi.egal")).toBeVisible();
  await page.locator("#cmpseul").check();
  await expect(cmp.locator(".cmpi.egal")).toBeHidden();
  // rien n'est appliqué avant « Importer »
  expect(await page.evaluate(() => price("pain"))).toBe(ancien.pain);
  await page.locator("#imp").click();
  expect(await page.evaluate(() => price("pain"))).toBe(+(ancien.pain * 1.5).toFixed(2));
  // la fenêtre se referme et repart de la zone de texte
  await page.locator("#iopen").click();
  await expect(page.locator("#csv")).toBeVisible();
  await expect(cmp).toBeHidden();
});

test("import des prix : les boutons Importer / Annuler restent visibles malgré un aperçu long", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "cat");
  const ingredients = await page.evaluate(() => {
    const o = {};
    Object.keys(ING)
      .slice(0, 30)
      .forEach((k, i) => {
        o[k] = {
          unite: { g: "kg", ml: "l", pc: "piece" }[ING[k][1]],
          prix_unitaire: 1 + i,
          produit: { nom: "Marque produit " + i },
        };
      });
    return o;
  });
  await simulerPrixPublies(page, 200, { source: "Colruyt", date_maj: "2026-10-03", ingredients });
  await page.locator("#pfetch").click();
  await expect(page.locator("#imp")).toBeVisible();
  await expect(page.locator("#imp")).toBeInViewport({ ratio: 1 });
  await expect(page.locator("#impno")).toBeInViewport({ ratio: 1 });
});

test("menu : le nom d'un repas ouvre un panneau (nom, couleur, ordre, retrait) sans section séparée", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "menu");
  await expect(page.locator("#types")).toHaveCount(0);
  const zone = () => page.locator('.dcard[data-dj="0"] .zone[data-slot="m"]');
  await zone().locator(".zn").click();
  const pan = page.locator(".zpan");
  await expect(pan).toHaveCount(1);
  await expect(pan.locator("[data-tn]")).toHaveValue("Matin");
  await expect(pan).toContainText("Ce jour seulement");
  await expect(pan).toContainText("Tous les jours");
  // renommer : le champ garde le focus et le nom change dans tous les jours
  await pan.locator("[data-tn]").fill("Petit matin");
  await expect(pan.locator("[data-tn]")).toBeFocused();
  await expect(
    page.locator('.zone[data-slot="m"] .zn', { hasText: "Petit matin" }).first()
  ).toBeVisible();
  expect(await page.evaluate(() => C.types.find((t) => t.k === "m").n)).toBe("Petit matin");
  // couleur : une pastille change la couleur du repas
  await pan.locator(".sw").nth(1).click();
  expect(await page.evaluate(() => C.col.m)).toBe("#c0392b");
  await expect(pan.locator(".sw.on")).toHaveCount(1);
  // ordre : « ▼ » descend le repas, « ▲ » le remonte
  const ordre = () => page.evaluate(() => C.types.map((t) => t.k).join(","));
  const avant = await ordre();
  await page.locator(".zpan [data-td]").click();
  const apres = await ordre();
  expect(apres).not.toBe(avant);
  await page.locator(".zpan [data-tu]").click();
  expect(await ordre()).toBe(avant);
  // le nom d'un repas rouvre/ferme le panneau
  await zone().locator(".zn").click();
  await expect(page.locator(".zpan")).toHaveCount(0);
});

test("menu : la poignée ⠿ d'un repas le déplace (clavier et glisser)", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "menu");
  const ordre = () => page.evaluate(() => C.types.map((t) => t.k).join(","));
  const avant = await ordre();
  // la poignée est visible sans ouvrir le panneau de modification
  await expect(page.locator('.dcard[data-dj="0"] .zh[data-zk="m"]')).toBeVisible();
  await page.locator('.dcard[data-dj="0"] .zone[data-slot="m"] .zn').click();
  const h = page.locator('.dcard[data-dj="0"] .zh[data-zk="m"]');
  await h.focus();
  await page.keyboard.press("ArrowDown");
  const apres = await ordre();
  expect(apres).not.toBe(avant);
  await page.locator('.dcard[data-dj="0"] .zh[data-zk="m"]').focus();
  await page.keyboard.press("ArrowUp");
  expect(await ordre()).toBe(avant);
  // glisser le premier repas sur le dernier du même jour
  await page.setViewportSize({ width: 412, height: 2000 }); // tout le jour visible malgré le panneau ouvert
  const zones = page.locator('.dcard[data-dj="0"] .zone');
  const n = await zones.count();
  const src = await zones.first().locator(".zh").boundingBox();
  const dst = await zones.nth(n - 1).boundingBox();
  await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
  await page.mouse.down();
  await page.mouse.move(dst.x + 100, dst.y + dst.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(await ordre()).not.toBe(avant);
});

test("menu : effectif réglé section par section pour un repas, un jour ou un repas tous les jours", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "menu");
  const info = await page.evaluate(() => ({ n: [...C.n], nb: SEC.length }));
  const j = info.n.findIndex((v) => v > 1);
  expect(j).toBeGreaterThanOrEqual(0);
  const total = () => page.evaluate(() => LAST.sum);
  const avant = await total();
  const zone = page.locator('.dcard[data-dj="0"] .zone[data-slot="s"]');
  await zone.locator(".zn").click();
  await expect(page.locator(".zpan [data-pr]")).toHaveCount(info.nb);
  // la section j vient à moitié
  const moitie = Math.floor(info.n[j] / 2);
  await page.locator(`.zpan [data-pr="${j}"]`).fill(String(moitie));
  await page.locator('.zpan [data-pra="1"]').click();
  const nbPres = info.n.reduce((a, v) => a + v, 0) - (info.n[j] - moitie);
  await expect(zone.locator(".zp")).toHaveText(`(${nbPres} pers.)`);
  await expect(zone.locator(".zp")).toHaveClass(/red/);
  const apres = await total();
  expect(apres).toBeLessThan(avant);
  expect(await page.evaluate(() => C.pres["0|s"])).toEqual(
    info.n.map((v, s) => (s === j ? moitie : v))
  );
  expect(await page.evaluate(() => LAST.pm.some((x) => /pers\./.test(x[0])))).toBe(true);
  // section à zéro : encore moins de quantités
  await page.locator(`.zpan [data-pr="${j}"]`).fill("0");
  await page.locator('.zpan [data-pra="1"]').click();
  expect(await total()).toBeLessThan(apres);
  // survit au rechargement
  await page.reload();
  expect((await page.evaluate(() => C.pres["0|s"]))[j]).toBe(0);
  // tous les repas de ce jour
  await aller(page, "menu");
  await page.locator('.dcard[data-dj="0"] .zone[data-slot="m"] .zn').click();
  await page.locator(`.zpan [data-pr="${j}"]`).fill("1");
  await page.locator(".zpan [data-prs]").selectOption("jour");
  await page.locator('.zpan [data-pra="1"]').click();
  expect(
    await page.evaluate(() => Object.keys(C.pres).filter((k) => k.startsWith("0|")).length)
  ).toBe(await page.evaluate(() => dtypes(0).length));
  // ce repas, tous les jours, puis « Toute la troupe » rétablit
  await page.locator(".zpan [data-prs]").selectOption("tous");
  await page.locator('.zpan [data-pra="0"]').click();
  expect(
    await page.evaluate(() => Object.keys(C.pres).filter((k) => k.endsWith("|m")).length)
  ).toBe(0);
  // des valeurs égales à l'effectif complet valent « tout le monde »
  await page.locator('.dcard[data-dj="0"] .zone[data-slot="s"] .zn').click();
  for (let s = 0; s < info.nb; s++)
    await page.locator(`.zpan [data-pr="${s}"]`).fill(String(info.n[s] + 5));
  await page.locator('.zpan [data-pra="1"]').click();
  expect(await page.evaluate(() => C.pres["0|s"])).toBeUndefined();
});

test("liste de courses : ajouter deux fois le même article additionne les quantités (pièces, kg, litres)", async ({
  page,
}) => {
  await ouvrir(page);
  await aller(page, "list");
  const ajouter = async (nom, unite, q) => {
    await page.locator("#xn").fill(nom);
    await page.locator("#xu").selectOption(unite);
    await page.locator("#xq").fill(q);
    await page.locator("#xok").click();
  };
  await ajouter("Sacs poubelle", "pc", "2");
  await ajouter("Sacs poubelle", "pc", "3");
  await ajouter("Farine de secours", "g", "1.5");
  await ajouter("Farine de secours", "g", "2");
  await ajouter("Jus de secours", "ml", "0.25");
  await ajouter("Jus de secours", "ml", "0.5");
  const q = await page.evaluate(() => {
    const v = (n) => C.extra[Object.keys(ING).find((k) => ING[k][0] === n)];
    return [v("Sacs poubelle"), v("Farine de secours"), v("Jus de secours")];
  });
  expect(q).toEqual([5, 3500, 750]);
});

test("robustesse : nom de recette trop long refusé, nombres négatifs ou démesurés ramenés dans les bornes", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  await aller(page, "rec");
  await page.locator("#rnew").click();
  await page.locator("#rname").evaluate((e) => (e.value = "x".repeat(101)));
  await page.locator("#rok").click();
  expect(await page.evaluate(() => Object.keys(S.rec).some((n) => n.length > 100))).toBe(false);
  await expect(page.locator("#rname")).toHaveAttribute("placeholder", /trop long/);
  // un gestionnaire reçoit la saisie telle quelle : le « min » du HTML ne la filtre pas
  await aller(page, "eff");
  await page.locator('#cnt [data-n="0"]').evaluate((e) => {
    e.value = "-5";
    e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(await page.evaluate(() => C.n[0])).toBe(0);
  await page.locator('#cnt [data-n="0"]').evaluate((e) => {
    e.value = "1e9";
    e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(await page.evaluate(() => C.n[0])).toBe(1e4);
  expect(erreurs).toEqual([]);
});

test("robustesse : un camp courant nommé comme une propriété héritée (constructor) ne bloque pas le démarrage", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("intendance2"));
    p.ccur = "constructor";
    p.cur = "constructor";
    localStorage.setItem("intendance2", JSON.stringify(p));
  });
  await page.reload();
  expect(await page.evaluate(() => Object.hasOwn(S.camps, S.ccur))).toBe(true);
  expect(await page.evaluate(() => Object.hasOwn(S.rec, S.cur))).toBe(true);
  expect(erreurs).toEqual([]);
});

test("catalogue : la fusion refuse un ingrédient en quantité unique avec un autre par personne", async ({
  page,
}) => {
  await ouvrir(page);
  const r = await page.evaluate(() => {
    const a = createIng("Lait mixte", "ml", "", "aut"),
      b = createIng("lait mixte", "ml", "", "aut");
    S.rec[S.cur].ing[a] = SEC.map(() => 10);
    S.rec[S.cur].ing[b] = SEC.map(() => 0);
    S.rec[S.cur].fx = { ...(S.rec[S.cur].fx || {}), [b]: 500 };
    const err = fusionnerIng(a, b);
    return { err, a: !!ING[a], b: !!ING[b], fx: S.rec[S.cur].fx[b] };
  });
  expect(r.err).toContain("quantité unique");
  expect(r.a).toBe(true);
  expect(r.b).toBe(true);
  expect(r.fx).toBe(500);
});

test("deux onglets : le second à enregistrer ne remplace pas le travail du premier sans prévenir", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  const B = await page.context().newPage();
  B.on("dialog", (d) => d.accept());
  await B.goto(URL_APPLI);
  const nomEnregistre = () =>
    page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem("intendance2"));
      return p.camps[p.ccur].name;
    });
  // l'onglet A renomme le camp, enregistré tout de suite
  await page.locator("#cname").fill("Camp A");
  expect(await nomEnregistre()).toBe("Camp A");
  // B (qui ne le sait pas) est prévenu sans rien faire, et n'écrase pas
  await expect(B.locator("#warn")).toBeVisible();
  await expect(B.locator("#warnr")).toBeVisible();
  await B.locator("#cname").fill("Camp B");
  expect(await nomEnregistre()).toBe("Camp A");
  // « Recharger » reprend le travail de A
  await B.locator("#warnr").click();
  await expect(B.locator("#cname")).toHaveValue("Camp A");
  await expect(B.locator("#warn")).toBeHidden();
  // B enregistre normalement ensuite, et A est alors prévenu à son tour
  await B.locator("#cname").fill("Camp B");
  expect(await nomEnregistre()).toBe("Camp B");
  await expect(page.locator("#warn")).toBeVisible();
  // « Garder cet onglet » : A remplace ce que B avait écrit
  await page.locator("#warnk").click();
  await expect(page.locator("#warn")).toBeHidden();
  expect(await nomEnregistre()).toBe("Camp A");
  expect(erreurs).toEqual([]);
});

test("recettes : la poignée ⠿ d'un ingrédient change son ordre (clavier et glisser), et l'ordre est conservé", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  await aller(page, "rec");
  const ordre = () => page.evaluate(() => Object.keys(S.rec[S.cur].ing).join(","));
  const stocke = () =>
    page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem("intendance2"));
      return Object.keys(p.rec[S.cur].ing).join(",");
    });
  const avant = await ordre();
  const cles = avant.split(",");
  expect(cles.length).toBeGreaterThan(2);
  // clavier : le premier descend d'un cran, puis remonte
  await page.locator(`#rb .ih[data-ih="${cles[0]}"]`).focus();
  await page.keyboard.press("ArrowDown");
  expect((await ordre()).split(",").slice(0, 2)).toEqual([cles[1], cles[0]]);
  await page.locator(`#rb .ih[data-ih="${cles[0]}"]`).focus();
  await page.keyboard.press("ArrowUp");
  expect(await ordre()).toBe(avant);
  // glisser : le premier ingrédient prend la place du dernier
  await page.setViewportSize({ width: 1200, height: 2000 });
  const lignes = page.locator("#rb tr[data-rk]");
  const n = await lignes.count();
  const src = await lignes.first().locator(".ih").boundingBox();
  const dst = await lignes.nth(n - 1).boundingBox();
  await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
  await page.mouse.down();
  await page.mouse.move(dst.x + 100, dst.y + dst.height / 2, { steps: 8 });
  await page.mouse.up();
  const apres = (await ordre()).split(",");
  expect(apres[n - 1]).toBe(cles[0]);
  expect(apres.slice(0, n - 1)).toEqual(cles.slice(1));
  // permanent : enregistré, relu après rechargement, et dans les documents
  expect(await stocke()).toBe(apres.join(","));
  await page.reload();
  expect(await ordre()).toBe(apres.join(","));
  expect(erreurs).toEqual([]);
});

test("menu : chaque repas indique son effectif « (N pers.) », réduit ou non", async ({ page }) => {
  await ouvrir(page);
  await aller(page, "menu");
  const total = await page.evaluate(() => nn());
  const zones = page.locator(".dcard .zone");
  const n = await zones.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++)
    await expect(zones.nth(i).locator(".zp")).toHaveText(`(${total} pers.)`);
  await expect(page.locator(".zp.red")).toHaveCount(0);
});

test("recettes : le nom d'un ingrédient ouvre sa fiche (comme le catalogue), une seule à la fois", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  await aller(page, "rec");
  const cles = (await page.evaluate(() => Object.keys(S.rec[S.cur].ing))).slice(0, 2);
  // fermée par défaut : ni champs de modification, ni « quantité unique » sur la ligne
  await expect(page.locator("#rb .ced")).toHaveCount(0);
  await expect(page.locator("#rb [data-tg]")).toHaveCount(0);
  await page.locator(`#rb tr[data-rk="${cles[0]}"] .ib`).click();
  await expect(page.locator("#rb .ced")).toHaveCount(1);
  for (const champ of ["en", "eu", "ep", "eg", "ec"])
    await expect(page.locator(`#rb .ced [data-${champ}="${cles[0]}"]`)).toHaveCount(1);
  await expect(page.locator(`#rb .ced [data-tg="${cles[0]}"]`)).toHaveCount(1);
  await expect(page.locator(`#rb tr[data-rk="${cles[0]}"] .ib`)).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  // ouvrir un autre ingrédient ferme le premier
  await page.locator(`#rb tr[data-rk="${cles[1]}"] .ib`).click();
  await expect(page.locator("#rb .ced")).toHaveCount(1);
  await expect(page.locator(`#rb .ced [data-en="${cles[1]}"]`)).toHaveCount(1);
  // modifier le nom et le prix, valider : la fiche se referme, le nom change partout
  await page.locator(`#rb .ced [data-en="${cles[1]}"]`).fill("Nom modifié");
  await page.locator(`#rb .ced [data-ep="${cles[1]}"]`).fill("3.5");
  await page.locator(`#rb .ced [data-eok="${cles[1]}"]`).click();
  await expect(page.locator("#rb .ced")).toHaveCount(0);
  await expect(page.locator(`#rb tr[data-rk="${cles[1]}"] .ibt`)).toContainText("Nom modifié");
  expect(await page.evaluate((k) => [ING[k][0], S.prices[k]], cles[1])).toEqual([
    "Nom modifié",
    3.5,
  ]);
  // « Annuler » referme sans rien changer ; un second clic sur le nom referme aussi
  await page.locator(`#rb tr[data-rk="${cles[0]}"] .ib`).click();
  await page.locator(`#rb .ced [data-eno="${cles[0]}"]`).click();
  await expect(page.locator("#rb .ced")).toHaveCount(0);
  await page.locator(`#rb tr[data-rk="${cles[0]}"] .ib`).click();
  await page.locator(`#rb tr[data-rk="${cles[0]}"] .ib`).click();
  await expect(page.locator("#rb .ced")).toHaveCount(0);
  // le ✕ de la ligne retire toujours de la recette, sans supprimer l'ingrédient
  await expect(page.locator(`#rb tr[data-rk="${cles[0]}"] [data-rm]`)).toHaveCount(1);
  expect(erreurs).toEqual([]);
});

test("Nouveautés : une page entre Configuration et Sauvegarde, avec l'historique à jour", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  // place dans le menu : après Configuration, avant Sauvegarde
  const pages = await page
    .locator("#drawer .ni[data-g]")
    .evaluateAll((l) => l.map((x) => x.dataset.g));
  expect(pages.indexOf("nv")).toBe(pages.indexOf("cfg") + 1);
  expect(pages.indexOf("pj")).toBe(pages.indexOf("nv") + 1);
  await aller(page, "nv");
  await expect(page.locator("#ptitle")).toHaveText("Nouveautés");
  const versions = page.locator("#nvl details.nv");
  expect(await versions.count()).toBeGreaterThan(10);
  // la dernière version est celle de l'appli, dépliée ; les autres sont repliées
  const v = await page.evaluate(() => APP_VERSION);
  await expect(versions.first().locator("summary b")).toHaveText(v);
  await expect(versions.first()).toHaveAttribute("open", "");
  await expect(versions.nth(1)).not.toHaveAttribute("open", "");
  // une version repliée s'ouvre au clic
  await versions.nth(1).locator("summary").click();
  await expect(versions.nth(1).locator("li").first()).toBeVisible();
  // la plus ancienne remonte aux débuts
  await expect(versions.last().locator("summary b")).toHaveText("1.0.0 – 1.4.0");
  expect(erreurs).toEqual([]);
});

test("rayons : créer, renommer, réordonner et supprimer un rayon depuis le catalogue", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  await aller(page, "cat");
  await page.locator("#rygere").click();
  const lignes = page.locator("#ryl .ryr");
  const n0 = await lignes.count();
  expect(n0).toBe(9);
  // « Autre » ne peut pas être supprimé
  await expect(page.locator('#ryl [data-rx="aut"]')).toHaveCount(0);
  // créer : un nom vide ou déjà pris est refusé ; le nouveau rayon se place avant « Autre »
  await page.locator("#ryn").fill("  ");
  await page.locator("#ryok").click();
  await expect(page.locator("#rym")).toContainText("vide");
  await page.locator("#ryn").fill("epicerie & conserves");
  await page.locator("#ryok").click();
  await expect(page.locator("#rym")).toContainText("s'appelle déjà");
  await page.locator("#ryn").fill("Hygiène");
  await page.locator("#ryok").click();
  await expect(lignes).toHaveCount(n0 + 1);
  const id = await page.evaluate(() => CATS[CATS.length - 2][0]);
  expect(await page.evaluate(() => CATS[CATS.length - 2][1])).toBe("Hygiène");
  expect(await page.evaluate(() => CATS[CATS.length - 1][0])).toBe("aut");
  // proposé dans les listes de choix et dans le filtre du catalogue
  await expect(page.locator(`#crayon option[value="${id}"]`)).toHaveCount(1);
  await expect(page.locator(`#ingc option[value="${id}"]`)).toHaveCount(1);
  // renommer garde les produits : un ingrédient rangé dans « Hygiène » y reste
  const k = await page.evaluate((r) => {
    const k = Object.keys(ING)[0];
    S.cat[k] = r;
    calc();
    return k;
  }, id);
  await page.locator(`#ryl [data-rn="${id}"]`).fill("Hygiène & entretien");
  await page.locator(`#ryl [data-rn="${id}"]`).dispatchEvent("change");
  expect(await page.evaluate((k) => catOf(k), k)).toBe(id);
  await expect(page.locator(`#crayon option[value="${id}"]`)).toContainText("Hygiène & entretien");
  // réordonner : monter le rayon d'un cran
  const avant = await page.evaluate(() => CATS.map((c) => c[0]).join(","));
  await page.locator(`#ryl [data-ru="${id}"]`).click();
  const apres = await page.evaluate(() => CATS.map((c) => c[0]).join(","));
  expect(apres).not.toBe(avant);
  // enregistré avec le projet et conservé au rechargement
  await page.reload();
  expect(await page.evaluate(() => CATS.map((c) => c[0]).join(","))).toBe(apres);
  expect(await page.evaluate((id) => CATS.find((c) => c[0] === id)[1], id)).toBe(
    "Hygiène & entretien"
  );
  // supprimer : les produits vont dans le rayon choisi
  await aller(page, "cat");
  await page.locator("#rygere").click();
  await page.locator(`#ryl [data-rx="${id}"]`).click();
  await page.locator("#ryl [data-rv]").selectOption("boi");
  await page.locator(`#ryl [data-rxok="${id}"]`).click();
  expect(await page.evaluate((k) => catOf(k), k)).toBe("boi");
  expect(await page.evaluate((id) => CATS.some((c) => c[0] === id), id)).toBe(false);
  // tout supprimer et revenir à l'identique : plus rien d'enregistré
  expect(erreurs).toEqual([]);
});

test("rayons : un rayon par défaut supprimé transfère ses produits, et l'ordre suit la liste de courses", async ({
  page,
}) => {
  await ouvrir(page);
  const r = await page.evaluate(() => {
    const avant = Object.keys(ING).filter((k) => catOf(k) === "epi");
    const err = supprimerRayon("epi", "aut");
    return {
      err,
      avant: avant.length,
      apres: avant.filter((k) => catOf(k) === "aut").length,
      supprime: !CATS.some((c) => c[0] === "epi"),
      err2: supprimerRayon("aut", "fl"),
    };
  });
  expect(r.err).toBe("");
  expect(r.avant).toBeGreaterThan(0);
  expect(r.apres).toBe(r.avant);
  expect(r.supprime).toBe(true);
  expect(r.err2).toContain("ne peut pas");
  // la liste de courses suit l'ordre des rayons
  await page.evaluate(() => {
    deplacerRayon("lai", -1);
    calc();
  });
  await aller(page, "list");
  const titres = await page.locator("#list tr.grp").allTextContents();
  const i = titres.findIndex((t) => t.includes("Frais"));
  const j = titres.findIndex((t) => t.includes("Frigo"));
  if (i >= 0 && j >= 0) expect(i).toBeLessThan(j);
  // un rayon invalide dans un projet importé est ignoré, les produits reviennent à « Autre »
  const ok = await page.evaluate(() => {
    const c = cleanProject(
      JSON.parse(
        JSON.stringify({
          ...S,
          rayons: [
            ["x1", "Un"],
            ["x1", "Doublon"],
            ["", "Sans id"],
          ],
          cat: { lait: "x1", pain: "fl" },
        })
      )
    );
    return [c.rayons.map((r) => r[0]).join(","), c.cat.lait, c.cat.pain];
  });
  expect(ok).toEqual(["x1,aut", "x1", undefined]);
});

test("régimes : les règles, les ingrédients et les substituts sont triés par ordre alphabétique", async ({
  page,
}) => {
  const erreurs = await ouvrir(page);
  await aller(page, "reg");
  const r = await page.evaluate(() => {
    const noms = Object.keys(ING).map((k) => ING[k][0]);
    const tries = (l) => l.every((x, i) => !i || l[i - 1].localeCompare(x, "fr") <= 0);
    // règles ajoutées dans le désordre
    const cles = Object.keys(ING)
      .filter((k) => !ING[k][4])
      .reverse()
      .slice(0, 4);
    DIETS.d_tri = { n: "Tri", ex: Object.fromEntries(cles.map((k) => [k, null])) };
    dcur = "d_tri";
    drawDietEd();
    const lignes = [...document.querySelectorAll("#drules tr")];
    const ingr = lignes.map((l) => l.querySelector("[data-ro] option:checked").textContent);
    const opts = (s) => [...s.options].map((o) => o.textContent).filter((t) => !t.startsWith("—"));
    return {
      nb: lignes.length,
      reglesTriees: tries(ingr),
      ingredientsTries: lignes.every((l) => tries(opts(l.querySelector("[data-ro]")))),
      substitutsTries: lignes.every((l) => tries(opts(l.querySelector("[data-rs]")))),
      retirerEnPremier: lignes[0].querySelector("[data-rs] option").textContent.startsWith("—"),
      total: noms.length,
    };
  });
  expect(r.nb).toBe(4);
  expect(r.reglesTriees).toBe(true);
  expect(r.ingredientsTries).toBe(true);
  expect(r.substitutsTries).toBe(true);
  expect(r.retirerEnPremier).toBe(true);
  // « + Ajouter une règle » : la règle apparaît à sa place alphabétique
  await page.evaluate(() => $("dradd").click());
  expect(
    await page.evaluate(() => {
      const l = [...document.querySelectorAll("#drules [data-ro] option:checked")].map(
        (o) => o.textContent
      );
      return l.every((x, i) => !i || l[i - 1].localeCompare(x, "fr") <= 0);
    })
  ).toBe(true);
  expect(erreurs).toEqual([]);
});
