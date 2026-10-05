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
STORE_ID = ""                          # peut être inutile (prix identiques dans tous les magasins ?)
MAX_ITEMS = 30
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


def appeler_apify(query):
    url = f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items"
    payload = {"searchQuery": query, "storeId": STORE_ID, "maxItems": MAX_ITEMS}  # à vérifier
    r = requests.post(url, params={"token": APIFY_TOKEN, "timeout": 300}, json=payload, timeout=320)
    r.raise_for_status()
    return r.json()


def normaliser(item):
    f = aplatir(item)
    return {
        "produit_id": pick(f, "productId", "id"),
        "nom": pick(f, "name", "longName", "title"),
        "marque": pick(f, "brand"),
        "prix": to_float(pick(f, "price", "basicPrice")),
        "prix_unitaire": to_float(pick(f, "unitPrice", "measurementUnitPrice", "pricePerUnit")),
        "unite": norm_unite(pick(f, "unitPriceUnit", "measurementUnit", "unit")),
        "promo": pick(f, "promotion", "promo"),
    }

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
    ok = sorted(
        [c for c in cands if c["prix_unitaire"] and c["unite"] == ing["unite"]],
        key=lambda c: c["prix_unitaire"],
    )
    if not ok:
        print(f"⚠️ {ing['id']} : aucun candidat en €/{ing['unite']}")
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
    "magasin": STORE_ID,
    "date_maj": datetime.datetime.now().isoformat(timespec="seconds"),
    "ingredients": resultats,
}

# %% Téléchargement du fichier (à charger ensuite dans l'appli : Catalogue de prix > Choisir un fichier)
with open(SORTIE, "w", encoding="utf-8") as f:
    json.dump(export, f, indent=2, ensure_ascii=False)
print("✅ Écrit :", SORTIE)
if files:
    files.download(SORTIE)
