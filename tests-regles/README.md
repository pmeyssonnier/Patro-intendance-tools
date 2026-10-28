# Tests des règles de sécurité Firestore

Ces tests vérifient `firestore.rules` avec l'émulateur Firebase (qui demande Java). Ils ne font pas partie de `npm test` : ils ont leurs propres outils.

```
mkdir /tmp/regles && cd /tmp/regles && npm init -y
npm i firebase-tools@14 @firebase/rules-unit-testing@4 firebase@11
```

Puis, depuis la racine du dépôt (là où se trouve `firebase.json`) :

```
/tmp/regles/node_modules/.bin/firebase emulators:exec --only firestore --project demo-patro "NODE_PATH=/tmp/regles/node_modules node --test tests-regles/"
```

Les messages « PERMISSION_DENIED » affichés pendant l'exécution sont normaux : ils correspondent aux accès que le test vérifie justement refusés.
