/* Intendance PSS – Historique et retour arrière (Firebase) : versions gardées par le groupe pour chaque camp et pour le catalogue.
   Le groupe garde une version toutes les 10 minutes au plus (et le dernier contenu d'un camp supprimé), 20 par morceau.
   Revenir en arrière ne supprime rien : l'état actuel est d'abord gardé, puis la version choisie est remise sur cet appareil
   et envoyée comme une modification ordinaire (nouvelle version du groupe).
   Script classique : chargé avant cloud.js, mais n'utilise ses fonctions qu'après le démarrage (voir l'ordre dans index.html). */

// état de la section « Historique » : morceau regardé, versions lues (avec leur contenu) et camps supprimés
let hiEtat = { cle: "cat", versions: null, donnees: {}, supprimes: [] };

/** Auteur lisible d'une version : l'adresse du membre si on la connaît. */
const hiAuteur = (uid) => (grEtat.membres.find((m) => m.uid === uid) || {}).email || "un membre";

/** Contenu de la section « Historique » de la carte « Mon groupe ». */
function histResume() {
  const choix = [{ cle: "cat", nom: "Catalogue du groupe (recettes, prix, régimes…)" }];
  for (const [id, c] of Object.entries(S.camps))
    choix.push({ cle: cleCamp(id), nom: "Camp : " + c.name });
  const cle = choix.some((c) => c.cle === hiEtat.cle) ? hiEtat.cle : "cat",
    g = grEtat.groupes.find((x) => x.id === grEtat.courant);
  return {
    choix,
    cle,
    versions: hiEtat.versions && hiEtat.versions.cle === cle ? hiEtat.versions.liste : null,
    supprimes: hiEtat.supprimes,
    ecriture: !!g && (g.role === "admin" || g.role === "editeur"),
  };
}

/** Lit les versions gardées d'un morceau (les plus récentes d'abord) et les camps supprimés dont le groupe garde le dernier contenu. */
async function hiVoir(cle) {
  const l = syncLien();
  if (!l || !cloudUser) return;
  try {
    const { fs, db } = await cloudBase(),
      col = fs.collection(db, "groupes", l.g, "historique"),
      [v, f] = await Promise.all([
        fs.getDocs(fs.query(col, fs.where("cle", "==", cle))),
        fs.getDocs(fs.query(col, fs.where("fin", "==", true))),
      ]);
    hiEtat.cle = cle;
    hiEtat.donnees = {};
    const liste = v.docs
      .map((d) => {
        hiEtat.donnees[d.id] = d.data().data;
        return {
          id: d.id,
          le: d.data().le,
          par: hiAuteur(d.data().par),
          note: d.data().note || "",
        };
      })
      .sort((a, b) => b.le - a.le);
    hiEtat.versions = { cle, liste };
    // un camp supprimé : on garde la plus récente copie « avant suppression » de chaque camp absent de cet appareil
    const vus = new Set();
    hiEtat.supprimes = [];
    for (const d of f.docs.sort((a, b) => b.data().le - a.data().le)) {
      const k = d.data().cle;
      if (vus.has(k) || Object.hasOwn(S.camps, k.slice(2))) continue;
      vus.add(k);
      hiEtat.donnees[d.id] = d.data().data;
      let nom = k;
      try {
        nom = JSON.parse(d.data().data).name || k;
      } catch (_) {
        /* contenu illisible : on garde l'identifiant comme nom */
      }
      hiEtat.supprimes.push({ id: d.id, cle: k, nom, le: d.data().le });
    }
    grAfficher();
  } catch (e) {
    grErreur(e);
  }
}

/** Ne garde que les 20 versions les plus récentes d'un morceau. */
async function hiElaguer(groupe, cle) {
  const { fs, db } = await cloudBase(),
    r = await fs.getDocs(
      fs.query(fs.collection(db, "groupes", groupe, "historique"), fs.where("cle", "==", cle))
    ),
    sup = aElaguer(r.docs.map((d) => ({ id: d.id, le: d.data().le })));
  if (!sup.length) return;
  const b = fs.writeBatch(db);
  for (const id of sup) b.delete(fs.doc(db, "groupes", groupe, "historique", id));
  await b.commit();
}

/** Garde l'état actuel d'un morceau dans l'historique (avant de le remplacer). */
async function hiGarderMaintenant(cle, note) {
  const l = syncLien(),
    texte = syncMorceaux()[cle];
  if (!l || texte === undefined) return;
  const { fs, db } = await cloudBase(),
    le = Date.now();
  await fs.setDoc(fs.doc(db, "groupes", l.g, "historique", idHistorique(cle, le, cloudUser.uid)), {
    cle,
    version: l.v[cle] || 0,
    data: texte,
    par: cloudUser.uid,
    le,
    note,
  });
}

/** Écrit le projet reconstruit sur l'appareil (avec copie de secours) et recharge : la page l'enverra comme une modification ordinaire. */
function hiAppliquer(projet) {
  const c = cleanProject(projet);
  conflitOnglet = true; // plus aucun enregistrement local jusqu'au rechargement
  const avant = syncLs("intendance2");
  if (avant) syncLs(SYNC_COPIE, avant);
  syncLs("intendance2", JSON.stringify(c));
  location.reload();
}

/** Remet une version gardée (catalogue ou camp) sur cet appareil. */
async function hiRetour(id) {
  const v = (hiEtat.versions || { liste: [] }).liste.find((x) => x.id === id),
    cle = hiEtat.versions && hiEtat.versions.cle;
  if (!v || !cle) return;
  const quand = new Date(v.le).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" });
  if (
    !confirm(
      "Revenir à la version du " +
        quand +
        " ? L'état actuel est d'abord gardé dans l'historique, et la version choisie sera envoyée au groupe comme une nouvelle version."
    )
  )
    return;
  try {
    await hiGarderMaintenant(cle, "Avant retour arrière");
    const local = cleanProject(JSON.parse(JSON.stringify(S))),
      data = hiEtat.donnees[id];
    if (cle === "cat") {
      const camps = {};
      for (const [k, c] of Object.entries(local.camps)) camps[k] = JSON.stringify(c);
      hiAppliquer(projetDepuisGroupe(data, camps, local));
    } else {
      local.camps[cle.slice(2)] = JSON.parse(data);
      hiAppliquer(local);
    }
  } catch (e) {
    grErreur(e);
  }
}

/** Remet un camp supprimé sur cet appareil ; il sera renvoyé au groupe (qui le marquera de nouveau présent). */
async function hiRestaurer(id) {
  const s = hiEtat.supprimes.find((x) => x.id === id),
    l = syncLien();
  if (!s || !l) return;
  if (!confirm("Restaurer le camp « " + s.nom + " » ? Il sera de nouveau partagé avec le groupe."))
    return;
  try {
    // on adopte le numéro de version actuel de ce camp dans le groupe, pour que son renvoi ne soit pas pris pour un conflit
    const { fs, db } = await cloudBase(),
      cur = await fs.getDoc(fs.doc(db, "groupes", l.g, "camps", s.cle.slice(2)));
    l.v[s.cle] = cur.exists() ? cur.data().version : 0;
    delete l.h[s.cle];
    syncPoser(l);
    const local = cleanProject(JSON.parse(JSON.stringify(S)));
    local.camps[s.cle.slice(2)] = JSON.parse(hiEtat.donnees[id]);
    hiAppliquer(local);
  } catch (e) {
    grErreur(e);
  }
}
