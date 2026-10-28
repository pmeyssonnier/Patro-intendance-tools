# Test de bout en bout de la synchronisation

Trois navigateurs (un administrateur, un éditeur, un lecteur) utilisent l'application contre les émulateurs Firebase (authentification et base de données, qui demandent Java). Le test vérifie l'envoi, le chargement, la détection d'une version plus récente, le conflit et ses deux issues, la suppression d'un camp, la lecture seule et le travail hors ligne.

Il ne fait pas partie de `npm test` (il a ses propres outils) et ne touche jamais au vrai projet Firebase : les adresses du kit Firebase sont remplacées, dans le navigateur de test, par une version qui parle aux émulateurs.

```
mkdir /tmp/sync && cd /tmp/sync && npm init -y
npm i firebase-tools@14 @firebase/rules-unit-testing@4 firebase@11 esbuild
cp <dépôt>/tests-sync/entree.js .
npx esbuild entree.js --bundle --format=esm --outfile=bundle.js
```

Depuis la racine du dépôt (là où se trouve `firebase.json`), avec les émulateurs déclarés (`"emulators": {"auth": {"port": 9099}, "firestore": {"port": 8080}}`) :

```
cd /tmp/sync && BUNDLE=/tmp/sync/bundle.js NODE_PATH=/tmp/sync/node_modules \
  npx firebase emulators:exec --config <dépôt>/firebase.json --only auth,firestore --project patro-intendance-test \
  "node <dépôt>/tests-sync/e2e.mjs"
```

Les messages « EAFNOSUPPORT » et « not authenticated » au démarrage des émulateurs sont normaux.
