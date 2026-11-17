// Service worker for the PWA and Web Push.
// FCM delivers standard push events, so no Firebase SDK is needed here.
// Server sends data messages: { title, body, url, tag }.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {}
  const d = payload.data || payload.notification || {};
  // Browsers require a visible notification for every push, so always show one.
  event.waitUntil(
    self.registration.showNotification(d.title || "Wat", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: d.tag || "alms",
      renotify: true,
      vibrate: [300, 100, 300],
      data: { url: d.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => w.url === url);
      return open ? open.focus() : self.clients.openWindow(url);
    })(),
  );
});
