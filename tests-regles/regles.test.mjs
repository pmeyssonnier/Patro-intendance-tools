// Tests des règles de sécurité Firestore (émulateur). Voir tests-regles/README.md pour les lancer.
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const ADMIN = "pmeyssonnier@gmail.com";
let env;

const moi = (uid, email, verifie = true) =>
  env.authenticatedContext(uid, { email, email_verified: verifie }).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-patro",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});
after(() => env.cleanup());

// décor : groupe g1 avec une administratrice (a), un éditeur (e) et un lecteur (l) ; groupe g2 avec un autre administrateur (z)
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "groupes/g1"), { nom: "Sainte-Suzanne" });
    await setDoc(doc(db, "groupes/g1/membres/a"), { role: "admin", email: "a@x.be" });
    await setDoc(doc(db, "groupes/g1/membres/e"), { role: "editeur", email: "e@x.be" });
    await setDoc(doc(db, "groupes/g1/membres/l"), { role: "lecteur", email: "l@x.be" });
    await setDoc(doc(db, "groupes/g1/camps/c1"), { version: 1, data: "{}" });
    await setDoc(doc(db, "groupes/g2"), { nom: "Uccle" });
    await setDoc(doc(db, "groupes/g2/membres/z"), { role: "admin", email: "z@x.be" });
    await setDoc(doc(db, "groupes/g2/camps/c9"), { version: 1, data: "{}" });
  });
});

test("personne n'est autorisé sans connexion ni adresse vérifiée", async () => {
  const anonyme = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anonyme, "groupes/g1")));
  await assertFails(getDoc(doc(anonyme, "prix/colruyt")));
  const nonVerifie = moi("a", "a@x.be", false);
  await assertFails(getDoc(doc(nonVerifie, "groupes/g1/camps/c1")));
});

test("lecture : un membre lit son groupe, pas celui d'un autre", async () => {
  await assertSucceeds(getDoc(doc(moi("l", "l@x.be"), "groupes/g1/camps/c1")));
  await assertSucceeds(getDoc(doc(moi("l", "l@x.be"), "groupes/g1")));
  await assertFails(getDoc(doc(moi("l", "l@x.be"), "groupes/g2/camps/c9")));
  await assertFails(getDoc(doc(moi("l", "l@x.be"), "groupes/g2")));
  await assertFails(getDoc(doc(moi("inconnu", "i@x.be"), "groupes/g1/camps/c1")));
});

test("camps : le lecteur n'écrit pas, l'éditeur écrit avec la version suivante", async () => {
  const ref = (db) => doc(db, "groupes/g1/camps/c1");
  await assertFails(setDoc(ref(moi("l", "l@x.be")), { version: 2, data: "a" }));
  await assertSucceeds(setDoc(ref(moi("e", "e@x.be")), { version: 2, data: "a" }));
  await assertFails(setDoc(ref(moi("e", "e@x.be")), { version: 2, data: "b" })); // version déjà prise
  await assertFails(setDoc(ref(moi("e", "e@x.be")), { version: 9, data: "b" })); // saut de version
  await assertSucceeds(
    setDoc(doc(moi("e", "e@x.be"), "groupes/g1/camps/c2"), { version: 1, data: "{}" })
  );
  await assertFails(
    setDoc(doc(moi("e", "e@x.be"), "groupes/g1/camps/c3"), { version: 4, data: "{}" })
  );
  await assertFails(deleteDoc(ref(moi("e", "e@x.be"))));
  await assertSucceeds(deleteDoc(ref(moi("a", "a@x.be"))));
});

test("on n'écrit pas dans un autre groupe, ni dans une collection inconnue", async () => {
  await assertFails(
    setDoc(doc(moi("e", "e@x.be"), "groupes/g2/camps/c9"), { version: 2, data: "{}" })
  );
  await assertFails(
    setDoc(doc(moi("e", "e@x.be"), "groupes/g1/secrets/s"), { version: 1, data: "{}" })
  );
  await assertFails(setDoc(doc(moi("e", "e@x.be"), "autre/x"), { a: 1 }));
});

test("groupes : seul le super-administrateur en crée ou en supprime", async () => {
  await assertFails(setDoc(doc(moi("a", "a@x.be"), "groupes/g3"), { nom: "Forest" }));
  await assertSucceeds(setDoc(doc(moi("s", ADMIN), "groupes/g3"), { nom: "Forest" }));
  await assertFails(setDoc(doc(moi("s", ADMIN), "groupes/g4"), { nom: "" }));
  await assertFails(setDoc(doc(moi("s", ADMIN), "groupes/g4"), { nom: "x".repeat(81) }));
  await assertFails(deleteDoc(doc(moi("a", "a@x.be"), "groupes/g1")));
  await assertSucceeds(deleteDoc(doc(moi("s", ADMIN), "groupes/g3")));
  // l'adresse du super-administrateur doit être vérifiée
  await assertFails(setDoc(doc(moi("s", ADMIN, false), "groupes/g5"), { nom: "Faux" }));
});

test("super-administrateur : crée un groupe et s'en fait administrateur en une opération", async () => {
  const db = moi("s", ADMIN);
  const b = writeBatch(db);
  b.set(doc(db, "groupes/g3"), { nom: "Forest" });
  b.set(doc(db, "groupes/g3/membres/s"), { role: "admin", email: ADMIN });
  b.set(doc(db, "utilisateurs/s/groupes/g3"), { role: "admin", nom: "Forest" });
  await assertSucceeds(b.commit());
  await assertSucceeds(getDoc(doc(db, "groupes/g3/membres/s")));
});

test("membres : l'administrateur gère, les autres non", async () => {
  await assertSucceeds(
    setDoc(doc(moi("a", "a@x.be"), "groupes/g1/membres/n"), { role: "lecteur", email: "n@x.be" })
  );
  await assertSucceeds(
    updateDoc(doc(moi("a", "a@x.be"), "groupes/g1/membres/n"), { role: "editeur" })
  );
  await assertFails(
    setDoc(doc(moi("a", "a@x.be"), "groupes/g1/membres/n2"), { role: "roi", email: "n@x.be" })
  );
  await assertFails(
    setDoc(doc(moi("e", "e@x.be"), "groupes/g1/membres/n3"), { role: "lecteur", email: "n@x.be" })
  );
  await assertFails(updateDoc(doc(moi("e", "e@x.be"), "groupes/g1/membres/e"), { role: "admin" })); // pas d'auto-promotion
  await assertFails(
    setDoc(doc(moi("a", "a@x.be"), "groupes/g2/membres/n"), { role: "lecteur", email: "n@x.be" })
  ); // autre groupe
  await assertSucceeds(deleteDoc(doc(moi("a", "a@x.be"), "groupes/g1/membres/l")));
  await assertFails(deleteDoc(doc(moi("e", "e@x.be"), "groupes/g1/membres/a")));
});

test("un membre ne se donne pas de rôle sans invitation", async () => {
  await assertFails(
    setDoc(doc(moi("n", "n@x.be"), "groupes/g1/membres/n"), { role: "admin", email: "n@x.be" })
  );
  await assertFails(
    setDoc(doc(moi("n", "n@x.be"), "utilisateurs/n/groupes/g1"), { role: "admin", nom: "x" })
  );
});

test("invitations : seul un administrateur du groupe invite, avec un identifiant « groupe|adresse »", async () => {
  const inv = { groupe: "g1", email: "n@x.be", role: "editeur", nomGroupe: "Sainte-Suzanne" };
  await assertSucceeds(setDoc(doc(moi("a", "a@x.be"), "invitations/g1|n@x.be"), inv));
  await assertFails(
    setDoc(doc(moi("e", "e@x.be"), "invitations/g1|n2@x.be"), { ...inv, email: "n2@x.be" })
  );
  await assertFails(setDoc(doc(moi("a", "a@x.be"), "invitations/autre"), inv)); // identifiant libre refusé
  await assertFails(
    setDoc(doc(moi("a", "a@x.be"), "invitations/g2|n@x.be"), { ...inv, groupe: "g2" })
  ); // admin d'un autre groupe
  await assertFails(
    setDoc(doc(moi("a", "a@x.be"), "invitations/g1|N@x.be"), { ...inv, email: "N@x.be" })
  ); // adresse en minuscules
  await assertFails(
    setDoc(doc(moi("a", "a@x.be"), "invitations/g1|n3@x.be"), {
      ...inv,
      email: "n3@x.be",
      role: "chef",
    })
  );
});

test("invitation : l'invité la voit, la reçoit avec son rôle, puis la supprime", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "invitations/g1|n@x.be"), {
      groupe: "g1",
      email: "n@x.be",
      role: "editeur",
      nomGroupe: "Sainte-Suzanne",
    });
    await setDoc(doc(ctx.firestore(), "invitations/g1|autre@x.be"), {
      groupe: "g1",
      email: "autre@x.be",
      role: "admin",
      nomGroupe: "Sainte-Suzanne",
    });
  });
  const n = moi("n", "N@X.be"); // l'adresse du jeton peut avoir des majuscules
  const q = query(collection(n, "invitations"), where("email", "==", "n@x.be"));
  const liste = await assertSucceeds(getDocs(q));
  if (liste.size !== 1) throw new Error("une invitation attendue");
  await assertFails(getDoc(doc(n, "invitations/g1|autre@x.be")));
  // rôle différent de l'invitation : refusé
  await assertFails(setDoc(doc(n, "groupes/g1/membres/n"), { role: "admin", email: "n@x.be" }));
  await assertFails(
    setDoc(doc(n, "groupes/g1/membres/n"), { role: "editeur", email: "autre@x.be" })
  );
  const b = writeBatch(n);
  b.set(doc(n, "groupes/g1/membres/n"), { role: "editeur", email: "n@x.be" });
  b.set(doc(n, "utilisateurs/n/groupes/g1"), { role: "editeur", nom: "Sainte-Suzanne" });
  b.delete(doc(n, "invitations/g1|n@x.be"));
  await assertSucceeds(b.commit());
  await assertSucceeds(getDoc(doc(n, "groupes/g1/camps/c1")));
  await assertFails(setDoc(doc(n, "groupes/g2/membres/n"), { role: "editeur", email: "n@x.be" })); // pas d'invitation pour g2
  await assertSucceeds(getDoc(doc(n, "utilisateurs/n/groupes/g1")));
  await assertFails(getDoc(doc(moi("e", "e@x.be"), "utilisateurs/n/groupes/g1")));
});

test("invitations : un administrateur voit et retire celles de son groupe, pas celles d'un autre", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "invitations/g1|n@x.be"), {
      groupe: "g1",
      email: "n@x.be",
      role: "lecteur",
      nomGroupe: "S",
    });
  });
  await assertSucceeds(getDoc(doc(moi("a", "a@x.be"), "invitations/g1|n@x.be")));
  await assertFails(getDoc(doc(moi("z", "z@x.be"), "invitations/g1|n@x.be")));
  await assertFails(deleteDoc(doc(moi("z", "z@x.be"), "invitations/g1|n@x.be")));
  await assertSucceeds(deleteDoc(doc(moi("a", "a@x.be"), "invitations/g1|n@x.be")));
});

test("prix communs : lisibles par tout connecté, écrits par le super-administrateur seul", async () => {
  await assertSucceeds(setDoc(doc(moi("s", ADMIN), "prix/colruyt"), { v: 1 }));
  await assertSucceeds(getDoc(doc(moi("l", "l@x.be"), "prix/colruyt")));
  await assertFails(setDoc(doc(moi("a", "a@x.be"), "prix/colruyt"), { v: 2 }));
});

test("un administrateur liste les invitations de son groupe, pas celles d'un autre", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "invitations/g1|n@x.be"), {
      groupe: "g1",
      email: "n@x.be",
      role: "lecteur",
      nomGroupe: "S",
    });
  });
  const parGroupe = (db, g) =>
    getDocs(query(collection(db, "invitations"), where("groupe", "==", g)));
  const liste = await assertSucceeds(parGroupe(moi("a", "a@x.be"), "g1"));
  if (liste.size !== 1) throw new Error("une invitation attendue");
  await assertFails(parGroupe(moi("e", "e@x.be"), "g1")); // un éditeur ne gère pas les invitations
  await assertFails(parGroupe(moi("a", "a@x.be"), "g2")); // administrateur d'un autre groupe
});

test("changer le rôle : la fiche du membre et sa copie « mes groupes » se modifient ensemble", async () => {
  const a = moi("a", "a@x.be");
  const b = writeBatch(a);
  b.set(doc(a, "groupes/g1/membres/l"), { role: "editeur", email: "l@x.be" });
  b.set(doc(a, "utilisateurs/l/groupes/g1"), { role: "editeur", nom: "Sainte-Suzanne" });
  await assertSucceeds(b.commit());
  const e = moi("e", "e@x.be");
  const c = writeBatch(e);
  c.set(doc(e, "groupes/g1/membres/l"), { role: "admin", email: "l@x.be" });
  c.set(doc(e, "utilisateurs/l/groupes/g1"), { role: "admin", nom: "Sainte-Suzanne" });
  await assertFails(c.commit());
});

test("morceaux : seuls les champs prévus, avec un texte de taille raisonnable ; suppression par marque", async () => {
  const e = moi("e", "e@x.be");
  const c = (id) => doc(e, "groupes/g1/camps/" + id);
  await assertFails(setDoc(c("n1"), { version: 1, data: "{}", intrus: 1 }));
  await assertFails(setDoc(c("n2"), { version: 1, data: 42 }));
  await assertFails(setDoc(c("n3"), { version: 1 }));
  await assertFails(setDoc(c("n4"), { version: 1, data: "x".repeat(900001) }));
  await assertFails(setDoc(c("n5"), { version: "1", data: "{}" }));
  await assertSucceeds(setDoc(c("n6"), { version: 1, data: "x".repeat(900000), par: "e", le: 1 }));
  // un éditeur « supprime » un camp en le marquant (il ne peut pas effacer le document)
  await assertSucceeds(
    setDoc(doc(e, "groupes/g1/camps/c1"), { version: 2, supprime: true, data: "" })
  );
  await assertFails(deleteDoc(doc(e, "groupes/g1/camps/c1")));
  // le catalogue suit les mêmes règles
  await assertSucceeds(setDoc(doc(e, "groupes/g1/catalogue/main"), { version: 1, data: "{}" }));
  await assertSucceeds(
    setDoc(doc(e, "groupes/g1/catalogue/main"), { version: 2, data: '{"a":1}' })
  );
  await assertFails(setDoc(doc(e, "groupes/g1/catalogue/main"), { version: 2, data: "{}" }));
});

test("historique : les membres lisent, les éditeurs ajoutent leur propre version et élaguent, personne ne modifie", async () => {
  const v = { cle: "cat", version: 1, data: "{}", par: "e", le: 1 };
  const e = moi("e", "e@x.be");
  await assertSucceeds(setDoc(doc(e, "groupes/g1/historique/h1"), v));
  await assertSucceeds(
    setDoc(doc(e, "groupes/g1/historique/h2"), { ...v, note: "avant suppression", fin: true })
  );
  await assertFails(setDoc(doc(e, "groupes/g1/historique/h3"), { ...v, par: "autre" })); // auteur falsifié
  await assertFails(setDoc(doc(e, "groupes/g1/historique/h4"), { ...v, intrus: 1 }));
  await assertFails(setDoc(doc(e, "groupes/g1/historique/h5"), { ...v, data: 3 }));
  await assertFails(setDoc(doc(e, "groupes/g1/historique/h6"), { ...v, data: "x".repeat(900001) }));
  await assertFails(setDoc(doc(e, "groupes/g1/historique/h7"), { ...v, note: "x".repeat(81) }));
  await assertFails(setDoc(doc(e, "groupes/g2/historique/h8"), v)); // autre groupe
  await assertFails(
    setDoc(doc(moi("l", "l@x.be"), "groupes/g1/historique/h9"), { ...v, par: "l" })
  ); // lecteur
  await assertSucceeds(getDoc(doc(moi("l", "l@x.be"), "groupes/g1/historique/h1")));
  await assertFails(getDoc(doc(moi("z", "z@x.be"), "groupes/g1/historique/h1")));
  await assertFails(updateDoc(doc(e, "groupes/g1/historique/h1"), { note: "x" })); // pas de modification
  await assertFails(deleteDoc(doc(moi("l", "l@x.be"), "groupes/g1/historique/h1")));
  await assertSucceeds(deleteDoc(doc(e, "groupes/g1/historique/h1")));
  const q = query(
    collection(moi("l", "l@x.be"), "groupes/g1/historique"),
    where("fin", "==", true)
  );
  const r = await assertSucceeds(getDocs(q));
  if (r.size !== 1) throw new Error("une version « avant suppression » attendue");
});
