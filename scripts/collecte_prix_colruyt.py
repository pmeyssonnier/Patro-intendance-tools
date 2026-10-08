# Collecte des prix Colruyt -> prix_colruyt.json (à charger dans le catalogue de prix de l'appli)
# À exécuter dans Google Colab : une cellule par bloc "# %%".
# Les noms de champs de l'acteur Apify ne sont pas garantis : lancer d'abord la cellule DEBUG.
# Par défaut, aucun jeton GitHub : le fichier est simplement téléchargé, puis chargé dans l'appli
# (Catalogue de prix > Choisir un fichier > Importer). Le dépôt automatique sur GitHub est facultatif
# (cellule finale « Dépôt sur GitHub », DEPOSER_SUR_GITHUB = True).

# %% Installation et configuration
# !pip -q install requests pandas   # dans Colab, décommenter (ou lancer cette ligne seule dans une cellule)

import base64
import collections
import datetime
import json
import os
import re
import unicodedata

import pandas as pd
import requests

try:
    from google.colab import files, userdata
    APIFY_TOKEN = userdata.get("APIFY_TOKEN")  # Colab > icône clé > Secrets
except ImportError:  # exécution hors Colab (tests locaux)
    files = None
    APIFY_TOKEN = os.environ.get("APIFY_TOKEN", "")

ACTOR = "studio-amba~colruyt-scraper"  # à vérifier
STORE_ID = 871                         # placeId Colruyt (871 = défaut de l'acteur ; les prix varient peu d'un magasin à l'autre)
MAX_ITEMS = 10                         # résultats par recherche : 2 $ / 1 000 résultats, donc 10 suffit pour le moins cher
LANGUE = "fr"                          # langue des noms de produits ("nl" ou "fr")
PROXY_BE = False                       # True = proxys résidentiels belges (conseillés par l'acteur si Colruyt bloque ; peuvent coûter en plus)
SORTIE = "prix_colruyt.json"

# Les id sont IDENTIQUES à ceux de js/data-defaults.js (objet ING).
# unite = unité du prix : kg (ingrédient en g), l (ingrédient en ml), piece (pc).
# epingle (optionnel) = identifiant produit Colruyt à forcer.
INGREDIENTS = [
    {"id": "pates", "q": "spaghetti", "unite": "kg"},
    {"id": "riz", "q": "riz long grain", "unite": "kg"},
    {"id": "hache", "q": "viande hachée", "unite": "kg"},
    {"id": "tom", "q": "tomates pelées", "unite": "kg"},
    {"id": "oig", "q": "oignons", "unite": "kg"},
    {"id": "fro", "q": "fromage râpé", "unite": "kg"},
    {"id": "poulet", "q": "filet de poulet", "unite": "kg"},
    {"id": "leg", "q": "légumes surgelés", "unite": "kg"},
    {"id": "coco", "q": "lait de coco", "unite": "l"},
    {"id": "pdt", "q": "pommes de terre", "unite": "kg"},
    {"id": "sauc", "q": "saucisses", "unite": "kg"},
    {"id": "car", "q": "carottes", "unite": "kg"},
    {"id": "pain", "q": "pain", "unite": "kg"},
    {"id": "jam", "q": "jambon cuit", "unite": "kg"},
    {"id": "beu", "q": "beurre", "unite": "kg"},
    {"id": "conf", "q": "confiture", "unite": "kg"},
    {"id": "cer", "q": "corn flakes", "unite": "kg"},
    {"id": "lait", "q": "lait demi-écrémé", "unite": "l"},
    {"id": "choc", "q": "pâte à tartiner", "unite": "kg"},
    {"id": "suc", "q": "sucre", "unite": "kg"},
    {"id": "subveg", "q": "steak végétarien", "unite": "kg"},
    {"id": "hache_h", "q": "viande hachée halal", "unite": "kg"},
    {"id": "poulet_h", "q": "poulet halal", "unite": "kg"},
    {"id": "sauc_h", "q": "saucisses halal", "unite": "kg"},
    {"id": "jam_h", "q": "jambon de dinde", "unite": "kg"},
    {"id": "lait_sl", "q": "lait sans lactose", "unite": "l"},
    {"id": "fro_sl", "q": "fromage râpé sans lactose", "unite": "kg"},
    {"id": "margar", "q": "margarine", "unite": "kg"},
    {"id": "dinde", "q": "dinde hachée", "unite": "kg"},
    {"id": "pates_sg", "q": "spaghetti sans gluten", "unite": "kg"},
    {"id": "pain_sg", "q": "pain sans gluten", "unite": "kg"},
]

# Filtre de pertinence par ingrédient : (mots à trouver dans le nom du produit, mots à exclure).
# Copie de js/data-defaults.js (ING[id][3]) et de js/catalog.js (EXCL) : la recherche Colruyt renvoie aussi
# des produits voisins (ex. « halal » -> viande normale), qu'on écarte ici plutôt que de prendre le moins cher.
FILTRES = {
    "pates": (r"spaghetti|pâtes|penne|pasta", r"sans gluten|tartiner"),
    "riz": (r"riz", r"au lait|galette|soufflé"),
    "hache": (r"haché", r"dinde|halal|végétari"),
    "tom": (r"tomates? pelées|concassées", None),
    "oig": (r"oignon", None),
    "fro": (r"râpé", r"sans lactose"),
    "poulet": (r"poulet", r"halal|végétari"),
    "leg": (r"courgette|légumes", None),
    "coco": (r"coco", None),
    "pdt": (r"pommes de terre", None),
    "sauc": (r"saucisse", r"halal|végétari"),
    "car": (r"carotte", None),
    "pain": (r"pain", r"épice|sans gluten|grillé|burger"),
    "jam": (r"jambon", r"dinde|halal"),
    "beu": (r"beurre", r"cacahu|arachide"),
    "conf": (r"confiture", None),
    "cer": (r"céréales|corn flakes", None),
    "lait": (r"lait", r"coco|riz au|chocolat|sans lactose"),
    "choc": (r"tartiner", None),
    "suc": (r"sucre", r"sans sucre|glace|vanill"),
    "subveg": (r"végétari|vegan|quorn", None),
    "hache_h": (r"halal.*haché|haché.*halal", None),
    "poulet_h": (r"poulet.*halal|halal.*poulet", None),
    "sauc_h": (r"saucisse.*halal|halal.*saucisse", None),
    "jam_h": (r"jambon.*dinde|dinde.*jambon|halal.*jambon", None),
    "lait_sl": (r"lait.*sans lactose|sans lactose.*lait", None),
    "fro_sl": (r"fromage.*sans lactose|sans lactose.*fromage|râpé.*sans lactose", None),
    "margar": (r"margarine", None),
    "dinde": (r"dinde.*haché|haché.*dinde", None),
    "pates_sg": (r"pâtes.*sans gluten|sans gluten.*pâtes|spaghetti.*sans gluten", None),
    "pain_sg": (r"pain.*sans gluten|sans gluten.*pain", None),
}

# %% Utilitaires
def aplatir(d, parent=""):
    out = {}
    for k, v in (d or {}).items():
        cle = f"{parent}.{k}" if parent else k
        if isinstance(v, dict):
            out.update(aplatir(v, cle))
        else:
            out[cle] = v
    return out


def pick(flat, *cles):
    """Premier champ (aplati) dont le nom se termine par l'un des noms candidats."""
    for c in cles:
        for k, v in flat.items():
            if k.lower().endswith(c.lower()) and v not in (None, ""):
                return v
    return None


def to_float(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    m = re.search(r"\d+(?:[.,]\d+)?", str(v))
    return float(m.group().replace(",", ".")) if m else None


def norm_unite(u):
    u = str(u or "").lower()
    if "kg" in u or "kilo" in u:
        return "kg"
    if re.search(r"\b(l|liter|litre)\b", u) or u.endswith("/l"):
        return "l"
    if any(x in u for x in ("st", "pièce", "piece", "stuk", "pc")):
        return "piece"
    return None


def sans_accents(t):
    return "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if not unicodedata.combining(c))


def pertinent(nom, ing_id):
    """True si le nom du produit correspond à l'ingrédient (mêmes règles que le catalogue de l'appli,
    sans tenir compte des accents : « cotelettes » correspond à « côtelettes »)."""
    inc, exc = FILTRES[ing_id]
    nom = sans_accents(nom)
    return bool(re.search(sans_accents(inc), nom, re.I)) and not (exc and re.search(sans_accents(exc), nom, re.I))


def appeler_apify(query):
    url = f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items"
    payload = {"searchQuery": query, "maxResults": MAX_ITEMS, "language": LANGUE, "placeId": STORE_ID}
    if PROXY_BE:
        payload["proxyConfiguration"] = {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"],
            "apifyProxyCountry": "BE",
        }
    # jeton dans un en-tête (et non dans l'URL) : il n'apparaît pas dans les messages d'erreur
    r = requests.post(
        url,
        params={"timeout": 300},
        headers={"Authorization": f"Bearer {APIFY_TOKEN}"},
        json=payload,
        timeout=320,
    )
    if not r.ok:  # message d'erreur exact d'Apify (type et texte), sans le jeton
        try:
            err = r.json().get("error", {})
            detail = f"{err.get('type', '?')} : {err.get('message', r.text[:300])}"
        except ValueError:
            detail = r.text[:300]
        raise RuntimeError(f"Apify {r.status_code} {detail}")
    return r.json()


def prix_depuis_conditionnement(prix, cond):
    """Repli : prix unitaire calculé à partir du prix et du conditionnement (« 500g », « 1L », « 6x33cl »)."""
    m = re.search(r"(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|ml)\b", str(cond or ""), re.I)
    if prix is None or not m:
        return None, None
    n = (int(m.group(1)) if m.group(1) else 1) * float(m.group(2).replace(",", "."))
    u = m.group(3).lower()
    if u in ("kg", "g"):
        return prix / (n * (1 if u == "kg" else 0.001)), "kg"
    return prix / (n * {"l": 1, "cl": 0.01, "ml": 0.001}[u]), "l"


# Rayons de l'appli (clés de CATS dans js/data-defaults.js) d'après le mot-clé de la catégorie Colruyt, du plus précis au plus général.
RAYONS = [
    ("sur", r"surgel|congel|glace"),
    ("boi", r"boisson|\beau\b|biere|\bvin|alcool|jus\b|soda|cafe|\bthe\b"),
    ("boul", r"boulanger|\bpain|patisserie|viennoiserie"),
    ("bou", r"viande|boucherie|poisson|volaille|gibier"),
    ("fri", r"charcuterie|traiteur|plat prepar|vegetarien|frigo|refriger"),
    ("lai", r"laitier|fromage|\boeuf|beurre|yaourt|margarine|\bfrais\b"),
    ("fl", r"fruit|legume"),
    ("epi", r"epicerie|conserve|pate|\briz\b|sauce|condiment|sucre|biscuit|chocolat|cereale|petit.dejeuner|snack|aperitif"),
]


# Rayon imposé pour une catégorie Colruyt précise (texte exact, accents et majuscules sans importance), prioritaire sur RAYONS.
# Clés de rayon : fl, bou, fri, lai, boul, epi, sur, boi, aut. Ex. : {"Charcuterie Colruyt": "fri"}. La cellule
# « Catégories Colruyt rencontrées » (après la collecte) propose les lignes à compléter.
RAYONS_PERSO = {
    "Crémerie": "lai",
    "Préparations/Charcuterie/Poissons/Veggi": "fri",
    "Santé": "aut",
    "Soins pour le corps/Parfumerie": "aut",
}


def texte_categorie(categorie):
    """Texte d'une catégorie Colruyt (le champ peut être une liste)."""
    return " / ".join(map(str, categorie)) if isinstance(categorie, list) else str(categorie or "")


def cle_categorie(categorie):
    """Catégorie Colruyt sans accents ni majuscules, pour la comparer."""
    return sans_accents(texte_categorie(categorie)).lower().strip()


def rayon_appli(categorie):
    """Rayon de l'appli pour une catégorie Colruyt (« Epicerie » -> « epi »), ou None si on ne la reconnaît pas."""
    t = cle_categorie(categorie)
    if not t:
        return None
    perso = {cle_categorie(k): v for k, v in RAYONS_PERSO.items()}
    if t in perso:
        return perso[t]
    return next((cle for cle, motif in RAYONS if re.search(motif, t)), None)


def sans_marque_doublee(nom):
    """« EVERYDAY EVERYDAY spaghetti 500g » -> « EVERYDAY spaghetti 500g » (Colruyt répète la marque en majuscules)."""
    return re.sub(r"^([A-ZÀ-Ý0-9'.&-]+(?: [A-ZÀ-Ý0-9'.&-]+)*?) \1(?= )", r"\1", nom or "")


def promo_numerique(v):
    """Prix promotionnel (nombre) si le champ en est un (« 1.09 », « 1,09 € »), None s'il s'agit d'un texte (« 2+1 gratuit ») ou s'il est absent."""
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v) if v > 0 else None
    m = re.fullmatch(r"\s*(\d+(?:[.,]\d+)?)\s*(?:€|eur)?\s*", str(v), re.I)
    return float(m.group(1).replace(",", ".")) if m else None


def promo_pour(c):
    """Promotion d'un produit retenu { prix_unitaire, prix, texte } si elle est moins chère que le prix normal, sinon None."""
    p, pp, pu = c.get("prix"), c.get("promo_prix"), c.get("prix_unitaire")
    if not (p and pp and pu and 0 < pp < p):
        return None
    return {
        "prix_unitaire": round(pu * pp / p, 2),
        "prix": round(pp, 2),
        "texte": f"{pp:.2f} € au lieu de {p:.2f} €".replace(".", ","),
    }


def lien_produit(c):
    """Adresse de la fiche produit sur colruyt.be (celle de l'acteur si elle est valide, sinon construite avec l'identifiant), ou None."""
    u = str(c.get("url") or "")
    if re.fullmatch(r"https://www\.colruyt\.be/[A-Za-z0-9/._~%?=&#:-]{1,150}", u):
        return u
    pid = str(c.get("produit_id") or "")
    return f"https://www.colruyt.be/fr/produits/{pid}" if pid.isdigit() else None


def en_stock(v):
    """True/False d'après le champ de stock (booléen, « true »/« false », « inStock »…), None s'il est absent ou illisible."""
    if isinstance(v, bool):
        return v
    t = sans_accents(str(v)).strip().lower() if v is not None else ""
    if t in ("true", "1", "oui", "yes", "instock", "in stock", "available", "disponible"):
        return True
    if t in ("false", "0", "non", "no", "outofstock", "out of stock", "unavailable", "indisponible", "rupture"):
        return False
    return None


def normaliser(item):
    f = aplatir(item)
    prix = to_float(pick(f, "price", "basicPrice"))
    up = pick(f, "unitPrice", "measurementUnitPrice", "pricePerUnit")  # ex. « 0.90/kg »
    prix_unitaire, unite = to_float(up), norm_unite(up)
    if prix_unitaire is None or unite is None:  # repli sur le conditionnement (« 500g »)
        prix_unitaire, unite = prix_depuis_conditionnement(prix, pick(f, "unit", "size", "name"))
    produit_id = pick(f, "productId", "id")
    if produit_id is None:  # l'acteur ne donne que l'URL : .../producten/14502
        m = re.search(r"/(\d+)/?$", str(pick(f, "url") or ""))
        produit_id = m.group(1) if m else None
    return {
        "produit_id": produit_id,
        "nom": sans_marque_doublee(pick(f, "name", "longName", "title")),
        "marque": pick(f, "brand"),
        "categorie_colruyt": pick(f, "category", "categories", "department"),
        "prix": prix,
        "prix_unitaire": round(prix_unitaire, 2) if prix_unitaire is not None else None,
        "unite": unite,
        "url": pick(f, "url"),
        "promo": pick(f, "promotionPrice", "promotion", "promo"),
        "promo_prix": promo_numerique(pick(f, "promotionPrice", "promotion", "promo")),
        "en_stock": en_stock(pick(f, "inStock", "available", "availability")),
    }

# %% Catalogue exporté de l'appli (facultatif : ingrédients ajoutés à la main dans les recettes)
# Dans l'appli : Catalogue de prix > « 💾 Exporter le catalogue » ; Colab demande ce fichier au lancement de la cellule
# (UTILISER_CATALOGUE = True par défaut ; mettre False pour n'utiliser que la liste INGREDIENTS ci-dessus).
# Le script cherche alors chaque ingrédient du catalogue (les 31 de base ET ceux ajoutés à la main, de la forme c_xxxx)
# et produit un JSON relié aux mêmes identifiants : à recharger dans l'appli SUR LE MÊME APPAREIL.
UTILISER_CATALOGUE = True
SEULEMENT_PERSO = False  # True : ne collecter que les ingrédients ajoutés à la main (moins cher)
# Recherche à utiliser à la place du nom de l'ingrédient (identifiant -> texte cherché sur Colruyt) :
REQUETES_PERSO = {}  # ex. {"c_xxxxxxx": "cotelettes de porc"}
# Ingrédient compté à la pièce mais vendu au kilo : poids moyen d'une pièce en grammes (identifiant -> g) :
POIDS_PIECE_G = {}  # ex. {"c_yyyyyyy": 200}  -> prix d'une pièce = prix au kilo x 0,2


def mots_filtre(nom):
    """Filtre d'un ingrédient ajouté à la main : tous ses mots (début de mot) doivent figurer dans le nom du produit."""
    nom = sans_accents(nom).lower()
    mots = [re.escape(m[:5]) for m in re.findall(r"\w{3,}", nom)]
    return "".join(f"(?=.*{m})" for m in mots) or re.escape(nom)


def appliquer_catalogue(cat):
    """Remplace INGREDIENTS par ceux du catalogue exporté : recherche connue pour les 31 de base, le nom pour les autres."""
    base = {i["id"]: i for i in INGREDIENTS}
    unites = {"kg": "kg", "l": "l", "piece": "piece"}
    nouveaux, perso = [], []
    for k, v in cat["ingredients"].items():
        if k in base:
            if not SEULEMENT_PERSO:
                nouveaux.append(base[k])
        else:
            nom = v.get("nom")
            if not nom:
                raise ValueError(f"Ingrédient {k} sans nom : réexporter le catalogue depuis l'appli à jour")
            q = REQUETES_PERSO.get(k, nom)
            ing = {"id": k, "nom": nom, "q": q, "unite": unites.get(v.get("unite"), "kg")}
            if k in POIDS_PIECE_G:
                ing["poids_piece_g"] = POIDS_PIECE_G[k]
            nouveaux.append(ing)
            FILTRES[k] = (mots_filtre(q), None)
            perso.append(f"{k} ({nom}" + (f" -> recherche « {q} »" if q != nom else "") + ")")
    INGREDIENTS[:] = nouveaux
    print(f"{len(nouveaux)} ingrédients à collecter dont {len(perso)} ajoutés à la main : {perso or 'aucun'}")


if UTILISER_CATALOGUE:
    print("Choisis le fichier « catalogue-prix-….json » exporté de l'appli (annule pour n'utiliser que la liste de base).")
    envoye = files.upload()  # choisir « catalogue-prix-….json »
    if envoye:
        # on lit le contenu envoyé, pas le fichier du même nom : Colab renomme un fichier déjà présent
        # (« … (1) (2).json ») mais renvoie le nom d'origine, ce qui ferait relire un ancien fichier
        appliquer_catalogue(json.loads(next(iter(envoye.values())).decode("utf-8")))
    else:
        UTILISER_CATALOGUE = False
        print("Aucun fichier : seuls les ingrédients de base (INGREDIENTS) sont collectés.")

# %% Liste commune (ingrédients partagés par tous les utilisateurs de l'appli)
# La liste commune est un fichier du dépôt : prix/ingredients_communs.json. Elle complète INGREDIENTS : ses produits sont
# collectés à chaque exécution et apparaissent dans prix_colruyt.json, où l'appli propose de les ajouter au catalogue
# de chacun (rattachés par le nom). Colab ne garde rien d'une exécution à l'autre : le fichier est lu depuis GitHub,
# puis une version à jour est téléchargée à la fin (à redéposer dans le dépôt, dossier « prix »).
UTILISER_LISTE_COMMUNE = True
AJOUTER_AU_COMMUN = True  # True : les ingrédients ajoutés à la main du catalogue exporté entrent dans la liste commune
URL_LISTE_COMMUNE = "https://raw.githubusercontent.com/pmeyssonnier/Patro-intendance-tools/main/prix/ingredients_communs.json"
SORTIE_COMMUNE = "ingredients_communs.json"
LISTE_COMMUNE = []  # [{"nom": "Spéculoos", "unite": "kg", "q": "speculoos" (facultatif), "poids_piece_g": 200 (facultatif)}]


def cle_commune(nom, unite):
    """Identité d'un produit de la liste commune : nom sans accents ni majuscules + unité."""
    return re.sub(r"[^a-z0-9]+", "_", sans_accents(nom).lower()).strip("_") + "_" + unite


def charger_liste_commune():
    """Lit la liste commune publiée ; liste vide si elle n'existe pas encore."""
    r = requests.get(URL_LISTE_COMMUNE, timeout=30)
    if r.status_code == 404:
        print("Pas encore de liste commune publiée : on repart d'une liste vide.")
        return []
    r.raise_for_status()
    return [x for x in r.json().get("ingredients", []) if x.get("nom") and x.get("unite") in ("kg", "l", "piece")]


def completer_liste_commune(nouveaux):
    """Ajoute à LISTE_COMMUNE les produits qui n'y sont pas déjà (même nom, même unité)."""
    connus = {cle_commune(x["nom"], x["unite"]) for x in LISTE_COMMUNE}
    ajoutes = []
    for x in nouveaux:
        c = cle_commune(x["nom"], x["unite"])
        if c not in connus:
            connus.add(c)
            LISTE_COMMUNE.append(x)
            ajoutes.append(x["nom"])
    return ajoutes


def ajouter_communs_a_collecter():
    """Ajoute les produits de la liste commune à INGREDIENTS (sauf ceux déjà collectés sous le même nom et la même unité)."""
    deja = {cle_commune(i.get("nom") or i["q"], i["unite"]) for i in INGREDIENTS}
    n = 0
    for x in LISTE_COMMUNE:
        c = cle_commune(x["nom"], x["unite"])
        if c in deja:
            continue
        q = x.get("q") or x["nom"]
        ing = {"id": "x_" + c, "nom": x["nom"], "q": q, "unite": x["unite"]}
        if x.get("poids_piece_g"):
            ing["poids_piece_g"] = x["poids_piece_g"]
        INGREDIENTS.append(ing)
        FILTRES[ing["id"]] = (mots_filtre(q), None)
        deja.add(c)
        n += 1
    print(f"{n} produits de la liste commune ajoutés à la collecte ({len(LISTE_COMMUNE)} dans la liste commune).")


if UTILISER_LISTE_COMMUNE:
    LISTE_COMMUNE = charger_liste_commune()
    if AJOUTER_AU_COMMUN and UTILISER_CATALOGUE:
        # ingrédients ajoutés à la main (identifiant c_…) du catalogue exporté
        perso = [i for i in INGREDIENTS if i["id"].startswith("c_")]
        nouveaux = []
        for i in perso:
            x = {"nom": i["nom"], "unite": i["unite"]}
            if i["q"] != i["nom"]:
                x["q"] = i["q"]  # recherche différente du nom (REQUETES_PERSO)
            if i.get("poids_piece_g"):
                x["poids_piece_g"] = i["poids_piece_g"]
            nouveaux.append(x)
        print("Ajoutés à la liste commune :", completer_liste_commune(nouveaux) or "rien de nouveau")
    ajouter_communs_a_collecter()

# %% DEBUG : champs réellement renvoyés par l'acteur (adapter les noms candidats ci-dessus si besoin)
test = appeler_apify("spaghetti")
print(len(test), "résultats")
if test:
    print(json.dumps(aplatir(test[0]), indent=2, ensure_ascii=False)[:3000])
    print("\nNormalisé :", normaliser(test[0]))

# %% Collecte
resultats, lignes, sans_resultat = {}, [], []
categories_vues = collections.Counter()  # catégorie Colruyt -> nombre de produits rencontrés (voir la cellule suivante)
for ing in INGREDIENTS:
    try:
        cands = [normaliser(x) for x in appeler_apify(ing["q"])]
        for c in cands:
            categories_vues[texte_categorie(c.get("categorie_colruyt"))] += 1
    except Exception as e:
        print(f"❌ {ing['id']} : {e}")
        sans_resultat.append(ing["id"])
        continue
    if ing.get("epingle"):
        cands = [c for c in cands if str(c["produit_id"]) == str(ing["epingle"])] or cands
    en_unite = [c for c in cands if c["prix_unitaire"] and c["unite"] == ing["unite"]]
    if ing["unite"] == "piece" and ing.get("poids_piece_g"):
        # produits vendus au kilo : prix d'une pièce = prix au kilo x poids moyen d'une pièce
        en_unite += [
            {
                **c,
                "nom": f"{c['nom']} (≈{ing['poids_piece_g']} g/pièce)",
                "prix_unitaire": round(c["prix_unitaire"] * ing["poids_piece_g"] / 1000, 2),
                "unite": "piece",
            }
            for c in cands
            if c["prix_unitaire"] and c["unite"] == "kg"
        ]
    ok = sorted(
        [c for c in en_unite if ing.get("epingle") or pertinent(c["nom"], ing["id"])],
        key=lambda c: c["prix_unitaire"],
    )
    # on écarte les produits en rupture de stock (stock inconnu = on garde)
    rupture = [c for c in ok if c.get("en_stock") is False]
    ok = [c for c in ok if c.get("en_stock") is not False]
    if rupture:
        print(f"ℹ️ {ing['id']} : {len(rupture)} produit(s) en rupture écarté(s)")
    if not ok:
        motif = (
            "tous les produits pertinents sont en rupture de stock"
            if rupture
            else "aucun produit pertinent" if en_unite else f"aucun candidat en €/{ing['unite']}"
        )
        print(f"⚠️ {ing['id']} : {motif} (le prix de l'appli est conservé)")
        sans_resultat.append(ing["id"])
        continue
    choix = ok[0]
    resultats[ing["id"]] = {
        "requete": ing["q"],
        **({"nom": ing["nom"]} if ing.get("nom") else {}),
        **({"categorie": rayon_appli(choix.get("categorie_colruyt"))} if rayon_appli(choix.get("categorie_colruyt")) else {}),
        "unite": ing["unite"],
        "prix_unitaire": choix["prix_unitaire"],
        **({"promo": promo_pour(choix)} if promo_pour(choix) else {}),
        **({"lien": lien_produit(choix)} if lien_produit(choix) else {}),
        "produit": choix,
        "alternatives": ok[1:4],
    }
    lignes.append({"id": ing["id"], "produit": choix["nom"], "€/unité": choix["prix_unitaire"], "unité": ing["unite"]})

display(pd.DataFrame(lignes)) if "display" in globals() else print(pd.DataFrame(lignes))
print(f"\n{len(resultats)}/{len(INGREDIENTS)} ingrédients trouvés. Sans résultat : {sans_resultat or 'aucun'}")

export = {
    "source": "Colruyt via Apify",
    "magasin": str(STORE_ID),
    "date_maj": datetime.datetime.now().isoformat(timespec="seconds"),
    "ingredients": resultats,
}

# %% Catégories Colruyt rencontrées (à lancer après la collecte : sert à compléter la correspondance avec les rayons de l'appli)
def tableau_categories():
    """Une ligne par catégorie Colruyt vue pendant la collecte, avec le rayon proposé (ou « ? » si on ne la reconnaît pas)."""
    noms_rayons = {"fl": "Fruits & légumes", "bou": "Boucherie & poisson", "fri": "Frigo", "lai": "Frais",
                   "boul": "Boulangerie", "epi": "Épicerie & conserves", "sur": "Surgelés", "boi": "Boissons", "aut": "Autre"}
    lignes = []
    for cat, n in sorted(categories_vues.items(), key=lambda x: (-x[1], str(x[0]))):
        r = rayon_appli(cat)
        lignes.append({"Catégorie Colruyt": cat or "(aucune)", "Produits": n, "Clé": r or "?", "Rayon proposé": noms_rayons.get(r, "—" if not cat else "⚠ non reconnue")})
    return lignes


tab = tableau_categories()
display(pd.DataFrame(tab)) if "display" in globals() else print(pd.DataFrame(tab))
inconnues = [t for t in tab if t["Clé"] == "?" and t["Catégorie Colruyt"] != "(aucune)"]
if inconnues:
    print("\n⚠️ Catégories non reconnues : complète RAYONS_PERSO (cellule « Utilitaires ») avec la clé du bon rayon,")
    print("   puis relance la collecte. Clés : fl, bou, fri, lai, boul, epi, sur, boi, aut.\n")
    print("RAYONS_PERSO = {")
    for t in inconnues:
        print(f'    "{t["Catégorie Colruyt"]}": "???",  # {t["Produits"]} produit(s)')
    print("}")
else:
    print("\n✅ Toutes les catégories rencontrées sont reconnues.")

# %% Téléchargement du fichier (à charger ensuite dans l'appli : Catalogue de prix > Choisir un fichier)
with open(SORTIE, "w", encoding="utf-8") as f:
    json.dump(export, f, indent=2, ensure_ascii=False)
print("✅ Écrit :", SORTIE)
if files:
    files.download(SORTIE)

# Liste commune mise à jour : à déposer dans le dépôt GitHub sous prix/ingredients_communs.json (Add file > Upload files)
if UTILISER_LISTE_COMMUNE:
    with open(SORTIE_COMMUNE, "w", encoding="utf-8") as f:
        json.dump({"ingredients": LISTE_COMMUNE}, f, indent=2, ensure_ascii=False)
    print(f"✅ Écrit : {SORTIE_COMMUNE} ({len(LISTE_COMMUNE)} produits)")
    if files:
        files.download(SORTIE_COMMUNE)


# %% Dépôt sur GitHub (facultatif : publie les fichiers pour tous les utilisateurs de l'appli)
# Il faut un jeton GitHub « fine-grained » limité à CE dépôt, avec la seule permission « Contents : Read and write »,
# enregistré dans les secrets de Colab (icône clé) sous le nom GITHUB_TOKEN. Il n'est jamais affiché ni écrit dans un fichier.
# Les prix collectés sont FUSIONNÉS avec ceux déjà publiés : un ingrédient non collecté cette fois garde son dernier prix.
DEPOSER_SUR_GITHUB = False
DEPOT_REPO = "pmeyssonnier/Patro-intendance-tools"
DEPOT_BRANCHE = "main"  # si main est protégée (PR obligatoire), mettre une autre branche puis ouvrir une PR
DEPOT_DOSSIER = "prix"


def _entetes_github():
    jeton = userdata.get("GITHUB_TOKEN") if files else os.environ.get("GITHUB_TOKEN", "")
    if not jeton:
        raise RuntimeError("Secret GITHUB_TOKEN absent (Colab > icône clé > Secrets)")
    return {
        "Authorization": f"Bearer {jeton}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def lire_depot(chemin):
    """Contenu texte et identifiant (sha) d'un fichier du dépôt ; (None, None) s'il n'existe pas encore."""
    r = requests.get(
        f"https://api.github.com/repos/{DEPOT_REPO}/contents/{chemin}",
        headers=_entetes_github(),
        params={"ref": DEPOT_BRANCHE},
        timeout=30,
    )
    if r.status_code == 404:
        return None, None
    _verifier(r, "lecture de " + chemin)
    d = r.json()
    return base64.b64decode(d["content"]).decode("utf-8"), d["sha"]


def _verifier(r, action):
    if r.status_code >= 400:
        # on n'affiche que le message de GitHub : jamais les en-têtes (donc jamais le jeton)
        raise RuntimeError(f"GitHub a refusé ({r.status_code}) : {action} — {r.json().get('message', '')}")


def deposer_fichier(chemin, texte, message, sha=None):
    """Crée ou remplace un fichier du dépôt (un commit sur DEPOT_BRANCHE)."""
    corps = {
        "message": message,
        "content": base64.b64encode(texte.encode("utf-8")).decode("ascii"),
        "branch": DEPOT_BRANCHE,
    }
    if sha:
        corps["sha"] = sha
    r = requests.put(
        f"https://api.github.com/repos/{DEPOT_REPO}/contents/{chemin}",
        headers=_entetes_github(),
        json=corps,
        timeout=60,
    )
    _verifier(r, "écriture de " + chemin)
    print("✅ Déposé :", chemin, "sur", DEPOT_REPO, f"({DEPOT_BRANCHE})")


def fusionner_prix(publie_texte, nouveau):
    """Prix publiés + prix collectés (les collectés l'emportent) ; la date est celle de la collecte."""
    ancien = json.loads(publie_texte).get("ingredients", {}) if publie_texte else {}
    return {**nouveau, "ingredients": {**ancien, **nouveau["ingredients"]}}


if DEPOSER_SUR_GITHUB:
    date = export["date_maj"][:10]
    chemin_prix = f"{DEPOT_DOSSIER}/{SORTIE}"
    publie, sha_prix = lire_depot(chemin_prix)
    complet = fusionner_prix(publie, export)
    deposer_fichier(
        chemin_prix,
        json.dumps(complet, indent=2, ensure_ascii=False) + "\n",
        f"Prix : collecte Colruyt du {date} ({len(resultats)} prix, {len(complet['ingredients'])} au total)",
        sha_prix,
    )
    if UTILISER_LISTE_COMMUNE:
        chemin_commun = f"{DEPOT_DOSSIER}/{SORTIE_COMMUNE}"
        _, sha_commun = lire_depot(chemin_commun)
        deposer_fichier(
            chemin_commun,
            json.dumps({"ingredients": LISTE_COMMUNE}, indent=2, ensure_ascii=False) + "\n",
            f"Prix : liste commune d'ingrédients ({len(LISTE_COMMUNE)} produits)",
            sha_commun,
        )
