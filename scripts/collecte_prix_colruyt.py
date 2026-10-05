# Collecte des prix Colruyt -> prix_colruyt.json (à charger dans le catalogue de prix de l'appli)
# À exécuter dans Google Colab : une cellule par bloc "# %%".
# Les noms de champs de l'acteur Apify ne sont pas garantis : lancer d'abord la cellule DEBUG.
# Aucun jeton GitHub : le fichier est simplement téléchargé, puis chargé dans l'appli
# (Catalogue de prix > Choisir un fichier > Importer).

# %% Installation et configuration
# !pip -q install requests pandas   # dans Colab, décommenter (ou lancer cette ligne seule dans une cellule)

import datetime
import json
import re

import pandas as pd
import requests

try:
    from google.colab import files, userdata
    APIFY_TOKEN = userdata.get("APIFY_TOKEN")  # Colab > icône clé > Secrets
except ImportError:  # exécution hors Colab (tests locaux)
    files = None
    import os
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


def pertinent(nom, ing_id):
    """True si le nom du produit correspond à l'ingrédient (mêmes règles que le catalogue de l'appli)."""
    inc, exc = FILTRES[ing_id]
    nom = str(nom or "")
    return bool(re.search(inc, nom, re.I)) and not (exc and re.search(exc, nom, re.I))


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
        "nom": pick(f, "name", "longName", "title"),
        "marque": pick(f, "brand"),
        "prix": prix,
        "prix_unitaire": round(prix_unitaire, 2) if prix_unitaire is not None else None,
        "unite": unite,
        "promo": pick(f, "promotionPrice", "promotion", "promo"),
    }

# %% Catalogue exporté de l'appli (facultatif : ingrédients ajoutés à la main dans les recettes)
# Dans l'appli : Catalogue de prix > « 💾 Exporter le catalogue », puis mettre UTILISER_CATALOGUE = True.
# Le script cherche alors chaque ingrédient du catalogue (les 31 de base ET ceux ajoutés à la main, de la forme c_xxxx)
# et produit un JSON relié aux mêmes identifiants : à recharger dans l'appli SUR LE MÊME APPAREIL.
UTILISER_CATALOGUE = False
SEULEMENT_PERSO = False  # True : ne collecter que les ingrédients ajoutés à la main (moins cher)


def mots_filtre(nom):
    """Filtre d'un ingrédient ajouté à la main : tous ses mots (début de mot) doivent figurer dans le nom du produit."""
    mots = [re.escape(m[:5]) for m in re.findall(r"\w{3,}", str(nom).lower())]
    return "".join(f"(?=.*{m})" for m in mots) or re.escape(str(nom).lower())


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
            nouveaux.append({"id": k, "q": nom, "unite": unites.get(v.get("unite"), "kg")})
            FILTRES[k] = (mots_filtre(nom), None)
            perso.append(f"{k} ({nom})")
    INGREDIENTS[:] = nouveaux
    print(f"{len(nouveaux)} ingrédients à collecter dont {len(perso)} ajoutés à la main : {perso or 'aucun'}")


if UTILISER_CATALOGUE:
    envoye = files.upload()  # choisir « catalogue-prix-….json »
    with open(next(iter(envoye)), encoding="utf-8") as f:
        appliquer_catalogue(json.load(f))

# %% DEBUG : champs réellement renvoyés par l'acteur (adapter les noms candidats ci-dessus si besoin)
test = appeler_apify("spaghetti")
print(len(test), "résultats")
if test:
    print(json.dumps(aplatir(test[0]), indent=2, ensure_ascii=False)[:3000])
    print("\nNormalisé :", normaliser(test[0]))

# %% Collecte
resultats, lignes, sans_resultat = {}, [], []
for ing in INGREDIENTS:
    try:
        cands = [normaliser(x) for x in appeler_apify(ing["q"])]
    except Exception as e:
        print(f"❌ {ing['id']} : {e}")
        sans_resultat.append(ing["id"])
        continue
    if ing.get("epingle"):
        cands = [c for c in cands if str(c["produit_id"]) == str(ing["epingle"])] or cands
    en_unite = [c for c in cands if c["prix_unitaire"] and c["unite"] == ing["unite"]]
    ok = sorted(
        [c for c in en_unite if ing.get("epingle") or pertinent(c["nom"], ing["id"])],
        key=lambda c: c["prix_unitaire"],
    )
    if not ok:
        motif = "aucun produit pertinent" if en_unite else f"aucun candidat en €/{ing['unite']}"
        print(f"⚠️ {ing['id']} : {motif} (le prix de l'appli est conservé)")
        sans_resultat.append(ing["id"])
        continue
    choix = ok[0]
    resultats[ing["id"]] = {
        "requete": ing["q"],
        "unite": ing["unite"],
        "prix_unitaire": choix["prix_unitaire"],
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

# %% Téléchargement du fichier (à charger ensuite dans l'appli : Catalogue de prix > Choisir un fichier)
with open(SORTIE, "w", encoding="utf-8") as f:
    json.dump(export, f, indent=2, ensure_ascii=False)
print("✅ Écrit :", SORTIE)
if files:
    files.download(SORTIE)
