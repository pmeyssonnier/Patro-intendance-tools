const { test, expect } = require("@playwright/test");
const { ouvrir, aller, telecharger, importer, montant, deplierRegime } = require("./helpers");

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
  expect(liens.length).toBe(18);
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
    .locator(".zx")
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
  await page.locator('button[data-tg="pain"]').click();
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
  expect(lignes[0]).toBe("Produit;Quantité;Unité;Prix unitaire (€);Prix par;Coût (€);Remarque");
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
  await page.setViewportSize({ width: 390, height: 380 });
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
  await page.locator(".dcard").first().locator("summary").click();
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
