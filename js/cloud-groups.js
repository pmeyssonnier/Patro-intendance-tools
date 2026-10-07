/* Intendance PSS – Mon groupe (Firebase) : groupes, membres et invitations.
   Lit et écrit dans Firestore ; les règles de sécurité (firestore.rules) décident de ce que chacun a le droit de faire.
   Script classique : chargé avant cloud.js, mais n'utilise ses fonctions qu'après le démarrage (voir l'ordre dans index.html). */

const GROUPE_CHOIX = "pss-cloud-groupe";

// état affiché dans la carte (voir htmlGroupes)
let grEtat = { groupes: [], courant: null, invitations: [], membres: [], attente: [] };

/** Message sous la carte « Mon groupe ». */
function grMessage(texte, erreur) {
  $("grmsg").textContent = texte;
  $("grmsg").classList.toggle("err", !!erreur);
}

const grErreur = (e) =>
  grMessage("Action impossible (" + (e && e.code ? e.code : "réseau") + ").", true);

/** Montre la carte quand quelqu'un est connecté, et la remplit. */
function drawGroupes() {
  $("grc").hidden = !cloudUser;
  if (!cloudUser) {
    grEtat = { groupes: [], courant: null, invitations: [], membres: [], attente: [] };
    syncArreter();
    return;
  }
  grCharger();
}

// numéro du dernier chargement lancé : une réponse arrivée en retard (d'un chargement plus ancien) est ignorée
let grSeq = 0;

/** Relit depuis Firestore : mes groupes, mes invitations, puis les membres du groupe choisi. */
async function grCharger(courant) {
  if (!cloudUser) return;
  const seq = ++grSeq;
  const uid = cloudUser.uid,
    mail = normMail(cloudUser.email);
  try {
    const { fs, db } = await cloudBase();
    const [mes, inv] = await Promise.all([
      fs.getDocs(fs.collection(db, "utilisateurs", uid, "groupes")),
      fs.getDocs(fs.query(fs.collection(db, "invitations"), fs.where("email", "==", mail))),
    ]);
    const groupes = mes.docs
        .map((d) => ({ id: d.id, nom: d.data().nom || d.id, role: d.data().role }))
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
      memo = courant || grEtat.courant || cloudLire(GROUPE_CHOIX),
      choisi = groupes.some((g) => g.id === memo) ? memo : groupes.length ? groupes[0].id : null;
    let membres = [],
      attente = [];
    if (choisi) {
      const g = groupes.find((x) => x.id === choisi),
        lect = [fs.getDocs(fs.collection(db, "groupes", choisi, "membres"))];
      if (g.role === "admin")
        lect.push(
          fs.getDocs(fs.query(fs.collection(db, "invitations"), fs.where("groupe", "==", choisi)))
        );
      const [m, a] = await Promise.all(lect);
      membres = m.docs
        .map((d) => ({ uid: d.id, email: d.data().email || "", role: d.data().role }))
        .sort((x, y) => x.email.localeCompare(y.email, "fr"));
      attente = a
        ? a.docs.map((d) => ({ id: d.id, email: d.data().email, role: d.data().role }))
        : [];
    }
    if (seq !== grSeq) return;
    cloudEcrire(GROUPE_CHOIX, choisi);
    grEtat = {
      groupes,
      courant: choisi,
      invitations: inv.docs.map((d) => ({
        id: d.id,
        groupe: d.data().groupe,
        nomGroupe: d.data().nomGroupe || d.data().groupe,
        role: d.data().role,
      })),
      membres,
      attente,
    };
    grAfficher();
    syncDemarrer();
  } catch (e) {
    grErreur(e);
  }
}

function grAfficher() {
  $("grbody").innerHTML = htmlGroupes({
    ...grEtat,
    moi: cloudUser.uid,
    superAdmin: normMail(cloudUser.email) === CLOUD.superAdmin,
    url: location.origin + location.pathname,
    sync: syncResume(),
    hist: histResume(),
  });
}

/** Crée un groupe (super-administrateur) et s'en fait administrateur, en une seule écriture. */
async function grCreer() {
  const nom = $("grnom").value.trim().replace(/\s+/g, " "),
    err = erreurNomGroupe(nom);
  if (err) return grMessage(err, true);
  try {
    const { fs, db } = await cloudBase(),
      id = fs.doc(fs.collection(db, "groupes")).id,
      b = fs.writeBatch(db);
    b.set(fs.doc(db, "groupes", id), { nom, creePar: cloudUser.uid, le: Date.now() });
    b.set(fs.doc(db, "groupes", id, "membres", cloudUser.uid), {
      role: "admin",
      email: normMail(cloudUser.email),
    });
    b.set(fs.doc(db, "utilisateurs", cloudUser.uid, "groupes", id), { role: "admin", nom });
    await b.commit();
    grMessage("Groupe « " + nom + " » créé.");
    await grCharger(id);
  } catch (e) {
    grErreur(e);
  }
}

/** Accepte une invitation reçue : devient membre avec le rôle prévu, puis supprime l'invitation. */
async function grRejoindre(idInv) {
  const inv = grEtat.invitations.find((i) => i.id === idInv);
  if (!inv) return;
  try {
    const { fs, db } = await cloudBase(),
      b = fs.writeBatch(db);
    b.set(fs.doc(db, "groupes", inv.groupe, "membres", cloudUser.uid), {
      role: inv.role,
      email: normMail(cloudUser.email),
    });
    b.set(fs.doc(db, "utilisateurs", cloudUser.uid, "groupes", inv.groupe), {
      role: inv.role,
      nom: inv.nomGroupe,
    });
    b.delete(fs.doc(db, "invitations", inv.id));
    await b.commit();
    grMessage("Tu as rejoint « " + inv.nomGroupe + " ».");
    await grCharger(inv.groupe);
  } catch (e) {
    grErreur(e);
  }
}

/** Invite une adresse dans le groupe affiché (administrateur). */
async function grInviter() {
  const g = grEtat.groupes.find((x) => x.id === grEtat.courant),
    mail = normMail($("grmail").value),
    role = $("grrole").value,
    err = erreurInvitation(mail, role, grEtat.membres, grEtat.attente);
  if (!g) return;
  if (err) return grMessage(err, true);
  try {
    const { fs, db } = await cloudBase();
    await fs.setDoc(fs.doc(db, "invitations", idInvitation(g.id, mail)), {
      groupe: g.id,
      nomGroupe: g.nom,
      email: mail,
      role,
      par: cloudUser.uid,
      le: Date.now(),
    });
    grMessage(
      "Invitation enregistrée pour " + mail + ". Utilise « Écrire l'invitation » pour la prévenir."
    );
    await grCharger(g.id);
  } catch (e) {
    grErreur(e);
  }
}

/** Renomme le groupe (administrateur) : sa fiche et la copie « mes groupes » de chaque membre. */
async function grRenommer() {
  const g = grEtat.groupes.find((x) => x.id === grEtat.courant),
    nom = $("grren").value.trim().replace(/\s+/g, " "),
    err = erreurNomGroupe(nom);
  if (!g) return;
  if (err) return grMessage(err, true);
  if (nom === g.nom) return;
  try {
    const { fs, db } = await cloudBase(),
      b = fs.writeBatch(db);
    b.update(fs.doc(db, "groupes", g.id), { nom });
    for (const m of grEtat.membres)
      b.set(fs.doc(db, "utilisateurs", m.uid, "groupes", g.id), { role: m.role, nom });
    await b.commit();
    grMessage("Groupe renommé en « " + nom + " ».");
    await grCharger(g.id);
  } catch (e) {
    grErreur(e);
  }
}

/** Quitte le groupe : la personne perd l'accès à ses camps (ils restent sur cet appareil). */
async function grQuitter() {
  const g = grEtat.groupes.find((x) => x.id === grEtat.courant),
    err = erreurDernierAdmin(grEtat.membres, cloudUser.uid);
  if (!g) return;
  if (err) return grMessage(err + " Nomme d'abord un autre administrateur.", true);
  if (
    !confirm(
      "Quitter le groupe « " +
        g.nom +
        " » ? Tu perdras l'accès à ses camps ; ceux de cet appareil restent."
    )
  )
    return;
  try {
    const { fs, db } = await cloudBase(),
      b = fs.writeBatch(db);
    b.delete(fs.doc(db, "groupes", g.id, "membres", cloudUser.uid));
    b.delete(fs.doc(db, "utilisateurs", cloudUser.uid, "groupes", g.id));
    await b.commit();
    const l = syncLien();
    if (l && l.g === g.id) {
      syncArreter();
      syncPoser(null);
    }
    grMessage("Tu as quitté « " + g.nom + " ».");
    await grCharger();
  } catch (e) {
    grErreur(e);
  }
}

async function grAnnuler(idInv) {
  try {
    const { fs, db } = await cloudBase();
    await fs.deleteDoc(fs.doc(db, "invitations", idInv));
    grMessage("Invitation annulée.");
    await grCharger();
  } catch (e) {
    grErreur(e);
  }
}

/** Change le rôle d'un membre (administrateur), sur sa fiche et sur sa copie « mes groupes ». */
async function grChangerRole(uid, role) {
  const err = erreurDernierAdmin(grEtat.membres, uid);
  if (err) {
    grMessage(err, true);
    return grAfficher();
  }
  const g = grEtat.groupes.find((x) => x.id === grEtat.courant),
    m = grEtat.membres.find((x) => x.uid === uid);
  if (!g || !m) return;
  try {
    const { fs, db } = await cloudBase(),
      b = fs.writeBatch(db);
    b.set(fs.doc(db, "groupes", g.id, "membres", uid), { role, email: m.email });
    b.set(fs.doc(db, "utilisateurs", uid, "groupes", g.id), { role, nom: g.nom });
    await b.commit();
    grMessage("Rôle modifié.");
    await grCharger();
  } catch (e) {
    grErreur(e);
  }
}

/** Retire un membre du groupe (administrateur). */
async function grRetirer(uid) {
  const err = erreurDernierAdmin(grEtat.membres, uid);
  if (err) return grMessage(err, true);
  const g = grEtat.groupes.find((x) => x.id === grEtat.courant);
  if (!g || !confirm("Retirer cette personne du groupe ?")) return;
  try {
    const { fs, db } = await cloudBase(),
      b = fs.writeBatch(db);
    b.delete(fs.doc(db, "groupes", g.id, "membres", uid));
    b.delete(fs.doc(db, "utilisateurs", uid, "groupes", g.id));
    await b.commit();
    grMessage("Membre retiré.");
    await grCharger();
  } catch (e) {
    grErreur(e);
  }
}

$("grc").onclick = (ev) => {
  const b = ev.target.closest("[data-gr]");
  if (!b) return;
  const a = b.dataset.gr;
  if (a === "creer") grCreer();
  else if (a === "rejoindre") grRejoindre(b.dataset.i);
  else if (a === "inviter") grInviter();
  else if (a === "annuler") grAnnuler(b.dataset.i);
  else if (a === "renommer") grRenommer();
  else if (a === "quitter") grQuitter();
  else if (a === "retirer") grRetirer(b.dataset.u);
  else if (a === "sync-envoyer" || a === "sync-charger") {
    const g = grEtat.groupes.find((x) => x.id === grEtat.courant);
    if (g)
      (a === "sync-envoyer" ? syncEnvoyerProjet : (i, n) => syncChargerGroupe(i, n, true))(
        g.id,
        g.nom
      );
  } else if (a === "sync-stop") syncArretLien();
  else if (a === "hi-voir") hiVoir($("hicle").value);
  else if (a === "hi-retour") hiRetour(b.dataset.i);
  else if (a === "hi-restaurer") hiRestaurer(b.dataset.i);
};

$("grc").onchange = (ev) => {
  const t = ev.target;
  if (t.id === "grsel") grCharger(t.value);
  else if (t.id === "hicle") hiVoir(t.value);
  else if (t.dataset.grrole) grChangerRole(t.dataset.grrole, t.value);
};
