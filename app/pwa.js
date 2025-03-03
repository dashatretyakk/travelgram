export function register() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      const swUrl = "/sw.js";
      navigator.serviceWorker
        .register(swUrl)
        .then(function (registration) {
          console.log(
            "ServiceWorker registration successful with scope:",
            registration.scope
          );
        })
        .catch(function (error) {
          console.log("ServiceWorker registration failed: ", error);
        });
    });
  }
}
