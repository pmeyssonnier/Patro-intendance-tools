/* Intendance PSS – Page « Nouveautés » : historique des modifications, de la plus récente à la plus ancienne.
   À compléter à chaque version : la première entrée doit porter le même numéro que APP_VERSION (un test le vérifie).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Une entrée par version : { v: numéro, d: date AAAA-MM-JJ (ou texte), t: titre court, l: liste des changements }. */
const CHANGELOG = [
  {
    v: "1.53.0",
    d: "2026-10-09",
    t: "Partager / imprimer : toujours un fichier HTML",
    l: [
      "Le choix « Envoyer en » est supprimé : WhatsApp, Mail et Partager… envoient toujours le fichier HTML. L'envoi en texte (liens WhatsApp et mail coupés) n'existe plus.",
    ],
  },
  {
    v: "1.52.0",
    d: "2026-10-09",
    t: "Partager / imprimer : envoi en fichier HTML",
    l: [
      "WhatsApp, Mail et Partager… envoient par défaut un fichier HTML (le même que « Fichier HTML ») par le menu de partage du téléphone ; un choix « Envoyer en : Texte » garde l'ancien envoi. Sans partage de fichier (ordinateur), le fichier est téléchargé à joindre au message.",
      "Le bouton « Copier » et le choix « Recette affichée » sont supprimés (« Toutes les recettes » reste).",
    ],
  },
  {
    v: "1.51.0",
    d: "2026-10-09",
    t: "Sauvegarde : « Partager » envoie le fichier .json exporté",
    l: [
      "« Partager » envoie le même fichier .json que « Exporter le projet » (plus de renommage en .txt). Si le téléphone le refuse, un nouvel appui envoie le même contenu en texte, comme « Copier le projet ».",
    ],
  },
  {
    v: "1.50.0",
    d: "2026-10-09",
    t: "Recettes (fichier HTML) : navigation par type et thème",
    l: [
      "En haut : les types et thèmes en pastilles. Colonne de gauche : la liste des recettes du type choisi. Au centre : la ou les recettes correspondantes. « Toutes » affiche tout ; un clic sur une recette n'affiche qu'elle. Sur téléphone, les colonnes s'empilent. Sans JavaScript, tout reste affiché avec des liens.",
      "Ingrédients : sous le nom, le libellé du produit Colruyt retenu, lié à sa fiche (impression comprise).",
    ],
  },
  {
    v: "1.49.0",
    d: "2026-10-09",
    t: "Partage : menu en texte complet, types des recettes",
    l: [
      "Partager le menu (WhatsApp, mail, copier) : la description des recettes et les adaptations (régimes) sont ajoutées sous chaque plat quand les cases correspondantes du menu sont cochées, comme à l'impression.",
      "Toutes les recettes : les types et thèmes sont indiqués (« Types et thèmes : … ») à l'impression et dans le fichier HTML, et le CSV a une colonne « Types et thèmes ».",
      "Catalogue de prix : l'impression, le fichier HTML et le texte (WhatsApp, mail, copier) indiquent le rayon, le libellé du produit Colruyt et son adresse, comme le CSV.",
      "Toutes les recettes (fichier HTML) : un sommaire en haut propose des pastilles par type ou thème, qui mènent à la liste des recettes du type puis à chaque recette ; une flèche ↑ ramène au sommaire. Le sommaire n'est pas imprimé.",
    ],
  },
  {
    v: "1.48.0",
    d: "2026-10-09",
    t: "Liste de courses : produit, lien, prix et coût dans l'export HTML et le partage",
    l: [
      "Partager / imprimer : la liste de courses en HTML a une colonne « Produit Colruyt » avec le libellé du produit retenu, lié à sa fiche, et l'adresse affichée en dessous.",
      "Partager (WhatsApp, mail, copier) : chaque ligne de la liste de courses indique aussi le prix et le coût, puis le produit Colruyt et son adresse en dessous.",
    ],
  },
  {
    v: "1.47.0",
    d: "2026-10-09",
    t: "Prix saisi à la main : le lien du produit est conservé",
    l: [
      "Modifier le prix d'un ingrédient (catalogue, fiche ✎ ou liste de courses) ne fait plus disparaître le lien du produit. Le nom du produit retenu à l'import et la promotion, eux, sont toujours oubliés.",
    ],
  },
  {
    v: "1.46.0",
    d: "2026-10-09",
    t: "Catalogue : lien du produit dans la fiche d'un ingrédient",
    l: [
      "La fiche de modification d'un ingrédient (✎) a un champ « Lien du produit (colruyt.be) » : on peut le saisir, le corriger ou l'effacer. Seules les adresses https://www.colruyt.be/… sont acceptées.",
    ],
  },
  {
    v: "1.45.0",
    d: "2026-10-08",
    t: "Vérifier les doublons : noms proches",
    l: [
      "« Vérifier les doublons » repère aussi un nom inclus dans un autre (« Huile d'olive » et « Huile d'olive extra vierge ») et propose de les fusionner.",
    ],
  },
  {
    v: "1.44.0",
    d: "2026-10-08",
    t: "Catalogue : huile d'olive ajoutée",
    l: [
      "Le catalogue de base inclut maintenant l'huile d'olive extra vierge EVERYDAY 1 L à 6,99 €/L, rayon Épicerie & conserves, avec sa fiche Colruyt.",
    ],
  },
  {
    v: "1.43.0",
    d: "2026-10-08",
    t: "Boutons plus compacts sur téléphone",
    l: [
      "Catalogue de prix : les 4 boutons tiennent sur 2 lignes (libellés courts) au lieu de 4.",
      "Recettes : les 3 boutons tiennent sur une seule ligne et les pastilles de filtre sont plus petites.",
    ],
  },
  {
    v: "1.42.0",
    d: "2026-10-08",
    t: "Sauvegarde : « Partager » contourne le refus « Permission denied »",
    l: [
      "Certains téléphones Android refusent le partage d'un fichier avec « Permission denied ». « Partager » essaie maintenant d'abord un fichier .txt (le mieux accepté), puis .json, puis le texte : après un refus, un nouvel appui sur « Partager » essaie le format suivant, et le message le dit.",
    ],
  },
  {
    v: "1.41.0",
    d: "2026-10-08",
    t: "WhatsApp : un texte long arrive en entier",
    l: [
      "Quand le texte est trop long pour un lien WhatsApp (par exemple toutes les recettes), le bouton WhatsApp ouvre le menu de partage du téléphone : il suffit d'y choisir WhatsApp, le texte arrive en entier. Sans menu de partage (certains ordinateurs), le début est envoyé et le texte complet est copié.",
    ],
  },
  {
    v: "1.40.0",
    d: "2026-10-08",
    t: "Partager / imprimer : textes longs et copie plus fiables",
    l: [
      "WhatsApp et Mail : quand le texte est trop long pour un lien (les messageries le coupent), le début est envoyé, coupé à une fin de ligne, et le texte complet est copié pour être collé à la suite.",
      "Copier : si le navigateur refuse l'accès au presse-papiers (navigateur intégré à une appli, page sans HTTPS), un second moyen est essayé.",
      "Partager… : une vraie erreur est maintenant signalée au lieu d'être ignorée. Mail : un rappel d'utiliser « Copier » si aucune messagerie ne s'ouvre.",
    ],
  },
  {
    v: "1.39.0",
    d: "2026-10-08",
    t: "Sauvegarde : « Partager » marche sur plus d'appareils",
    l: [
      "« Partager » essaie d'abord le fichier .json ; si le navigateur le refuse (Chrome sur Android), il partage le même contenu en fichier .txt, puis en texte seul.",
      "L'import accepte maintenant les fichiers .json et .txt.",
      "Quand le navigateur n'a pas de partage (Firefox, certains navigateurs de bureau), le bouton est masqué ; « Exporter » et « Copier le projet » restent disponibles. Une vraie erreur de partage est maintenant affichée.",
    ],
  },
  {
    v: "1.38.0",
    d: "2026-10-08",
    t: "Fenêtres « Gérer les rayons / les types » : un seul modèle, plus compact sur téléphone",
    l: [
      "Les fenêtres « Gérer les rayons » et « Gérer les types et thèmes » partagent maintenant le même modèle (mise en page, lignes et pied de fenêtre).",
      "Sur téléphone : chaque ligne tient sur une seule ligne (▲ ▼, nom, nombre, 🗑), le texte d'aide est réduit, et le pied de la fenêtre (ajout, bouton Fermer) reste toujours visible pendant que la liste défile.",
    ],
  },
  {
    v: "1.37.0",
    d: "2026-10-08",
    t: "Gérer les types : même présentation que les rayons",
    l: [
      "Dans « Gérer les types et thèmes », les flèches ▲ ▼ passent devant le nom, comme dans « Gérer les rayons ».",
    ],
  },
  {
    v: "1.36.0",
    d: "2026-10-08",
    t: "Recettes : gérer les types et thèmes",
    l: [
      "Nouveau bouton « ⚙️ Gérer les types » sur la page Recettes : renommer, déplacer, supprimer ou ajouter des types, y compris ceux d'origine (Petit-déjeuner, Chaud, Froid…).",
      "Renommer ou supprimer un type le change dans toutes les recettes qui le portent (avec confirmation pour la suppression). « Rétablir la liste d'origine » remet la liste de départ.",
      "La liste modifiée est enregistrée dans le projet (sauvegarde et export compris) ; les propositions « d'après la description » ne suggèrent plus que les types qui existent.",
    ],
  },
  {
    v: "1.35.0",
    d: "2026-10-08",
    t: "Téléphone : plus de débordement",
    l: [
      "Fiche de recette : le tableau des ingrédients défile de côté dans son cadre, avec le nom de l'ingrédient qui reste visible, au lieu de faire déborder toute la fenêtre.",
      "Catalogue de prix : le filtre « sans prix » passe à la ligne au lieu de dépasser de l'écran.",
      "Boutons ⧉ ✎ ✕ de la liste des recettes et nom des repas du menu : zones de toucher plus hautes (24 px au moins).",
    ],
  },
  {
    v: "1.34.0",
    d: "2026-10-08",
    t: "Listes plus compactes et même police partout",
    l: [
      "Page Recettes : la liste utilise la même police que les tableaux de saisie (14 px, graisse normale), avec des lignes serrées.",
      "Ingrédients d'une recette : nom sur une ligne plus basse et plus petite, champs et bouton ✕ plus compacts : environ 35 px par ligne au lieu de 48, pour en voir plus à l'écran.",
      "Pied de la fenêtre de recette : les boutons Enregistrer, Enregistrer et fermer, Annuler tiennent sur une ligne sur téléphone.",
    ],
  },
  {
    v: "1.33.0",
    d: "2026-10-08",
    t: "Menu : repas en blanc, plus de barre de types ; total des effectifs",
    l: [
      "La barre « Afficher : Plat, Dessert… » est retirée de la page Menu. Le filtre par types reste sur la page Recettes ; « + Ajouter un plat… » propose toutes les recettes, par ordre alphabétique.",
      "Menu : le nom des repas (Matin, Midi…) et leur effectif sont toujours en blanc, quelle que soit la couleur du repas.",
      "Camp & effectifs : le total de la troupe s'affiche sous les champs de section.",
    ],
  },
  {
    v: "1.32.0",
    d: "2026-10-08",
    t: "Recettes et catalogue : plus compacts",
    l: [
      "Description d'une recette : un bouton bascule entre la saisie (avec les marques de mise en forme) et l'aperçu ; les deux ne s'affichent plus ensemble.",
      "Catalogue de prix : le filtre « sans prix » est sur la ligne du titre, à droite, et la colonne Ingrédient garde sa largeur, filtre ou non.",
      "Page Recettes : lignes de la liste plus serrées, comme celles du tableau des ingrédients, pour en voir plus.",
    ],
  },
  {
    v: "1.31.0",
    d: "2026-10-08",
    t: "Fenêtre de recette : types en accordéon",
    l: [
      "Types, thèmes et mots-clés : un volet repliable comme la description (clic sur le titre) ; replié, il liste les types cochés. Le réglage est retenu.",
    ],
  },
  {
    v: "1.30.0",
    d: "2026-10-08",
    t: "Description de recette : italique, aperçu et volet repliable ; catalogue sans prix",
    l: [
      "Nouveau bouton I (ou Ctrl+I) : met la sélection en italique, noté *mot*.",
      "Sous le champ de saisie, un aperçu montre la description avec sa mise en forme (gras, souligné, italique), sans les marques.",
      "La description se replie et se déplie comme les types et thèmes (réglage retenu).",
      "Tableau des ingrédients : titre « Ingrédients » et plus de tranche d'âge sous le nom des sections, pour gagner de la place.",
      "Prix des ingrédients : une case « Afficher seulement les ingrédients sans prix » (avec leur nombre) pour repérer ce qu'il reste à renseigner. Elle se combine avec le rayon et la recherche.",
    ],
  },
  {
    v: "1.29.0",
    d: "2026-10-08",
    t: "Fenêtre de recette : réglages",
    l: [
      "Un clic à côté de la fenêtre de recette ne la ferme plus (Échap demande confirmation s'il y a des changements).",
      "« Enregistrer » garde la fenêtre ouverte pour voir le résultat ; « Enregistrer et fermer » la referme. « Annuler » revient au dernier enregistrement.",
      "Le tableau des ingrédients n'a plus d'ascenseur : c'est la fenêtre qui défile. Lignes un peu plus serrées pour en voir plus.",
      "Les types, thèmes et mots-clés se masquent et se montrent d'un bouton (réglage retenu).",
    ],
  },
  {
    v: "1.28.0",
    d: "2026-10-08",
    t: "Recettes : liste compacte et fiche dans une fenêtre",
    l: [
      "La page Recettes montre les filtres, puis la liste des recettes filtrée et triée par ordre alphabétique : une ligne par recette, avec les boutons ⧉ (dupliquer), ✎ (modifier) et ✕ (supprimer).",
      "Un clic sur une recette ouvre sa fiche dans une fenêtre : nom, types et mots-clés, description, tableau des ingrédients, « Ajouter un ingrédient » et « + Nouvel ingrédient ». Rien n'est gardé avant « Enregistrer » ; « Annuler » rétablit la recette (les changements faits dans la fiche d'un ingrédient du catalogue, eux, restent).",
      "« + Nouvelle recette » et « 📥 Importer une recette » sont au-dessus de la liste, hors de la fenêtre.",
    ],
  },
  {
    v: "1.27.0",
    d: "2026-10-08",
    t: "Recettes : tri alphabétique, types et thèmes, filtre",
    l: [
      "La liste des recettes (page Recettes et choix d'un plat dans le menu) est triée par ordre alphabétique, sans tenir compte des accents ni des majuscules.",
      "Chaque recette peut porter des types, des thèmes et des mots-clés (Entrée, Plat, Dessert, Chaud, Froid, Italien, Asiatique, Barbecue…) : on les coche dans la fiche, et on peut ajouter ses propres mots-clés avec « Nouveau mot-clé ». L'appli propose des types d'après le nom, la description et les ingrédients ; un bouton propose aussi des types à toutes les recettes qui n'en ont pas.",
      "Filtre « visible ou pas » : des pastilles au-dessus de la liste des recettes (et du menu) n'affichent que les recettes qui portent au moins un des types cochés, « Sans type » compris. Le filtre est un réglage de l'appareil.",
      "Les types sont enregistrés avec la recette (export, import), et apparaissent sur la recette imprimée.",
    ],
  },
  {
    v: "1.26.0",
    d: "2026-10-08",
    t: "Menu imprimable : adaptations des régimes modifiables",
    l: [
      "Menu du camp, aperçu du menu imprimable : un crayon ✎ à côté des adaptations (régimes) de chaque plat permet de les remplacer par son propre texte, ou de les masquer. « Texte automatique » rétablit le calcul.",
      "Le texte choisi est utilisé dans l'impression, le fichier HTML et le CSV du menu. Il est rangé par camp, jour, repas et plat ; il suit si une recette est renommée.",
    ],
  },
  {
    v: "1.25.0",
    d: "2026-10-07",
    t: "Gras et souligné, effectif lisible sur le menu imprimé",
    l: [
      "Recettes : dans la description, on peut mettre des mots en gras ou soulignés (boutons G et S en mode édition, ou Ctrl+B / Ctrl+U). La mise en forme se voit à la lecture et dans l'impression ; elle est retirée du texte partagé et du CSV.",
      "Menu imprimable : « 30 pers. » prend la couleur du nom du repas, donc il se lit sur toutes les couleurs de repas.",
    ],
  },
  {
    v: "1.24.1",
    d: "2026-10-07",
    t: "Régimes triés par ordre alphabétique",
    l: [
      "Régimes : les règles de remplacement et les listes d'ingrédients et de substituts sont triées par ordre alphabétique.",
    ],
  },
  {
    v: "1.24.0",
    d: "2026-10-07",
    t: "Gérer les rayons",
    l: [
      "Catalogue de prix : un bouton « Gérer les rayons » permet de créer, renommer, réordonner et supprimer les rayons (les produits d'un rayon supprimé sont transférés vers le rayon choisi).",
      "L'ordre des rayons est celui de la liste de courses et des exports. « Autre » reste toujours disponible. Les rayons sont les mêmes pour tous les camps.",
    ],
  },
  {
    v: "1.23.0",
    d: "2026-10-07",
    t: "Page Nouveautés",
    l: [
      "Un menu « Nouveautés » entre Configuration et Sauvegarde reprend l'historique des modifications depuis le début.",
    ],
  },
  {
    v: "1.22.0",
    d: "2026-10-07",
    t: "Fiche d'ingrédient dans les recettes",
    l: [
      "Recettes : chaque ingrédient est dans une boîte avec sa poignée ⠿, son nom en bouton (✎) et le ✕ pour le retirer.",
      "Un clic sur le nom ouvre la fiche de l'ingrédient, la même que dans le catalogue de prix (nom, unité, prix, régime, rayon). « → quantité unique » est dans cette fiche.",
    ],
  },
  {
    v: "1.21.2",
    d: "2026-10-07",
    t: "Poignée des repas toujours visible",
    l: [
      "Menu : la poignée ⠿ de chaque repas est visible sans ouvrir le crayon, et l'étiquette est élargie pour ne plus couper les noms.",
    ],
  },
  {
    v: "1.21.1",
    d: "2026-10-07",
    t: "Effectif de chaque repas",
    l: [
      "Menu : chaque repas indique son effectif, « (30 pers.) », à l'écran et sur le menu imprimé.",
    ],
  },
  {
    v: "1.21.0",
    d: "2026-10-07",
    t: "Ordre des ingrédients",
    l: [
      "Recettes : une poignée ⠿ permet de réordonner les ingrédients (glisser, ou flèches du clavier). L'ordre est enregistré et repris par l'impression, le partage et le CSV.",
    ],
  },
  {
    v: "1.20.4",
    d: "2026-10-07",
    t: "Plusieurs onglets",
    l: [
      "Sauvegarde : un onglet qui n'a pas enregistré en dernier est prévenu au lieu d'écraser le travail de l'autre (Recharger, ou Garder cet onglet).",
    ],
  },
  {
    v: "1.20.3",
    d: "2026-10-07",
    t: "Thème clair/sombre simplifié",
    l: [
      "Les couleurs du mode clair et du mode sombre sont définies une seule fois (aspect inchangé).",
    ],
  },
  {
    v: "1.20.2",
    d: "2026-10-07",
    t: "Corrections de fiabilité",
    l: [
      "Liste de courses : ajouter deux fois le même article additionne bien les quantités.",
      "Recettes : un nom de plus de 100 caractères est refusé dès la création.",
      "Les saisies numériques (effectifs, marge, quantités, prix) restent dans des bornes valides.",
      "La fusion de deux ingrédients est refusée quand l'un est en quantité unique et l'autre par personne.",
      "Hors connexion : une erreur du serveur ne remplace plus la copie gardée par l'appli.",
    ],
  },
  {
    v: "1.20.1",
    d: "2026-10-07",
    t: "Code du catalogue découpé",
    l: ["Le fichier du catalogue est découpé en cinq modules (aucun changement visible)."],
  },
  {
    v: "1.20.0",
    d: "2026-10-07",
    t: "Effectif réglé section par section",
    l: [
      "Menu : l'effectif d'un repas se règle section par section (un repas, un jour, ou un repas tous les jours).",
    ],
  },
  {
    v: "1.19.0",
    d: "2026-10-07",
    t: "Effectif réduit pour un repas ou un jour",
    l: [
      "Menu : quand toute la troupe n'est pas là, on réduit l'effectif d'un repas ou d'un jour ; les quantités de la liste de courses suivent, régimes compris.",
    ],
  },
  {
    v: "1.18.1",
    d: "2026-10-07",
    t: "Options d'un repas sur demande",
    l: [
      "Menu : les options d'un repas (nom, couleur, ordre, retrait) ne s'affichent qu'en mode modification.",
    ],
  },
  {
    v: "1.18.0",
    d: "2026-10-07",
    t: "Panneau de modification d'un repas",
    l: [
      "Menu : un clic sur le nom d'un repas (Matin, Midi…) ouvre un panneau : nom, couleur, monter/descendre, retrait pour un jour ou tous les jours.",
      "Une poignée ⠿ permet de déplacer les repas.",
    ],
  },
  {
    v: "1.17.1",
    d: "2026-10-07",
    t: "Boutons d'import toujours visibles",
    l: ["Import de prix : les boutons Importer et Annuler restent visibles en bas de la fenêtre."],
  },
  {
    v: "1.17.0",
    d: "2026-10-07",
    t: "Aperçu détaillé de l'import de prix",
    l: [
      "Import de prix : l'aperçu montre les hausses, les baisses, les nouveaux prix, les promotions, les rayons, les liens et l'effet sur le budget.",
      "Un lien vers la fiche du produit et un filtre « voir seulement ce qui change ».",
    ],
  },
  {
    v: "1.16.0",
    d: "2026-10-07",
    t: "Vérifier les doublons",
    l: [
      "Catalogue : le bouton « Vérifier les doublons » liste les doublons et les fusionne dans le sens choisi.",
    ],
  },
  {
    v: "1.15.1",
    d: "2026-10-07",
    t: "Un seul bouton ✎ par ingrédient",
    l: [
      "Catalogue : un seul bouton ✎ ouvre la modification (nom, unité, prix, régime, rayon, puis Valider / Effacer / Fusionner / Annuler).",
    ],
  },
  {
    v: "1.15.0",
    d: "2026-10-07",
    t: "Articles hors recettes",
    l: [
      "Liste de courses : ajout d'articles qui ne viennent pas d'une recette (liquide vaisselle, boissons…), propres au camp.",
    ],
  },
  {
    v: "1.14.0 – 1.14.2",
    d: "2026-10-07",
    t: "Ajout d'ingrédient et fusion",
    l: [
      "Un seul formulaire pour ajouter un ingrédient (catalogue et recettes), avec contrôle des doublons sur le nom et l'unité.",
      "Fusion de deux ingrédients, même utilisés dans des recettes. Depuis une recette, on peut utiliser l'ingrédient existant.",
    ],
  },
  {
    v: "1.13.0 – 1.13.1",
    d: "2026-10-06",
    t: "Import de prix dans une fenêtre",
    l: [
      "Catalogue : « Importer des prix » s'ouvre dans une fenêtre.",
      "Un prix manquant est signalé en rouge, comme dans la liste de courses.",
    ],
  },
  {
    v: "1.12.0",
    d: "2026-10-06",
    t: "Lien vers le produit",
    l: [
      "Catalogue et liste de courses : le nom du produit ouvre sa fiche sur colruyt.be (aussi dans le CSV et le fichier HTML).",
    ],
  },
  {
    v: "1.11.0 – 1.11.2",
    d: "2026-10-06",
    t: "Promotions",
    l: [
      "Les promotions repérées par la collecte s'affichent dans le catalogue et la liste de courses, avec l'économie possible. Le budget garde le prix normal.",
      "La liste des rayons du catalogue est plus large.",
    ],
  },
  {
    v: "1.10.0 – 1.10.1",
    d: "2026-10-06",
    t: "Filtre par rayon dans le catalogue",
    l: [
      "Catalogue : une liste déroulante des rayons (triée, avec le nombre d'ingrédients) filtre les prix.",
    ],
  },
  {
    v: "1.9.0 – 1.9.9",
    d: "2026-10-06",
    t: "Rayons, mode sombre, renommer une recette",
    l: [
      "Rayons : chaque ingrédient a un rayon, et la liste de courses est groupée par rayon dans l'ordre du magasin.",
      "Mode sombre / clair : un bouton à côté de la configuration, le choix est gardé sur l'appareil.",
      "Recettes : renommer une recette (le menu de tous les camps suit), description enregistrée en tapant et verrouillée hors du mode édition, confirmation avant de retirer un ingrédient.",
      "Sauvegarde : message d'état à l'export, avec « Copier le projet » et « Partager » en repli.",
    ],
  },
  {
    v: "1.8.0 – 1.8.2",
    d: "2026-10-06",
    t: "Importer une recette",
    l: [
      "Recettes : importer une recette collée (bloc ld+json d'une page de recettes, ou simple liste d'ingrédients).",
      "Catalogue : modifier un ingrédient avec les mêmes champs que l'ajout, dont « Attention régime ».",
    ],
  },
  {
    v: "1.7.0 – 1.7.4",
    d: "2026-10-06",
    t: "Gestion du catalogue",
    l: [
      "Catalogue : renommer un ingrédient, changer son unité, en insérer un nouveau ; suppression refusée s'il est dans une recette.",
      "Bouton « Récupérer les derniers prix » (fichier publié avec l'appli), et ajout au catalogue des produits absents.",
    ],
  },
  {
    v: "1.6.0 – 1.6.5",
    d: "2026-10-05",
    t: "Prix Colruyt",
    l: [
      "Catalogue : chargement d'un fichier de prix JSON avec aperçu avant import, filtre par nom, export du catalogue.",
      "Collecte automatique des prix Colruyt (notebook Colab) et relation d'un prix à l'ingrédient par son nom.",
      "Recettes : saisie « X pour N personnes ». Pièces : arrondi sans erreur de calcul. Catalogue de prix dans Partager / imprimer.",
    ],
  },
  {
    v: "1.5.0 – 1.5.1",
    d: "2026-10-05",
    t: "Configuration, tableaux repliables",
    l: [
      "Configuration (⚙️) : nom de la troupe, logo et sections modifiables, triables et supprimables.",
      "Menu : jours repliables avec résumé (x plats / x repas) et bouton Tout replier.",
      "Régimes : blocs dépliables sur téléphone et vérification que l'effectif d'un régime ne dépasse pas celui de la section.",
      "Tableaux de recettes, de catalogue et de liste de courses : toutes les colonnes tiennent dans l'écran.",
    ],
  },
  {
    v: "1.0.0 – 1.4.0",
    d: "2026-10-04",
    t: "Les débuts",
    l: [
      "Menu du camp par jour et par repas, avec glisser-déposer, couleurs, repas supplémentaires (goûter…) et menu imprimable en couleur.",
      "Un projet par camp (dates, effectifs, régimes, menu), menu latéral ☰, régimes et allergies modifiables.",
      "Recettes avec quantité par personne ou quantité unique répartie selon les régimes.",
      "Liste de courses avec coûts, partage et impression, export CSV (Excel en français).",
      "Application installable sur téléphone et utilisable hors connexion, import et export du projet vérifiés.",
    ],
  },
];

/** Date « AAAA-MM-JJ » → « JJ/MM/AAAA » (un autre texte est affiché tel quel). */
const dateFr = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split("-").reverse().join("/") : d);

/** Dessine l'historique : la dernière version est dépliée, les autres repliées. */
function drawNouveautes() {
  $("nvl").innerHTML = CHANGELOG.map(
    (e, i) =>
      `<details class="nv"${i === 0 ? " open" : ""}><summary><b>${esc(e.v)}</b> <span class="s">${esc(dateFr(e.d))}</span> — ${esc(e.t)}</summary><ul>${e.l.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></details>`
  ).join("");
}
