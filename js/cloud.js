/* Intendance PSS – Compte en ligne (Firebase) : connexion par lien envoyé par e-mail.
   Rien n'est chargé tant que personne ne se connecte : l'application reste utilisable hors ligne et sans compte.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

const CLOUD = {
  // true sur le site de test : bandeau « version test » affiché
  test: true,
  sdk: "https://www.gstatic.com/firebasejs/11.0.2/",
  config: {
    apiKey: "AIzaSyDpYkEFDV2KYi3jHq8m40TNon-IKCKQnZw",
    authDomain: "patro-intendance-test.firebaseapp.com",
    projectId: "patro-intendance-test",
    storageBucket: "patro-intendance-test.firebasestorage.app",
    messagingSenderId: "338825462601",
    appId: "1:338825462601:web:386dbe6b116ad07db11098",
  },
};

const CLOUD_MAIL = "pss-cloud-email",
  CLOUD_ACTIF = "pss-cloud-connecte";

let cloudSdk = null,
  cloudUser = null;

/** Lecture / écriture du stockage local sans jamais lever d'erreur (navigation privée, stockage bloqué). */
const cloudLire = (k) => {
    try {
      return localStorage.getItem(k);
    } catch (_) {
      return null;
    }
  },
  cloudEcrire = (k, v) => {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch (_) {
      /* stockage indisponible : on continue sans mémoriser */
    }
  };

/** Charge le kit Firebase (une seule fois) et suit l'état de connexion. */
function cloudCharger() {
  if (!cloudSdk)
    cloudSdk = Promise.all([
      import(CLOUD.sdk + "firebase-app.js"),
      import(CLOUD.sdk + "firebase-auth.js"),
    ]).then(([app, auth]) => {
      const a = auth.getAuth(app.initializeApp(CLOUD.config));
      a.languageCode = "fr";
      auth.onAuthStateChanged(a, (u) => {
        cloudUser = u;
        cloudEcrire(CLOUD_ACTIF, u ? "1" : null);
        drawCloud();
      });
      return { auth, a };
    });
  cloudSdk.catch(() => {
    cloudSdk = null; // échec réseau : on pourra réessayer
  });
  return cloudSdk;
}

/** Affiche un message sous le formulaire de connexion. */
function cloudMessage(texte, erreur) {
  const m = $("cloudmsg");
  m.textContent = texte;
  m.classList.toggle("err", !!erreur);
}

/** Texte et boutons du compte, selon que quelqu'un est connecté ou non. */
function drawCloud() {
  $("vtest").hidden = !CLOUD.test;
  $("cloudst").textContent = cloudUser
    ? "Connecté : " +
      cloudUser.email +
      ". La synchronisation des camps arrive dans une prochaine étape."
    : "Non connecté : tes données restent sur cet appareil. Entre ton adresse e-mail pour recevoir un lien de connexion (pas de mot de passe).";
  $("cloudf").hidden = $("cmailok").hidden = !!cloudUser;
  $("cout").hidden = !cloudUser;
}

const MAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function cloudEnvoyerLien() {
  const mail = $("cmail").value.trim();
  if (!MAIL_OK.test(mail)) return cloudMessage("Adresse e-mail invalide.", true);
  $("cmailok").disabled = true;
  cloudMessage("Envoi du lien…");
  try {
    const { auth, a } = await cloudCharger();
    await auth.sendSignInLinkToEmail(a, mail, {
      url: location.origin + location.pathname,
      handleCodeInApp: true,
    });
    cloudEcrire(CLOUD_MAIL, mail);
    cloudMessage(
      "Lien envoyé à " +
        mail +
        ". Ouvre-le dans ce navigateur (pense à regarder les courriers indésirables)."
    );
  } catch (e) {
    cloudMessage("Impossible d'envoyer le lien (" + (e && e.code ? e.code : "réseau") + ").", true);
  }
  $("cmailok").disabled = false;
}

/** À l'arrivée par le lien reçu : termine la connexion puis nettoie l'adresse de la page. */
async function cloudTerminerLien() {
  try {
    const { auth, a } = await cloudCharger();
    if (!auth.isSignInWithEmailLink(a, location.href)) return;
    const mail =
      cloudLire(CLOUD_MAIL) || prompt("Confirme ton adresse e-mail pour terminer la connexion :");
    if (!mail) return;
    await auth.signInWithEmailLink(a, mail.trim(), location.href);
    cloudEcrire(CLOUD_MAIL, null);
    cloudMessage("Connexion réussie.");
  } catch (e) {
    cloudMessage(
      "Lien invalide ou expiré (" + (e && e.code ? e.code : "réseau") + "). Demande-en un nouveau.",
      true
    );
  }
  history.replaceState(null, "", location.pathname);
}

async function cloudDeconnecter() {
  try {
    const { auth, a } = await cloudCharger();
    await auth.signOut(a);
    cloudMessage("Déconnecté.");
  } catch (_) {
    cloudMessage("Déconnexion impossible.", true);
  }
}

$("cmailok").onclick = cloudEnvoyerLien;
$("cout").onclick = cloudDeconnecter;
$("cmail").onkeydown = (e) => {
  if (e.key === "Enter") cloudEnvoyerLien();
};

drawCloud();

// le kit n'est chargé que s'il y a quelque chose à faire : retour par le lien, ou session déjà ouverte sur cet appareil
if (location.search.includes("oobCode=")) cloudTerminerLien();
else if (cloudLire(CLOUD_ACTIF)) cloudCharger().catch(() => {});
