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

          // Check for updates to the service worker
          registration.addEventListener("updatefound", () => {
            // An updated service worker has appeared in registration.installing!
            const newWorker = registration.installing;

            newWorker.addEventListener("statechange", () => {
              // Has network.state changed?
              switch (newWorker.state) {
                case "installed":
                  if (navigator.serviceWorker.controller) {
                    // New content is available, refresh is needed
                    console.log("New content is available; please refresh.");

                    // Optional: show a notification to the user
                    if (
                      "Notification" in window &&
                      Notification.permission === "granted"
                    ) {
                      navigator.serviceWorker.ready.then((registration) => {
                        registration.showNotification("Update Available", {
                          body: "New content is available. Please refresh to update.",
                          icon: "/icons/icon-192x192.png",
                        });
                      });
                    }
                  } else {
                    // Content is cached for offline use
                    console.log("Content is cached for offline use.");
                  }
                  break;
              }
            });
          });
        })
        .catch(function (error) {
          console.log("ServiceWorker registration failed: ", error);
        });

      // Handle service worker updates
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }

  // Request notification permission for update notifications
  if (typeof window !== "undefined" && "Notification" in window) {
    Notification.requestPermission();
  }
}
