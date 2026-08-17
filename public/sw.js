/* Minimal service worker whose only job is to show chat push notifications.
   Registered from src/main.jsx. Not used for offline caching. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Minto Farm Records", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Minto Farm Records";
  const options = {
    body: data.body || "",
    icon: "/apple-touch-icon.png",
    badge: "/apple-touch-icon.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Home-screen app icon badge (iOS 16.4+ / Chrome installed PWAs). Not
      // an exact unread count — just marks "there's something new" until the
      // app clears it on open. Silently does nothing where unsupported.
      self.registration.setAppBadge ? self.registration.setAppBadge(1).catch(() => {}) : Promise.resolve(),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
