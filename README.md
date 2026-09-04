# MyAlert

Static browser notification opt-in page for Traeto publisher subscribers.

## Routes

- `https://myalert.in/?partner=traeto`
- `https://myalert.in/traeto` when the host supports SPA rewrites
- `https://myalert.in/publisher-notification-sw.js`

The page reads partner/topic data from:

`https://api.traeto.in/api/publisher-notifications/public/partners/{slug}`

The service worker must stay at the site root so browser push can use root scope.
