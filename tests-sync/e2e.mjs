// Test de bout en bout de la synchronisation : deux intendants (administrateur et éditeur) et un lecteur, dans trois navigateurs,
// contre les émulateurs Firebase (authentification et base). Voir tests-sync/README.md pour le lancer.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
const ici = path.dirname(new URL(import.meta.url).pathname),
  ROOT = process.env.APP_ROOT || path.resolve(ici, ".."),
  BUNDLE = process.env.BUNDLE || path.join(ici, "bundle.js"),
  PORT = 4173;
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(ROOT, "node_modules", "@playwright", "test"));
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/json",
};
const srv = http
  .createServer((q, r) => {
    const u = decodeURIComponent(q.url.split("?")[0]);
    const f = u === "/__fb/bundle.js" ? BUNDLE : path.join(ROOT, u === "/" ? "index.html" : u);
    fs.readFile(f, (e, d) => {
      if (e) {
        r.writeHead(404);
        return r.end();
      }
      r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
      r.end(d);
    });
  })
  .listen(PORT);

const ok = [],
  ko = [];
const verifier = (nom, cond, detail) => {
  (cond ? ok : ko).push(nom);
  console.log(
    (cond ? "OK   " : "ECHEC") + " " + nom + (cond ? "" : "  -> " + JSON.stringify(detail))
  );
};

const env = await initializeTestEnvironment({ projectId: "patro-intendance-test" });
const adm = async (fn) => {
  let r;
  await env.withSecurityRulesDisabled(async (c) => {
    r = await fn(c.firestore());
  });
  return r;
};

const browser = await chromium.launch();
const URLAPP = `http://localhost:${PORT}/index.html`;
const SDK = "https://www.gstatic.com/firebasejs/11.0.2/";

async function ouvrir(email) {
  const ctx = await browser.newContext({ serviceWorkers: "block" });
  await ctx.route(SDK + "*.js", (r) =>
    r.fulfill({
      contentType: "application/javascript",
      body: `export * from "http://localhost:${PORT}/__fb/bundle.js";`,
    })
  );
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") erreurs.push("console: " + m.text());
  });
  page.on("dialog", (d) => d.accept());
  await page.goto(URLAPP);
  const uid = await page.evaluate(async (email) => {
    const { auth, a } = await cloudCharger();
    const cred = await auth.signInWithCredential(
      a,
      auth.GoogleAuthProvider.credential(
        JSON.stringify({ sub: email, email, email_verified: true })
      )
    );
    return cred.user.uid;
  }, email);
  return { ctx, page, uid, erreurs };
}

const attendre = (page, expr, arg, t = 20000) => page.waitForFunction(expr, arg, { timeout: t });
const distant = (chemin) =>
  adm(async (db) => {
    const d = await getDoc(doc(db, chemin));
    return d.exists() ? d.data() : null;
  });

try {
  const A = await ouvrir("a@x.be"),
    B = await ouvrir("b@x.be"),
    L = await ouvrir("l@x.be");
  await adm((db) => setDoc(doc(db, "groupes/g1"), { nom: "Test" }));
  for (const [u, role, mail] of [
    [A, "admin", "a@x.be"],
    [B, "editeur", "b@x.be"],
    [L, "lecteur", "l@x.be"],
  ]) {
    await adm((db) => setDoc(doc(db, `groupes/g1/membres/${u.uid}`), { role, email: mail }));
    await adm((db) => setDoc(doc(db, `utilisateurs/${u.uid}/groupes/g1`), { role, nom: "Test" }));
    await u.page.evaluate(() => grCharger());
  }
  await A.page.evaluate(() => grCharger());
  verifier(
    "A voit son groupe",
    await A.page.evaluate(() => grEtat.groupes.length === 1 && grEtat.courant === "g1")
  );

  // 1. A envoie son projet
  await A.page.evaluate(() => {
    C.notes = "note initiale";
    save();
  });
  await A.page.evaluate(() => syncEnvoyerProjet("g1", "Test"));
  await attendre(A.page, () => syncStatut === "ok");
  const nbCamps = await A.page.evaluate(() => Object.keys(S.camps).length);
  const cat = await distant("groupes/g1/catalogue/main");
  verifier(
    "A : catalogue envoyé en version 1",
    cat && cat.version === 1 && typeof cat.data === "string",
    cat && cat.version
  );
  const campsDist = await adm((db) => getDocs(collection(db, "groupes/g1/camps")));
  verifier(
    "A : un document par camp",
    campsDist.size === nbCamps && campsDist.docs.every((d) => d.data().version === 1),
    campsDist.size
  );

  // 2. B charge le projet du groupe (la page se recharge)
  await B.page.evaluate(() => syncChargerGroupe("g1", "Test", true));
  await B.page.waitForLoadState("load");
  await attendre(
    B.page,
    () => typeof cloudUser !== "undefined" && cloudUser && syncStatut === "ok",
    null,
    30000
  );
  const mA = await A.page.evaluate(() =>
    JSON.stringify(morceauxProjet(cleanProject(JSON.parse(JSON.stringify(S)))))
  );
  const mB = await B.page.evaluate(() =>
    JSON.stringify(morceauxProjet(cleanProject(JSON.parse(JSON.stringify(S)))))
  );
  verifier("B : mêmes données que A après chargement", mA === mB);
  verifier(
    "B : statut synchronisé, rien à renvoyer",
    await B.page.evaluate(() => syncStatut === "ok" && !syncSale)
  );
  await B.page.waitForTimeout(3000);
  const v1 = await distant("groupes/g1/catalogue/main");
  verifier(
    "B : le chargement n'a pas fabriqué de version (catalogue toujours v1)",
    v1.version === 1,
    v1.version
  );

  // 3. B modifie, A est prévenu
  await B.page.evaluate(() => {
    C.notes = "note de B";
    save();
  });
  await attendre(B.page, () => syncStatut === "ok" && !syncSale);
  const camp = async () => {
    const k = await A.page.evaluate(() => S.ccur);
    return [k, await distant(`groupes/g1/camps/${k}`)];
  };
  let [k, c] = await camp();
  verifier(
    "B : camp envoyé en version 2 avec sa note",
    c.version === 2 && JSON.parse(c.data).notes === "note de B",
    c && c.version
  );
  await attendre(A.page, () => syncStatut === "maj");
  verifier(
    "A : prévenu d'une version plus récente (bandeau et bouton Charger)",
    await A.page.evaluate(() => !$("warn").hidden && !$("warng").hidden && $("warnm").hidden)
  );
  await A.page.click("#warng");
  await A.page.waitForLoadState("load");
  await attendre(
    A.page,
    () => typeof cloudUser !== "undefined" && cloudUser && syncStatut === "ok",
    null,
    30000
  );
  verifier(
    "A : a la note de B après chargement",
    await A.page.evaluate(() => C.notes === "note de B")
  );

  // 4. conflit : A envoie, B (pas à jour) modifie
  await A.page.evaluate(() => {
    C.notes = "note de A";
    save();
  });
  await attendre(A.page, () => syncStatut === "ok" && !syncSale);
  await attendre(B.page, () => syncStatut === "maj");
  await B.page.evaluate(() => {
    C.notes = "note de B2";
    save();
  });
  await attendre(B.page, () => syncStatut === "conflit");
  verifier(
    "B : conflit signalé, bandeau avec les deux choix",
    await B.page.evaluate(() => !$("warn").hidden && !$("warng").hidden && !$("warnm").hidden)
  );
  [k, c] = await camp();
  verifier(
    "conflit : la version de A n'est pas écrasée",
    JSON.parse(c.data).notes === "note de A" && c.version === 3,
    c.version
  );
  await B.page.click("#warnm");
  await attendre(B.page, () => syncStatut === "ok" && !syncSale);
  [k, c] = await camp();
  verifier(
    "B garde sa version : le groupe a la note de B2 (v4)",
    JSON.parse(c.data).notes === "note de B2" && c.version === 4,
    [c.version, JSON.parse(c.data).notes]
  );

  // 5. nouveau camp puis suppression (marque de suppression)
  await B.page.evaluate(() => {
    S.camps.cx1 = JSON.parse(JSON.stringify(C));
    S.camps.cx1.name = "Camp 2";
    save();
  });
  await attendre(B.page, () => syncStatut === "ok" && !syncSale);
  let cx = await distant("groupes/g1/camps/cx1");
  verifier("nouveau camp envoyé", cx && cx.version === 1 && !cx.supprime);
  await B.page.evaluate(() => {
    delete S.camps.cx1;
    save();
  });
  await attendre(B.page, () => syncStatut === "ok" && !syncSale);
  cx = await distant("groupes/g1/camps/cx1");
  verifier(
    "camp supprimé : marqué supprimé (v2), pas effacé",
    cx && cx.version === 2 && cx.supprime === true,
    cx
  );
  await B.page.waitForTimeout(1500);
  verifier(
    "B : pas de fausse alerte après sa propre suppression",
    await B.page.evaluate(() => syncStatut === "ok")
  );

  // 6. lecteur : charge, modifie, rien n'est envoyé
  await L.page.evaluate(() => syncChargerGroupe("g1", "Test", true));
  await L.page.waitForLoadState("load");
  await attendre(
    L.page,
    () => typeof cloudUser !== "undefined" && cloudUser && syncStatut === "lecture",
    null,
    30000
  );
  await L.page.evaluate(() => {
    C.notes = "modif du lecteur";
    save();
  });
  await L.page.waitForTimeout(3500);
  [k, c] = await camp();
  verifier(
    "lecteur : statut lecture seule et rien envoyé",
    (await L.page.evaluate(() => syncStatut === "lecture")) &&
      JSON.parse(c.data).notes === "note de B2"
  );

  // 7. hors ligne puis retour
  await B.ctx.setOffline(true);
  await B.page.evaluate(() => {
    C.notes = "écrit hors ligne";
    save();
  });
  await attendre(B.page, () => syncStatut === "horsligne", null, 40000);
  verifier(
    "B hors ligne : statut hors ligne, modification gardée en local",
    await B.page.evaluate(
      () => syncStatut === "horsligne" && C.notes === "écrit hors ligne" && syncSale
    )
  );
  await B.ctx.setOffline(false);
  await B.page.evaluate(() => syncProgrammer(200));
  await attendre(B.page, () => syncStatut === "ok" && !syncSale, null, 40000);
  [k, c] = await camp();
  verifier(
    "B de retour en ligne : la modification hors ligne est envoyée",
    JSON.parse(c.data).notes === "écrit hors ligne",
    JSON.parse(c.data).notes
  );

  // 8. rechargement de B : l'état de synchronisation est retrouvé sans renvoi inutile
  await B.page.reload();
  await attendre(
    B.page,
    () => typeof cloudUser !== "undefined" && cloudUser && syncStatut === "ok",
    null,
    30000
  );
  await B.page.waitForTimeout(2500);
  const vFin = await distant("groupes/g1/catalogue/main");
  verifier(
    "rechargement : aucune version fabriquée (catalogue inchangé)",
    vFin.version === (await distant("groupes/g1/catalogue/main")).version &&
      (await B.page.evaluate(() => !syncSale))
  );

  // 9. historique : une version gardée par morceau au premier envoi, pas à chaque modification
  const histo = (cle) =>
    adm(async (db) =>
      (await getDocs(collection(db, "groupes/g1/historique"))).docs
        .map((d) => d.data())
        .filter((d) => !cle || d.cle === cle)
    );
  const cleCampA = "c:" + (await A.page.evaluate(() => S.ccur));
  let hc = await histo(cleCampA);
  verifier(
    "historique : une version du camp gardée au premier envoi",
    hc.length >= 1 && hc.some((x) => x.version === 1),
    hc.length
  );
  verifier("historique : une version du catalogue gardée", (await histo("cat")).length >= 1);
  const avant = (await histo(cleCampA)).length;
  await B.page.evaluate(() => {
    C.notes = "modif rapide 1";
    save();
  });
  await attendre(B.page, () => syncStatut === "ok" && !syncSale);
  await B.page.evaluate(() => {
    C.notes = "modif rapide 2";
    save();
  });
  await attendre(B.page, () => syncStatut === "ok" && !syncSale);
  verifier(
    "historique : deux modifications rapprochées ne gardent pas de nouvelle version",
    (await histo(cleCampA)).length === avant,
    [avant, (await histo(cleCampA)).length]
  );

  // 10. élagage : au plus 20 versions par morceau
  for (let i = 0; i < 22; i++) {
    await B.page.evaluate((i) => {
      syncLien().hs = {};
      C.notes = "version " + i;
      save();
    }, i);
    await attendre(B.page, () => syncStatut === "ok" && !syncSale);
  }
  await B.page.waitForTimeout(2500);
  hc = await histo(cleCampA);
  verifier("historique : 20 versions au plus pour un camp", hc.length === 20, hc.length);
  verifier(
    "historique : les plus récentes sont conservées",
    hc.some((x) => JSON.parse(x.data).notes === "version 21") &&
      !hc.some((x) => JSON.parse(x.data).notes === "version 0")
  );

  // 11. retour arrière : A remet une ancienne version du camp
  await A.page.evaluate(() => syncChargerGroupe("g1", "Test", true));
  await A.page.waitForLoadState("load");
  await attendre(
    A.page,
    () => typeof cloudUser !== "undefined" && cloudUser && syncStatut === "ok",
    null,
    30000
  );
  await A.page.evaluate((cle) => hiVoir(cle), cleCampA);
  await attendre(A.page, () => hiEtat.versions && hiEtat.versions.liste.length > 5);
  const cible = await A.page.evaluate(
    () =>
      hiEtat.versions.liste.find((v) => JSON.parse(hiEtat.donnees[v.id]).notes === "version 10").id
  );
  await A.page.evaluate((id) => hiRetour(id), cible);
  await A.page.waitForLoadState("load");
  await attendre(
    A.page,
    () => typeof cloudUser !== "undefined" && cloudUser && syncStatut === "ok",
    null,
    30000
  );
  verifier(
    "retour arrière : A a retrouvé la version 10 sur son appareil",
    await A.page.evaluate(() => C.notes === "version 10")
  );
  await attendre(A.page, () => !syncSale);
  await A.page.waitForTimeout(3000);
  [k, c] = await camp();
  verifier(
    "retour arrière : le groupe a reçu la version 10 comme nouvelle version",
    JSON.parse(c.data).notes === "version 10" && c.version > 10,
    [c.version, JSON.parse(c.data).notes]
  );
  hc = await histo(cleCampA);
  verifier(
    "retour arrière : l'état d'avant est gardé (annulation possible)",
    hc.some((x) => x.note === "Avant retour arrière" && JSON.parse(x.data).notes === "version 21"),
    hc.map((x) => x.note)
  );

  // 12. camp supprimé : restauration
  await A.page.evaluate(() => {
    S.camps.cx2 = JSON.parse(JSON.stringify(C));
    S.camps.cx2.name = "Camp à retrouver";
    S.camps.cx2.notes = "précieux";
    save();
  });
  await attendre(A.page, () => syncStatut === "ok" && !syncSale);
  await A.page.evaluate(() => {
    delete S.camps.cx2;
    save();
  });
  await attendre(A.page, () => syncStatut === "ok" && !syncSale);
  await A.page.evaluate(() => hiVoir("cat"));
  await attendre(A.page, () => hiEtat.supprimes.some((x) => x.nom === "Camp à retrouver"));
  const idSup = await A.page.evaluate(
    () => hiEtat.supprimes.find((x) => x.nom === "Camp à retrouver").id
  );
  verifier("camp supprimé : proposé à la restauration avec son nom", !!idSup);
  await A.page.evaluate((id) => hiRestaurer(id), idSup);
  await A.page.waitForLoadState("load");
  await attendre(
    A.page,
    () => typeof cloudUser !== "undefined" && cloudUser && syncStatut === "ok",
    null,
    30000
  );
  await attendre(A.page, () => !syncSale);
  await A.page.waitForTimeout(2500);
  verifier(
    "camp restauré : présent sur l'appareil avec son contenu",
    await A.page.evaluate(() => S.camps.cx2 && S.camps.cx2.notes === "précieux")
  );
  cx = await distant("groupes/g1/camps/cx2");
  verifier(
    "camp restauré : de nouveau présent dans le groupe (plus marqué supprimé)",
    cx && !cx.supprime && JSON.parse(cx.data).notes === "précieux",
    cx && [cx.version, cx.supprime]
  );

  // 13. renommer le groupe, puis le quitter
  verifier(
    "synchronisation : la date du dernier envoi est mémorisée",
    await A.page.evaluate(() => typeof syncLien().dernier === "number")
  );
  await attendre(A.page, () => !!$("grren"));
  await A.page.evaluate(() => {
    $("grren").value = "Test renommé";
    return grRenommer();
  });
  const grp = await distant("groupes/g1");
  verifier("renommer : le groupe porte son nouveau nom", grp.nom === "Test renommé", grp.nom);
  const miroirB = await distant(`groupes/g1/membres/${B.uid}`);
  const copieB = await adm(async (db) =>
    (await getDoc(doc(db, `utilisateurs/${B.uid}/groupes/g1`))).data()
  );
  verifier(
    "renommer : la copie « mes groupes » d'un membre suit",
    copieB.nom === "Test renommé" && miroirB.role === "editeur",
    copieB
  );
  await A.page.evaluate(() => grQuitter());
  verifier(
    "quitter : le seul administrateur ne peut pas partir",
    (await A.page.evaluate(() => $("grmsg").textContent.includes("au moins un administrateur"))) &&
      !!(await distant(`groupes/g1/membres/${A.uid}`))
  );
  await L.page.evaluate(() => grQuitter());
  await attendre(L.page, () => grEtat.groupes.length === 0);
  verifier(
    "quitter : la fiche du membre et sa copie sont supprimées",
    !(await distant(`groupes/g1/membres/${L.uid}`)) &&
      !(await distant(`utilisateurs/${L.uid}/groupes/g1`))
  );
  verifier(
    "quitter : la synchronisation de cet appareil s'arrête",
    await L.page.evaluate(() => syncLien() === null && syncStatut === "off")
  );
  for (const u of [A, B, L]) {
    const e = u.erreurs.filter((x) => !/net::ERR|favicon/.test(x));
    if (e.length) console.log("erreurs page:", e);
  }
} catch (e) {
  console.log("EXCEPTION", e);
  ko.push("exception");
} finally {
  await browser.close();
  srv.close();
  await env.cleanup();
  console.log(`\n${ok.length} réussis, ${ko.length} en échec`);
  process.exit(ko.length ? 1 : 0);
}
