self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = {};
  }

  const title = payload.title || "MyAlert update";
  const options = {
    body: payload.body || "You have a new update.",
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: {
      actionUrl: payload.actionUrl || "/view",
      updateId: payload.updateId || "",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const actionUrl = event.notification.data && event.notification.data.actionUrl
    ? event.notification.data.actionUrl
    : "/view";
  event.waitUntil(clients.openWindow(actionUrl));
});
