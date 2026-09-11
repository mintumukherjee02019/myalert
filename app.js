const API_BASE = "https://api.traeto.in";
const STORAGE_KEY = "myalert_state_v1";
const DEVICE_KEY = "myalert_device_id";

const state = {
  route: window.location.pathname,
  query: new URLSearchParams(window.location.search),
  activeCategory: "All",
  search: "",
  filters: ["All"],
  publishers: [],
  subscriptions: [],
  updates: [],
  publisher: null,
  publisherIdentifier: "",
  topics: [],
  webPush: { enabled: false, publicKey: "" },
  selectedTopicIds: new Set(),
  topicPasscodes: {},
  browserEnabled: false,
  browserDenied: false,
  publisherFocusPending: false,
  qrOpen: false,
  qrError: "",
  whatsappOpen: false,
  whatsappName: "",
  whatsappPhone: "",
  whatsappConsent: false,
  loading: false,
  loadingPublishers: false,
  loadingSubscriptions: false,
  loadingUpdates: false,
  publishersLoaded: false,
  subscriptionsLoaded: false,
  updatesLoaded: false,
  error: "",
};

let searchTimer = 0;
let qrStream = null;
let qrScanStopped = true;
let html5QrScanner = null;

const icons = {
  bell:
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/></svg>',
  search:
    '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  qr:
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M16 16h2v2h-2zM21 16v5h-5M12 7v4M7 12h4M12 16v.01M12 21v-1"/></svg>',
  check:
    '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>',
  chevron:
    '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  menu:
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close:
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  arrow:
    '<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  phone:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z"/></svg>',
  message:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
  history:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>',
  shield:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
};

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function loadLocalState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (_) {
    return {};
  }
}

function saveLocalState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function getSavedContact() {
  const local = loadLocalState();
  return {
    phoneNumber: local.phoneNumber || "",
    displayName: local.displayName || "",
    lastEndpoint: local.lastEndpoint || "",
  };
}

function saveSavedContact(nextContact) {
  const local = loadLocalState();
  saveLocalState({ ...local, ...nextContact });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success !== true) {
    throw new Error(payload.message || "MyAlert API request failed.");
  }
  return payload;
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  window.setTimeout(() => el.classList.remove("show"), 2800);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(name) {
  return String(name || "MA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function routeTo(path) {
  history.pushState({}, "", path);
  syncRoute();
}

function syncRoute() {
  state.route = window.location.pathname;
  state.query = new URLSearchParams(window.location.search);
  render();
}

async function fetchPublicPublishers(query = "") {
  state.loadingPublishers = true;
  state.error = "";
  render();
  try {
    const url = new URL(`${API_BASE}/api/myalert-publisher-notifications/public/partners`);
    if (query.trim()) url.searchParams.set("query", query.trim());
    const payload = await fetchJson(url.toString());
    state.publishers = (payload.partners || []).map(normalizePublisher);
    state.filters = ["All", ...(payload.filters || [])]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
    state.publishersLoaded = true;
  } catch (error) {
    state.error = error.message || "Could not load MyAlert publishers.";
    state.publishers = [];
    state.publishersLoaded = true;
  } finally {
    state.loadingPublishers = false;
    render();
  }
}

function header(active = "") {
  const links = [
    ["/", "Discover"],
    ["/my-alerts", "My Alerts"],
    ["/help", "Help"],
  ];
  return `
    <header class="header">
      <div class="shell header-inner">
        <a href="/" class="brand" data-link>
          <span class="brand-mark">${icons.bell}</span>
          <span class="brand-text">
            <span class="wordmark">My<span>Alert</span></span>
            <span class="tagline-small">Get only the alerts you choose.</span>
          </span>
        </a>
        <nav class="desktop-nav" aria-label="Primary">
          ${links
            .map(
              ([href, label]) =>
                `<a href="${href}" data-link class="${
                  active === href ? "active" : ""
                }">${label}</a>`
            )
            .join("")}
        </nav>
        <button class="icon-btn" type="button" data-menu-open aria-label="Open menu">
          ${icons.menu}
        </button>
      </div>
    </header>
    <div class="drawer-backdrop" data-menu-close></div>
    <aside class="drawer" aria-label="Menu">
      <div class="drawer-head">
        <span class="brand">
          <span class="brand-mark">${icons.bell}</span>
          <span class="wordmark">My<span>Alert</span></span>
        </span>
        <button class="icon-btn" type="button" data-menu-close aria-label="Close menu">
          ${icons.close}
        </button>
      </div>
      <nav class="drawer-links">
        <a class="menu-link" href="/" data-link>${icons.search}Discover</a>
        <a class="menu-link" href="/my-alerts" data-link>${icons.bell}My Alerts</a>
        <a class="menu-link" href="/history" data-link>${icons.history}History</a>
        <a class="menu-link" href="/install" data-link>${icons.phone}iPhone Setup</a>
        <a class="menu-link" href="/help" data-link>${icons.message}Help</a>
        <a class="menu-link" href="/contact" data-link>${icons.phone}Contact</a>
        <a class="menu-link" href="/privacy" data-link>${icons.shield}Privacy</a>
      </nav>
    </aside>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div class="shell footer-inner">
        <div>
          <strong class="footer-brand">MyAlert</strong>
          <p class="tagline-small">Get only the alerts you choose.</p>
        </div>
        <div class="footer-links">
          <a href="/privacy" data-link>Privacy</a>
          <a href="/terms" data-link>Terms</a>
          <a href="/help" data-link>Help</a>
          <a href="/contact" data-link>Contact</a>
        </div>
      </div>
    </footer>
  `;
}

function appShell(content, active = "") {
  return `<div class="page">${header(active)}<main>${content}</main>${footer()}${qrScannerModal()}</div>`;
}

function qrScannerModal() {
  if (!state.qrOpen) return "";
  return `
    <div class="modal-backdrop open">
      <section class="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-title">
        <div class="modal-head">
          <div>
            <h2 id="qr-title" class="section-title">Scan Publisher QR</h2>
            <p class="section-subtitle">Point the camera at a MyAlert publisher QR code.</p>
          </div>
          <button class="icon-btn" type="button" data-qr-close aria-label="Close scanner">${icons.close}</button>
        </div>
        <div class="qr-frame">
          <video data-qr-video playsinline muted></video>
          <div id="qr-reader" class="qr-reader"></div>
          <span class="qr-corners"></span>
        </div>
        ${state.qrError ? `<div class="warning-box">${escapeHtml(state.qrError)}</div>` : ""}
      </section>
    </div>
  `;
}

function homePage() {
  if (!state.loadingPublishers && !state.publishersLoaded && !state.error) {
    setTimeout(() => fetchPublicPublishers(state.search), 0);
  }
  const filtered = state.publishers.filter((publisher) => {
    const query = state.search.trim().toLowerCase();
    const categoryOk =
      state.activeCategory === "All" ||
      publisher.category.toLowerCase().includes(state.activeCategory.toLowerCase()) ||
      (publisher.categories || []).some((category) =>
        category.toLowerCase().includes(state.activeCategory.toLowerCase())
      ) ||
      publisher.description.toLowerCase().includes(state.activeCategory.toLowerCase()) ||
      publisher.topics.some((topic) =>
        topic.toLowerCase().includes(state.activeCategory.toLowerCase())
      );
    const searchOk =
      !query ||
      [publisher.name, publisher.category, publisher.location, publisher.code]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return categoryOk && searchOk;
  });

  return appShell(
    `
      <section class="hero">
        <div class="shell hero-grid">
          <div>
            <span class="eyebrow">${icons.bell} MyAlert</span>
            <h1>Get only the alerts you choose.</h1>
            <p>Follow trusted publishers and receive important updates without installing another app.</p>
            <section class="code-card home-code-card" aria-labelledby="code-title">
              <div class="code-card-head">
                <span class="code-card-icon">${icons.bell}</span>
                <div>
                  <h2 id="code-title">Have a publisher code?</h2>
                  <p class="section-subtitle">Enter the code shared by a MyAlert publisher.</p>
                </div>
              </div>
              <div class="code-row">
                <input class="input" data-code-input placeholder="Enter publisher code" maxlength="12" />
                <button class="secondary-btn code-submit-btn" data-find-code>Find Publisher</button>
              </div>
            </section>
          </div>
          <div class="hero-card">
            <ul class="trust-list">
              <li>${icons.check} No forced app install</li>
              <li>${icons.check} No noisy group chats</li>
              <li>${icons.check} Easy unsubscribe</li>
              <li>${icons.check} Browser push and WhatsApp choices</li>
            </ul>
          </div>
        </div>
        <div class="shell">
          <div class="search-panel home-search-panel">
            <div class="search-row">
              <label class="input-wrap">
                ${icons.search}
                <span class="hidden">Search publisher</span>
                <input class="input has-icon" data-search-input placeholder="Search publisher, school, store, media..." value="${escapeHtml(
                  state.search
                )}" />
              </label>
              <button class="icon-btn" data-qr title="Scan QR" aria-label="Scan QR">${icons.qr}</button>
            </div>
          </div>
          <div class="chips" aria-label="Publisher filters">
            ${state.filters
              .map(
                (category) =>
                  `<button class="chip ${
                    state.activeCategory === category ? "active" : ""
                  }" data-category="${category}">${category}</button>`
              )
              .join("")}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-head">
            <div>
              <h2 class="section-title">Popular Alerts Near You</h2>
              <p class="section-subtitle">Trusted publishers people commonly follow.</p>
            </div>
            <a class="ghost-btn" href="/search" data-link>Filters</a>
          </div>
          <div class="publisher-grid">
            ${
              state.loadingPublishers
                ? '<div class="empty">Loading real MyAlert publishers...</div>'
                : filtered.length
                ? filtered.map(publisherCard).join("")
                : '<div class="empty">No active MyAlert publishers found. Try a publisher code or search again.</div>'
            }
          </div>
        </div>
      </section>
    `,
    "/"
  );
}

function publisherCard(publisher) {
  const topics = publisher.topics || [];
  const visibleTopics = topics.slice(0, 3);
  const more = topics.length - visibleTopics.length;
  return `
    <article class="publisher-card home-publisher-card">
      <div class="publisher-top">
        <div class="avatar">${initials(publisher.name)}</div>
        <div>
          <h3 class="publisher-name">
            ${escapeHtml(publisher.name)}
            ${publisher.verified ? `<span class="verified">${icons.check}</span>` : ""}
          </h3>
          <div class="publisher-meta">${escapeHtml(publisher.category)} &bull; ${escapeHtml(
    publisher.location
  )}</div>
        </div>
      </div>
      <p class="publisher-desc">${escapeHtml(publisher.description)}</p>
      <div class="topic-pills">
        ${visibleTopics.map((topic) => `<span class="pill">${escapeHtml(topic)}</span>`).join("")}
        ${more > 0 ? `<span class="pill">+${more} more</span>` : ""}
      </div>
      <div class="publisher-foot">
        <strong>${escapeHtml(publisher.subscribers)} subscribers</strong>
        <a class="secondary-btn" href="/p/${encodeURIComponent(publisher.slug)}" data-link>View Alerts ${icons.chevron}</a>
      </div>
    </article>
  `;
}

async function fetchPublisher(identifier) {
  state.loading = true;
  state.error = "";
  state.publisherIdentifier = identifier;
  render();
  try {
    const response = await fetch(
      `${API_BASE}/api/myalert-publisher-notifications/public/partners/${encodeURIComponent(
        identifier
      )}`
    );
    const payload = await response.json();
    if (!response.ok || payload.success !== true) {
      throw new Error(payload.message || "Publisher not found.");
    }
    state.publisher = normalizePublisher(payload.partner);
    state.topics = payload.topics || [];
    state.webPush = payload.webPush || { enabled: false, publicKey: "" };
    state.selectedTopicIds = new Set(state.topics.map((topic) => topic.id));
    state.topicPasscodes = {};
    state.whatsappOpen = true;
    state.whatsappConsent = true;
    const savedContact = getSavedContact();
    state.whatsappName = savedContact.displayName || state.whatsappName;
    state.whatsappPhone = savedContact.phoneNumber || state.whatsappPhone;
    state.publisherFocusPending = true;
    await hydratePublisherSubscription();
  } catch (error) {
    state.error = error.message || "Publisher not found.";
  } finally {
    state.loading = false;
    render();
  }
}

async function hydratePublisherSubscription() {
  try {
    const saved = getSavedContact();
    const endpoint = (await getCurrentPushEndpoint()) || saved.lastEndpoint || "";
    const phoneNumber = normalizePhone(saved.phoneNumber);
    if (!state.publisher || (!endpoint && !phoneNumber)) return;
    const url = new URL(`${API_BASE}/api/myalert-publisher-notifications/public/subscriptions`);
    url.searchParams.set("partnerId", state.publisher.id);
    if (endpoint) url.searchParams.set("endpoint", endpoint);
    if (phoneNumber) url.searchParams.set("phoneNumber", phoneNumber);
    const payload = await fetchJson(url.toString());
    const subscription = payload.subscriptions?.[0];
    if (!subscription) return;
    state.browserEnabled = subscription.hasBrowserPush === true;
    state.whatsappOpen = true;
    state.whatsappConsent = true;
    state.whatsappName = subscription.displayName || saved.displayName || "";
    state.whatsappPhone = subscription.phoneNumber || saved.phoneNumber || "";
  } catch (_) {
    state.browserEnabled = false;
  }
}

async function getCurrentPushEndpoint() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "";
  const registration =
    (await navigator.serviceWorker.getRegistration()) ||
    (await navigator.serviceWorker.register("/service-worker.js").catch(() => null));
  const subscription = await registration?.pushManager.getSubscription();
  return subscription?.endpoint || "";
}

async function fetchPublicSubscriptions() {
  const saved = getSavedContact();
  const endpoint = (await getCurrentPushEndpoint()) || saved.lastEndpoint || "";
  const phoneNumber = normalizePhone(saved.phoneNumber);
  state.loadingSubscriptions = true;
  state.error = "";
  render();
  try {
    if (!endpoint && !phoneNumber) {
      state.subscriptions = [];
      state.subscriptionsLoaded = true;
      return;
    }
    const url = new URL(`${API_BASE}/api/myalert-publisher-notifications/public/subscriptions`);
    if (endpoint) url.searchParams.set("endpoint", endpoint);
    if (phoneNumber) url.searchParams.set("phoneNumber", phoneNumber);
    const payload = await fetchJson(url.toString());
    state.subscriptions = payload.subscriptions || [];
    state.subscriptionsLoaded = true;
  } catch (error) {
    state.error = error.message || "Could not load your alert subscriptions.";
    state.subscriptions = [];
    state.subscriptionsLoaded = true;
  } finally {
    state.loadingSubscriptions = false;
    render();
  }
}

async function fetchPublicUpdates() {
  const saved = getSavedContact();
  const endpoint = (await getCurrentPushEndpoint()) || saved.lastEndpoint || "";
  const phoneNumber = normalizePhone(saved.phoneNumber);
  state.loadingUpdates = true;
  state.error = "";
  render();
  try {
    if (!endpoint && !phoneNumber) {
      state.updates = [];
      state.updatesLoaded = true;
      return;
    }
    const url = new URL(`${API_BASE}/api/myalert-publisher-notifications/public/updates`);
    if (endpoint) url.searchParams.set("endpoint", endpoint);
    if (phoneNumber) url.searchParams.set("phoneNumber", phoneNumber);
    const payload = await fetchJson(url.toString());
    state.updates = payload.updates || [];
    state.updatesLoaded = true;
  } catch (error) {
    state.error = error.message || "Could not load alert history.";
    state.updates = [];
    state.updatesLoaded = true;
  } finally {
    state.loadingUpdates = false;
    render();
  }
}

function normalizePublisher(raw = {}) {
  const name = raw.name || raw.entityName || raw.vendorName || raw.username || "Publisher";
  const topicLabels = Array.isArray(raw.topics)
    ? raw.topics.map((topic) => topic.title || topic.name || topic).filter(Boolean)
    : [];
  if (!topicLabels.length && Number(raw.topicCount) > 0) {
    topicLabels.push(`${raw.topicCount} alert topics`);
  }
  return {
    ...raw,
    name,
    slug: raw.slug || raw.publicSlug || raw.id,
    category: raw.category || raw.categories?.[0] || raw.businessType || "Publisher",
    categories: Array.isArray(raw.categories) && raw.categories.length ? raw.categories : ["Publisher"],
    location:
      raw.location ||
      raw.city ||
      raw.storeArea ||
      (Array.isArray(raw.postingCities) ? raw.postingCities[0] : "") ||
      "MyAlert",
    description:
      raw.description ||
      raw.shortDescription ||
      "Important updates, alerts and announcements from this publisher.",
    logoUrl: raw.logoUrl || raw.storeImage?.url || "",
    verified: raw.verified !== false,
    subscribers: raw.subscribers || raw.subscriberCount || "0",
    topics: topicLabels,
  };
}

function currentPublisherIdentifier() {
  const path = state.route;
  if (path.startsWith("/p/")) return decodeURIComponent(path.slice(3));
  if (path.startsWith("/code/")) return decodeURIComponent(path.slice(6));
  const code = state.query.get("code");
  const partner = state.query.get("partner");
  if (code) return code;
  if (partner) return partner;
  const bare = path.replace(/^\/+/, "");
  return bare || "";
}

function publisherPage() {
  const identifier = currentPublisherIdentifier();
  if (state.publisherIdentifier && state.publisherIdentifier !== identifier) {
    state.publisher = null;
    state.error = "";
  }
  if (
    (!state.publisher || state.publisherIdentifier !== identifier) &&
    !state.loading &&
    !state.error
  ) {
    setTimeout(() => fetchPublisher(identifier), 0);
  }

  if (state.loading) {
    return appShell(`<div class="shell section"><div class="empty">Loading publisher...</div></div>`);
  }
  if (state.error) {
    return appShell(
      `<div class="shell section"><a href="/" class="back-link" data-link>${icons.arrow} Back</a><div class="empty">Publisher not found. Check the link/code or search MyAlert.</div></div>`
    );
  }
  if (!state.publisher) {
    return appShell(`<div class="shell section"><div class="empty">Loading publisher...</div></div>`);
  }

  const publisher = state.publisher;
  const selectedTopics = state.topics.filter((topic) => state.selectedTopicIds.has(topic.id));
  const canContinue = selectedTopics.length > 0;
  return appShell(
    `
      <section class="section">
        <div class="shell publisher-layout">
          <div>
            <a href="/" class="back-link" data-link>${icons.arrow} Back</a>
            <section class="publisher-identity">
              <div class="publisher-identity-main">
                <div class="publisher-logo">${publisher.logoUrl ? `<img src="${escapeHtml(
                  publisher.logoUrl
                )}" alt="" />` : initials(publisher.name)}</div>
                <div>
                  <h1 class="page-title">${escapeHtml(publisher.name || "Publisher")} ${
      publisher.verified !== false ? `<span class="verified">${icons.check}</span>` : ""
    }</h1>
                  <p class="publisher-meta">${escapeHtml(
                    publisher.category || "Publisher"
                  )} &bull; ${escapeHtml(publisher.city || publisher.location || "MyAlert")}</p>
                </div>
              </div>
              <p class="page-subtitle">${escapeHtml(
                publisher.description ||
                  "Important updates, alerts and announcements from this publisher."
              )}</p>
            </section>
            <section class="section">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Choose what you want to receive</h2>
                  <p class="section-subtitle">You can change these anytime.</p>
                </div>
              </div>
              <div class="topics-list topic-grid">
                ${
                  state.topics.length
                    ? state.topics.map(topicCard).join("")
                    : '<div class="empty">This publisher has not added alert topics yet.</div>'
                }
              </div>
            </section>
          </div>
          <aside>
            <section class="section" style="padding-top: 54px;">
              <h2 class="section-title">How would you like to receive alerts?</h2>
              <p class="section-subtitle">Choose one or both.</p>
              <div class="delivery-list" style="margin-top: 14px;">
                ${browserCard(canContinue)}
                ${whatsappCard(canContinue, publisher.name || "this publisher")}
                ${summaryCard(selectedTopics, canContinue)}
              </div>
            </section>
          </aside>
        </div>
      </section>
    `
  );
}

function topicCard(topic) {
  const selected = state.selectedTopicIds.has(topic.id);
  return `
    <label class="topic-card ${selected ? "selected" : ""}">
      <input type="checkbox" data-topic-id="${escapeHtml(topic.id)}" ${selected ? "checked" : ""} />
      <span>
        <h3>${escapeHtml(topic.title || "Topic")}</h3>
        <span class="small-text">${escapeHtml(
          topic.description || "Important updates from this publisher"
        )}</span>
        ${
          topic.isPrivate
            ? `<span class="private-note">Private topic - passcode required</span>
               <span class="passcode-row">
                 <input class="input" data-passcode-for="${escapeHtml(
                   topic.id
                 )}" placeholder="Enter 5 character passcode" maxlength="5" value="${escapeHtml(
                state.topicPasscodes[topic.id] || ""
              )}" />
               </span>`
            : ""
        }
      </span>
    </label>
  `;
}

function browserCard(canContinue) {
  const unsupported = !("serviceWorker" in navigator) || !("PushManager" in window);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  return `
    <article class="delivery-card">
      <div class="delivery-title">
        <span class="delivery-icon">${icons.bell}</span>
        <div>
          <h3>Browser Notifications</h3>
          <p class="section-subtitle">Receive alerts directly on this device.</p>
          <p class="small-text">No phone number required.</p>
        </div>
      </div>
      ${
        state.browserEnabled
          ? `<div class="success-box">${icons.check} Browser notifications enabled</div>`
          : state.browserDenied
          ? `<div class="warning-box">Notifications are blocked for MyAlert in your browser settings.</div>`
          : unsupported || (isIos && !standalone)
          ? `<div class="warning-box">Browser notifications need MyAlert installed to Home Screen on iPhone.</div>
             <a class="inline-link" href="/install" data-link>Show iPhone setup</a>`
          : `<div class="success-box">${icons.check} Browser notifications will be enabled on submit</div>`
      }
    </article>
  `;
}

function whatsappCard(canContinue, publisherName) {
  return `
    <article class="delivery-card">
      <div class="delivery-title">
        <span class="delivery-icon whatsapp">${icons.message}</span>
        <div>
          <h3>WhatsApp Alerts</h3>
          <p class="section-subtitle">Receive the selected alerts on WhatsApp.</p>
        </div>
      </div>
      <label class="consent">
        <input type="checkbox" data-whatsapp-toggle ${state.whatsappOpen ? "checked" : ""} />
        <span>I want WhatsApp alerts</span>
      </label>
      <div class="${state.whatsappOpen ? "" : "hidden"}" style="display: grid; gap: 12px;">
        <div class="field">
          <label>Your Name *</label>
          <input class="input" data-wa-name value="${escapeHtml(state.whatsappName)}" placeholder="Your name" />
        </div>
        <div class="field">
          <label>WhatsApp Number *</label>
          <input class="input" data-wa-phone value="${escapeHtml(state.whatsappPhone)}" inputmode="tel" placeholder="+91 98765 43210" />
        </div>
        <label class="consent">
          <input type="checkbox" data-wa-consent ${state.whatsappConsent ? "checked" : ""} />
          <span>I agree to receive WhatsApp alerts from MyAlert on behalf of ${escapeHtml(
            publisherName
          )} for the topics I selected above.</span>
        </label>
        <p class="small-text">You can unsubscribe anytime. Your number is used to deliver the alerts you choose and manage your subscription.</p>
      </div>
    </article>
  `;
}

function summaryCard(selectedTopics, canContinue) {
  const publisher = state.publisher || {};
  const delivery = [
    canUseBrowserNotifications()
      ? state.browserEnabled
        ? "Browser Push on"
        : "Browser Push on submit"
      : "",
    state.whatsappOpen ? "WhatsApp" : "",
  ].filter(Boolean);
  return `
    <article class="summary-card">
      <h2 class="section-title">Your selection</h2>
      <ul class="summary-list">
        <li><span>Publisher</span><strong>${escapeHtml(publisher.name || "-")}</strong></li>
        <li><span>Topics</span><strong>${selectedTopics.length || 0}</strong></li>
        <li><span>Delivery</span><strong>${delivery.length ? delivery.join(", ") : "Choose method"}</strong></li>
      </ul>
      <button class="primary-btn submit-preferences-btn" data-save-preferences ${!canContinue ? "disabled" : ""}>Submit Alert Preferences</button>
      <p class="small-text">This will save your WhatsApp consent and enable browser notifications where supported.</p>
    </article>
  `;
}

function canUseBrowserNotifications() {
  const unsupported = !("serviceWorker" in navigator) || !("PushManager" in window);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  return !unsupported && !(isIos && !standalone) && state.webPush.enabled && !!state.webPush.publicKey;
}

async function prepareBrowserSubscription() {
  if (!canUseBrowserNotifications()) return null;
  const existingRegistration =
    (await navigator.serviceWorker.getRegistration()) ||
    (await navigator.serviceWorker.register("/service-worker.js"));
  const existingSubscription = await existingRegistration.pushManager.getSubscription();
  if (existingSubscription) return existingSubscription;
  const permission = await Notification.requestPermission();
  if (permission === "denied") {
    state.browserDenied = true;
    return null;
  }
  if (permission !== "granted") return null;
  return existingRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(state.webPush.publicKey),
  });
}

async function saveSubscription(subscription) {
  const topicIds = [...state.selectedTopicIds];
  const body = {
    publicSlug: state.publisher.publicSlug || state.publisher.slug || state.publisher.id,
    partnerId: state.publisher.id,
    topicIds,
    topicPasscodes: state.topicPasscodes,
    replaceTopics: true,
    anonymousDeviceId: getDeviceId(),
    source: "website",
  };
  if (subscription) {
    body.browserPush = subscription.toJSON();
  }
  if (state.whatsappOpen) {
    if (!validateWhatsapp()) return;
    body.displayName = state.whatsappName.trim();
    body.phoneNumber = normalizePhone(state.whatsappPhone);
    body.whatsappOptIn = { enabled: true };
  }
  await fetchJson(`${API_BASE}/api/myalert-publisher-notifications/public/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const savedContact = getSavedContact();
  saveSavedContact({
    displayName: state.whatsappOpen ? state.whatsappName.trim() : savedContact.displayName,
    phoneNumber: state.whatsappOpen ? normalizePhone(state.whatsappPhone) : savedContact.phoneNumber,
    lastEndpoint: subscription?.endpoint || savedContact.lastEndpoint || "",
  });
}

function validateWhatsapp() {
  if (!state.whatsappOpen) return true;
  if (!state.whatsappName.trim()) {
    toast("Enter your name.");
    return false;
  }
  const phone = state.whatsappPhone.replace(/\D/g, "");
  if (phone.length < 10) {
    toast("Enter a valid WhatsApp number.");
    return false;
  }
  if (!state.whatsappConsent) {
    toast("Please accept WhatsApp consent.");
    return false;
  }
  return true;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-15);
}

function resolveQrValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text, window.location.origin);
    if (url.searchParams.get("code")) {
      return `/code/${encodeURIComponent(url.searchParams.get("code").toUpperCase())}`;
    }
    if (url.searchParams.get("partner")) {
      return `/p/${encodeURIComponent(url.searchParams.get("partner"))}`;
    }
    if (url.pathname.startsWith("/p/") || url.pathname.startsWith("/code/")) {
      return url.pathname;
    }
  } catch (_) {}
  if (/^[A-Za-z0-9]{4,24}$/.test(text)) {
    return `/code/${encodeURIComponent(text.toUpperCase())}`;
  }
  return "";
}

async function openQrScanner() {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
    state.qrOpen = true;
    state.qrError = "Camera access is not available in this browser.";
    render();
    return;
  }
  state.qrOpen = true;
  state.qrError = "";
  render();
  const video = document.querySelector("[data-qr-video]");
  try {
    if (!("BarcodeDetector" in window) && window.Html5Qrcode) {
      video?.classList.add("hidden");
      html5QrScanner = new Html5Qrcode("qr-reader");
      await html5QrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => {
          const target = resolveQrValue(decodedText);
          if (target) {
            closeQrScanner();
            routeTo(target);
          }
        },
        () => {}
      );
      return;
    }
    if (!("BarcodeDetector" in window)) {
      state.qrError = "QR scanner could not load. Please update the browser or enter the publisher code.";
      render();
      return;
    }
    qrStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    video.srcObject = qrStream;
    await video.play();
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    qrScanStopped = false;
    const scan = async () => {
      if (qrScanStopped || !state.qrOpen) return;
      try {
        const codes = await detector.detect(video);
        const target = resolveQrValue(codes?.[0]?.rawValue);
        if (target) {
          closeQrScanner();
          routeTo(target);
          return;
        }
      } catch (_) {}
      requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
  } catch (error) {
    state.qrError = error?.message || "Camera permission was not granted.";
    render();
  }
}

function closeQrScanner() {
  qrScanStopped = true;
  if (html5QrScanner) {
    html5QrScanner.stop().catch(() => {}).finally(() => {
      html5QrScanner?.clear?.();
      html5QrScanner = null;
    });
  }
  if (qrStream) {
    qrStream.getTracks().forEach((track) => track.stop());
    qrStream = null;
  }
  state.qrOpen = false;
  state.qrError = "";
  render();
}

async function savePreferences() {
  if (state.selectedTopicIds.size === 0) {
    toast("Select at least one topic.");
    return;
  }
  if (state.whatsappOpen && !validateWhatsapp()) return;
  const privateOk = await verifyPrivatePasscodes();
  if (!privateOk) return;
  const subscription = await prepareBrowserSubscription();
  if (subscription) {
    state.browserEnabled = true;
  }
  if (!subscription && !state.whatsappOpen) {
    toast("Enable browser notifications or WhatsApp alerts first.");
    return;
  }
  await saveSubscription(subscription);
  state.subscriptionsLoaded = false;
  state.updatesLoaded = false;
  toast(subscription ? "Preferences saved. Browser and WhatsApp alerts are ready." : "WhatsApp alert preferences saved.");
  render();
}

async function verifyPrivatePasscodes() {
  const privateTopicIds = state.topics
    .filter((topic) => topic.isPrivate && state.selectedTopicIds.has(topic.id))
    .map((topic) => topic.id);
  if (!privateTopicIds.length) return true;
  const invalid = privateTopicIds.some(
    (id) => !/^[A-Z0-9]{5}$/.test(state.topicPasscodes[id] || "")
  );
  if (invalid) {
    toast("Private topics require a valid 5 character passcode.");
    return false;
  }
  const response = await fetch(
    `${API_BASE}/api/myalert-publisher-notifications/public/topics/verify-passcodes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicSlug: state.publisher.publicSlug || state.publisher.slug || state.publisher.id,
        partnerId: state.publisher.id,
        topicIds: privateTopicIds,
        topicPasscodes: state.topicPasscodes,
      }),
    }
  );
  const payload = await response.json();
  if (!response.ok || payload.success !== true) {
    toast(payload.message || "Private topic passcode did not match.");
    return false;
  }
  return true;
}

function myAlertsPage() {
  const saved = getSavedContact();
  if (!state.loadingSubscriptions && !state.subscriptionsLoaded && !state.error) {
    setTimeout(() => fetchPublicSubscriptions(), 0);
  }
  return appShell(
    `
      <section class="section">
        <div class="shell">
          <h1 class="page-title">My Alerts</h1>
          <p class="page-subtitle">Manage who can notify you and what you receive.</p>
          <div class="filter-panel" style="margin-top: 18px;">
            <div class="field">
              <label>WhatsApp number for lookup</label>
              <input class="input" data-lookup-phone value="${escapeHtml(
                saved.phoneNumber
              )}" inputmode="tel" placeholder="+91 98765 43210" />
            </div>
            <button class="secondary-btn" data-load-subscriptions>Refresh My Alerts</button>
          </div>
          <div class="alerts-list" style="margin-top: 20px;">
            ${
              state.loadingSubscriptions
                ? '<div class="empty">Loading your saved alert preferences...</div>'
                : state.subscriptions.length
                ? state.subscriptions.map(subscriptionCard).join("")
                : '<div class="empty">No subscriptions found for this device or WhatsApp number.</div>'
            }
          </div>
        </div>
      </section>
    `,
    "/my-alerts"
  );
}

function subscriptionCard(item) {
  const publisher = normalizePublisher(item.partner || {});
  const whatsappOn = item.whatsappOptIn?.enabled === true;
  return `
    <article class="publisher-card subscription-card">
      <div class="publisher-top">
        <div class="avatar">${initials(publisher.name)}</div>
        <div>
          <h3 class="publisher-name">${escapeHtml(publisher.name || "Publisher")} <span class="verified">${icons.check}</span></h3>
          <div class="publisher-meta">Browser Push: ${item.hasBrowserPush ? "ON" : "OFF"} &bull; WhatsApp: ${
    whatsappOn ? "ON" : "OFF"
  }</div>
        </div>
      </div>
      <div>
        ${(item.topics || [])
          .map(
            (topic) => `
              <div class="toggle-row">
                <strong>${escapeHtml(topic.title)}</strong>
                <button class="toggle on" data-topic-toggle data-topic-id="${escapeHtml(topic.id)}" aria-label="Toggle ${escapeHtml(
              topic.title
            )}"></button>
              </div>`
          )
          .join("")}
      </div>
      <button class="secondary-btn" data-unsubscribe="${escapeHtml(item.browserPush?.endpoint || "")}" ${
    item.hasBrowserPush ? "" : "disabled"
  }>Unsubscribe Browser Push</button>
    </article>
  `;
}

function historyPage() {
  const saved = getSavedContact();
  if (!state.loadingUpdates && !state.updatesLoaded && !state.error) {
    setTimeout(() => fetchPublicUpdates(), 0);
  }
  const items = state.updates.map((item) => ({
    publisher: normalizePublisher(item.partner || {}).name || "MyAlert",
    topic: item.topics?.[0]?.title || "Alert",
    title: item.title || item.publisher?.entityName || "MyAlert",
    body: item.body || "",
    time: item.sentAt || item.createdAt,
    unread: false,
  }));
  return appShell(
    `
      <section class="section">
        <div class="shell">
          <h1 class="page-title">Alert History</h1>
          <p class="page-subtitle">When your subscribed publishers send updates, they appear here.</p>
          <div class="filter-panel" style="margin-top: 18px;">
            <div class="field">
              <label>WhatsApp number for lookup</label>
              <input class="input" data-lookup-phone value="${escapeHtml(
                saved.phoneNumber
              )}" inputmode="tel" placeholder="+91 98765 43210" />
            </div>
            <button class="secondary-btn" data-load-updates>Refresh History</button>
          </div>
          <div class="chips">
            ${["All", "Unread", "Traffic", "Schools", "Media"]
              .map((label, index) => `<button class="chip ${index === 0 ? "active" : ""}">${label}</button>`)
              .join("")}
          </div>
          <div class="history-list" style="margin-top: 18px;">
            ${
              state.loadingUpdates
                ? '<div class="empty">Loading sent alerts from MyAlert...</div>'
                : items.length
                ? items.map(historyCard).join("")
                : '<div class="empty">No sent alerts found for this device or WhatsApp number yet.</div>'
            }
          </div>
        </div>
      </section>
    `,
    "/history"
  );
}

function historyCard(item) {
  const time = item.time ? new Date(item.time).toLocaleString() : "Just now";
  return `
    <article class="history-card ${item.unread ? "unread" : ""}">
      <div class="avatar">${initials(item.publisher)}</div>
      <div>
        <h3 class="publisher-name">${escapeHtml(item.publisher)}</h3>
        <div class="publisher-meta">${escapeHtml(item.topic)}</div>
        <strong>${escapeHtml(item.title)}</strong>
        <p class="publisher-desc">${escapeHtml(item.body)}</p>
        <p class="small-text">${escapeHtml(time)}</p>
      </div>
    </article>
  `;
}

function searchPage() {
  if (!state.loadingPublishers && !state.publishers.length && !state.error) {
    setTimeout(() => fetchPublicPublishers(state.search), 0);
  }
  return appShell(
    `
      <section class="section">
        <div class="shell">
          <h1 class="page-title">Find Publishers</h1>
          <p class="page-subtitle">Search by name, category, city or publisher code.</p>
          <div class="filter-panel" style="margin-top: 20px;">
            <div class="field">
              <label>Search publisher, school, store, media...</label>
              <input class="input" data-search-input value="${escapeHtml(state.search)}" />
            </div>
            <div class="chips" style="margin-top: 14px;">
              ${state.filters
                .filter((category) => category !== "All")
                .map((category) => `<button class="chip" data-category="${category}">${category}</button>`)
                .join("")}
            </div>
          </div>
          <p class="section-subtitle" style="margin-top: 18px;">${state.publishers.length} publishers found</p>
          <div class="publisher-grid" style="margin-top: 12px;">${
            state.loadingPublishers
              ? '<div class="empty">Searching active MyAlert publishers...</div>'
              : state.publishers.length
              ? state.publishers.map(publisherCard).join("")
              : '<div class="empty">No active MyAlert publishers found for this search.</div>'
          }</div>
        </div>
      </section>
    `,
    "/"
  );
}

function staticPage(kind) {
  const pages = {
    help: {
      title: "Help",
      subtitle:
        "Use MyAlert to follow trusted publishers and control exactly which alerts reach you.",
      cards: [
        ["Subscribe", "Open a publisher page, choose topics, then enable browser notifications, WhatsApp alerts, or both."],
        ["iPhone", "Add MyAlert to Home Screen from Safari before enabling browser notifications on iOS."],
        ["Private Topics", "If a topic is private, enter the publisher-provided 5 character passcode before subscribing."],
        ["Manage", "Use My Alerts to retrieve saved preferences by device endpoint or WhatsApp number."],
      ],
    },
    install: {
      title: "Enable alerts on iPhone",
      subtitle:
        "iOS browser notifications work from an installed Home Screen web app.",
      cards: [
        ["Open in Safari", "Visit the publisher link in Safari on your iPhone."],
        ["Add to Home Screen", "Tap Share, choose Add to Home Screen, then confirm MyAlert."],
        ["Return to Publisher", "Open MyAlert from the Home Screen and visit the publisher page again."],
        ["Enable Alerts", "Choose topics and tap Submit Alert Preferences."],
      ],
    },
    privacy: {
      title: "Privacy",
      subtitle:
        "MyAlert stores only the information required to deliver the alerts you choose.",
      cards: [
        ["Browser Push", "We store your browser push endpoint and keys so selected publishers can send notifications to this device."],
        ["WhatsApp", "When you opt in, we store your name, WhatsApp number, consent time, and selected topics."],
        ["Control", "You can stop browser push from My Alerts or from your browser notification settings."],
        ["No Spam", "Publishers can notify only subscribers who selected their topics."],
      ],
    },
    terms: {
      title: "Terms",
      subtitle:
        "These terms explain the basic rules for using MyAlert subscriber pages.",
      cards: [
        ["Chosen Alerts", "You are responsible for selecting the publishers and topics you want to follow."],
        ["Publisher Content", "Alert messages are created by publishers. MyAlert provides the delivery system."],
        ["Availability", "Delivery can depend on browser, device, network, WhatsApp, and notification permission status."],
        ["Unsubscribe", "You may stop receiving alerts anytime from My Alerts or your browser settings."],
      ],
    },
    contact: {
      title: "Contact",
      subtitle: "For support, questions, publisher links, or subscription help.",
      cards: [
        ["Email", "myalert@traeto.in"],
        ["Phone / WhatsApp", "+91 8624089902"],
        ["Support Hours", "Send your query anytime. We will respond on the registered contact channel."],
      ],
    },
  };
  const content = pages[kind] || pages.help;
  return appShell(
    `<section class="section static-hero">
      <div class="shell">
        <span class="eyebrow">${icons.bell} MyAlert</span>
        <h1 class="page-title">${content.title}</h1>
        <p class="page-subtitle">${content.subtitle}</p>
        <div class="info-grid">
          ${content.cards
            .map(
              ([title, body]) => `
                <article class="info-card">
                  <span class="delivery-icon">${icons.check}</span>
                  <div>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(body)}</p>
                  </div>
                </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`,
    kind === "help" ? "/help" : ""
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function unsubscribe(endpoint) {
  if (!endpoint) return;
  await fetchJson(`${API_BASE}/api/myalert-publisher-notifications/public/subscriptions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  state.subscriptionsLoaded = false;
  await fetchPublicSubscriptions();
  toast("Subscription removed.");
  render();
}

function render() {
  const path = state.route;
  const queryPublisher = state.query.get("code") || state.query.get("partner");
  let html = "";
  if (path === "/" && queryPublisher) {
    html = publisherPage();
  } else if (path === "/") {
    state.publisher = null;
    state.publisherIdentifier = "";
    state.error = "";
    html = homePage();
  } else if (path === "/search") {
    html = searchPage();
  } else if (path === "/my-alerts") {
    html = myAlertsPage();
  } else if (path === "/history") {
    html = historyPage();
  } else if (path === "/help" || path === "/install" || path === "/privacy" || path === "/terms" || path === "/contact") {
    html = staticPage(path.slice(1));
  } else if (path.startsWith("/p/") || path.startsWith("/code/") || path.length > 1) {
    html = publisherPage();
  } else {
    html = homePage();
  }
  document.getElementById("app").innerHTML = html;
  bindEvents();
  focusPublisherWhatsappFields();
}

function bindEvents() {
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      event.preventDefault();
      closeMenu();
      routeTo(href);
    });
  });
  document.querySelector("[data-menu-open]")?.addEventListener("click", openMenu);
  document.querySelectorAll("[data-menu-close]").forEach((el) => el.addEventListener("click", closeMenu));
  document.querySelector("[data-search-input]")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    state.publishersLoaded = false;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => fetchPublicPublishers(state.search), 300);
  });
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      render();
    });
  });
  document.querySelector("[data-find-code]")?.addEventListener("click", () => {
    const value = document.querySelector("[data-code-input]")?.value?.trim();
    if (!value) return toast("Enter a publisher code.");
    routeTo(`/code/${encodeURIComponent(value.toUpperCase())}`);
  });
  document.querySelector("[data-qr]")?.addEventListener("click", () => {
    openQrScanner().catch((error) => toast(error.message || "Could not open camera."));
  });
  document.querySelector("[data-qr-close]")?.addEventListener("click", closeQrScanner);
  document.querySelector("[data-select-all]")?.addEventListener("click", () => {
    state.selectedTopicIds = new Set(state.topics.map((topic) => topic.id));
    render();
  });
  document.querySelectorAll("[data-topic-id]").forEach((input) => {
    if (input.type !== "checkbox") return;
    input.addEventListener("change", () => {
      if (input.checked) state.selectedTopicIds.add(input.dataset.topicId);
      else state.selectedTopicIds.delete(input.dataset.topicId);
      render();
    });
  });
  document.querySelectorAll("[data-passcode-for]").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
      state.topicPasscodes[input.dataset.passcodeFor] = input.value;
    });
  });
  document.querySelector("[data-save-preferences]")?.addEventListener("click", () => {
    savePreferences().catch((error) =>
      toast(error.message || "We couldn't save your preferences. Please try again.")
    );
  });
  document.querySelector("[data-whatsapp-toggle]")?.addEventListener("change", (event) => {
    state.whatsappOpen = event.target.checked;
    render();
  });
  document.querySelector("[data-wa-name]")?.addEventListener("input", (event) => {
    state.whatsappName = event.target.value;
  });
  document.querySelector("[data-wa-phone]")?.addEventListener("input", (event) => {
    state.whatsappPhone = event.target.value;
  });
  document.querySelector("[data-wa-consent]")?.addEventListener("change", (event) => {
    state.whatsappConsent = event.target.checked;
  });
  document.querySelector("[data-lookup-phone]")?.addEventListener("input", (event) => {
    saveSavedContact({ phoneNumber: normalizePhone(event.target.value) });
  });
  document.querySelector("[data-load-subscriptions]")?.addEventListener("click", () => {
    state.subscriptionsLoaded = false;
    state.updatesLoaded = false;
    fetchPublicSubscriptions().catch((error) =>
      toast(error.message || "Could not load your saved alerts.")
    );
  });
  document.querySelector("[data-load-updates]")?.addEventListener("click", () => {
    state.updatesLoaded = false;
    fetchPublicUpdates().catch((error) =>
      toast(error.message || "Could not load sent alerts.")
    );
  });
  document.querySelectorAll("[data-unsubscribe]").forEach((button) => {
    button.addEventListener("click", () => unsubscribe(button.dataset.unsubscribe));
  });
}

function focusPublisherWhatsappFields() {
  if (!state.publisherFocusPending || !state.publisher || state.loading) return;
  state.publisherFocusPending = false;
  window.setTimeout(() => {
    const target =
      document.querySelector("[data-wa-name]")?.value.trim()
        ? document.querySelector("[data-wa-phone]")
        : document.querySelector("[data-wa-name]");
    target?.focus({ preventScroll: false });
  }, 80);
}

function openMenu() {
  document.body.classList.add("menu-open");
  document.querySelector(".drawer")?.classList.add("open");
  document.querySelector(".drawer-backdrop")?.classList.add("open");
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  document.querySelector(".drawer")?.classList.remove("open");
  document.querySelector(".drawer-backdrop")?.classList.remove("open");
}

window.addEventListener("popstate", syncRoute);
document.addEventListener("DOMContentLoaded", () => {
  const pendingRoute = sessionStorage.getItem("myalert_pending_route");
  if (pendingRoute) {
    sessionStorage.removeItem("myalert_pending_route");
    history.replaceState({}, "", pendingRoute);
  }
  getDeviceId();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }
  syncRoute();
});
