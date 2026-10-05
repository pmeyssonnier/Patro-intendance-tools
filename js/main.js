/* Intendance PSS – Démarrage : page affichée au lancement et premier affichage.
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

go(
  (() => {
    try {
      const g = sessionStorage.getItem("pg");
      return PG[g] ? g : "eff";
    } catch (_) {
      return "eff";
    }
  })()
);

syncDrawer(false);

fillCamp();

drawCamps();

drawSw();

drawDiets();

drawDietEd();

drawMenu();

drawRec();

calc();
