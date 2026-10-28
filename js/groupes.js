/* Intendance PSS – Groupes : rôles, invitations et affichage de la carte « Mon groupe ».
   Données et texte seulement (aucun accès à la page ni à Firebase) : l'accès à la base est dans cloud-groups.js.
   Script classique : voir l'ordre de chargement dans index.html. */

const ROLES = [
  ["admin", "Administrateur"],
  ["editeur", "Éditeur"],
  ["lecteur", "Lecteur"],
];

const GROUPE_NOM_MAX = 80,
  MAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const roleNom = (r) => (ROLES.find((x) => x[0] === r) || [0, "?"])[1],
  normMail = (m) => String(m).trim().toLowerCase();

/** Identifiant d'une invitation : « groupe|adresse en minuscules » (les règles de sécurité le vérifient). */
const idInvitation = (g, mail) => g + "|" + normMail(mail);

/** Nombre d'administrateurs d'une liste de membres [{ uid, role }]. */
const nbAdmins = (membres) => membres.filter((m) => m.role === "admin").length;

/** Message d'erreur si `nom` ne convient pas comme nom de groupe, sinon "". */
function erreurNomGroupe(nom) {
  nom = String(nom).trim();
  if (!nom) return "Le nom du groupe ne peut pas être vide.";
  if (nom.length > GROUPE_NOM_MAX) return `Nom trop long (${GROUPE_NOM_MAX} caractères au plus).`;
  return "";
}

/** Message d'erreur si on ne peut pas inviter cette adresse (invalide, déjà membre ou déjà invitée), sinon "". */
function erreurInvitation(mail, role, membres, attente) {
  mail = normMail(mail);
  if (!MAIL_VALIDE.test(mail)) return "Adresse e-mail invalide.";
  if (!ROLES.some((r) => r[0] === role)) return "Rôle inconnu.";
  if (membres.some((m) => normMail(m.email || "") === mail))
    return "Cette personne est déjà membre.";
  if (attente.some((i) => normMail(i.email) === mail)) return "Cette adresse est déjà invitée.";
  return "";
}

/** Message d'erreur si ce membre ne peut pas changer de rôle ni être retiré (c'est le dernier administrateur), sinon "". */
function erreurDernierAdmin(membres, uid) {
  const m = membres.find((x) => x.uid === uid);
  return m && m.role === "admin" && nbAdmins(membres) < 2
    ? "Il faut au moins un administrateur dans le groupe."
    : "";
}

/** Lien « mailto » pour envoyer l'invitation avec son propre logiciel de messagerie. */
function lienMailInvitation(mail, nomGroupe, url) {
  const sujet = `Invitation : intendance de camp (${nomGroupe})`,
    texte =
      `Bonjour,\n\nTu es invité·e à rejoindre le groupe « ${nomGroupe} » dans l'outil d'intendance de camp.\n\n` +
      `1. Ouvre ${url}\n2. Va dans ⚙️ Configuration, carte « Compte en ligne ».\n` +
      `3. Connecte-toi avec cette adresse e-mail (${normMail(mail)}) : tu recevras un lien par e-mail.\n` +
      `4. Dans la carte « Mon groupe », touche « Rejoindre ».\n\nÀ bientôt !`;
  return `mailto:${encodeURIComponent(normMail(mail))}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(texte)}`;
}

/** Section « Synchronisation » de la carte pour le groupe affiché : s = { liee, autre, ecriture, texte }. */
function htmlSync(s) {
  if (!s) return "";
  let h = `<h3>Synchronisation</h3>`;
  if (s.liee)
    h += `<p class="s">Cet appareil est synchronisé avec ce groupe (${esc(s.texte)}).${s.dernier ? ` Dernier envoi : ${new Date(s.dernier).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" })}.` : ""} Les camps, recettes, prix et réglages du groupe sont partagés ; le logo reste sur l'appareil.</p><p><button class="x" data-gr="sync-stop">Arrêter la synchronisation</button></p>`;
  else if (s.autre)
    h += `<p class="s">Cet appareil est déjà synchronisé avec un autre groupe. Arrête d'abord cette synchronisation pour en choisir un autre.</p>`;
  else {
    h += `<p class="s">Pour l'instant, tes camps, recettes et prix ne sont que sur cet appareil. ${s.ecriture ? "Envoie ton projet si le groupe n'a encore rien, ou charge celui du groupe (il remplace les données de cet appareil, dont une copie de secours est gardée)." : "Charge le projet du groupe pour le consulter (lecture seule)."}</p><p>`;
    if (s.ecriture)
      h += `<button class="x" data-gr="sync-envoyer">⬆️ Envoyer mon projet au groupe</button> `;
    h += `<button class="x" data-gr="sync-charger">⬇️ Charger le projet du groupe</button></p>`;
  }
  return h;
}

/** Section « Historique » : h = { choix: [{ cle, nom }], cle, versions: [{ id, le, par, note }] | null, supprimes: [{ id, nom, le }], ecriture }. */
function htmlHistorique(h) {
  if (!h) return "";
  const quand = (le) =>
    new Date(le).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" });
  let x = `<h3>Historique</h3><p class="s">Le groupe garde des versions de chaque camp et du catalogue (une toutes les ${HISTORIQUE_PAUSE / 60000} minutes au plus, ${HISTORIQUE_MAX} au maximum) pour revenir en arrière après une fausse manœuvre. Revenir à une version en crée une nouvelle : rien n'est perdu.</p>`;
  x += `<div class="g"><div><label for="hicle">Élément</label><select id="hicle" aria-label="Élément dont voir l'historique">${h.choix.map((c) => `<option value="${esc(c.cle)}"${c.cle === h.cle ? " selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div></div><p><button class="x" data-gr="hi-voir">Voir les versions</button></p>`;
  if (h.versions) {
    if (!h.versions.length) x += `<p class="s">Aucune version gardée pour l'instant.</p>`;
    for (const v of h.versions)
      x += `<div class="mbr"><span>${quand(v.le)} · ${esc(v.par)}${v.note ? " · " + esc(v.note) : ""}</span>${h.ecriture ? `<button class="x" data-gr="hi-retour" data-i="${esc(v.id)}">Revenir à cette version</button>` : ""}</div>`;
  }
  if (h.supprimes.length) {
    x += `<h3>Camps supprimés</h3>`;
    for (const v of h.supprimes)
      x += `<div class="mbr"><span>${esc(v.nom)} · supprimé, dernière version du ${quand(v.le)}</span>${h.ecriture ? `<button class="x" data-gr="hi-restaurer" data-i="${esc(v.id)}">Restaurer</button>` : ""}</div>`;
  }
  return x;
}

/** Contenu de la carte « Mon groupe » pour l'état e :
    { superAdmin, groupes: [{ id, nom, role }], courant, invitations: [{ id, nomGroupe, role }], membres: [{ uid, email, role }], moi, attente: [{ id, email, role }] }. */
function htmlGroupes(e) {
  const rolesHtml = (sel) =>
    ROLES.map(
      (r) => `<option value="${r[0]}"${r[0] === sel ? " selected" : ""}>${r[1]}</option>`
    ).join("");
  let h = "";
  for (const i of e.invitations)
    h += `<div class="mbr"><span>Invitation : <b>${esc(i.nomGroupe)}</b> (${roleNom(i.role)})</span><button class="x" data-gr="rejoindre" data-i="${esc(i.id)}">Rejoindre</button></div>`;
  const g = e.groupes.find((x) => x.id === e.courant);
  if (!e.groupes.length)
    h += `<p class="s">Tu n'es membre d'aucun groupe. Demande une invitation à l'administrateur de ton groupe, puis reviens ici.</p>`;
  else
    h += `<div class="g"><div><label for="grsel">Groupe</label><select id="grsel" aria-label="Groupe">${e.groupes.map((x) => `<option value="${esc(x.id)}"${x.id === e.courant ? " selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></div></div><p class="s">Ton rôle : <b>${g ? roleNom(g.role) : "?"}</b>.</p>`;
  if (g) {
    const admin = g.role === "admin";
    h += htmlSync(e.sync);
    if (e.sync && e.sync.liee) h += htmlHistorique(e.hist);
    if (admin)
      h += `<h3>Nom du groupe</h3><div class="g"><div><label for="grren">Nom</label><input id="grren" maxlength="${GROUPE_NOM_MAX}" value="${esc(g.nom)}" aria-label="Nom du groupe"></div></div><p><button class="x" data-gr="renommer">Renommer</button></p>`;
    h += `<h3>Membres</h3>`;
    for (const m of e.membres) {
      const verrou = erreurDernierAdmin(e.membres, m.uid) !== "",
        moi = m.uid === e.moi,
        quitter = `<button class="x" data-gr="quitter"${verrou ? " disabled" : ""}>Quitter le groupe</button>`;
      h += `<div class="mbr"><span>${esc(m.email || m.uid)}${moi ? " (moi)" : ""}</span>`;
      if (admin)
        h += `<select data-grrole="${esc(m.uid)}" aria-label="Rôle de ${esc(m.email || m.uid)}"${verrou ? " disabled" : ""}>${rolesHtml(m.role)}</select>${moi ? quitter : `<button class="x" data-gr="retirer" data-u="${esc(m.uid)}" aria-label="Retirer ${esc(m.email || m.uid)}">✕</button>`}`;
      else h += `<span class="s">${roleNom(m.role)}</span>${moi ? quitter : ""}`;
      h += `</div>`;
    }
    if (admin) {
      h += `<h3>Inviter quelqu'un</h3><p class="s">La personne se connecte avec l'adresse invitée, puis touche « Rejoindre ». Aucun e-mail n'est envoyé automatiquement : utilise le lien « Écrire l'invitation ».</p><div class="g"><div><label for="grmail">Adresse e-mail</label><input id="grmail" type="email" maxlength="120" aria-label="Adresse e-mail à inviter"></div><div><label for="grrole">Rôle</label><select id="grrole" aria-label="Rôle de la personne invitée">${rolesHtml("editeur")}</select></div></div><p><button class="x" data-gr="inviter">Inviter</button></p>`;
      for (const i of e.attente)
        h += `<div class="mbr"><span>En attente : ${esc(i.email)} (${roleNom(i.role)})</span><a class="x" href="${esc(lienMailInvitation(i.email, g.nom, e.url || ""))}">✉️ Écrire l'invitation</a><button class="x" data-gr="annuler" data-i="${esc(i.id)}" aria-label="Annuler l'invitation de ${esc(i.email)}">✕</button></div>`;
    }
  }
  if (e.superAdmin)
    h += `<h3>Nouveau groupe</h3><div class="g"><div><label for="grnom">Nom du groupe</label><input id="grnom" maxlength="${GROUPE_NOM_MAX}" aria-label="Nom du nouveau groupe"></div></div><p><button class="x" data-gr="creer">+ Créer le groupe</button></p>`;
  return h;
}
