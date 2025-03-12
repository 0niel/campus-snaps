/**
 * Register a service worker for offline capabilities and image caching
 */
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").then(
        function (registration) {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope,
          );
        },
        function (err) {
          console.log("ServiceWorker registration failed: ", err);
        },
      );
    });
  }
}

/**
 * Cache images for offline use
 */
export function cacheImages(urls: string[]) {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  void caches.open("campus-snaps-images").then((cache) => {
    urls.forEach((url) => {
      fetch(url, { mode: "no-cors" })
        .then((response) => {
          if (response.status === 200) {
            cache.put(url, response);
          }
        })
        .catch((error) => {
          console.error("Error caching image:", url, error);
        });
    });
  });
}

/**
 * Clear cached images that are older than a week
 */
export function clearOldCache() {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  void caches.open("campus-snaps-images").then((cache) => {
    cache.keys().then((requests) => {
      requests.forEach((request) => {
        cache.match(request).then((response) => {
          if (response) {
            const headers = response.headers;
            const date = headers.get("date");
            if (date && new Date(date).getTime() < oneWeekAgo) {
              cache.delete(request);
            }
          }
        });
      });
    });
  });
}
