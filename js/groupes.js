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
    h += `<h3>Membres</h3>`;
    for (const m of e.membres) {
      const verrou = erreurDernierAdmin(e.membres, m.uid) !== "";
      h += `<div class="mbr"><span>${esc(m.email || m.uid)}${m.uid === e.moi ? " (moi)" : ""}</span>`;
      if (admin)
        h += `<select data-grrole="${esc(m.uid)}" aria-label="Rôle de ${esc(m.email || m.uid)}"${verrou ? " disabled" : ""}>${rolesHtml(m.role)}</select><button class="x" data-gr="retirer" data-u="${esc(m.uid)}" aria-label="Retirer ${esc(m.email || m.uid)}"${verrou ? " disabled" : ""}>✕</button>`;
      else h += `<span class="s">${roleNom(m.role)}</span>`;
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
