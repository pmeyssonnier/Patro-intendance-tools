/* Intendance PSS – Données par défaut : sections, ingrédients, recettes d'exemple, régimes, couleurs, état initial.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

// Numéro de version affiché dans le menu : à mettre à jour à chaque release (avec "version" dans package.json).
const APP_VERSION = "1.17.1";

// Nom de la troupe par défaut (modifiable dans Configuration).
const TROOP0 = "Patro Sainte-Suzanne";

// Sections par défaut [nom, âges]. La liste utilisée par l'appli est SEC (copie de S.sec, modifiable dans Configuration).
const SEC0 = [
  ["Benjas", "5–10 ans"],
  ["Chevaliers-Étincelles", "10–13 ans"],
  ["Conquérants-Alpines", "13–16 ans"],
  ["Animateurs", "16 ans et +"],
];

const SEC = SEC0.map((s) => [...s]);

const ING = {
  pates: ["Pâtes", "g", 1.4, "spaghetti|pâtes|penne|pasta"],
  riz: ["Riz", "g", 2, "riz"],
  hache: ["Viande hachée", "g", 8.5, "haché"],
  tom: ["Tomates pelées", "g", 1.6, "tomates? pelées|concassées"],
  oig: ["Oignons", "g", 1.5, "oignon"],
  fro: ["Fromage râpé", "g", 7, "râpé"],
  poulet: ["Blanc de poulet", "g", 7.5, "poulet"],
  leg: ["Légumes", "g", 2.2, "courgette|légumes"],
  coco: ["Lait de coco", "ml", 3.5, "coco"],
  pdt: ["Pommes de terre", "g", 1.1, "pommes de terre"],
  sauc: ["Saucisses", "g", 7, "saucisse"],
  car: ["Carottes", "g", 1.2, "carotte"],
  pain: ["Pain", "g", 2.5, "pain"],
  jam: ["Jambon", "g", 12, "jambon"],
  beu: ["Beurre", "g", 9, "beurre"],
  conf: ["Confiture", "g", 3.5, "confiture"],
  cer: ["Céréales", "g", 4, "céréales|corn flakes"],
  lait: ["Lait", "ml", 1.1, "lait"],
  choc: ["Pâte à tartiner", "g", 4, "tartiner"],
  suc: ["Sucre", "g", 1.3, "sucre"],
  subveg: ["Substitut végétarien (steaks, pilons…)", "g", 9, "végétari|vegan|quorn", 1],
  hache_h: ["Viande hachée halal", "g", 11, "halal.*haché|haché.*halal", 1],
  poulet_h: ["Poulet halal", "g", 9.5, "poulet.*halal|halal.*poulet", 1],
  sauc_h: ["Saucisses halal", "g", 10, "saucisse.*halal|halal.*saucisse", 1],
  jam_h: ["Jambon de dinde halal", "g", 14, "jambon.*dinde|dinde.*jambon|halal.*jambon", 1],
  lait_sl: ["Lait sans lactose", "ml", 1.6, "lait.*sans lactose|sans lactose.*lait", 1],
  fro_sl: [
    "Fromage sans lactose",
    "g",
    9,
    "fromage.*sans lactose|sans lactose.*fromage|râpé.*sans lactose",
    1,
  ],
  margar: ["Margarine végétale", "g", 5, "margarine", 1],
  dinde: ["Dinde hachée", "g", 9, "dinde.*haché|haché.*dinde", 1],
  pates_sg: [
    "Pâtes sans gluten",
    "g",
    6,
    "pâtes.*sans gluten|sans gluten.*pâtes|spaghetti.*sans gluten",
    1,
  ],
  pain_sg: ["Pain sans gluten", "g", 8, "pain.*sans gluten|sans gluten.*pain", 1],
};

// Rayons de la liste de courses, dans l'ordre du magasin : [clé, nom]. « aut » (Autre) est la catégorie par défaut.
const CATS = [
  ["fl", "Fruits & légumes"],
  ["bou", "Boucherie & poisson"],
  ["fri", "Frigo (charcuterie, plats préparés)"],
  ["lai", "Frais (produits laitiers, œufs)"],
  ["boul", "Boulangerie"],
  ["epi", "Épicerie & conserves"],
  ["sur", "Surgelés"],
  ["boi", "Boissons"],
  ["aut", "Autre"],
];

// Rayon par défaut des ingrédients de base (modifiable dans le catalogue : S.cat).
const CAT0 = {
  pates: "epi",
  riz: "epi",
  hache: "bou",
  tom: "epi",
  oig: "fl",
  fro: "lai",
  poulet: "bou",
  leg: "fl",
  coco: "epi",
  pdt: "fl",
  sauc: "fri",
  car: "fl",
  pain: "boul",
  jam: "fri",
  beu: "lai",
  conf: "epi",
  cer: "epi",
  lait: "lai",
  choc: "epi",
  suc: "epi",
  subveg: "fri",
  hache_h: "bou",
  poulet_h: "bou",
  sauc_h: "fri",
  jam_h: "fri",
  lait_sl: "lai",
  fro_sl: "lai",
  margar: "lai",
  dinde: "bou",
  pates_sg: "epi",
  pain_sg: "boul",
};

let DIETS = {
  veg: {
    n: "Végétarien",
    ex: { hache: "subveg", poulet: "subveg", sauc: "subveg", jam: "subveg" },
  },
  halal: {
    n: "Halal (sans porc, viande halal)",
    ex: { hache: "hache_h", poulet: "poulet_h", sauc: "sauc_h", jam: "jam_h" },
  },
  sl: { n: "Sans lactose", ex: { lait: "lait_sl", fro: "fro_sl", beu: "margar", choc: null } },
  sb: { n: "Sans bœuf", ex: { hache: "dinde" } },
  sg: { n: "Sans gluten", ex: { pates: "pates_sg", pain: "pain_sg", cer: null } },
  nut: { n: "Allergie fruits à coque / arachides", ex: { choc: null } },
};

const F = [0.5, 0.75, 1, 1],
  r5 = (v) => Math.max(1, Math.round(v / 5) * 5);

const mk = (d, o) => ({
  desc: d,
  ing: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, F.map((f) => r5(v * f))])),
});

const REC0 = {
  "Spaghetti bolognaise": mk(
    "Faire revenir oignons et viande, ajouter les tomates, laisser mijoter 30 min. Cuire les pâtes, servir avec le fromage râpé.",
    { pates: 100, hache: 120, tom: 150, oig: 30, fro: 15 }
  ),
  "Riz poulet curry-coco": mk(
    "Poulet en dés saisi avec oignons et légumes, lait de coco et curry, mijoter 20 min. Servir sur le riz.",
    { riz: 80, poulet: 120, leg: 150, coco: 50, oig: 20 }
  ),
  "Saucisses, purée, carottes": mk(
    "Cuire les pommes de terre, écraser avec beurre et lait. Carottes à l'eau ou poêlées, saucisses à la poêle.",
    { sauc: 150, pdt: 250, car: 150, beu: 10, lait: 30 }
  ),
  "Croque-monsieur": mk("Pain, jambon, fromage, un peu de beurre. Griller à la poêle ou au four.", {
    pain: 100,
    jam: 40,
    fro: 40,
    beu: 10,
  }),
  "Soupe de légumes + pain": mk(
    "Légumes et pommes de terre en morceaux, cuire 30 min, mixer. Servir avec du pain.",
    { leg: 250, pdt: 80, pain: 60 }
  ),
  "Petit-déjeuner": mk("Pain, beurre, confiture, pâte à tartiner, céréales et lait.", {
    pain: 100,
    beu: 10,
    conf: 20,
    cer: 30,
    lait: 200,
    choc: 15,
  }),
  "Riz au lait (dessert)": mk(
    "Cuire le riz dans le lait sucré à feu doux en remuant, environ 40 min.",
    { lait: 250, riz: 30, suc: 20 }
  ),
};

const CN = {
  "#1f7a3f": "vert",
  "#c0392b": "rouge",
  "#2c6fbb": "bleu",
  "#e08a00": "orange",
  "#7b4fb5": "violet",
  "#c2185b": "rose",
  "#333333": "anthracite",
};

const COLS = ["#1f7a3f", "#c0392b", "#2c6fbb", "#e08a00", "#7b4fb5", "#c2185b", "#333333"],
  DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const DEF = {
  n: [10, 8, 6, 6],
  wa: 10,
  prices: {},
  pn: {},
  rec: REC0,
  meals: [
    ["Vendredi souper", "Spaghetti bolognaise"],
    ["Samedi matin", "Petit-déjeuner"],
    ["Samedi midi", "Croque-monsieur"],
    ["Samedi soir", "Riz poulet curry-coco"],
    ["Dimanche matin", "Petit-déjeuner"],
    ["Dimanche midi", "Saucisses, purée, carottes"],
  ],
  cur: "Spaghetti bolognaise",
  dt: {},
  notes: "",
  mc: COLS[0],
  mt: "Menu du camp",
  md: 1,
  ma: 1,
  hid: [],
  cust: {},
  ov: {},
  cat: {},
  promo: {},
  url: {},
};
