/* Intendance PSS – Page « Nouveautés » : historique des modifications, de la plus récente à la plus ancienne.
   À compléter à chaque version : la première entrée doit porter le même numéro que APP_VERSION (un test le vérifie).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

/** Une entrée par version : { v: numéro, d: date AAAA-MM-JJ (ou texte), t: titre court, l: liste des changements }. */
const CHANGELOG = [
  {
    v: "1.32.0",
    d: "2026-10-08",
    t: "Groupes en ligne : synchronisation, invitations et historique",
    l: [
      "Configuration : connexion par un lien envoyé par e-mail (sans mot de passe). Sans connexion, rien ne change : tout reste sur l'appareil et l'application fonctionne comme avant.",
      "Mon groupe : un administrateur crée un groupe (Sainte-Suzanne, Uccle, Forest…), invite des personnes par e-mail et choisit leur rôle (administrateur, éditeur ou lecteur). Les groupes sont cloisonnés : on ne voit que les siens.",
      "Synchronisation : camps, recettes, prix, régimes et sections sont envoyés au groupe en tâche de fond ; le travail reste possible sans réseau. Un indicateur ☁️ en haut de page montre l'état.",
      "Conflits : si quelqu'un d'autre a modifié le groupe entre-temps, un bandeau propose de charger sa version (une copie de secours est gardée) ou de garder la tienne. Rien n'est écrasé sans ton choix.",
      "Historique : le groupe garde des versions de chaque camp et du catalogue (une toutes les 10 minutes au plus, 20 au maximum) pour revenir en arrière ; un camp supprimé peut être restauré.",
      "Un administrateur peut renommer son groupe ; chaque membre peut le quitter.",
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
