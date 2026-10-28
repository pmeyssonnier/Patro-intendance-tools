// Contrôle du code JavaScript : npm run lint
// Les fichiers de js/ sont des scripts classiques qui partagent leurs variables globales.
// Pour que « no-undef » repère une faute de frappe sans lister les globales à la main, on prend
// comme globales connues tout ce que les fichiers de js/ déclarent au premier niveau.
const fs = require("fs");
const path = require("path");
const espree = require("espree");
const js = require("@eslint/js");
const globals = require("globals");

const JS_DIR = path.join(__dirname, "js");
const fichiers = fs.readdirSync(JS_DIR).filter((f) => f.endsWith(".js"));

/** Noms déclarés au premier niveau dans un fichier : { nom: "readonly" (const, function) ou "writable" (let, var) }. */
function declarations(code) {
  const noms = {};
  let droit = "readonly";
  const ajouter = (id) => {
    if (id.type === "Identifier") noms[id.name] = droit;
    else if (id.type === "ObjectPattern")
      id.properties.forEach((p) => ajouter(p.type === "RestElement" ? p.argument : p.value));
    else if (id.type === "ArrayPattern") id.elements.forEach((e) => e && ajouter(e));
    else if (id.type === "AssignmentPattern") ajouter(id.left);
    else if (id.type === "RestElement") ajouter(id.argument);
  };
  const ast = espree.parse(code, { ecmaVersion: "latest", sourceType: "script" });
  for (const n of ast.body) {
    if (n.type === "VariableDeclaration") {
      droit = n.kind === "const" ? "readonly" : "writable";
      n.declarations.forEach((d) => ajouter(d.id));
    } else if ((n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") && n.id)
      noms[n.id.name] = "readonly";
  }
  return noms;
}

const globalesAppli = {};
for (const f of fichiers)
  Object.assign(globalesAppli, declarations(fs.readFileSync(path.join(JS_DIR, f), "utf8")));

module.exports = [
  // tests-sync : test de bout en bout lancé à part (le code exécuté dans le navigateur utilise les globales de js/, pas celles de Node)
  { ignores: ["node_modules/", "test-results/", "playwright-report/", "tests-sync/"] },
  js.configs.recommended,
  {
    // Page : scripts classiques qui se partagent les mêmes globales
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: { ...globals.browser, ...globalesAppli },
    },
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }], // « x == null » = null ou undefined, voulu
      "no-empty": ["error", { allowEmptyCatch: true }], // stockage indisponible : on continue sans
      "no-implied-eval": "error",
      "no-new-func": "error",
      // Une fonction ou une constante d'un fichier est utilisée par un autre : « no-unused-vars »
      // ne s'applique donc qu'aux variables locales et aux paramètres.
      "no-unused-vars": ["error", { vars: "local", args: "none", caughtErrors: "none" }],
      // Les globales de l'appli sont déclarées dans un autre fichier ou ailleurs dans ce fichier.
      "no-redeclare": "off",
    },
  },
  {
    // Service worker
    files: ["sw.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: globals.serviceworker,
    },
    rules: { eqeqeq: ["error", "always", { null: "ignore" }] },
  },
  {
    // Tests et configuration : Node ; le code passé à page.evaluate() voit les globales de l'appli
    files: ["tests/**/*.js", "*.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: { ...globals.node, ...globals.browser, ...globalesAppli },
    },
    rules: { eqeqeq: ["error", "always", { null: "ignore" }] },
  },
];
