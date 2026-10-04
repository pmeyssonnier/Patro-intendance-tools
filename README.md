# Patro Sainte-Suzanne – Intendance de camp ⛺

Outil fait par le PSS pour les patros : il aide à préparer l'intendance d'un camp
(menus, recettes, régimes et allergies, liste de courses et budget).

👉 **Utiliser l'outil : https://pmeyssonnier.github.io/Patro-intendance-tools/**

Aucune installation : c'est une page web unique (`index.html`) qui fonctionne
sur ordinateur, tablette et téléphone. Les données restent sur ton appareil
(stockage du navigateur) ; rien n'est envoyé sur un serveur.

## Prise en main

1. Ouvre le menu ☰ (en haut à gauche) : chaque page s'y trouve, une à la fois.
2. **Camp & effectifs** : donne un nom au camp, ses dates de début et de fin, et le nombre de personnes par section.
3. **Régimes & allergies** : indique combien de personnes sont concernées, par section.
4. **Menu** : compose les repas (Matin, Midi, Soir) de chaque jour ; glisse ⠿ pour déplacer un plat.
5. **Liste de courses** : consulte les quantités et le budget, puis imprime ou partage la liste.
6. **Sauvegarde** : exporte le projet (`.json`) pour ne rien perdre.

## Installer l'application sur le téléphone

L'outil s'installe comme une application, avec son icône sur l'écran d'accueil, et fonctionne ensuite aussi sans connexion.

- **Android (Chrome)** : ouvre le menu ☰ de l'outil puis touche « 📲 Installer l'application » (ou menu ⋮ du navigateur → « Installer l'application »).
- **iPhone (Safari)** : touche Partager puis « Sur l'écran d'accueil ».
- **Ordinateur (Chrome, Edge)** : icône d'installation dans la barre d'adresse.

## Pages et fonctions

- **Camp & effectifs** : un projet par camp (nom, dates, effectifs par section – Benjas, Chevaliers-Étincelles, Conquérants-Alpines, Animateurs –, marge de pertes, régimes/allergies et menu). On peut créer, dupliquer, supprimer et changer de camp (sélecteur dans le menu ☰). Recettes, ingrédients et prix sont partagés entre les camps.
- **Régimes & allergies** : végétarien, halal, sans lactose, sans gluten, etc. L'appli retire l'ingrédient concerné et ajoute le substitut à acheter. Les régimes sont modifiables : on peut en créer, les renommer, en supprimer et définir les règles de remplacement.
- **Menu** : un tableau par jour (« Vendredi 22/03 »), d'après les dates du camp, avec Matin, Midi et Soir. On peut ajouter d'autres repas (Goûter, Collation…) et les retirer, à **un seul jour ou à tous les jours** au choix ; ils sont renommables, réordonnables et ont chacun une couleur. Les plats se glissent d'un repas ou d'un jour à l'autre. Menu imprimable (avec ou sans descriptions et adaptations) et copie du menu d'un autre camp.
- **Recettes** : quantités par personne et par section, ou **quantité unique** pour un ingrédient (ex. 5 pains, 5 L de lait : bouton « → quantité unique » sous l'ingrédient ; cette quantité n'est ni multipliée par l'effectif, ni augmentée de la marge, et elle est répartie au prorata des personnes au régime concernées — par exemple 3 personnes sans gluten sur 30 reçoivent 10 % du pain en pain sans gluten ; case « adapter aux régimes » désactivable) ; ingrédients personnalisés.
- **Catalogue de prix** : saisie à la main ou import d'une liste de produits (CSV/texte, `nom ; prix`) ; l'appli lit le poids dans le nom du produit et retient le moins cher pour chaque ingrédient.
- **Liste de courses** : quantités, coût total, par personne et par repas.
- **Partager / imprimer** : liste, menu et recettes par WhatsApp, mail, partage du téléphone, copie, impression ou fichier HTML (utile si l'impression directe ne marche pas sur l'appareil).
- **Sauvegarde** : export / import du projet en `.json` (le fichier est vérifié avant d'être accepté ; en cas de problème, rien n'est modifié et un message l'explique). Une « zone sensible » permet de vider les recettes, ingrédients et menus (les camps sont conservés) ou de tout réinitialiser (camps compris, retour aux données d'exemple).

## Conseils

- Les données sont enregistrées **dans le navigateur de l'appareil** : change d'appareil ou vide le navigateur, et elles disparaissent. Exporte régulièrement ton projet (`.json`) et importe-le sur l'autre appareil pour le retrouver.
- Si l'appli ne peut plus enregistrer (mémoire pleine, navigation privée), un bandeau rouge te le dit et propose d'exporter tout de suite. Installer l'appli sur l'écran d'accueil protège aussi mieux tes données : sur iPhone, Safari peut effacer les données d'un site simplement consulté, après une longue période sans l'ouvrir.
- Si tu changes les dates d'un camp, les plats restent attachés au numéro du jour : le menu n'est pas perdu, seuls les jours de la semaine affichés se décalent.
- Vérifie toujours les étiquettes (traces possibles) et confirme les allergies graves avec les parents.

## Pour les développeurs

Tout le code (HTML, CSS, JavaScript) est dans `index.html`, sans dépendance ni étape de compilation. L'installation repose sur `manifest.webmanifest`, `sw.js` (hors connexion) et le dossier `icons/`. Pour essayer en local, ouvre simplement le fichier dans un navigateur. Le site est publié par GitHub Pages à partir de la branche `main`.

## Licence

[MIT](LICENSE)
