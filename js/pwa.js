/* Intendance PSS – Installation sur l'écran d'accueil et usage hors connexion (service worker).
   Script classique : dépend des fichiers chargés avant lui (voir l'ordre dans index.html). */

let dip = null;

addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  dip = e;
  $("inst").style.display = "inline-block";
});

addEventListener("appinstalled", () => {
  $("inst").style.display = "none";
});

$("inst").onclick = () => {
  if (dip) {
    dip.prompt();
    dip.userChoice.finally(() => {
      dip = null;
      $("inst").style.display = "none";
    });
  }
};

if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone)
  $("ioshint").style.display = "block";

if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol))
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
