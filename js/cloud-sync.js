/* Intendance PSS – Synchronisation avec le groupe (Firebase) : envoi des changements, réception, conflits.
   Les données restent d'abord sur l'appareil (le travail ne dépend jamais du réseau) ; ce module les envoie au groupe en tâche de fond.
   Un morceau = le catalogue du groupe (recettes, prix, ingrédients, régimes, sections…) ou un camp ; chacun porte un numéro de version
   qui avance de 1 à chaque envoi. Si quelqu'un d'autre a envoyé entre-temps, l'envoi est refusé et un bandeau demande de choisir :
   charger la version du groupe, ou garder la sienne. Rien n'est jamais fusionné ni écrasé sans que la personne l'ait choisi.
   Script classique : chargé avant cloud.js, mais n'utilise ses fonctions qu'après le démarrage (voir l'ordre dans index.html). */

const SYNC_CLE = "pss-sync",
  SYNC_COPIE = "intendance2_avant_groupe",
  SYNC_DELAI = 2000;

// lien de cet appareil avec un groupe : { g: groupe, uid, role, v: versions connues par morceau, h: empreintes envoyées ou reçues }
let syncMemo,
  syncStatut = "off", // off, ok, attente, conflit, maj, horsligne, lecture, erreur
  syncSale = false, // des changements locaux n'ont pas encore été envoyés
  syncGen = 0, // augmente à chaque enregistrement local (pour savoir si on a modifié pendant un envoi)
  syncMinuteur = null,
  syncEnCours = false,
  syncConflit = false, // un envoi a été refusé : une version plus récente existe dans le groupe
  syncDemarre = null,
  syncAbonnements = [],
  syncDistant = {}, // versions vues dans le groupe : clé -> { v, supprime }
  syncBandeauOn = false;

const syncLs = (k, v) => {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch (_) {
    /* stockage indisponible */
  }
  return null;
};

/** Lien enregistré sur cet appareil (null s'il n'y en a pas). */
function syncLien() {
  if (syncMemo === undefined) {
    try {
      const x = JSON.parse(syncLs(SYNC_CLE));
      syncMemo = x && x.g && x.uid && x.v && x.h ? x : null;
    } catch (_) {
      syncMemo = null;
    }
  }
  return syncMemo;
}

function syncPoser(lien) {
  syncMemo = lien;
  syncLs(SYNC_CLE, lien ? JSON.stringify(lien) : null);
}

const syncEcriture = () => {
    const l = syncLien();
    return !!l && (l.role === "admin" || l.role === "editeur");
  },
  syncPret = () => {
    const l = syncLien();
    return !!l && !!cloudUser && l.uid === cloudUser.uid && syncDemarre === l.uid + "|" + l.g;
  },
  syncHorsLigne = (e) => (e && e.code === "unavailable") || !navigator.onLine;

/** Morceaux du projet de cet appareil (voir sync-data.js). */
function syncMorceaux() {
  S.dd = DIETS;
  return morceauxProjet(cleanProject(JSON.parse(JSON.stringify(S))));
}

const SYNC_ETATS = {
  ok: ["☁️", "Synchronisé avec le groupe", "synchronisé"],
  attente: ["⏳", "Modifications en cours d'envoi au groupe", "envoi en cours"],
  conflit: ["⚠️", "Conflit avec le groupe : touche pour choisir", "conflit à résoudre"],
  maj: [
    "🔔",
    "Le groupe a une version plus récente : touche pour la charger",
    "version plus récente disponible",
  ],
  horsligne: [
    "📴",
    "Hors ligne : les modifications seront envoyées au retour du réseau",
    "hors ligne",
  ],
  lecture: ["👁️", "Lecture seule : tes changements ne sont pas envoyés au groupe", "lecture seule"],
  erreur: ["❌", "Synchronisation impossible", "erreur"],
};

/** Bandeau d'avertissement de la synchronisation (boutons : g = charger la version du groupe, m = garder la mienne). */
function syncBandeau(texte, boutons) {
  syncBandeauOn = !!texte;
  $("warnt").textContent = texte;
  $("warn").hidden = !texte;
  $("warnx").hidden = !!texte;
  $("warnr").hidden = $("warnk").hidden = true;
  $("warng").hidden = !texte || !boutons.includes("g");
  $("warnm").hidden = !texte || !boutons.includes("m");
  $("warnc").hidden = false;
}

function syncEffacerBandeau() {
  if (!syncBandeauOn) return;
  syncBandeau("", "");
}

function syncDefinir(statut) {
  syncStatut = statut;
  const e = SYNC_ETATS[statut],
    b = $("sync");
  b.hidden = !e;
  if (e) {
    b.textContent = e[0];
    b.title = e[1];
    b.setAttribute("aria-label", e[1]);
  }
  if (statut === "conflit")
    syncBandeau(
      "Une autre personne a modifié les données du groupe depuis ta dernière synchronisation. Charge sa version (une copie de secours de tes données reste sur cet appareil), ou garde la tienne pour remplacer la sienne.",
      "gm"
    );
  else if (statut === "maj")
    syncBandeau("Le groupe a une version plus récente que celle de cet appareil.", "g");
  else syncEffacerBandeau();
  if (cloudUser && !$("grc").hidden) grAfficher();
}

/** Texte et boutons de la carte « Mon groupe » pour le groupe affiché. */
function syncResume() {
  const l = syncLien(),
    g = grEtat.courant;
  return {
    liee: !!l && l.g === g,
    autre: !!l && l.g !== g,
    ecriture: grEtat.groupes.some(
      (x) => x.id === g && (x.role === "admin" || x.role === "editeur")
    ),
    texte: (SYNC_ETATS[syncStatut] || SYNC_ETATS.ok)[2],
    dernier: l && l.g === g ? l.dernier : undefined,
  };
}

/** Compare ce que le groupe a (versions vues) à ce que cet appareil connaît, et fixe l'état affiché. */
function syncEvaluer() {
  if (!syncPret() || syncEnCours) return;
  const l = syncLien(),
    plusRecent = Object.entries(syncDistant).some(
      ([k, d]) => d.v > (l.v[k] || 0) && !(d.supprime && !(k in l.v))
    );
  if (syncConflit || (plusRecent && syncSale)) syncDefinir("conflit");
  else if (plusRecent) syncDefinir("maj");
  else if (!syncEcriture()) syncDefinir("lecture");
  else syncDefinir(syncSale ? "attente" : "ok");
}

function syncProgrammer(delai) {
  clearTimeout(syncMinuteur);
  syncMinuteur = setTimeout(syncPousser, delai || SYNC_DELAI);
}

/** Appelé par save() à chaque enregistrement local. */
function syncApresSave() {
  if (!syncPret() || !syncEcriture()) return;
  syncGen++;
  syncSale = true;
  if (!syncConflit) syncProgrammer();
  syncEvaluer();
}

/** Envoie au groupe les morceaux qui ont changé, un par un, chacun seulement si personne d'autre n'y a touché. */
async function syncPousser() {
  if (!syncPret() || !syncEcriture() || syncEnCours || syncConflit) return;
  let morceaux;
  try {
    morceaux = syncMorceaux();
  } catch (_) {
    return syncDefinir("erreur");
  }
  const trop = erreurTaille(morceaux);
  if (trop) {
    grMessage(trop, true);
    return syncDefinir("erreur");
  }
  const l = syncLien(),
    liste = morceauxAEnvoyer(morceaux, l.h);
  if (!liste.length) {
    syncSale = false;
    return syncEvaluer();
  }
  const gen = syncGen;
  syncEnCours = true;
  syncDefinir("attente");
  try {
    const { fs, db } = await cloudBase();
    for (const { cle, supprime } of liste) {
      const ref =
          cle === "cat"
            ? fs.doc(db, "groupes", l.g, "catalogue", "main")
            : fs.doc(db, "groupes", l.g, "camps", cle.slice(2)),
        attendue = l.v[cle] || 0,
        contenu = supprime ? { supprime: true, data: "" } : { data: morceaux[cle] },
        maintenant = Date.now(),
        garder = !supprime && doitGarder(l.hs, cle, maintenant);
      l.v[cle] = await fs.runTransaction(db, async (tx) => {
        const s = await tx.get(ref),
          reelle = s.exists() ? s.data().version : 0;
        if (reelle !== attendue)
          throw Object.assign(new Error("conflit"), { code: "sync/conflit" });
        const gardee = (version, data, plus) =>
          tx.set(
            fs.doc(db, "groupes", l.g, "historique", idHistorique(cle, maintenant, cloudUser.uid)),
            { cle, version, data, par: cloudUser.uid, le: maintenant, ...plus }
          );
        // un camp supprimé reste récupérable : on garde son dernier contenu avant de le marquer supprimé
        if (supprime && s.exists() && s.data().data)
          gardee(reelle, s.data().data, { fin: true, note: "Avant suppression" });
        if (garder) gardee(reelle + 1, morceaux[cle], {});
        tx.set(ref, { version: reelle + 1, ...contenu, par: cloudUser.uid, le: maintenant });
        return reelle + 1;
      });
      if (garder) {
        l.hs = { ...l.hs, [cle]: maintenant };
        hiElaguer(l.g, cle).catch(() => {});
      }
      if (supprime) delete l.h[cle];
      else l.h[cle] = empreinte(morceaux[cle]);
      syncPoser(l);
    }
    l.dernier = Date.now();
    syncPoser(l);
    syncSale = gen !== syncGen;
  } catch (e) {
    syncEnCours = false;
    if (e && e.code === "sync/conflit") {
      syncConflit = true;
      return syncDefinir("conflit");
    }
    if (syncHorsLigne(e)) {
      syncDefinir("horsligne");
      return syncProgrammer(30000);
    }
    grMessage("Synchronisation impossible (" + (e && e.code ? e.code : "réseau") + ").", true);
    return syncDefinir("erreur");
  }
  syncEnCours = false;
  if (syncSale) syncProgrammer();
  syncEvaluer();
}

/** Lit tout ce que le groupe a : { cat: { version, data } | null, camps: { id: { version, data } } } (camps supprimés exclus). */
async function syncTirer(groupe) {
  const { fs, db } = await cloudBase(),
    [c, k] = await Promise.all([
      fs.getDoc(fs.doc(db, "groupes", groupe, "catalogue", "main")),
      fs.getDocs(fs.collection(db, "groupes", groupe, "camps")),
    ]),
    camps = {},
    versions = {};
  for (const d of k.docs) {
    versions[cleCamp(d.id)] = d.data().version;
    if (!d.data().supprime) camps[d.id] = { version: d.data().version, data: d.data().data };
  }
  return {
    cat: c.exists() ? { version: c.data().version, data: c.data().data } : null,
    camps,
    versions,
  };
}

/** Remplace les données de cet appareil par celles du groupe, après avoir gardé une copie de secours, puis recharge la page. */
async function syncChargerGroupe(groupe, nomGroupe, confirmer) {
  if (!cloudUser) return;
  const g = grEtat.groupes.find((x) => x.id === groupe);
  if (
    confirmer &&
    !confirm(
      "Remplacer les données de cet appareil par celles du groupe « " +
        nomGroupe +
        " » ? Une copie de secours de tes données actuelles reste sur cet appareil."
    )
  )
    return;
  try {
    const r = await syncTirer(groupe);
    if (!r.cat)
      return grMessage("Le groupe n'a pas encore de données : envoie d'abord un projet.", true);
    const textes = {};
    for (const [id, c] of Object.entries(r.camps)) textes[id] = c.data;
    if (!Object.keys(textes).length)
      return grMessage("Le groupe n'a aucun camp pour le moment.", true);
    const local = cleanProject(JSON.parse(JSON.stringify(S))),
      projet = cleanProject(projetDepuisGroupe(r.cat.data, textes, local)),
      m = morceauxProjet(projet),
      v = { cat: r.cat.version },
      h = {};
    for (const k of Object.keys(m)) h[k] = empreinte(m[k]);
    for (const [k, n] of Object.entries(r.versions)) v[k] = n;
    // plus aucun enregistrement local jusqu'au rechargement, pour ne pas écraser ce qu'on écrit ici
    conflitOnglet = true;
    const avant = syncLs("intendance2");
    if (avant) syncLs(SYNC_COPIE, avant);
    syncLs("intendance2", JSON.stringify(projet));
    syncPoser({ g: groupe, uid: cloudUser.uid, role: g ? g.role : "lecteur", v, h });
    location.reload();
  } catch (e) {
    grErreur(e);
  }
}

/** Premier envoi : le groupe est vide, le projet de cet appareil devient celui du groupe. */
async function syncEnvoyerProjet(groupe, nomGroupe) {
  const g = grEtat.groupes.find((x) => x.id === groupe);
  if (!cloudUser || !g || !(g.role === "admin" || g.role === "editeur")) return;
  if (
    !confirm(
      "Envoyer le projet de cet appareil au groupe « " +
        nomGroupe +
        " » ? Les autres membres le recevront en le chargeant."
    )
  )
    return;
  try {
    const m = syncMorceaux(),
      trop = erreurTaille(m);
    if (trop) return grMessage(trop, true);
    const { fs, db } = await cloudBase(),
      existe = await fs.getDoc(fs.doc(db, "groupes", groupe, "catalogue", "main"));
    if (existe.exists())
      return grMessage(
        "Le groupe a déjà des données : charge-les plutôt que d'en envoyer d'autres.",
        true
      );
    syncPoser({ g: groupe, uid: cloudUser.uid, role: g.role, v: {}, h: {} });
    syncDemarre = null;
    await syncDemarrer();
    await syncPousser();
    grMessage("Projet envoyé au groupe « " + nomGroupe + " ».");
  } catch (e) {
    syncPoser(null);
    grErreur(e);
  }
}

/** « Garder ma version » : on adopte les numéros de version du groupe, puis tout ce qui diffère est renvoyé. */
async function syncGarderMaVersion() {
  const l = syncLien();
  if (
    !l ||
    !confirm(
      "Remplacer la version du groupe par celle de cet appareil ? Les changements de l'autre personne seront écrasés."
    )
  )
    return;
  try {
    const r = await syncTirer(l.g);
    l.v = { ...r.versions };
    if (r.cat) l.v.cat = r.cat.version;
    l.h = {};
    syncPoser(l);
    syncConflit = false;
    syncSale = true;
    await syncPousser();
  } catch (e) {
    grErreur(e);
  }
}

/** Arrête de synchroniser cet appareil : ses données restent, le groupe aussi. */
function syncArretLien() {
  if (
    !confirm(
      "Arrêter la synchronisation de cet appareil avec le groupe ? Tes données restent sur l'appareil."
    )
  )
    return;
  syncArreter();
  syncPoser(null);
  syncDefinir("off");
  if (cloudUser) grAfficher();
}

/** Coupe l'écoute et les envois (déconnexion ou arrêt de la synchronisation). */
function syncArreter() {
  clearTimeout(syncMinuteur);
  for (const f of syncAbonnements) f();
  syncAbonnements = [];
  syncDistant = {};
  syncDemarre = null;
  syncSale = syncConflit = syncEnCours = false;
  syncStatut = "off";
  $("sync").hidden = true;
  syncEffacerBandeau();
}

/** Suit les changements du groupe en direct. */
async function syncEcouter(groupe) {
  const { fs, db } = await cloudBase(),
    abo = (type) =>
      fs.onSnapshot(
        fs.collection(db, "groupes", groupe, type),
        (snap) => {
          if (snap.metadata.hasPendingWrites) return;
          for (const d of snap.docs)
            syncDistant[type === "catalogue" ? "cat" : cleCamp(d.id)] = {
              v: d.data().version,
              supprime: !!d.data().supprime,
            };
          syncEvaluer();
        },
        (e) => {
          grMessage(
            "Suivi du groupe impossible (" + (e && e.code ? e.code : "réseau") + ").",
            true
          );
          syncDefinir("erreur");
        }
      );
  syncAbonnements = [abo("catalogue"), abo("camps")];
}

/** Lance la synchronisation si cet appareil est lié à un groupe dont la personne connectée est membre. */
async function syncDemarrer() {
  const l = syncLien();
  if (!cloudUser || !l || l.uid !== cloudUser.uid) return syncArreter();
  const g = grEtat.groupes.find((x) => x.id === l.g);
  if (!g) return syncDefinir("erreur");
  if (l.role !== g.role) {
    l.role = g.role;
    syncPoser(l);
  }
  const cle = l.uid + "|" + l.g;
  if (syncDemarre !== cle) {
    syncDemarre = cle;
    await syncEcouter(l.g);
  }
  // changements faits hors connexion ou avant ce démarrage
  try {
    syncSale = syncEcriture() && morceauxAEnvoyer(syncMorceaux(), l.h).length > 0;
  } catch (_) {
    syncSale = false;
  }
  syncEvaluer();
  if (syncSale && !syncConflit) syncProgrammer(500);
}

$("warng").onclick = () => {
  const l = syncLien();
  if (l) syncChargerGroupe(l.g, (grEtat.groupes.find((x) => x.id === l.g) || {}).nom || "", true);
};

$("warnm").onclick = syncGarderMaVersion;

$("sync").onclick = () => {
  if (syncStatut === "conflit") syncDefinir("conflit");
  else if (syncStatut === "maj") syncDefinir("maj");
  else go("cfg");
};

addEventListener("online", () => {
  if (syncPret() && syncSale) syncProgrammer(500);
});
