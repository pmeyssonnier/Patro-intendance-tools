# Patro Sainte-Suzanne – Intendance de camp ⛺

Outil fait par le Patro Sainte-Suzanne pour les patros : il aide à préparer l'intendance d'un camp
(menus, recettes, régimes et allergies, liste de courses et budget).

👉 **Utiliser l'outil : https://pmeyssonnier.github.io/Patro-intendance-tools/**

Aucune installation : c'est une petite page web (`index.html`, avec `styles.css`, les scripts de `js/` et le logo dans `assets/`) qui fonctionne
sur ordinateur, tablette et téléphone. Les données restent sur ton appareil
(stockage du navigateur) ; rien n'est envoyé sur un serveur.

## Prise en main

1. Ouvre le menu ☰ (en haut à gauche) : chaque page s'y trouve, une à la fois.
2. **Configuration** (⚙️, en haut à droite ou dans le menu) : indique le nom de ta troupe, son logo et tes sections (noms et âges). Les sections du PSS sont proposées par défaut.
3. **Camp & effectifs** : donne un nom au camp, ses dates de début et de fin, et le nombre de personnes par section.
4. **Régimes & allergies** : indique combien de personnes sont concernées, par section.
5. **Menu** : compose les repas (Matin, Midi, Soir) de chaque jour ; glisse ⠿ pour déplacer un plat.
6. **Liste de courses** : consulte les quantités et le budget, puis imprime ou partage la liste.
7. **Sauvegarde** : exporte le projet (`.json`) pour ne rien perdre.

## Installer l'application sur le téléphone

L'outil s'installe comme une application, avec son icône sur l'écran d'accueil, et fonctionne ensuite aussi sans connexion.

- **Android (Chrome)** : ouvre le menu ☰ de l'outil puis touche « 📲 Installer l'application » (ou menu ⋮ du navigateur → « Installer l'application »).
- **iPhone (Safari)** : touche Partager puis « Sur l'écran d'accueil ».
- **Ordinateur (Chrome, Edge)** : icône d'installation dans la barre d'adresse.

## Pages et fonctions

- **Camp & effectifs** : un projet par camp (nom, dates, effectifs par section (par défaut Benjas, Chevaliers-Étincelles, Conquérants-Alpines, Animateurs), marge de pertes, régimes/allergies et menu). On peut créer, dupliquer, supprimer et changer de camp (sélecteur dans le menu ☰). Recettes, ingrédients et prix sont partagés entre les camps.
- **Configuration** (⚙️) : nom de la troupe (affiché dans le menu et sur les documents), logo et sections. Chaque section a un nom et une tranche d'âge modifiables ; on peut les trier (▲ ▼), en ajouter (12 au maximum) et en supprimer (au moins une reste). Les effectifs, les régimes et les quantités des recettes suivent les sections quand on les déplace ; supprimer une section efface ses chiffres.
- **Régimes & allergies** : végétarien, halal, sans lactose, sans gluten, etc. L'appli retire l'ingrédient concerné et ajoute le substitut à acheter. Les régimes sont modifiables : on peut en créer, les renommer, en supprimer et définir les règles de remplacement.
- **Menu** : un tableau par jour (« Vendredi 22/03 »), d'après les dates du camp, avec Matin, Midi et Soir. On peut ajouter d'autres repas (Goûter, Collation…) et les retirer, à **un seul jour ou à tous les jours** au choix ; ils sont renommables, réordonnables et ont chacun une couleur. Les plats se glissent d'un repas ou d'un jour à l'autre, à la souris, au doigt ou au clavier (flèches haut/bas pour l'ordre, gauche/droite pour changer de repas). Menu imprimable (avec ou sans descriptions et adaptations) et copie du menu d'un autre camp.
- **Recettes** : quantités par personne et par section, ou **quantité unique** pour un ingrédient (ex. 5 pains, 5 L de lait : bouton « → quantité unique » sous l'ingrédient ; cette quantité n'est ni multipliée par l'effectif, ni augmentée de la marge, et elle est répartie au prorata des personnes au régime concernées — par exemple 3 personnes sans gluten sur 30 reçoivent 10 % du pain en pain sans gluten ; case « adapter aux régimes » désactivable) ; ingrédients personnalisés.
- **Catalogue de prix** : saisie à la main ou import d'une liste de produits (CSV/texte, `nom ; prix`) ; l'appli lit le poids dans le nom du produit et retient le moins cher pour chaque ingrédient. Elle accepte aussi un fichier de prix `.json` (voir « Mettre à jour les prix Colruyt »).
- **Liste de courses** : quantités, coût total, par personne et par repas.
- **Partager / imprimer** : liste, menu et recettes par WhatsApp, mail, partage du téléphone, copie, impression ou fichier HTML (utile si l'impression directe ne marche pas sur l'appareil). **Export CSV** de la liste de courses (avec coûts et total), du menu et des recettes : le fichier s'ouvre directement dans Excel en français, pratique pour le budget et le trésorier.
- **Sauvegarde** : export / import du projet en `.json` (le fichier est vérifié avant d'être accepté ; en cas de problème, rien n'est modifié et un message l'explique). Une « zone sensible » permet de vider les recettes, ingrédients et menus (les camps sont conservés) ou de tout réinitialiser (camps compris, retour aux données d'exemple).

## Mettre à jour les prix Colruyt

Colruyt n'a pas d'API publique et son site bloque les accès depuis un navigateur : les prix sont donc collectés **hors de l'appli**, dans un fichier `prix_colruyt.json` que tu charges toi-même dans le catalogue. L'appli ne contacte jamais Colruyt et fonctionne comme avant sans ce fichier.

1. **Collecte** : [![Ouvrir dans Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/pmeyssonnier/Patro-intendance-tools/blob/main/scripts/collecte_prix_colruyt.ipynb) (notebook `scripts/collecte_prix_colruyt.ipynb`). Il faut un compte Apify ; enregistre son jeton dans les secrets de Colab (icône clé) sous le nom `APIFY_TOKEN`. Aucun jeton GitHub n'est nécessaire.
2. **Vérification** : lance d'abord la cellule DEBUG, qui affiche les champs réellement renvoyés par le service ; si besoin, adapte les noms de champs dans `normaliser()`. Lance ensuite la cellule de collecte : elle liste les ingrédients sans résultat (les articles halal ou sans gluten en ont souvent), puis la dernière cellule télécharge `prix_colruyt.json`.
3. **Chargement** : dans l'appli, page *Catalogue de prix* → « Choisir un fichier » → sélectionne le `.json`. Un aperçu (ancien prix → nouveau prix) s'affiche ; clique sur « Importer » pour l'appliquer. Un exemple à tester se trouve dans `exemples/prix_colruyt_exemple.json`.

À savoir :

- Les prix sont reliés aux ingrédients **par identifiant** (`pates`, `riz`, `lait`…), et seulement quand l'unité correspond (€/kg pour un ingrédient en g, €/L pour un ingrédient en ml). Les ingrédients ajoutés à la main ne sont pas reconnus, et ceux qui sont absents du fichier gardent leur prix.
- Les prix chargés **remplacent** les prix déjà saisis pour les ingrédients présents dans le fichier. Le nom du produit retenu s'affiche en « ↳ » sous l'ingrédient.
- **Ajouter un ingrédient à la collecte** : ajoute une ligne `{"id": …, "q": …, "unite": …}` dans `INGREDIENTS` (l'`id` doit être identique à celui de l'appli). Pour forcer un produit précis, ajoute `"epingle": "<identifiant produit Colruyt>"`.
- Le service de collecte (acteur Apify `studio-amba~colruyt-scraper`) est tiers et payant, et ses champs n'ont pas été vérifiés. La collecte automatisée de prix peut aller à l'encontre des conditions d'utilisation de Colruyt : à toi de voir si cet usage te convient.

## Accessibilité

Tous les boutons et champs ont un nom pour les lecteurs d'écran, le menu ☰ et le déplacement des plats se font au clavier, et la navigation est annoncée (page courante, déplacements de plats).

## Conseils

- Les données sont enregistrées **dans le navigateur de l'appareil** : change d'appareil ou vide le navigateur, et elles disparaissent. Exporte régulièrement ton projet (`.json`) et importe-le sur l'autre appareil pour le retrouver.
- Si l'appli ne peut plus enregistrer (mémoire pleine, navigation privée), un bandeau rouge te le dit et propose d'exporter tout de suite. Installer l'appli sur l'écran d'accueil protège aussi mieux tes données : sur iPhone, Safari peut effacer les données d'un site simplement consulté, après une longue période sans l'ouvrir.
- Si tu changes les dates d'un camp, les plats restent attachés au numéro du jour : le menu n'est pas perdu, seuls les jours de la semaine affichés se décalent.
- **Une personne, un seul régime par ingrédient.** Les régimes se comptent par section, pas par personne : si quelqu'un cumule deux régimes qui touchent le **même ingrédient**, il est compté une fois par régime. Exemple : un enfant végétarien et halal, compté dans les deux, fait acheter une portion de substitut végétarien **et** une de viande halal, et retire deux portions de viande normale au lieu d'une. Les régimes qui touchent des ingrédients différents (par exemple végétarien et sans gluten) ne posent aucun problème. Les cas cumulés étant rares, deux solutions : ne compter la personne que dans le régime le plus strict (ici végétarien, qui exclut déjà la viande), ou créer dans « Régimes & allergies » un régime à part (« Végétarien + halal ») avec ses propres règles.
- Vérifie toujours les étiquettes (traces possibles) et confirme les allergies graves avec les parents.

## Pour les développeurs

Aucune dépendance ni étape de compilation :

| Fichier | Rôle |
| --- | --- |
| `index.html` | structure de la page (pages, formulaires, conteneurs) |
| `styles.css` | tout le CSS |
| `js/data-defaults.js` | données par défaut : sections, ingrédients, recettes d'exemple, régimes, couleurs |
| `js/utils.js` | petits outils partagés : accès au DOM, échappement HTML, formats, contraste des couleurs |
| `js/storage.js` | validation des données, enregistrement, avertissement, export / import / réinitialisation |
| `js/state.js` | camps, dates, jours et repas, migration et nettoyage au chargement |
| `js/calculations.js` | calcul des quantités d'un plat |
| `js/shopping-list.js` | liste de courses et budget |
| `js/documents.js` | menu, liste et recettes imprimables, textes à partager, exports CSV |
| `js/share-print.js` | impression, fichier HTML téléchargeable, WhatsApp, mail, copie |
| `js/navigation.js` | menu latéral, changement de page, logo |
| `js/camps.js` | choix du camp, dates, effectifs, copie de menu |
| `js/diets.js` | régimes, allergies, règles de remplacement |
| `js/menu.js` | menu du camp, glisser-déposer, repas supplémentaires, couleurs |
| `js/recipes.js` | recettes et ingrédients |
| `js/catalog.js` | catalogue de prix et import |
| `js/config.js` | configuration : nom de la troupe, logo, sections |
| `js/pwa.js` | installation et hors connexion |
| `js/main.js` | démarrage |
| `assets/logo-pss.jpg` | logo par défaut |
| `manifest.webmanifest`, `sw.js`, `icons/` | installation et usage hors connexion |

Ce sont des **scripts classiques**, pas des modules : les fichiers `js/` partagent les mêmes variables et **l'ordre de chargement** (`index.html`) compte, chacun dépendant de ceux qui le précèdent. Un nouveau fichier doit aussi être ajouté à la liste de `sw.js` pour fonctionner hors connexion (un test le vérifie) ; changer cette liste impose de changer le nom du cache (`pss-v…`) dans `sw.js`.

Le numéro de version affiché sous « Outil fait par… » (bas du menu et bas de page) vient de `APP_VERSION` dans `js/data-defaults.js` : à mettre à jour à chaque release, avec `"version"` dans `package.json` et les `?v=…` de `styles.css` et des scripts dans `index.html` (ils obligent le navigateur à recharger les fichiers après une release ; un test vérifie que tout est identique).

Les fichiers doivent rester ensemble dans le même dossier. Pour modifier les styles ou le code, édite `styles.css` ou le fichier de `js/` concerné. L'installation repose sur `manifest.webmanifest`, `sw.js` (hors connexion) et le dossier `icons/`. Pour essayer en local, ouvre simplement `index.html` dans un navigateur.

### Mise en forme du code

`js/`, `styles.css` et les tests sont formatés automatiquement avec [Prettier](https://prettier.io) (réglages dans `.prettierrc.json`). Après une modification : `npm run format` (ou `npm run format:check` pour seulement vérifier). `index.html` n'est pas reformaté automatiquement, pour ne pas décaler l'affichage.

### Contrôle du code (ESLint)

`npm run lint` repère les fautes de frappe et les oublis avant même d'ouvrir la page : variable ou fonction inconnue (`no-undef`), variable locale inutilisée, `==` au lieu de `===` (sauf `x == null`, voulu). Comme les fichiers de `js/` partagent leurs variables, `eslint.config.js` lit lui-même ce que chaque fichier déclare au premier niveau : il n'y a aucune liste à tenir à jour. Ce contrôle ne vérifie pas l'ordre de chargement des fichiers (voir plus haut) : les tests s'en chargent.

### Tests

Des tests de bout en bout (Playwright) ouvrent la page dans un vrai navigateur, sur ordinateur et au format téléphone : navigation, camps et dates, menu (ajout, repas supplémentaires, déplacement au clavier), quantité unique et régimes, export/import, sécurité de l'import, export CSV, avertissement de stockage, accessibilité et **mode hors connexion** (l'appli est alors servie en HTTP par un petit serveur local, pour tester le service worker : fichiers en cache, rechargement sans réseau).

```
npm install
npx playwright install chromium
npm test
```

Pour utiliser un Chromium déjà installé : `CHROMIUM_PATH=/chemin/vers/chromium npm test`.

Sur GitHub, le contrôle du code (ESLint, Prettier) puis ces tests se lancent automatiquement à chaque pull request et à chaque envoi sur `main` (onglet « Actions », fichier `.github/workflows/tests.yml`) ; en cas d'échec, les captures sont conservées 7 jours. Le site est publié par GitHub Pages à partir de la branche `main`.

## Licence

[MIT](LICENSE)
