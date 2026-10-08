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
7. **Sauvegarde** : exporte le projet (`.json`) pour ne rien perdre. Si le téléchargement est bloqué par ton navigateur (navigateur intégré à une appli, appli installée, Safari…), « 📋 Copier le projet » et « 📤 Partager » servent de repli, et un message explique toute erreur d'export.

## Installer l'application sur le téléphone

L'outil s'installe comme une application, avec son icône sur l'écran d'accueil, et fonctionne ensuite aussi sans connexion.

- **Android (Chrome)** : ouvre le menu ☰ de l'outil puis touche « 📲 Installer l'application » (ou menu ⋮ du navigateur → « Installer l'application »).
- **iPhone (Safari)** : touche Partager puis « Sur l'écran d'accueil ».
- **Ordinateur (Chrome, Edge)** : icône d'installation dans la barre d'adresse.

## Pages et fonctions

- **Camp & effectifs** : un projet par camp (nom, dates, effectifs par section (par défaut Benjas, Chevaliers-Étincelles, Conquérants-Alpines, Animateurs), marge de pertes, régimes/allergies et menu). On peut créer, dupliquer, supprimer et changer de camp (sélecteur dans le menu ☰). Recettes, ingrédients et prix sont partagés entre les camps.
- **Configuration** (⚙️) : nom de la troupe (affiché dans le menu et sur les documents), logo et sections. Chaque section a un nom et une tranche d'âge modifiables ; on peut les trier (▲ ▼), en ajouter (12 au maximum) et en supprimer (au moins une reste). Les effectifs, les régimes et les quantités des recettes suivent les sections quand on les déplace ; supprimer une section efface ses chiffres.
- **Régimes & allergies** : végétarien, halal, sans lactose, sans gluten, etc. L'appli retire l'ingrédient concerné et ajoute le substitut à acheter. Les régimes sont modifiables : on peut en créer, les renommer, en supprimer et définir les règles de remplacement.
- **Menu** : un tableau par jour (« Vendredi 22/03 »), d'après les dates du camp, avec Matin, Midi et Soir. Chaque repas indique son effectif entre parenthèses, « (30 pers.) » (en gras quand il est réduit), dans le menu à l'écran comme dans le menu imprimé. On peut ajouter d'autres repas (Goûter, Collation…) et les retirer, à **un seul jour ou à tous les jours** au choix ; un clic sur le nom d'un repas ouvre son panneau : renommer, choisir la couleur, monter/descendre (ou glisser sa poignée ⠿), supprimer le type, ou le retirer d'un jour / de tous les jours. Le même panneau règle l'**effectif d'un repas, section par section**, quand toute la troupe n'est pas présente (pour ce repas, pour tous les repas d'un jour, ou pour ce repas tous les jours) : les quantités (régimes compris), le budget et le coût par repas sont calculés avec les présents de chaque section, et l'effectif s'affiche sur le repas (👥 15/30) et dans le menu imprimable. Les plats se glissent d'un repas ou d'un jour à l'autre, à la souris, au doigt ou au clavier (flèches haut/bas pour l'ordre, gauche/droite pour changer de repas). Menu imprimable (avec ou sans descriptions et adaptations) et copie du menu d'un autre camp. Dans l'aperçu du menu imprimable, le crayon ✎ à côté des adaptations (régimes) d'un plat permet de les remplacer par son propre texte, de les masquer (texte vide) ou de revenir au texte automatique ; ce texte est utilisé dans l'impression, le fichier HTML et le CSV du menu.
- **Recettes** : nom et description modifiables avec ✎ (la description est verrouillée hors du mode édition ; en édition, les boutons **G** (gras) et **S** (souligné) ou Ctrl+B / Ctrl+U mettent la sélection en forme : le texte garde les marques `**gras**` et `__souligné__`, la lecture et l'impression les affichent mises en forme, le texte partagé et le CSV les retirent ; le menu de tous les camps suit un changement de nom), quantités par personne et par section (ou saisie « X pour N personnes » : « 1 pain pour 5 personnes » recopie 0,2 par personne dans toutes les sections, avec le total pour l'effectif actuel en aperçu), ou **quantité unique** pour un ingrédient (ex. 5 pains, 5 L de lait : bouton « → quantité unique » dans la fiche de l'ingrédient ; cette quantité n'est ni multipliée par l'effectif, ni augmentée de la marge, et elle est répartie au prorata des personnes au régime concernées — par exemple 3 personnes sans gluten sur 30 reçoivent 10 % du pain en pain sans gluten ; case « adapter aux régimes » désactivable) ; **fiche d'ingrédient** : un clic sur le nom d'un ingrédient (✎) ouvre sa fiche sous la ligne, la même que dans le catalogue de prix (nom, unité, prix, attention régime, rayon, Valider / Effacer / Fusionner / Annuler / Rétablir) avec en plus « → quantité unique » ; une seule fiche ouverte à la fois, et le ✕ de la ligne retire l'ingrédient de la recette sans le supprimer ; **ordre des ingrédients** modifiable avec la poignée ⠿ à gauche de chaque ingrédient (glisser, ou flèches haut/bas au clavier) : il est enregistré avec la recette et suivi par les documents (impression, partage, CSV) ; ingrédients personnalisés. **📥 Importer une recette** : colle le bloc `ld+json` (schema.org « Recipe ») d'une page de recettes (clic droit → code source → cherche `ld+json`) ; l'appli lit les ingrédients (g, kg, cl, c. à soupe, pièces…), propose pour chaque ligne un ingrédient existant, un nouvel ingrédient (avec « Attention régime » deviné) ou « ignorer », ramène les quantités par personne, et garde la source (adresse) dans la description. Les étapes de préparation ne sont reprises que si tu coches la case. Pour une page sans données « Recipe » (article, site sans ld+json), colle plutôt la liste des ingrédients, une ligne par ingrédient (nom de la recette et nombre de personnes à renseigner dans l'aperçu). L'appli n'appelle aucun site : elle ne lit que ce que tu colles.
- **Mode sombre / clair** : bouton 🌙/☀️ à côté de ⚙️ Configuration (barre du haut sur téléphone, menu sur ordinateur). Par défaut l'appli suit le réglage de l'appareil ; le choix est gardé sur l'appareil.
- **Rayons** : chaque ingrédient a un rayon (Fruits & légumes, Boucherie & poisson, Frigo (charcuterie, plats préparés), Frais (produits laitiers, œufs), Boulangerie, Épicerie & conserves, Surgelés, Boissons, Autre), choisi à l'ajout et modifiable avec ✎ dans le catalogue. Les ingrédients de base ont un rayon par défaut. La liste de courses est **groupée par rayon**, dans l'ordre du magasin (case « Grouper par rayon » ; mêmes titres dans l'impression, le partage et l'export, et colonne « Rayon » dans le CSV). L'import d'une recette devine le rayon des nouveaux ingrédients. Dans le catalogue de prix, une **liste déroulante des rayons** (triée par ordre alphabétique, avec le nombre d'ingrédients) filtre le tableau, en plus du filtre par nom ; le CSV du catalogue a une colonne « Rayon ». Le bouton **⚙️ Gérer les rayons** (à côté de la liste des rayons du catalogue) permet de créer, renommer, réordonner et supprimer les rayons : chaque rayon a un identifiant stable, donc renommer garde les produits et les imports de prix ; supprimer un rayon transfère ses produits vers le rayon choisi ; « Autre » ne peut pas être supprimé ; l'ordre est celui de la liste de courses et des exports ; les rayons sont communs à tous les camps et enregistrés avec le projet. Le script de collecte lit la catégorie Colruyt (champ `category`, ex. « Epicerie ») et la convertit en rayon de l'appli (`categorie` dans le fichier de prix) : elle est reprise pour les ingrédients qui n'ont pas encore de rayon et pour les produits ajoutés au catalogue.
- **Catalogue de prix** : saisie à la main ou import d'une liste de produits (CSV/texte, `nom ; prix`) ; l'appli lit le poids dans le nom du produit et retient le moins cher pour chaque ingrédient. Elle accepte aussi un fichier de prix `.json` (voir « Mettre à jour les prix Colruyt »). Pour un fichier `.json`, l'aperçu compare avec le catalogue actuel : hausses, baisses (en %), prix inchangés ou renseignés pour la première fois, promotions, rayons et liens produit repérés, produits changés et effet sur le budget de la liste de courses, avec un lien vers la fiche Colruyt de chaque produit (utilisable sur téléphone) et la possibilité de ne voir que ce qui change. Chaque ligne a un bouton **✎** pour renommer l'ingrédient, changer son unité ou son « Attention régime » (mêmes champs que l'ajout ; un changement de régime supprime les remplacements existants, avec un avertissement) (g ⇄ ml sans perte ; g/ml ⇄ pièce refusé tant que l'ingrédient est dans une recette), avec « Rétablir » pour revenir au nom d'origine ; **➕ Insérer un ingrédient** en bas de liste l'ajoute au catalogue sans l'ajouter à une recette ; c'est la même fenêtre que « + Nouvel ingrédient » de la page Recettes (qui ajoute en plus l'ingrédient à la recette), avec un prix facultatif. Si le nom existe déjà (accents, majuscules et pluriel ignorés), l'appli le signale, en précisant si l'unité est la même ou non, et demande confirmation avant de créer un doublon (depuis une recette, elle propose aussi d'utiliser l'ingrédient existant). Le bouton **⇄** de chaque ligne fusionne deux ingrédients, même utilisés dans des recettes : on choisit l'autre ingrédient et lequel garder (A → B ou B → A) ; les quantités des recettes sont additionnées, le prix est repris si l'ingrédient gardé n'en a pas, l'autre disparaît. Les deux doivent avoir la même unité. Si l'un est en quantité unique et l'autre par personne dans une même recette, la fusion est refusée (elle figerait le total pour l'effectif du moment). Le bouton **🔍 Vérifier les doublons** du catalogue liste les ingrédients de même nom et de même unité et fusionne dans le sens choisi (A → B ou B → A), après confirmation ; il signale à part les noms identiques d'unités différentes.
- **Liste de courses** : quantités, coût total, par personne et par repas. Sous le tableau, **Autres articles (hors recettes)** ajoute ce qui ne vient pas d'une recette (liquide vaisselle, boissons, sacs poubelle…) avec quantité, unité (pièces, kg ou L), prix et rayon : ces articles sont propres au camp, comptent dans la liste, le total et les documents (impression, partage, CSV), et restent dans le catalogue (sans apparaître dans les ingrédients de recette) pour garder leur prix.
- **Partager / imprimer** : liste, menu, recettes et catalogue de prix (prix des ingrédients) par WhatsApp, mail, partage du téléphone, copie, impression ou fichier HTML (utile si l'impression directe ne marche pas sur l'appareil). **Export CSV** de la liste de courses (avec coûts et total), du menu, des recettes et du catalogue de prix : le fichier s'ouvre directement dans Excel en français, pratique pour le budget et le trésorier.
- **Nouveautés** (menu ☰, entre Configuration et Sauvegarde) : l'historique des modifications, version par version, de la plus récente à la première (la dernière est dépliée). Il vient de `js/changelog.js`.
- **Sauvegarde** : export / import du projet en `.json` (le fichier est vérifié avant d'être accepté ; en cas de problème, rien n'est modifié et un message l'explique). Une « zone sensible » permet de vider les recettes, ingrédients et menus (les camps sont conservés) ou de tout réinitialiser (camps compris, retour aux données d'exemple).

## Mettre à jour les prix Colruyt

Colruyt n'a pas d'API publique et son site bloque les accès depuis un navigateur : les prix sont donc collectés **hors de l'appli**, dans un fichier `prix_colruyt.json` que tu charges toi-même dans le catalogue. L'appli ne contacte jamais Colruyt et fonctionne comme avant sans ce fichier.

1. **Collecte** : [![Ouvrir dans Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/pmeyssonnier/Patro-intendance-tools/blob/main/scripts/collecte_prix_colruyt.ipynb) (notebook `scripts/collecte_prix_colruyt.ipynb`). Il faut un compte Apify ; enregistre son jeton dans les secrets de Colab (icône clé) sous le nom `APIFY_TOKEN`. Aucun jeton GitHub n'est nécessaire, sauf pour le dépôt automatique (facultatif, voir plus bas).
2. **Vérification** : lance d'abord la cellule DEBUG, qui affiche les champs réellement renvoyés par le service ; si besoin, adapte les noms de champs dans `normaliser()`. Lance ensuite la cellule de collecte : elle liste les ingrédients sans résultat (les articles halal ou sans gluten en ont souvent), puis la dernière cellule télécharge `prix_colruyt.json`.
3. **Publication (facultatif, pour que tout le monde reçoive les prix sans refaire la collecte)** : dépose le fichier dans le dépôt GitHub sous `prix/prix_colruyt.json` (« Add file → Upload files », dossier `prix`). Dans l'appli, le bouton « 🌐 Récupérer les derniers prix » lit ce fichier : il ne contacte ni Apify ni Colruyt et ne consomme aucun crédit ; seule la collecte en consomme. L'aperçu s'affiche, rien n'est appliqué avant « Importer ». Les produits du fichier qui ne sont pas dans ton catalogue sont listés avec des cases à cocher : ceux que tu coches sont ajoutés au catalogue (avec leur prix, sans les mettre dans une recette).
4. **Chargement** : dans l'appli, page *Catalogue de prix* → « Importer des prix » → « Choisir un fichier » → sélectionne le `.json`. Une fenêtre d'import s'ouvre avec un aperçu (ancien prix → nouveau prix) ; clique sur « Importer » pour l'appliquer. Un exemple à tester se trouve dans `exemples/prix_colruyt_exemple.json`. Sans collecte, `exemples/prix_depart.csv` (un produit par ligne, avec les prix d'exemple de l'appli) s'ouvre dans Excel : remplace les prix par ceux du magasin, enregistre en CSV, puis importe-le de la même façon.

**Dépôt automatique sur GitHub (facultatif)** : au lieu de déposer les fichiers à la main, la dernière cellule du notebook (« Dépôt sur GitHub », `DEPOSER_SUR_GITHUB = True`) publie `prix/prix_colruyt.json` et `prix/ingredients_communs.json` dans le dépôt. Les prix collectés sont **fusionnés** avec ceux déjà publiés : un ingrédient non collecté cette fois garde son dernier prix. Préparation, une seule fois : sur GitHub, *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*, avec *Only select repositories* (ce dépôt) et la seule permission *Contents : Read and write*, puis une durée d'expiration ; enregistre-le dans les secrets de Colab (icône clé) sous le nom `GITHUB_TOKEN`. Le jeton n'est jamais affiché ni écrit dans un fichier, et ne doit jamais être collé dans le chat ni dans le code. Chaque dépôt est un commit sur `main` (`DEPOT_BRANCHE`) : si `main` exige une PR, indique une autre branche et ouvre la PR toi-même. Les prix sont en ligne dès que GitHub Pages a publié le commit.

**Liste commune (ingrédients de tous les utilisateurs)** : chaque utilisateur a sa propre liste, et le fichier publié est le même pour tous. Le notebook tient donc une liste commune, `prix/ingredients_communs.json` dans le dépôt (exemple : `exemples/ingredients_communs_exemple.json`). À chaque exécution (cellule « Liste commune »), il la lit depuis GitHub, y ajoute les ingrédients ajoutés à la main du catalogue que tu lui donnes (`UTILISER_CATALOGUE` et `AJOUTER_AU_COMMUN`), collecte leurs prix avec ceux de `INGREDIENTS`, puis télécharge la liste mise à jour (`ingredients_communs.json`) : redépose-la dans le dépôt, dossier `prix`. Dans l'appli, les produits du fichier absents du catalogue sont proposés avec des cases à cocher à l'import. Pour retirer un produit de la liste commune, supprime sa ligne dans le fichier. Colab ne garde rien d'une exécution à l'autre, d'où ce fichier dans le dépôt.

À savoir :

- Les prix sont reliés aux ingrédients **par identifiant** (`pates`, `riz`, `lait`…) ; à défaut d'identifiant connu, **par le nom** (`nom` ou `requete` du fichier) : sans tenir compte des accents, des majuscules ni du pluriel, et quand tous les mots de l'un figurent dans l'autre (« Pains » → Pain, « Pate à tartiner » → Pâte à tartiner, « poivron rouge » → Poivrons). Si plusieurs ingrédients se valent, la ligne est ignorée. Dans les deux cas, l'unité doit correspondre (€/kg pour un ingrédient en g, €/L pour un ingrédient en ml, €/pièce pour une pièce). Les ingrédients absents du fichier gardent leur prix.
- Les prix chargés **remplacent** les prix déjà saisis pour les ingrédients présents dans le fichier. Le nom du produit retenu s'affiche en « ↳ » sous l'ingrédient.
- **Lien du produit** : le script ajoute au fichier de prix l'adresse de la fiche Colruyt du produit retenu (`lien`). Dans le catalogue et la liste de courses, le nom du produit (« ↳ … 🔗 ») devient cliquable et ouvre la fiche sur colruyt.be dans un nouvel onglet ; le CSV a une colonne « Lien produit » et le fichier HTML du catalogue garde les liens (pas l'impression papier ni le texte WhatsApp). Seules les adresses en `https://www.colruyt.be/…` sont acceptées (fichier de prix et de projet). Le lien disparaît si tu saisis le prix à la main.
- **Promotions** : si Colruyt indique pour le produit retenu un prix promotionnel numérique moins cher que le prix normal, le script l'ajoute au fichier de prix (`promo` : prix par unité et texte). L'appli l'affiche (🏷️ « promo : … ») sous le produit dans le catalogue et la liste de courses, avec l'économie possible, et additionne les économies sous le total de la liste (« Promos possibles »). Le **budget garde le prix normal** : une promotion est temporaire. Elle disparaît si tu saisis le prix à la main. Une promotion écrite en texte (« 2+1 gratuit ») n'est pas prise en compte pour l'instant.
- **Catégories Colruyt** : la cellule « Catégories Colruyt rencontrées » (après la collecte) liste chaque catégorie vue, le nombre de produits et le rayon de l'appli proposé. Pour une catégorie non reconnue, elle imprime les lignes à copier dans `RAYONS_PERSO` (cellule « Utilitaires ») avec la clé du bon rayon (`fl`, `bou`, `fri`, `lai`, `boul`, `epi`, `sur`, `boi`, `aut`), puis relance la collecte.
- **Ruptures de stock** : le script écarte les produits que Colruyt indique en rupture (champ `inStock`) ; si le stock n'est pas indiqué, le produit est gardé. Si tous les produits pertinents d'un ingrédient sont en rupture, son prix dans l'appli est conservé et le notebook l'indique.
- **Ajouter un ingrédient à la collecte** : ajoute une ligne `{"id": …, "q": …, "unite": …}` dans `INGREDIENTS` (l'`id` doit être identique à celui de l'appli). Pour forcer un produit précis, ajoute `"epingle": "<identifiant produit Colruyt>"`. **Ingrédients ajoutés à la main dans les recettes** (identifiants `c_…`) : dans l'appli, « 💾 Exporter le catalogue » ; dans le notebook, mets `UTILISER_CATALOGUE = True` (cellule « Catalogue exporté de l'appli ») et choisis ce fichier quand Colab le demande. Le script cherche alors chaque ingrédient du catalogue par son nom et produit un JSON relié aux mêmes identifiants, à recharger **sur le même appareil** (les identifiants `c_…` changent d'un appareil à l'autre). `SEULEMENT_PERSO = True` ne collecte que les ingrédients ajoutés à la main. Si le nom de l'ingrédient ne donne rien sur Colruyt (« Côté de porc » au lieu de « côtelettes de porc »), indique la recherche à utiliser dans `REQUETES_PERSO` ; pour un ingrédient compté à la pièce mais vendu au kilo (poivrons), indique le poids moyen d'une pièce en grammes dans `POIDS_PIECE_G` : le prix d'une pièce est alors calculé à partir du prix au kilo.
- Le service de collecte (acteur Apify `studio-amba~colruyt-scraper`) est tiers et payant, et ses champs n'ont pas été vérifiés. La collecte automatisée de prix peut aller à l'encontre des conditions d'utilisation de Colruyt : à toi de voir si cet usage te convient.

## Accessibilité

Tous les boutons et champs ont un nom pour les lecteurs d'écran, le menu ☰ et le déplacement des plats se font au clavier, et la navigation est annoncée (page courante, déplacements de plats).

## Conseils

- **Plusieurs onglets** : si l'appli est ouverte dans deux onglets du même navigateur, celui qui n'a pas enregistré en dernier est prévenu (bandeau rouge) et n'écrase pas le travail de l'autre. « 🔄 Recharger » reprend les données de l'autre onglet ; « Garder cet onglet » remplace les siennes par celles de cet onglet.
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
| `js/ingredient-matching.js` | comparer les noms d'ingrédients (doublons, correspondances) |
| `js/ingredients.js` | modifier, créer et exporter les ingrédients (données) |
| `js/ingredient-merge.js` | détecter les doublons et fusionner deux ingrédients (données) |
| `js/price-import.js` | lire, comparer et appliquer les prix importés (JSON, CSV/texte) |
| `js/rayons.js` | créer, renommer, ordonner et supprimer les rayons (données) |
| `js/catalog-ui.js` | catalogue de prix : tableau, fenêtres d'import, d'ingrédient, de fusion et de doublons |
| `js/recipe-import.js` | import d'une recette collée (ld+json) |
| `js/changelog.js` | page « Nouveautés » : historique des versions (à compléter à chaque release) |
| `js/config.js` | configuration : nom de la troupe, logo, sections |
| `js/pwa.js` | installation et hors connexion |
| `js/main.js` | démarrage |
| `assets/logo-pss.jpg` | logo par défaut |
| `manifest.webmanifest`, `sw.js`, `icons/` | installation et usage hors connexion |

Ce sont des **scripts classiques**, pas des modules : les fichiers `js/` partagent les mêmes variables et **l'ordre de chargement** (`index.html`) compte, chacun dépendant de ceux qui le précèdent. Un nouveau fichier doit aussi être ajouté à la liste de `sw.js` pour fonctionner hors connexion (un test le vérifie) ; changer cette liste impose de changer le nom du cache (`pss-v…`) dans `sw.js`.

Le numéro de version affiché sous « Outil fait par… » (bas du menu et bas de page) vient de `APP_VERSION` dans `js/data-defaults.js` : à mettre à jour à chaque release, avec `"version"` dans `package.json` et les `?v=…` de `styles.css` et des scripts dans `index.html` (ils obligent le navigateur à recharger les fichiers après une release ; un test vérifie que tout est identique). Ajoute aussi une entrée en tête de `CHANGELOG` dans `js/changelog.js` (page « Nouveautés ») : un test vérifie qu'elle porte le même numéro.

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
