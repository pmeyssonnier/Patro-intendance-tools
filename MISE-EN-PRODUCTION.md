# Notice : passer l'intendance de camp en production

Cette notice décrit, pas à pas, comment mettre l'application en ligne avec ses groupes et sa synchronisation (Firebase), pour **un Patro**. Elle couvre deux scénarios, qui partagent la plupart des étapes :

|                                  | Scénario 1 : adresse Firebase                        | Scénario 2 : nom de domaine propre                                                                    |
| -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Adresse publique                 | `https://patro-intendance.web.app`                   | `https://patro-sainte-suzanne.com`                                                                    |
| Coût                             | 0 €                                                  | 0 € d'hébergement, plus le nom de domaine (environ 10 à 15 € par an, déjà acheté pour Sainte-Suzanne) |
| Réglages en plus                 | aucun                                                | enregistrements DNS chez le revendeur du domaine                                                      |
| Délai                            | environ 1 h 30                                       | environ 1 h 30, plus l'attente DNS (de quelques minutes à 48 h)                                       |
| Adresse des e-mails de connexion | `noreply@<projet>.firebaseapp.com` (personnalisable) | `noreply@patro-sainte-suzanne.com` (avec la personnalisation du domaine d'envoi)                      |

> **Un projet Firebase par Patro.** Chaque Patro a son propre projet : données, administrateurs, adresse et e-mails séparés. Pour ajouter un Patro, on refait cette notice avec un autre nom de projet (voir la dernière partie).

## Avant de commencer : ce qu'il te faut

- Un compte Google qui sera **propriétaire du projet Firebase** (celui du responsable du Patro).
- Un accès au dépôt GitHub (pour les secrets et la fusion de la version).
- Pour le scénario 2 : l'accès à la gestion du **nom de domaine** chez le revendeur (OVH, Gandi, Infomaniak, GoDaddy…), onglet « zone DNS ».
- Environ une heure sans interruption pour la partie Firebase.

Noms utilisés dans cette notice : remplace `<projet>` par l'identifiant choisi (par exemple `patro-intendance` ou `patro-sainte-suzanne`).

---

## Partie A : étapes communes aux deux scénarios

### A1. Sauvegarder l'existant

1. Sur chaque appareil qui contient des données utiles : page **Sauvegarde**, **Exporter** (fichier `.json`).
2. Garde ces fichiers : c'est la sauvegarde la plus sûre avant tout changement.

### A2. Créer le projet Firebase

1. Va sur <https://console.firebase.google.com>, connecté avec le compte propriétaire.
2. **Créer un projet** (ou « Ajouter un projet »).
3. **Nom** : `patro-intendance` (scénario 1) ou `patro-sainte-suzanne` (scénario 2).
4. Firebase propose un **identifiant** (ID) sous le nom. Il est **définitif** et sert à fabriquer l'adresse `<ID>.web.app` : vérifie qu'il te convient.
   - Un identifiant déjà pris par quelqu'un d'autre reçoit un suffixe automatique (par exemple `patro-intendance-a1b2c`). Si tu veux l'adresse exacte `patro-intendance.web.app`, il faut un identifiant libre : essaie une variante avant de valider (par exemple `patro-intendance-be`).
5. **Google Analytics** : désactive-le (inutile, évite des questions de consentement).
6. **Créer le projet**, puis attends la fin.
7. Reste sur le forfait gratuit **Spark** : aucune carte bancaire n'est demandée.

### A3. Enregistrer l'application web et récupérer sa configuration

1. Roue dentée en haut à gauche, **Paramètres du projet**, section **Vos applications**, icône **`</>`** (Web).
2. **Surnom** : `intendance-web`. Ne coche pas « Configurer aussi Firebase Hosting » (on le fait en A7).
3. **Enregistrer l'application**.
4. Copie le bloc `firebaseConfig` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) et garde-le : il faut le donner à la personne qui prépare le code (A9). Il n'est pas secret.

### A4. Activer la connexion par lien e-mail

1. Menu de gauche, **Authentication**, **Commencer**.
2. Onglet **Méthode de connexion**, ligne **Adresse e-mail/Mot de passe**.
3. Active **Adresse e-mail/Mot de passe** **et** **Lien envoyé par e-mail (connexion sans mot de passe)**. Enregistre.
4. Ignore les recommandations d'activer Google ou l'authentification multifacteur par SMS.
5. Les **domaines autorisés** (onglet Paramètres) contiennent déjà `localhost` et les domaines Firebase du projet. Les domaines à ajouter sont indiqués dans les parties B et C.

### A5. Créer la base Firestore

1. **Firestore Database**, **Créer une base de données**.
2. Édition **Standard**.
3. **Emplacement : `eur3 (Europe)`**. Ce choix est **définitif** : ne prends jamais un emplacement hors d'Europe.
4. Mode **production** (règles fermées).
5. **Activer**.

### A6. Publier les règles de sécurité

1. Ouvre le fichier `firestore.rules` du dépôt (bouton **Raw** sur GitHub), copie tout.
2. **Si le responsable du Patro n'est pas `pmeyssonnier@gmail.com`**, remplace cette adresse dans le fichier **avant** de la copier (une seule occurrence, dans la fonction `superAdmin`), et fais le même changement dans `js/cloud.js` (champ `superAdmin`). Cette adresse est la seule à pouvoir créer des groupes.
3. Console Firebase, Firestore, onglet **Règles** : sélectionne tout, colle, puis **Publier**.
4. Vérifie : la liste à gauche de l'éditeur doit afficher une ligne datée d'aujourd'hui, marquée comme version active. Recharge la page (F5) : les règles collées doivent rester.
5. **À refaire** chaque fois que le fichier `firestore.rules` change dans le dépôt.

### A7. Activer Hosting

1. **Hébergement et sans serveur**, **Hosting**, **Commencer**.
2. Ignore les instructions en ligne de commande jusqu'au bout, puis **Continuer vers la console**.
3. Note l'adresse affichée : `https://<ID>.web.app`. Elle fonctionne dès maintenant (page vide, « en attente de la première version »).

### A8. Préparer le déploiement automatique depuis GitHub

Le site se publie tout seul à chaque envoi sur `main` grâce au fichier `.github/workflows/deploy-test.yml`. Il lui faut une clé de compte de service, stockée comme **secret** GitHub (elle ne doit jamais passer par un message, un e-mail ou le dépôt).

1. Console Firebase, roue dentée, **Paramètres du projet**, onglet **Comptes de service**, **Générer une nouvelle clé privée**, **Générer la clé**. Un fichier `.json` se télécharge.
2. Donne les droits de publication à ce compte : console Google Cloud <https://console.cloud.google.com/iam-admin/iam>, **projet `<ID>` sélectionné** (vérifie le nom en haut de la page : ne modifie pas un autre projet).
   - Ligne `firebase-adminsdk-…@<ID>.iam.gserviceaccount.com`, **crayon**, **Ajouter un autre rôle** : **Administrateur Firebase Hosting**. **Enregistrer**. Ne retire aucun rôle existant.
   - Si le déploiement échoue plus tard avec une erreur de permission, ajoute aussi **Utilisateur du service d'utilisation** (Service Usage Consumer).
3. GitHub, dépôt, **Settings**, **Secrets and variables**, **Actions**, **New repository secret** :
   - **Name** : `FIREBASE_SERVICE_ACCOUNT` s'il n'y a qu'un projet ; avec plusieurs projets, un nom par projet (par exemple `FIREBASE_SA_SAINTE_SUZANNE`).
   - **Secret** : tout le contenu du fichier `.json` (de `{` jusqu'à `}`).
4. **Supprime le fichier `.json`** de ton ordinateur, y compris le dossier Téléchargements.

### A9. Préparer le code pour ce projet

Le code contient la configuration d'**un seul** projet Firebase (celui de test). Pour la production, il faut :

1. Remplacer ou ajouter la configuration `firebaseConfig` de A3 dans `js/cloud.js`, choisie selon l'adresse du site (production ou test), pour que le terrain d'essai et la production restent séparés.
2. Mettre `projectId` (et le nom du secret) du fichier `.github/workflows/deploy-test.yml` et `.firebaserc` au nouvel identifiant.
3. Vérifier l'adresse du super-administrateur (A6).
4. Lancer les tests et publier.

> **Cette étape est à demander à Claude** : envoie-lui le bloc `firebaseConfig`, le nom du projet, le nom du secret, et l'adresse du super-administrateur. Il prépare le tout dans une demande de fusion (PR). Il ne manipule jamais la clé de compte de service.

### A10. Fusionner la version

1. Ouvre la PR préparée, vérifie que les tests de la CI sont verts (coche verte).
2. **Merge pull request**.
3. L'onglet **Actions** de GitHub montre « Déploiement du site de test » : attends la coche verte (environ une minute).
4. Ouvre `https://<ID>.web.app` : l'application s'affiche. La page **Nouveautés** annonce la nouvelle version.
5. Un test automatique est aussi lancé sur `main` (CI) : il doit rester vert.

### A11. Premier lancement en production

À faire sur l'adresse définitive.

1. ⚙️ **Configuration**, carte **Compte en ligne** : saisis l'adresse e-mail du responsable, **Recevoir le lien de connexion**, ouvre le lien reçu **dans le même navigateur**.
2. Carte **Mon groupe**, section **Nouveau groupe** (visible seulement pour le super-administrateur) : saisis le nom du Patro, **+ Créer le groupe**. Tu apparais dans les membres avec le rôle **Administrateur**.
3. Section **Synchronisation** : **⬆️ Envoyer mon projet au groupe** (ou **Charger** si un autre appareil l'a déjà fait).
4. Vérifie que l'indicateur ☁️ apparaît en haut de la page.
5. Section **Inviter quelqu'un** : saisis l'adresse d'un intendant, choisis son rôle, **Inviter**, puis **✉️ Écrire l'invitation** (ouvre ta messagerie avec le message prêt).
6. Teste avec un second appareil (ou une seconde adresse) : connexion, **Rejoindre**, **Charger le projet du groupe**, modification d'une note de camp sur l'un, 🔔 sur l'autre.

### A12. Prévenir les intendants

Message type à envoyer :

> Bonjour,
>
> L'outil d'intendance de camp est maintenant en ligne : **<adresse>**.
>
> 1. Ouvre l'adresse, puis ⚙️ Configuration, carte « Compte en ligne ».
> 2. Saisis ton adresse e-mail, clique sur « Recevoir le lien de connexion » : tu reçois un lien (pense à regarder les courriers indésirables). Ouvre-le dans le même navigateur.
> 3. Dans « Mon groupe », clique sur « Rejoindre », puis « Charger le projet du groupe ».
>
> Pas de mot de passe. Tes camps se synchronisent ensuite tout seuls, même si le réseau coupe un moment. Une question ? Écris-moi.

### A13. Après la mise en ligne : suivi

- **Sauvegardes** : chaque intendant peut exporter son projet (page Sauvegarde). Le groupe garde aussi l'historique des versions (20 par camp). Une sauvegarde automatique de la base demande l'offre payante : non activée.
- **Quotas** : l'offre gratuite suffit largement pour quelques intendants. Surveille de temps en temps Firebase, **Utilisation**.
- **Clé d'API** (recommandé) : console Google Cloud, **API et services**, **Identifiants**, la clé « Browser key » du projet, **Restrictions d'application**, **Référents HTTP** : ajoute `https://<adresse>/*` et `https://<ID>.web.app/*` et `https://<ID>.firebaseapp.com/*`. La clé n'est pas secrète, mais cela évite qu'un autre site l'utilise.
- **Règles** : republier `firestore.rules` à chaque changement de ce fichier.

---

## Partie B : scénario 1, adresse Firebase (`patro-intendance.web.app`)

À faire en plus de la partie A.

1. **Domaines autorisés** (Authentication, Paramètres) : `<ID>.web.app` et `<ID>.firebaseapp.com` y sont déjà ajoutés par Firebase. Vérifie qu'ils apparaissent. Si tu gardes aussi une ancienne adresse (GitHub Pages) pour le lien de connexion, ajoute-la.
2. **Adresse à communiquer** : `https://<ID>.web.app`.
3. **E-mails de connexion** : ils partent de `noreply@<ID>.firebaseapp.com`. Pour un nom plus propre dans la boîte de réception : Authentication, **Modèles**, **Lien de connexion par e-mail**, crayon : change le **nom de l'expéditeur** (par exemple « Intendance Patro ») et le sujet. L'adresse technique reste celle du projet.
4. **Ancienne adresse GitHub Pages** : elle continue de fonctionner tant que tu ne la retires pas. Les données d'un appareil sont liées à l'adresse : sur la nouvelle adresse, chacun repart d'un stockage vide et clique sur « Charger le projet du groupe ». Garde l'ancienne le temps que tout le monde ait basculé.
5. **Un site avec un autre nom** : si l'adresse `<ID>.web.app` n'est pas celle que tu veux, Hosting permet d'ajouter un second site (bouton **Ajouter un autre site**) avec un identifiant libre, par exemple `patro-intendance`. Il demande de choisir ce site dans le déploiement : à demander à Claude.

---

## Partie C : scénario 2, domaine propre (`patro-sainte-suzanne.com`)

À faire en plus de la partie A. Le domaine doit déjà t'appartenir.

### C1. Ajouter le domaine dans Hosting

1. Console Firebase, **Hosting**, **Ajouter un domaine personnalisé**.
2. Saisis `patro-sainte-suzanne.com`. Firebase propose aussi `www.patro-sainte-suzanne.com` : accepte, et choisis laquelle des deux est l'adresse principale (l'autre redirige vers elle).
3. Firebase affiche des **enregistrements DNS** à créer. **Copie les valeurs exactes affichées par la console** (elles peuvent changer). En général :
   - un enregistrement **TXT** de vérification (nom `@`, valeur du type `hosting-site=<ID>`) ;
   - un ou deux enregistrements **A** vers les adresses IP de Firebase (nom `@`), pour le domaine sans `www` ;
   - pour `www` : un enregistrement **CNAME** vers `<ID>.web.app`, ou les mêmes A.

### C2. Créer les enregistrements chez le revendeur

1. Connecte-toi chez le revendeur du domaine, **zone DNS** du domaine.
2. **Supprime les enregistrements qui entrent en conflit** : une ancienne `A`, `AAAA` ou `CNAME` du même nom (page de parking du revendeur, redirection web, ancien hébergement). Un nom ne peut pas avoir un `CNAME` et d'autres enregistrements en même temps.
3. Ajoute les enregistrements demandés, un par un, **sans modifier les autres** (les enregistrements `MX`, qui font fonctionner une éventuelle adresse e-mail du domaine, ne doivent pas être touchés).
4. Enregistre. La durée de vie (TTL) peut rester à la valeur par défaut.
5. Reviens dans Firebase, **Vérifier** : l'état passe de « En attente » à « Prêt » après la propagation, de quelques minutes à 48 heures. Le certificat HTTPS est ensuite créé tout seul (quelques heures au plus) : tant qu'il n'est pas prêt, le navigateur peut afficher un avertissement de certificat. Ne fais rien, attends.

### C3. Autoriser le domaine pour la connexion

1. Authentication, **Paramètres**, **Domaines autorisés**, **Ajouter un domaine** : `patro-sainte-suzanne.com`, puis `www.patro-sainte-suzanne.com`.
2. Sans cela, le lien de connexion par e-mail échoue avec `auth/unauthorized-continue-uri`.

### C4. Faire partir les e-mails de connexion du domaine propre (optionnel, recommandé)

1. Authentication, **Modèles**, **Lien de connexion par e-mail**, crayon.
2. Change le **nom de l'expéditeur** (« Intendance Patro Sainte-Suzanne »).
3. Si la console propose **Personnaliser le domaine** pour l'adresse d'expédition, suis les étapes : Firebase affiche des enregistrements **TXT/CNAME** (SPF, DKIM) à ajouter dans la zone DNS du domaine, comme en C2. Une fois validés (jusqu'à 48 heures), les e-mails partent de `noreply@patro-sainte-suzanne.com`.
4. Si la console propose **Personnaliser l'URL d'action**, utilise ton domaine : le lien du message ne contient alors plus `firebaseapp.com`.

### C5. Vérifier et communiquer

1. Ouvre `https://patro-sainte-suzanne.com` : l'application s'affiche, avec le cadenas HTTPS, **sans** bandeau « VERSION TEST » (il n'apparaît que sur les adresses `…web.app` et `…firebaseapp.com`).
2. Refais le test de la partie A11 sur cette adresse (connexion, groupe, envoi, invitation).
3. Clé d'API : ajoute `https://patro-sainte-suzanne.com/*` et `https://www.patro-sainte-suzanne.com/*` aux référents HTTP (voir A13).
4. Communique l'adresse (message de A12). L'adresse `…web.app` continue de fonctionner : tu peux la laisser, c'est une copie avec le bandeau « VERSION TEST ».

---

## Partie D : checklist finale avant d'annoncer

- [ ] L'adresse définitive s'ouvre en HTTPS, sans bandeau « VERSION TEST ».
- [ ] La page **Nouveautés** affiche la dernière version.
- [ ] Connexion par lien e-mail réussie, avec le responsable puis avec un second compte.
- [ ] Le groupe existe, le responsable est administrateur.
- [ ] L'envoi du projet au groupe a réussi (indicateur ☁️ visible).
- [ ] Un second appareil a chargé le projet et reçoit les modifications (🔔).
- [ ] Une modification faite sans réseau est bien envoyée au retour du réseau.
- [ ] L'historique permet de revenir à une version précédente.
- [ ] Les règles publiées dans Firebase correspondent au fichier `firestore.rules` du dépôt.
- [ ] La clé d'API est restreinte aux adresses du site.
- [ ] Le secret GitHub existe et le fichier `.json` téléchargé a été supprimé.
- [ ] Une sauvegarde `.json` du projet existe hors de l'application.

---

## Partie E : revenir en arrière

| Problème                                     | Solution                                                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La nouvelle version du site est mauvaise     | Firebase, Hosting, **Versions précédentes**, menu de la version voulue, **Restaurer** (immédiat). Côté GitHub : annuler la fusion avec « Revert » sur la PR.                                                                             |
| Un camp a été modifié ou supprimé par erreur | Page **Mon groupe**, **Historique** : « Revenir à cette version » ou « Restaurer » (camp supprimé).                                                                                                                                      |
| Une règle de sécurité bloque tout le monde   | Firestore, Règles, la liste de gauche garde les versions précédentes : sélectionne la précédente puis **Publier**.                                                                                                                       |
| Des données du groupe sont perdues           | Chaque appareil garde une copie du projet : « Arrêter la synchronisation » puis « Envoyer mon projet au groupe » (possible quand le groupe n'a plus de catalogue). Les sauvegardes `.json` (page Sauvegarde) servent de dernier recours. |

---

## Partie F : dépannage

| Ce que tu vois                                        | Cause probable                                          | Que faire                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `auth/unauthorized-continue-uri` en demandant le lien | l'adresse du site n'est pas dans les domaines autorisés | Authentication, Paramètres, Domaines autorisés : l'ajouter                                    |
| `auth/operation-not-allowed`                          | le lien e-mail n'est pas activé                         | Authentication, Méthode de connexion : activer « Lien envoyé par e-mail » et enregistrer      |
| aucun e-mail reçu                                     | courrier indésirable, ou adresse mal saisie             | regarder les indésirables, attendre 2 minutes, redemander une fois                            |
| « Lien invalide ou expiré »                           | lien ouvert dans un autre navigateur, ou déjà utilisé   | redemander un lien et l'ouvrir dans le navigateur où l'adresse a été saisie                   |
| `permission-denied` dans la carte Mon groupe          | règles de sécurité absentes ou anciennes                | republier `firestore.rules` (A6)                                                              |
| le workflow affiche « Secret absent »                 | le secret GitHub manque ou porte un autre nom           | vérifier le nom exact dans Settings, Secrets and variables, Actions                           |
| le workflow est rouge avec une erreur de permission   | le compte de service n'a pas le rôle Hosting            | ajouter « Administrateur Firebase Hosting » (A8)                                              |
| le domaine reste « En attente »                       | DNS pas encore propagé ou enregistrement en conflit     | vérifier les valeurs copiées, supprimer les enregistrements en conflit, attendre jusqu'à 48 h |
| avertissement de certificat sur le domaine            | le certificat est en cours de création                  | attendre quelques heures                                                                      |
| une version plus ancienne s'affiche                   | cache du navigateur ou de l'application installée       | recharger avec Ctrl+F5 ; sur téléphone, fermer puis rouvrir l'application                     |
| ☁️ reste en « conflit »                               | quelqu'un d'autre a modifié le groupe                   | bandeau : charger sa version, ou garder la tienne                                             |

---

## Partie G : ajouter un autre Patro (Uccle, Forest…)

1. Le responsable du nouveau Patro crée son propre projet Firebase (A2 à A8) avec son compte Google : il est ainsi propriétaire de ses données.
2. Il envoie à la personne qui maintient le code : le bloc `firebaseConfig`, le nom du projet, l'adresse de son super-administrateur, et le nom de son secret GitHub.
3. Le code reçoit une configuration de plus (A9), le déploiement publie sur son projet (A10).
4. Son domaine (si le Patro en a un) se branche comme en partie C.
5. Il crée son groupe, envoie son projet, invite ses intendants (A11).

Les recettes et ingrédients de base, le code de l'application et le fichier de prix Colruyt publié restent communs ; les données de chaque Patro restent séparées.

---

## Annexe : répartition du travail

| Qui                     | Quoi                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le responsable du Patro | Créer le projet Firebase, réglages de la console (A2 à A8), DNS du domaine (partie C), inviter les intendants                                      |
| Claude                  | Préparer le code et la fusion (A9, A10), tester, rédiger les notes de version ; n'a jamais accès à la clé de compte de service ni au compte Google |
| Chaque intendant        | Se connecter par lien e-mail, rejoindre le groupe, charger le projet                                                                               |
