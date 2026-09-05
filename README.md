# MyAlert

Static browser notification opt-in page for Traeto publisher subscribers.

## Routes

- `https://myalert.in/?code=AB12`
- `https://myalert.in/?partner=traeto` for slug compatibility
- `https://myalert.in/traeto` when the host supports SPA rewrites
- `https://myalert.in/publisher-notification-sw.js`
- `https://myalert.in/site.webmanifest`

The page reads partner/topic data from:

`https://api.traeto.in/api/myalert-publisher-notifications/public/partners/{slug}`

The service worker must stay at the site root so browser push can use root scope.

Current public API namespace: `/api/myalert-publisher-notifications`.
