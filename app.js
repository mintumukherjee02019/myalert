const API_BASE = "https://api.traeto.in";
const STORAGE_KEY = "myalert_state_v1";
const DEVICE_KEY = "myalert_device_id";
const MYALERT_ANDROID_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=in.myalert.pub";
const MYALERT_IOS_DOWNLOAD_URL = "https://apps.apple.com/search?term=MyAlert%20Publisher";

const state = {
  route: window.location.pathname,
  query: new URLSearchParams(window.location.search),
  activeCategory: "All",
  homeVisiblePublishers: 5,
  search: "",
  filters: ["All"],
  publishers: [],
  subscriptions: [],
  myAlertsSearch: "",
  savedAlerts: [],
  updates: [],
  publisherPosts: [],
  alertDetail: null,
  alertDetailPublisher: null,
  alertDetailId: "",
  alertDetailPublisherIdentifier: "",
  publisher: null,
  publisherIdentifier: "",
  publisherTab: "topics",
  topics: [],
  webPush: { enabled: false, publicKey: "" },
  selectedTopicIds: new Set(),
  topicPasscodes: {},
  browserEnabled: false,
  browserDenied: false,
  publisherFocusPending: false,
  qrOpen: false,
  qrError: "",
  whatsappOpen: true,
  whatsappName: "",
  whatsappPhone: "",
  whatsappConsent: false,
  whatsappOtp: "",
  whatsappOtpSent: false,
  whatsappOtpBusy: false,
  whatsappOtpMessage: "",
  whatsappOtpCooldownUntil: 0,
  whatsappVerifiedPhone: "",
  lastSubscriptionWhatsAppEnabled: true,
  apiRequestName: "",
  apiRequestPhone: "",
  apiRequestEmail: "",
  apiRequestBusy: false,
  apiRequestSent: false,
  apiRequestError: "",
  apiRequestRedirectUntil: 0,
  subscriptionActionBusy: false,
  actionDialog: null,
  loading: false,
  loadingPublishers: false,
  loadingSubscriptions: false,
  loadingUpdates: false,
  loadingPublisherPosts: false,
  loadingAlertDetail: false,
  publishersLoaded: false,
  subscriptionsLoaded: false,
  updatesLoaded: false,
  publisherPostsLoaded: false,
  publisherPostsHasMore: true,
  publisherPostsOffset: 0,
  publisherPostsError: "",
  alertDetailError: "",
  error: "",
};

let searchTimer = 0;
let qrStream = null;
let qrScanStopped = true;
let html5QrScanner = null;
let otpCooldownTimer = 0;
let otpVerifyTimer = 0;
let successRedirectTimer = 0;
let successCountdownTimer = 0;
let apiRequestRedirectTimer = 0;
let apiRequestCountdownTimer = 0;

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
  posts:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  pin:
    '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 17-5 5"/><path d="M9 10 4 5l1-1 5 5"/><path d="m14 4 6 6"/><path d="m8 14 8-8"/><path d="M15 9 9 15"/></svg>',
  calendar:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg>',
  clock:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  share:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg>',
  download:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  bookmark:
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
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
    verifiedWhatsAppPhone: local.verifiedWhatsAppPhone || "",
    verifiedWhatsAppName: local.verifiedWhatsAppName || "",
    whatsappVerifiedAt: local.whatsappVerifiedAt || "",
  };
}

function saveSavedContact(nextContact) {
  const local = loadLocalState();
  saveLocalState({ ...local, ...nextContact });
}

function getSavedAlerts() {
  const local = loadLocalState();
  return Array.isArray(local.savedAlerts) ? local.savedAlerts : [];
}

function saveSavedAlerts(savedAlerts) {
  const local = loadLocalState();
  saveLocalState({ ...local, savedAlerts });
  state.savedAlerts = savedAlerts;
}

function isAlertSaved(alertId) {
  if (!state.savedAlerts.length) state.savedAlerts = getSavedAlerts();
  return state.savedAlerts.some((item) => item.id === alertId);
}

function currentAlertSavePayload() {
  if (!state.alertDetail || !state.alertDetailPublisher) return null;
  const publisher = state.alertDetailPublisher;
  const update = state.alertDetail;
  const topicTitle = update.topics?.[0]?.title || "General";
  return {
    id: update.id,
    title: update.title || "Alert update",
    body: update.body || "",
    topic: topicTitle,
    publisherName: publisher.name || "Publisher",
    publisherSlug: publisher.publicSlug || publisher.slug || publisher.id || state.alertDetailPublisherIdentifier,
    publisherCategory: publisher.category || "Publisher",
    publisherLocation: publisher.city || publisher.location || "MyAlert",
    sentAt: update.sentAt || update.createdAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
    url: window.location.pathname + window.location.search,
  };
}

function saveCurrentAlert() {
  const payload = currentAlertSavePayload();
  if (!payload?.id) {
    showActionDialog("error", "Could not save alert", "This alert is not ready yet. Please try again.");
    return;
  }
  const next = [payload, ...getSavedAlerts().filter((item) => item.id !== payload.id)].slice(0, 50);
  saveSavedAlerts(next);
  showActionDialog("success", "Alert saved", "You can find this alert under My Alerts.");
}

function removeSavedAlert(alertId) {
  const next = getSavedAlerts().filter((item) => item.id !== alertId);
  saveSavedAlerts(next);
  showActionDialog("success", "Saved alert removed", "This alert was removed from your saved list.");
}

function applySavedWhatsAppVerification() {
  const saved = getSavedContact();
  const currentPhone = normalizePhone(state.whatsappPhone);
  const savedVerifiedPhone = normalizePhone(saved.verifiedWhatsAppPhone);
  if (!currentPhone && saved.phoneNumber) {
    state.whatsappPhone = saved.phoneNumber;
  }
  if (!state.whatsappName && (saved.verifiedWhatsAppName || saved.displayName)) {
    state.whatsappName = saved.verifiedWhatsAppName || saved.displayName;
  }
  const nextPhone = normalizePhone(state.whatsappPhone);
  state.whatsappVerifiedPhone =
    nextPhone && savedVerifiedPhone === nextPhone ? savedVerifiedPhone : "";
}

function rememberWhatsAppVerification() {
  const phoneNumber = normalizePhone(state.whatsappPhone);
  if (!phoneNumber) return;
  state.whatsappVerifiedPhone = phoneNumber;
  saveSavedContact({
    displayName: state.whatsappName.trim() || getSavedContact().displayName,
    phoneNumber,
    verifiedWhatsAppPhone: phoneNumber,
    verifiedWhatsAppName: state.whatsappName.trim(),
    whatsappVerifiedAt: new Date().toISOString(),
  });
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

function showActionDialog(kind, title, message) {
  state.actionDialog = {
    kind: kind === "error" ? "error" : "success",
    title,
    message,
  };
  render();
}

function closeActionDialog() {
  state.actionDialog = null;
  render();
}

function otpCooldownSeconds() {
  return Math.max(0, Math.ceil((state.whatsappOtpCooldownUntil - Date.now()) / 1000));
}

function setOtpCooldown(seconds) {
  state.whatsappOtpCooldownUntil = Date.now() + Math.max(0, Number(seconds) || 0) * 1000;
  if (!otpCooldownTimer) {
    otpCooldownTimer = window.setInterval(() => {
      if (otpCooldownSeconds() <= 0) {
        window.clearInterval(otpCooldownTimer);
        otpCooldownTimer = 0;
      }
      updateOtpPanelStatus();
    }, 1000);
  }
}

function resetWhatsappOtpState() {
  window.clearTimeout(otpVerifyTimer);
  otpVerifyTimer = 0;
  state.whatsappOtp = "";
  state.whatsappOtpSent = false;
  state.whatsappOtpMessage = "";
  state.whatsappOtpCooldownUntil = 0;
  state.whatsappVerifiedPhone = "";
}

function updateOtpPanelStatus() {
  const button = document.querySelector("[data-request-wa-otp]");
  if (!button) return;
  const phone = normalizePhone(state.whatsappPhone);
  const verified = !!phone && state.whatsappVerifiedPhone === phone;
  const cooldown = otpCooldownSeconds();
  button.disabled = state.whatsappOtpBusy || cooldown > 0 || verified;
  button.textContent = cooldown > 0 ? `Resend in ${cooldown}s` : state.whatsappOtpSent ? "Resend OTP" : "Send OTP";
  const message = document.querySelector("[data-otp-message]");
  if (message) {
    message.textContent = state.whatsappOtpMessage;
  }
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

function resetPublisherPosts() {
  state.publisherPosts = [];
  state.publisherPostsLoaded = false;
  state.publisherPostsHasMore = true;
  state.publisherPostsOffset = 0;
  state.publisherPostsError = "";
}

function formatPostTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} min ago`;
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))} hours ago`;
  if (diff < 7 * day) return `${Math.max(1, Math.floor(diff / day))} days ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function safeFileName(value) {
  return String(value || "myalert-alert")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "myalert-alert";
}

function publisherCodeForAlert(publisher = state.alertDetailPublisher) {
  return (
    publisher?.publicCode ||
    publisher?.publisherCode ||
    publisher?.code ||
    publisher?.entityId ||
    ""
  );
}

function getAlertPdfContext() {
  if (!state.alertDetail || !state.alertDetailPublisher) {
    throw new Error("Alert details are not ready yet.");
  }
  const publisher = state.alertDetailPublisher;
  const update = state.alertDetail;
  const topicTitle = update.topics?.[0]?.title || "General";
  const sentDate = update.sentAt || update.createdAt;
  const code = publisherCodeForAlert(publisher);
  return {
    publisher,
    update,
    code,
    topicTitle,
    title: update.title || "Alert update",
    body: update.body || "This update was sent by the publisher.",
    published: sentDate
      ? new Date(sentDate).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just now",
    url: window.location.href,
  };
}

function alertShareCaption(context = getAlertPdfContext()) {
  const followLine = context.code
    ? `Follow ${context.publisher.name || "this publisher"} on MyAlert with code ${context.code}.`
    : `Follow ${context.publisher.name || "this publisher"} on MyAlert.`;
  return `${context.title}\n\n${context.body}\n\n${followLine}\nPowered by MyAlert | myalert.in`;
}

function getJsPdfConstructor() {
  return window.jspdf?.jsPDF || window.jsPDF;
}

function writeWrappedPdfText(doc, text, x, y, maxWidth, lineHeight, options = {}) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  const maxY = options.maxY || 270;
  for (const line of lines) {
    if (y > maxY) {
      doc.addPage();
      drawAlertPdfFrame(doc);
      y = 58;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function drawPdfDownloadBadge(doc, x, y, width, platform, url) {
  const isIos = platform === "ios";
  const height = 13.5;
  doc.setFillColor(5, 5, 5);
  doc.roundedRect(x, y, width, height, 3, 3, "F");
  doc.setDrawColor(52, 52, 52);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, height, 3, 3);
  doc.setFillColor(255, 255, 255);
  if (isIos) {
    doc.ellipse(x + 7.5, y + 7.1, 2.4, 3.1, "F");
    doc.circle(x + 9.1, y + 4.2, 0.9, "F");
  } else {
    doc.triangle(x + 5.2, y + 3, x + 5.2, y + 10.6, x + 12, y + 6.8, "F");
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.4);
  doc.text(isIos ? "Download on the" : "GET IT ON", x + 15, y + 4.8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(isIos ? 8.5 : 8);
  doc.text(isIos ? "App Store" : "Google Play", x + 15, y + 10);
  doc.link(x, y, width, height, { url });
}

function drawMyAlertPdfWordmark(doc, x, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  doc.text("My", x, y);
  doc.setTextColor(225, 29, 72);
  doc.text("Alert", x + 10.5, y);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.text("Get only the alerts you choose.", x, y + 8);
}

function drawAlertPdfFrame(doc) {
  const pageWidth = 210;
  const pageHeight = 297;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(255, 247, 249);
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setFillColor(255, 228, 234);
  doc.circle(pageWidth - 20, 10, 22, "F");
  drawMyAlertPdfWordmark(doc, 15, 18);

  doc.setDrawColor(254, 205, 211);
  doc.setLineWidth(0.25);
  doc.line(14, 36, pageWidth - 14, 36);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text("PUBLIC ALERT DOCUMENT", pageWidth - 14, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Generated on myalert.in", pageWidth - 14, 23, { align: "right" });

  doc.setFillColor(225, 29, 72);
  doc.rect(0, 0, 3, pageHeight, "F");

  doc.setFillColor(255, 245, 247);
  doc.roundedRect(14, pageHeight - 29, pageWidth - 28, 21, 5, 5, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Download the MyAlert Publisher app", 18, pageHeight - 20);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Create and send trusted community alerts.", 18, pageHeight - 14);
  drawPdfDownloadBadge(doc, pageWidth - 101, pageHeight - 25.5, 41, "android", MYALERT_ANDROID_DOWNLOAD_URL);
  drawPdfDownloadBadge(doc, pageWidth - 55, pageHeight - 25.5, 41, "ios", MYALERT_IOS_DOWNLOAD_URL);
}

function buildAlertPdf() {
  const JsPDF = getJsPdfConstructor();
  if (!JsPDF) {
    throw new Error("PDF tools are still loading. Please try again in a moment.");
  }
  const context = getAlertPdfContext();
  const doc = new JsPDF({ unit: "mm", format: "a4", compress: true });
  const bodyLength = context.body.length;
  const titleSize = bodyLength > 900 ? 19 : bodyLength > 500 ? 22 : 25;
  const bodySize = bodyLength > 1100 ? 11 : bodyLength > 650 ? 12 : 13;
  drawAlertPdfFrame(doc);

  let y = 52;
  doc.setTextColor(225, 29, 72);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Alert Bulletin", 20, y);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(context.published, 190, y, { align: "right" });
  y += 9;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(18, y - 4, 174, 34, 5, 5, "FD");
  doc.setFillColor(255, 245, 247);
  doc.roundedRect(24, y + 2, 18, 18, 5, 5, "F");
  doc.setTextColor(225, 29, 72);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(initials(context.publisher.name || "MA"), 33, y + 14, { align: "center" });
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  y = writeWrappedPdfText(doc, context.publisher.name || "Publisher", 48, y + 8, 99, 7.5, { maxY: 250 });

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${context.publisher.category || "Publisher"} | ${context.publisher.city || context.publisher.location || "MyAlert"}`, 48, y + 2);
  if (context.code) {
    doc.setFillColor(225, 29, 72);
    doc.roundedRect(155, 66, 29, 10, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(context.code, 169.5, 72.5, { align: "center" });
    doc.setFillColor(255, 228, 234);
    doc.roundedRect(151, 79, 37, 7, 3, 3, "F");
    doc.setTextColor(225, 29, 72);
    doc.setFontSize(6.8);
    doc.text("PUBLISHER CODE", 169.5, 83.8, { align: "center" });
  }
  y = 103;

  const topicLabel =
    context.topicTitle.length > 28 ? `${context.topicTitle.slice(0, 25)}...` : context.topicTitle;
  const topicWidth = Math.min(82, Math.max(38, doc.getTextWidth(topicLabel) + 11));
  doc.setFillColor(255, 228, 234);
  doc.roundedRect(20, y - 6, topicWidth, 10, 4, 4, "F");
  doc.setTextColor(225, 29, 72);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(topicLabel, 24, y + 1);
  y += 14;

  const titleLines = doc.splitTextToSize(context.title, 166);
  const bodyLines = doc.splitTextToSize(context.body, 166);
  const contentHeight = Math.min(118, Math.max(58, titleLines.length * 9 + bodyLines.length * (bodySize + 1) + 22));
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(18, y - 5, 174, contentHeight, 5, 5, "FD");
  doc.setFillColor(225, 29, 72);
  doc.rect(18, y - 5, 2.5, contentHeight, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleSize);
  y = writeWrappedPdfText(doc, context.title, 27, y + 10, 156, titleSize > 22 ? 10 : 8, { maxY: 250 });
  y += 5;

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(bodySize);
  y = writeWrappedPdfText(doc, context.body, 27, y, 156, bodySize + 2, { maxY: 250 });
  y = Math.max(y + 14, 117 + contentHeight);

  const followTop = y;
  doc.setFillColor(255, 247, 249);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(18, followTop, 174, 32, 5, 5, "FD");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Follow this publisher", 27, followTop + 10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const followText = context.code
    ? `Use publisher code ${context.code} on myalert.in to receive future alerts.`
    : "Open myalert.in to receive future alerts from this publisher.";
  writeWrappedPdfText(doc, followText, 27, followTop + 18, 108, 5.5, { maxY: followTop + 28 });
  doc.setFillColor(225, 29, 72);
  doc.roundedRect(146, followTop + 11, 34, 11, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Open MyAlert", 163, followTop + 18, { align: "center" });
  doc.link(146, followTop + 11, 34, 11, { url: context.url });
  doc.setTextColor(225, 29, 72);
  return { doc, context };
}

function alertPdfFileName(context = getAlertPdfContext()) {
  return `${safeFileName(context.publisher.name)}-${safeFileName(context.title)}.pdf`;
}

async function downloadAlertPdf() {
  try {
    const { doc, context } = buildAlertPdf();
    doc.save(alertPdfFileName(context));
    showActionDialog("success", "PDF downloaded", "The alert PDF has been generated on your device.");
  } catch (error) {
    showActionDialog("error", "Could not download PDF", error.message || "Please try again.");
  }
}

async function shareAlertPdf() {
  try {
    const { doc, context } = buildAlertPdf();
    const fileName = alertPdfFileName(context);
    const blob = doc.output("blob");
    const caption = alertShareCaption(context);
    const file = typeof File !== "undefined" ? new File([blob], fileName, { type: "application/pdf" }) : null;
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: context.title,
        text: caption,
        files: [file],
      });
      return;
    }
    if (navigator.share) {
      await navigator.share({
        title: context.title,
        text: caption,
        url: context.url,
      });
      return;
    }
    doc.save(fileName);
    await navigator.clipboard?.writeText(caption).catch(() => {});
    showActionDialog(
      "success",
      "PDF downloaded",
      "Sharing files is not supported in this browser, so the PDF was downloaded and the caption was copied where supported."
    );
  } catch (error) {
    showActionDialog("error", "Could not share PDF", error.message || "Please try again.");
  }
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

function maybeLoadMoreHomePublishers() {
  if (state.route !== "/" || state.loadingPublishers) return;
  const marker = document.querySelector("[data-home-load-more]");
  if (!marker) return;
  const rect = marker.getBoundingClientRect();
  if (rect.top > window.innerHeight + 180) return;
  state.homeVisiblePublishers += 5;
  render();
}

function maybeLoadMorePublisherPosts() {
  if (state.publisherTab !== "posts" || state.loadingPublisherPosts || !state.publisherPostsHasMore) {
    return;
  }
  const marker = document.querySelector("[data-publisher-posts-load-more]");
  if (!marker) return;
  const rect = marker.getBoundingClientRect();
  if (rect.top > window.innerHeight + 180) return;
  fetchPublisherPosts().catch((error) =>
    toast(error.message || "Could not load more publisher posts.")
  );
}

function handleScrollLoaders() {
  maybeLoadMoreHomePublishers();
  maybeLoadMorePublisherPosts();
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
        <a class="menu-link" href="/api-req" data-link>${icons.message}API Req</a>
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
          <a href="/api-req" data-link>API Req</a>
        </div>
      </div>
    </footer>
  `;
}

function appShell(content, active = "") {
  return `<div class="page">${header(active)}<main>${content}</main>${footer()}${qrScannerModal()}${apiRequestSentDialog()}${actionDialog()}</div>`;
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

function apiRequestSentDialog() {
  if (!state.apiRequestSent) return "";
  return `
    <div class="modal-backdrop open">
      <section class="qr-modal request-sent-modal" role="dialog" aria-modal="true" aria-labelledby="api-request-sent-title">
        <div class="success-tick">${icons.check}</div>
        <h2 id="api-request-sent-title">Request sent</h2>
        <p>We have received your API request. Our team will contact you shortly.</p>
        <p class="small-text redirect-countdown">Redirecting to home in <strong data-api-request-countdown>10</strong> seconds.</p>
        <button class="primary-btn" type="button" data-api-request-home>Back to Home</button>
      </section>
    </div>
  `;
}

function actionDialog() {
  if (!state.actionDialog) return "";
  const isError = state.actionDialog.kind === "error";
  return `
    <div class="modal-backdrop open">
      <section class="qr-modal action-modal ${isError ? "error" : "success"}" role="dialog" aria-modal="true" aria-labelledby="action-dialog-title">
        <div class="action-modal-icon">${isError ? icons.close : icons.check}</div>
        <h2 id="action-dialog-title">${escapeHtml(state.actionDialog.title)}</h2>
        <p>${escapeHtml(state.actionDialog.message)}</p>
        <button class="primary-btn" type="button" data-action-dialog-close>OK</button>
      </section>
    </div>
  `;
}

function homePage() {
  if (!state.loadingPublishers && !state.publishersLoaded && !state.error) {
    setTimeout(() => fetchPublicPublishers(state.search), 0);
  }
  const filters = [
    state.activeCategory,
    ...state.filters.filter((category) => category !== state.activeCategory),
  ].filter(Boolean);
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
  const visiblePublishers = filtered.slice(0, state.homeVisiblePublishers);
  const hasMorePublishers = visiblePublishers.length < filtered.length;

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
            ${filters
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
                ? visiblePublishers.map(publisherCard).join("")
                : '<div class="empty">No active MyAlert publishers found. Try a publisher code or search again.</div>'
            }
          </div>
          ${
            hasMorePublishers
              ? `<div class="lazy-load-status" data-home-load-more>
                  <span class="loader-dot"></span>
                  <span>Scroll to load 5 more publishers</span>
                </div>`
              : filtered.length > 5
              ? '<p class="lazy-load-status complete">All publishers loaded.</p>'
              : ""
          }
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
        <a class="secondary-btn" href="/p/${encodeURIComponent(
          publisher.slug
        )}" data-link data-focus-alerts>View Alerts ${icons.chevron}</a>
      </div>
    </article>
  `;
}

async function fetchPublisher(identifier) {
  state.loading = true;
  state.error = "";
  if (state.publisherIdentifier !== identifier) {
    resetPublisherPosts();
    state.publisherTab = state.query.get("tab") === "posts" ? "posts" : "topics";
  }
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
    state.whatsappName = savedContact.verifiedWhatsAppName || savedContact.displayName || state.whatsappName;
    state.whatsappPhone = savedContact.phoneNumber || state.whatsappPhone;
    applySavedWhatsAppVerification();
    state.publisherFocusPending = true;
    await hydratePublisherSubscription();
  } catch (error) {
    state.error = error.message || "Publisher not found.";
  } finally {
    state.loading = false;
    render();
  }
}

async function fetchPublisherPosts({ reset = false } = {}) {
  if (!state.publisher || state.loadingPublisherPosts) return;
  if (!reset && !state.publisherPostsHasMore) return;
  if (reset) {
    resetPublisherPosts();
  }
  state.loadingPublisherPosts = true;
  state.publisherPostsError = "";
  render();
  try {
    const identifier =
      state.publisher.publicSlug ||
      state.publisher.slug ||
      state.publisher.publicCode ||
      state.publisherIdentifier ||
      state.publisher.id;
    const url = new URL(
      `${API_BASE}/api/myalert-publisher-notifications/public/partners/${encodeURIComponent(
        identifier
      )}/updates`
    );
    url.searchParams.set("limit", "5");
    url.searchParams.set("offset", String(state.publisherPostsOffset));
    const payload = await fetchJson(url.toString());
    const nextUpdates = payload.updates || [];
    const merged = reset ? nextUpdates : [...state.publisherPosts, ...nextUpdates];
    const seen = new Set();
    state.publisherPosts = merged.filter((item) => {
      const id = item.id || `${item.title}-${item.sentAt || item.createdAt}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    state.publisherPostsLoaded = true;
    state.publisherPostsHasMore = payload.hasMore === true;
    state.publisherPostsOffset =
      Number(payload.nextOffset) || state.publisherPostsOffset + nextUpdates.length;
  } catch (error) {
    state.publisherPostsError = error.message || "Could not load publisher posts.";
    state.publisherPostsLoaded = true;
  } finally {
    state.loadingPublisherPosts = false;
    render();
  }
}

async function fetchAlertDetail(publisherIdentifier, alertId) {
  state.loadingAlertDetail = true;
  state.alertDetailError = "";
  state.alertDetailPublisherIdentifier = publisherIdentifier;
  state.alertDetailId = alertId;
  render();
  try {
    const payload = await fetchJson(
      `${API_BASE}/api/myalert-publisher-notifications/public/partners/${encodeURIComponent(
        publisherIdentifier
      )}/updates/${encodeURIComponent(alertId)}`
    );
    state.alertDetailPublisher = normalizePublisher(payload.partner || {});
    state.alertDetail = payload.update || null;
    if (!state.alertDetail) {
      throw new Error("Alert not found.");
    }
  } catch (error) {
    state.alertDetailError = error.message || "Could not load alert details.";
    state.alertDetail = null;
    state.alertDetailPublisher = null;
  } finally {
    state.loadingAlertDetail = false;
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
    state.whatsappName = saved.verifiedWhatsAppName || subscription.displayName || saved.displayName || "";
    state.whatsappPhone = saved.verifiedWhatsAppPhone || subscription.phoneNumber || saved.phoneNumber || "";
    applySavedWhatsAppVerification();
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

function currentAlertRoute() {
  const match = state.route.match(/^\/p\/([^/]+)\/alerts\/([^/?#]+)/);
  if (!match) return null;
  return {
    publisherIdentifier: decodeURIComponent(match[1]),
    alertId: decodeURIComponent(match[2]),
  };
}

function publisherRouteIdentifier(publisher = state.publisher) {
  return (
    publisher?.publicSlug ||
    publisher?.slug ||
    publisher?.publicCode ||
    publisher?.entityId ||
    publisher?.id ||
    state.publisherIdentifier ||
    ""
  );
}

function publisherRoutePath(publisher = state.publisher, suffix = "") {
  const identifier = publisherRouteIdentifier(publisher);
  return `/p/${encodeURIComponent(identifier)}${suffix}`;
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
  const requestedTab = state.query.get("tab") === "posts" ? "posts" : state.publisherTab;
  if (state.publisherTab !== requestedTab) {
    state.publisherTab = requestedTab;
  }
  const activeTab = state.publisherTab === "posts" ? "posts" : "topics";
  if (
    activeTab === "posts" &&
    !state.publisherPostsLoaded &&
    !state.loadingPublisherPosts &&
    !state.publisherPostsError
  ) {
    setTimeout(() => fetchPublisherPosts({ reset: true }), 0);
  }
  return appShell(
    `
      <section class="section">
        <div class="shell publisher-layout ${activeTab === "posts" ? "posts-mode" : ""}">
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
            ${publisherTabs(activeTab)}
            ${
              activeTab === "posts"
                ? publisherPostsSection(publisher)
                : `<section class="section">
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
                  </section>`
            }
          </div>
          ${
            activeTab === "topics"
              ? `<aside>
                  <section class="section" style="padding-top: 54px;">
                    <h2 class="section-title">How would you like to receive alerts?</h2>
                    <p class="section-subtitle">Choose one or both.</p>
                    <div class="delivery-list" style="margin-top: 14px;">
                      ${browserCard(canContinue)}
                      ${whatsappCard(canContinue, publisher.name || "this publisher")}
                      ${summaryCard(selectedTopics, canContinue)}
                    </div>
                  </section>
                </aside>`
              : ""
          }
        </div>
      </section>
    `
  );
}

function publisherTabs(activeTab) {
  return `
    <div class="publisher-tabs" role="tablist" aria-label="Publisher sections">
      <button class="publisher-tab ${activeTab === "topics" ? "active" : ""}" type="button" data-publisher-tab="topics" role="tab" aria-selected="${
        activeTab === "topics"
      }">
        ${icons.bell}
        <span>Topics</span>
      </button>
      <button class="publisher-tab ${activeTab === "posts" ? "active" : ""}" type="button" data-publisher-tab="posts" role="tab" aria-selected="${
        activeTab === "posts"
      }">
        ${icons.posts}
        <span>All Posts</span>
        <small>Latest posts</small>
      </button>
    </div>
  `;
}

function publisherPostsSection(publisher) {
  const posts = state.publisherPosts || [];
  return `
    <section class="section publisher-posts-section">
      <div class="posts-head">
        <div>
          <h2 class="section-title">Recent updates</h2>
          <p class="section-subtitle">All alerts and announcements from this publisher.</p>
        </div>
      </div>
      <div class="publisher-posts-list">
        ${
          state.publisherPostsError
            ? `<div class="empty">${escapeHtml(state.publisherPostsError)}</div>`
            : posts.length
            ? posts.map(publisherPostCard).join("")
            : state.loadingPublisherPosts
            ? '<div class="empty">Loading latest posts...</div>'
            : '<div class="empty">No sent posts are available for this publisher yet.</div>'
        }
      </div>
      ${
        state.publisherPostsHasMore
          ? `<div class="lazy-load-status" data-publisher-posts-load-more>
              <span class="loader-dot"></span>
              <span>${state.loadingPublisherPosts ? "Loading more posts..." : "Scroll to load more posts"}</span>
            </div>`
          : posts.length
          ? `<div class="posts-end">
              <img src="/assets/share/myalert-preview.png" alt="" />
              <strong>You are all caught up</strong>
              <span>End of posts from this publisher.</span>
            </div>`
          : ""
      }
    </section>
  `;
}

function publisherPostCard(update, index) {
  const topic = update.topics?.[0] || {};
  const topicTitle = topic.title || "General";
  const title = update.title || topicTitle || "Alert update";
  const body = update.body || "This update was sent by the publisher.";
  const time = formatPostTime(update.sentAt || update.createdAt);
  const pinned = index === 0 && update.priority === "high";
  const detailPath = publisherRoutePath(state.publisher, `/alerts/${encodeURIComponent(update.id)}`);
  return `
    <a class="publisher-post-card" href="${detailPath}" data-link>
      <div class="post-icon">
        ${icons.bell}
      </div>
      <div class="post-content">
        <div class="post-meta-row">
          <span class="post-chip">${escapeHtml(topicTitle)}</span>
          ${pinned ? `<span class="post-pin">${icons.pin} Pinned</span>` : ""}
          <span class="post-time">${escapeHtml(time)}</span>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
      </div>
      <span class="post-arrow">${icons.chevron}</span>
    </a>
  `;
}

function alertDetailPage() {
  const route = currentAlertRoute();
  if (!route) return homePage();
  if (
    state.alertDetailError &&
    (state.alertDetailId !== route.alertId ||
      state.alertDetailPublisherIdentifier !== route.publisherIdentifier)
  ) {
    state.alertDetailError = "";
  }
  const needsLoad =
    !state.alertDetail ||
    state.alertDetailId !== route.alertId ||
    state.alertDetailPublisherIdentifier !== route.publisherIdentifier;
  if (needsLoad && !state.loadingAlertDetail && !state.alertDetailError) {
    setTimeout(() => fetchAlertDetail(route.publisherIdentifier, route.alertId), 0);
  }
  if (state.loadingAlertDetail) {
    return appShell(`<div class="shell section"><div class="empty">Loading alert details...</div></div>`);
  }
  if (state.alertDetailError) {
    return appShell(
      `<div class="shell section"><a href="/" class="back-link" data-link>${icons.arrow} Back</a><div class="empty">Alert not found or no longer public.</div></div>`
    );
  }
  if (!state.alertDetail || !state.alertDetailPublisher) {
    return appShell(`<div class="shell section"><div class="empty">Loading alert details...</div></div>`);
  }

  const publisher = state.alertDetailPublisher;
  const update = state.alertDetail;
  const topicTitle = update.topics?.[0]?.title || "General";
  const priority = update.priority || "normal";
  const sentDate = update.sentAt || update.createdAt;
  const saved = isAlertSaved(update.id);
  const channels = [
    "Browser Push",
    update.whatsappDelivery?.requested ? "WhatsApp" : "",
    update.facebookPost?.success ? "Facebook" : "",
  ].filter(Boolean);
  const publisherPath = publisherRoutePath(publisher);
  return appShell(
    `
      <section class="section">
        <div class="shell alert-detail-shell">
          <a href="${publisherPath}?tab=posts" class="back-link" data-link data-open-posts>${icons.arrow} Back</a>
          <section class="publisher-identity alert-publisher-identity">
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
          </section>

          <section class="alert-hero">
            <div class="alert-meta-strip">
              <span class="post-chip">${escapeHtml(topicTitle)}</span>
              ${
                priority === "high" || priority === "urgent"
                  ? `<span class="post-pin">${icons.pin} ${priority === "urgent" ? "Urgent" : "Pinned"}</span>`
                  : ""
              }
              <span class="post-time">${escapeHtml(formatPostTime(sentDate))}</span>
            </div>
          </section>

          <section class="alert-detail-card">
            <div class="alert-detail-card-head">
              <div class="alert-detail-icon">${icons.posts}</div>
              <h2>Update details</h2>
              <button class="detail-icon-btn" type="button" data-download-alert-pdf aria-label="Download alert PDF">${icons.download}</button>
              <button class="detail-icon-btn" type="button" data-share-alert-pdf="${escapeHtml(
                window.location.href
              )}" aria-label="Share alert PDF">${icons.share}</button>
              <button class="detail-icon-btn ${saved ? "saved" : ""}" type="button" data-save-alert aria-label="${
                saved ? "Alert saved" : "Save alert"
              }">${icons.bookmark}</button>
            </div>
            <div class="detail-rows">
              ${detailRow(icons.message, "Alert Details", update.body || "This update was sent by the publisher.", "detail-row-message")}
              ${detailRow(icons.bell, "Topic", topicTitle)}
              ${detailRow(icons.calendar, "Published", sentDate ? new Date(sentDate).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }) : "Just now")}
              ${detailRow(icons.clock, "Priority", priority[0].toUpperCase() + priority.slice(1))}
              ${detailRow(icons.bell, "Channels", channels.join(", ") || "Browser Push")}
            </div>
          </section>

          <section class="alert-detail-card">
            <div class="alert-detail-card-head simple">
              <div class="alert-detail-icon">${icons.shield}</div>
              <h2>Stay updated</h2>
            </div>
            <p class="detail-note">Choose topics from this publisher and receive future alerts through browser push or WhatsApp.</p>
          </section>

          <div class="alert-detail-actions">
            <a class="primary-btn" href="${publisherPath}" data-link data-focus-alerts>${icons.bell} Enable alerts from this publisher</a>
            <a class="secondary-btn" href="${publisherPath}?tab=posts" data-link data-open-posts>View all posts</a>
          </div>
        </div>
      </section>
    `
  );
}

function detailRow(icon, label, value, className = "") {
  return `
    <div class="detail-row ${escapeHtml(className)}">
      <span class="detail-row-icon">${icon}</span>
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value || "-")}</strong>
      </div>
    </div>
  `;
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
  state.whatsappOpen = true;
  const phone = normalizePhone(state.whatsappPhone);
  const verified = !!phone && state.whatsappVerifiedPhone === phone;
  const cooldown = otpCooldownSeconds();
  return `
    <article class="delivery-card whatsapp-alert-card" data-whatsapp-alerts>
      <div class="delivery-title">
        <span class="delivery-icon whatsapp">${icons.message}</span>
        <div>
          <h3>WhatsApp Alerts</h3>
          <p class="section-subtitle">Receive the selected alerts on WhatsApp.</p>
        </div>
      </div>
      <div style="display: grid; gap: 12px;">
        <label class="consent">
          <input type="checkbox" data-wa-consent ${state.whatsappConsent ? "checked" : ""} />
          <span>I agree to receive WhatsApp alerts from MyAlert on behalf of ${escapeHtml(
            publisherName
          )} for the topics I selected above.</span>
        </label>
        ${
          state.whatsappConsent
            ? `<div class="field">
                <label>Your Name *</label>
                <input class="input" data-wa-name value="${escapeHtml(state.whatsappName)}" placeholder="Your name" />
              </div>
              <div class="field">
                <label>WhatsApp Number *</label>
                <div class="phone-input">
                  <span>+91</span>
                  <input class="input" data-wa-phone value="${escapeHtml(
                    displayIndianPhone(state.whatsappPhone)
                  )}" inputmode="tel" placeholder="98765 43210" maxlength="12" />
                </div>
              </div>
              <div class="otp-panel ${verified ? "verified" : ""}">
                <div class="otp-panel-head">
                  <div>
                    <strong>${verified ? "Number verified" : "Verify WhatsApp number"}</strong>
                    <p>${verified ? "You can submit your alert preferences now." : "We will send a 4 digit OTP to this WhatsApp number."}</p>
                  </div>
                  ${
                    verified
                      ? `<span class="otp-verified-badge">${icons.check} Verified</span>`
                      : `<button class="secondary-btn otp-btn" type="button" data-request-wa-otp ${state.whatsappOtpBusy || cooldown > 0 ? "disabled" : ""}>
                          ${cooldown > 0 ? `Resend in ${cooldown}s` : state.whatsappOtpSent ? "Resend OTP" : "Send OTP"}
                        </button>`
                  }
                </div>
                ${
                  state.whatsappOtpSent && !verified
                    ? `<div class="otp-row">
                        <input class="input otp-input" data-wa-otp value="${escapeHtml(
                          state.whatsappOtp
                        )}" inputmode="numeric" placeholder="Enter OTP" maxlength="4" autocomplete="one-time-code" />
                        <button class="primary-btn otp-btn" type="button" data-verify-wa-otp ${state.whatsappOtpBusy ? "disabled" : ""}>Verify</button>
                      </div>`
                    : ""
                }
                <p class="otp-message" data-otp-message>${escapeHtml(state.whatsappOtpMessage)}</p>
              </div>`
            : `<div class="warning-box whatsapp-consent-warning">WhatsApp consent is unchecked, so this publisher will not send alerts to you on WhatsApp. Browser notifications will be used where supported.</div>`
        }
        <p class="small-text">${
          state.whatsappConsent
            ? "You can unsubscribe anytime. Your number is used to deliver the alerts you choose and manage your subscription."
            : "Name and WhatsApp number are not required when WhatsApp consent is unchecked."
        }</p>
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
    state.whatsappConsent ? "WhatsApp" : "WhatsApp off",
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
      <p class="small-text">${
        state.whatsappConsent
          ? "This will save your WhatsApp consent and enable browser notifications where supported."
          : "WhatsApp alerts will not be sent because consent is unchecked."
      }</p>
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
  const wantsWhatsApp = state.whatsappConsent === true;
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
  if (wantsWhatsApp) {
    if (!validateWhatsapp()) return false;
    body.displayName = state.whatsappName.trim();
    body.phoneNumber = normalizePhone(state.whatsappPhone);
    body.whatsappOptIn = { enabled: true };
  } else {
    body.whatsappOptIn = { enabled: false };
    const savedVerifiedPhone = normalizePhone(getSavedContact().verifiedWhatsAppPhone);
    if (savedVerifiedPhone) body.phoneNumber = savedVerifiedPhone;
  }
  await fetchJson(`${API_BASE}/api/myalert-publisher-notifications/public/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (wantsWhatsApp || subscription) {
    const savedContact = getSavedContact();
    saveSavedContact({
      displayName: state.whatsappName.trim() || savedContact.displayName,
      phoneNumber: normalizePhone(state.whatsappPhone) || savedContact.phoneNumber,
      verifiedWhatsAppPhone: state.whatsappVerifiedPhone || savedContact.verifiedWhatsAppPhone,
      verifiedWhatsAppName:
        state.whatsappVerifiedPhone === normalizePhone(state.whatsappPhone)
          ? state.whatsappName.trim()
          : savedContact.verifiedWhatsAppName,
      lastEndpoint: subscription?.endpoint || savedContact.lastEndpoint || "",
    });
  }
  return true;
}

function validateWhatsapp(options = {}) {
  const requireName = options.requireName !== false;
  const requireConsent = options.requireConsent !== false;
  if (!state.whatsappOpen) return true;
  if (requireName && !state.whatsappName.trim()) {
    toast("Enter your name.");
    return false;
  }
  const phone = state.whatsappPhone.replace(/\D/g, "");
  if (phone.length < 10) {
    toast("Enter a valid WhatsApp number.");
    return false;
  }
  if (requireConsent && !state.whatsappConsent) {
    toast("Please accept WhatsApp consent.");
    return false;
  }
  return true;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits.slice(-15);
}

function displayIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
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

async function requestWhatsAppOtp() {
  if (state.whatsappOtpBusy) return;
  if (!validateWhatsapp({ requireName: false, requireConsent: false })) return;
  state.whatsappOtpBusy = true;
  state.whatsappOtpMessage = "";
  render();
  try {
    const response = await fetch(`${API_BASE}/api/myalert-publisher-notifications/public/whatsapp-otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: normalizePhone(state.whatsappPhone),
        anonymousDeviceId: getDeviceId(),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    const retryAfter = Number(payload.retryAfterSeconds) || 0;
    if (retryAfter > 0) setOtpCooldown(retryAfter);
    if (!response.ok || payload.success !== true) {
      state.whatsappOtpMessage = payload.message || "Please wait before requesting another OTP.";
      return;
    }
    state.whatsappOtpSent = true;
    state.whatsappOtp = "";
    state.whatsappVerifiedPhone = "";
    state.whatsappOtpMessage = "OTP sent. Enter it below to verify.";
  } catch (error) {
    state.whatsappOtpMessage = error.message || "Could not send OTP. Please try again.";
  } finally {
    state.whatsappOtpBusy = false;
    render();
  }
}

async function verifyWhatsAppOtp() {
  if (state.whatsappOtpBusy) return;
  if (!validateWhatsapp({ requireName: false, requireConsent: false })) return;
  if (state.whatsappOtp.trim().length < 4) {
    toast("Enter the OTP sent to your WhatsApp number.");
    return;
  }
  state.whatsappOtpBusy = true;
  state.whatsappOtpMessage = "";
  render();
  try {
    const payload = await fetchJson(`${API_BASE}/api/myalert-publisher-notifications/public/whatsapp-otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: normalizePhone(state.whatsappPhone),
        otpCode: state.whatsappOtp.trim(),
        anonymousDeviceId: getDeviceId(),
      }),
    });
    rememberWhatsAppVerification();
    state.whatsappOtpCooldownUntil = 0;
    window.clearInterval(otpCooldownTimer);
    otpCooldownTimer = 0;
    state.whatsappOtpMessage = payload.message || "WhatsApp number verified.";
    toast("WhatsApp number verified.");
  } catch (error) {
    state.whatsappOtpMessage = error.message || "OTP verification failed.";
  } finally {
    state.whatsappOtpBusy = false;
    render();
  }
}

async function savePreferences() {
  state.whatsappOpen = true;
  if (state.selectedTopicIds.size === 0) {
    toast("Select at least one topic.");
    return;
  }
  const wantsWhatsApp = state.whatsappConsent === true;
  if (wantsWhatsApp && !validateWhatsapp()) return;
  if (wantsWhatsApp && state.whatsappVerifiedPhone !== normalizePhone(state.whatsappPhone)) {
    toast("Verify your WhatsApp number with OTP first.");
    document.querySelector("[data-request-wa-otp]")?.focus();
    return;
  }
  const privateOk = await verifyPrivatePasscodes();
  if (!privateOk) return;
  const subscription = await prepareBrowserSubscription();
  if (subscription) {
    state.browserEnabled = true;
  }
  if (!wantsWhatsApp && !subscription) {
    showActionDialog(
      "error",
      "WhatsApp alerts are off",
      "You unchecked WhatsApp consent, so WhatsApp alerts will not be sent. Browser notifications were not enabled on this device, so no delivery method is active."
    );
    return;
  }
  const saved = await saveSubscription(subscription);
  if (!saved) return;
  state.lastSubscriptionWhatsAppEnabled = wantsWhatsApp;
  state.subscriptionsLoaded = false;
  state.updatesLoaded = false;
  routeTo("/done");
}

function updateApiRequestCountdown() {
  const counter = document.querySelector("[data-api-request-countdown]");
  if (!counter) return;
  counter.textContent = Math.max(0, Math.ceil((state.apiRequestRedirectUntil - Date.now()) / 1000)).toString();
}

function clearApiRequestDialog() {
  window.clearTimeout(apiRequestRedirectTimer);
  window.clearInterval(apiRequestCountdownTimer);
  apiRequestRedirectTimer = 0;
  apiRequestCountdownTimer = 0;
  state.apiRequestSent = false;
  state.apiRequestRedirectUntil = 0;
}

function startApiRequestRedirect() {
  window.clearTimeout(apiRequestRedirectTimer);
  window.clearInterval(apiRequestCountdownTimer);
  state.apiRequestSent = true;
  state.apiRequestRedirectUntil = Date.now() + 10000;
  apiRequestRedirectTimer = window.setTimeout(() => {
    clearApiRequestDialog();
    routeTo("/");
  }, 10000);
  apiRequestCountdownTimer = window.setInterval(updateApiRequestCountdown, 250);
}

async function submitApiRequest() {
  if (state.apiRequestBusy) return;
  const name = state.apiRequestName.trim();
  const phoneNumber = normalizePhone(state.apiRequestPhone);
  const email = state.apiRequestEmail.trim();
  if (!name) {
    state.apiRequestError = "Enter your name.";
    render();
    return;
  }
  if (phoneNumber.length !== 10) {
    state.apiRequestError = "Enter a valid 10 digit phone number.";
    render();
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    state.apiRequestError = "Enter a valid email address.";
    render();
    return;
  }
  state.apiRequestBusy = true;
  state.apiRequestError = "";
  render();
  try {
    await fetchJson(`${API_BASE}/api/myalert-publisher-notifications/public/api-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phoneNumber,
        email,
        sourcePage: window.location.href,
      }),
    });
    saveSavedContact({ displayName: name, phoneNumber });
    state.apiRequestName = "";
    state.apiRequestPhone = "";
    state.apiRequestEmail = "";
    startApiRequestRedirect();
  } catch (error) {
    state.apiRequestError = error.message || "Could not send request. Please try again.";
  } finally {
    state.apiRequestBusy = false;
    render();
    updateApiRequestCountdown();
  }
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
  if (!state.savedAlerts.length) state.savedAlerts = getSavedAlerts();
  if (!state.loadingSubscriptions && !state.subscriptionsLoaded && !state.error) {
    setTimeout(() => fetchPublicSubscriptions(), 0);
  }
  const searchTerm = state.myAlertsSearch.trim().toLowerCase();
  const visibleSubscriptions = state.subscriptions.filter((item) => {
    if (!searchTerm) return true;
    const publisher = normalizePublisher(item.partner || {});
    const haystack = [
      publisher.name,
      publisher.category,
      publisher.location,
      item.phoneNumber,
      ...(item.topics || []).map((topic) => `${topic.title} ${topic.description || ""}`),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchTerm);
  });
  const visibleSavedAlerts = state.savedAlerts.filter((item) => {
    if (!searchTerm) return true;
    return [
      item.title,
      item.body,
      item.topic,
      item.publisherName,
      item.publisherCategory,
      item.publisherLocation,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm);
  });
  return appShell(
    `
      <section class="section">
        <div class="shell">
          <h1 class="page-title">My Alerts</h1>
          <p class="page-subtitle">Manage who can notify you and what you receive.</p>
          <div class="filter-panel" style="margin-top: 18px;">
            <div class="field">
              <label>Search My Alerts</label>
              <input class="input" data-my-alerts-search value="${escapeHtml(
                state.myAlertsSearch
              )}" placeholder="Search publisher or topic" />
            </div>
            <div class="field">
              <label>WhatsApp number for lookup</label>
              <input class="input" data-lookup-phone value="${escapeHtml(
                saved.phoneNumber
              )}" inputmode="tel" placeholder="+91 98765 43210" />
            </div>
            <button class="secondary-btn" data-load-subscriptions ${
              state.subscriptionActionBusy ? "disabled" : ""
            }>Refresh My Alerts</button>
          </div>
          <div class="alerts-list" style="margin-top: 20px;">
            ${
              state.loadingSubscriptions
                ? '<div class="empty">Loading your saved alert preferences...</div>'
                : visibleSubscriptions.length
                ? visibleSubscriptions.map(subscriptionCard).join("")
                : state.subscriptions.length
                ? '<div class="empty">No subscriptions match your search.</div>'
                : '<div class="empty">No subscriptions found for this device or WhatsApp number.</div>'
            }
          </div>
          <div class="saved-alerts-section">
            <div>
              <h2 class="section-title">Saved Alerts</h2>
              <p class="section-subtitle">Alerts you bookmarked on this device.</p>
            </div>
            <div class="saved-alerts-list">
              ${
                visibleSavedAlerts.length
                  ? visibleSavedAlerts.map(savedAlertCard).join("")
                  : state.savedAlerts.length
                  ? '<div class="empty">No saved alerts match your search.</div>'
                  : '<div class="empty">Tap the bookmark icon on any alert detail page to save it here.</div>'
              }
            </div>
          </div>
        </div>
      </section>
    `,
    "/my-alerts"
  );
}

function savedAlertCard(item) {
  const href = item.url || `/p/${encodeURIComponent(item.publisherSlug || "")}/alerts/${encodeURIComponent(item.id)}`;
  return `
    <article class="saved-alert-card">
      <a href="${escapeHtml(href)}" data-link>
        <div class="post-icon">
          ${icons.bookmark}
        </div>
        <div>
          <div class="publisher-meta">${escapeHtml(item.publisherName || "Publisher")} &bull; ${escapeHtml(
    item.topic || "Alert"
  )}</div>
          <h3>${escapeHtml(item.title || "Alert update")}</h3>
          <p>${escapeHtml(item.body || "Open this saved alert for details.")}</p>
          <span class="small-text">Saved ${escapeHtml(formatPostTime(item.savedAt || item.sentAt))}</span>
        </div>
      </a>
      <button class="detail-icon-btn" type="button" data-remove-saved-alert="${escapeHtml(item.id)}" aria-label="Remove saved alert">${icons.close}</button>
    </article>
  `;
}

function subscriptionCard(item) {
  const publisher = normalizePublisher(item.partner || {});
  const whatsappOn = item.whatsappOptIn?.enabled === true;
  const hasBrowserPush = item.hasBrowserPush === true;
  return `
    <article class="publisher-card subscription-card">
      <div class="publisher-top">
        <div class="avatar">${initials(publisher.name)}</div>
        <div>
          <h3 class="publisher-name">${escapeHtml(publisher.name || "Publisher")} <span class="verified">${icons.check}</span></h3>
          <div class="publisher-meta">Browser Push: ${hasBrowserPush ? "ON" : "OFF"} &bull; WhatsApp: ${
    whatsappOn ? "ON" : "OFF"
  }</div>
        </div>
      </div>
      <div>
        ${(item.topics || [])
          .map(
            (topic) => `
              <div class="toggle-row ${topic.enabled === false ? "muted" : ""}">
                <div>
                  <strong>${escapeHtml(topic.title || "Topic")}</strong>
                  <span>${topic.enabled === false ? "Paused" : "Active"}</span>
                </div>
                <button class="toggle ${topic.enabled === false ? "" : "on"}" data-subscription-topic-toggle data-subscription-id="${escapeHtml(
                  item.id
                )}" data-topic-id="${escapeHtml(topic.id)}" data-topic-enabled="${topic.enabled === false ? "false" : "true"}" aria-label="Toggle ${escapeHtml(
              topic.title
            )}" ${state.subscriptionActionBusy ? "disabled" : ""}></button>
              </div>`
          )
          .join("")}
      </div>
      <div class="subscription-actions">
        <button class="secondary-btn" data-unsubscribe-mode="browser" data-subscription-id="${escapeHtml(item.id)}" ${
    hasBrowserPush && !state.subscriptionActionBusy ? "" : "disabled"
  }>Unsubscribe Browser Push</button>
        <button class="secondary-btn" data-unsubscribe-mode="whatsapp" data-subscription-id="${escapeHtml(item.id)}" ${
    whatsappOn && !state.subscriptionActionBusy ? "" : "disabled"
  }>Unsubscribe WhatsApp</button>
        <button class="secondary-btn danger" data-unsubscribe-mode="all" data-subscription-id="${escapeHtml(item.id)}" ${
    state.subscriptionActionBusy ? "disabled" : ""
  }>Remove All</button>
      </div>
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

function donePage() {
  window.clearTimeout(successRedirectTimer);
  window.clearInterval(successCountdownTimer);
  const redirectAt = Date.now() + 10000;
  const updateRedirectCountdown = () => {
    const counter = document.querySelector("[data-success-countdown]");
    if (!counter) return;
    counter.textContent = Math.max(0, Math.ceil((redirectAt - Date.now()) / 1000)).toString();
  };
  successRedirectTimer = window.setTimeout(() => {
    if (state.route === "/done") routeTo("/");
  }, 10000);
  successCountdownTimer = window.setInterval(updateRedirectCountdown, 250);
  window.setTimeout(updateRedirectCountdown, 0);
  return appShell(
    `
      <section class="section success-page">
        <div class="shell">
          <div class="success-card">
            <div class="success-tick">${icons.check}</div>
            <h1>All done</h1>
            <p>${
              state.lastSubscriptionWhatsAppEnabled
                ? "You are subscribed. Alerts from this publisher will now reach you for the topics you selected."
                : "Your alert preferences are saved. WhatsApp alerts are off because you unchecked consent, so this publisher will not send alerts to you on WhatsApp."
            }</p>
            <a class="primary-btn" href="/" data-link>Back to Home</a>
            <span class="small-text redirect-countdown">You will be redirected to home in <strong data-success-countdown>10</strong> seconds.</span>
          </div>
        </div>
      </section>
    `,
    "/done"
  );
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

function apiRequestPage() {
  const saved = getSavedContact();
  if (!state.apiRequestName && saved.displayName) {
    state.apiRequestName = saved.displayName;
  }
  if (!state.apiRequestPhone && saved.phoneNumber) {
    state.apiRequestPhone = saved.phoneNumber;
  }
  return appShell(
    `
      <section class="section static-hero">
        <div class="shell narrow-shell">
          <div class="api-request-card">
            <div class="section-kicker">MyAlert API</div>
            <h1 class="page-title">Request API Access</h1>
            <p class="page-subtitle">Share your contact details and our team will reach out for API integration support.</p>
            <form class="api-request-form" data-api-request-form>
              <div class="field">
                <label>Name *</label>
                <input class="input" data-api-request-name value="${escapeHtml(state.apiRequestName)}" placeholder="Your name" autocomplete="name" />
              </div>
              <div class="field">
                <label>Phone Number *</label>
                <div class="phone-input">
                  <span>+91</span>
                  <input class="input" data-api-request-phone value="${escapeHtml(
                    displayIndianPhone(state.apiRequestPhone)
                  )}" inputmode="tel" placeholder="98765 43210" maxlength="12" autocomplete="tel" />
                </div>
              </div>
              <div class="field">
                <label>Email</label>
                <input class="input" data-api-request-email value="${escapeHtml(state.apiRequestEmail)}" type="email" placeholder="you@example.com" autocomplete="email" />
              </div>
              ${state.apiRequestError ? `<p class="form-error">${escapeHtml(state.apiRequestError)}</p>` : ""}
              <button class="primary-btn" type="submit" ${state.apiRequestBusy ? "disabled" : ""}>
                ${state.apiRequestBusy ? "Sending..." : "Submit API Request"}
              </button>
            </form>
          </div>
        </div>
      </section>
    `,
    "/api-req"
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

async function getSubscriptionOwnershipPayload() {
  const saved = getSavedContact();
  const endpoint = (await getCurrentPushEndpoint()) || saved.lastEndpoint || "";
  const phoneNumber = normalizePhone(saved.phoneNumber);
  return { endpoint, phoneNumber };
}

function findSubscription(subscriptionId) {
  return state.subscriptions.find((item) => item.id === subscriptionId);
}

async function refreshSubscriptionsAfterAction() {
  state.subscriptionsLoaded = false;
  state.updatesLoaded = false;
  await fetchPublicSubscriptions();
}

async function toggleManagedTopic(subscriptionId, topicId, currentlyEnabled) {
  if (state.subscriptionActionBusy) return;
  const subscription = findSubscription(subscriptionId);
  if (!subscription) {
    showActionDialog("error", "Could not update topic", "This subscription is no longer available on this screen.");
    return;
  }
  state.subscriptionActionBusy = true;
  render();
  try {
    const ownership = await getSubscriptionOwnershipPayload();
    const payload = await fetchJson(
      `${API_BASE}/api/myalert-publisher-notifications/public/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ownership,
          topicId,
          enabled: !currentlyEnabled,
        }),
      }
    );
    await refreshSubscriptionsAfterAction();
    state.subscriptionActionBusy = false;
    showActionDialog("success", "Preference updated", payload.message || "Your topic preference was saved.");
  } catch (error) {
    state.subscriptionActionBusy = false;
    render();
    showActionDialog("error", "Could not update topic", error.message || "Please try again.");
  }
}

async function unsubscribeSubscription(subscriptionId, mode = "all") {
  if (state.subscriptionActionBusy) return;
  const subscription = findSubscription(subscriptionId);
  if (!subscription) {
    showActionDialog("error", "Could not unsubscribe", "This subscription is no longer available on this screen.");
    return;
  }
  state.subscriptionActionBusy = true;
  render();
  try {
    const ownership = await getSubscriptionOwnershipPayload();
    const payload = await fetchJson(`${API_BASE}/api/myalert-publisher-notifications/public/subscriptions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...ownership,
        subscriberId: subscriptionId,
        mode,
      }),
    });
    if (mode === "browser" || mode === "all") {
      const registration = await navigator.serviceWorker?.getRegistration?.();
      const pushSubscription = await registration?.pushManager?.getSubscription?.();
      await pushSubscription?.unsubscribe?.().catch(() => {});
    }
    await refreshSubscriptionsAfterAction();
    state.subscriptionActionBusy = false;
    showActionDialog("success", "Unsubscribed", payload.message || "Your alert preference was updated.");
  } catch (error) {
    state.subscriptionActionBusy = false;
    render();
    showActionDialog("error", "Could not unsubscribe", error.message || "Please try again.");
  }
}

function render() {
  const path = state.route;
  if (path !== "/done" && successRedirectTimer) {
    window.clearTimeout(successRedirectTimer);
    window.clearInterval(successCountdownTimer);
    successRedirectTimer = 0;
    successCountdownTimer = 0;
  }
  const queryPublisher = state.query.get("code") || state.query.get("partner");
  let html = "";
  if (currentAlertRoute()) {
    html = alertDetailPage();
  } else if (path === "/" && queryPublisher) {
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
  } else if (path === "/done") {
    html = donePage();
  } else if (path === "/api-req") {
    html = apiRequestPage();
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
  window.setTimeout(handleScrollLoaders, 80);
}

function bindEvents() {
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      event.preventDefault();
      if (link.hasAttribute("data-focus-alerts")) {
        state.publisherFocusPending = true;
        state.publisherTab = "topics";
      }
      if (link.hasAttribute("data-open-posts")) {
        state.publisherTab = "posts";
      }
      closeMenu();
      routeTo(href);
    });
  });
  document.querySelector("[data-download-alert-pdf]")?.addEventListener("click", () => {
    downloadAlertPdf();
  });
  document.querySelector("[data-share-alert-pdf]")?.addEventListener("click", () => {
    shareAlertPdf();
  });
  document.querySelector("[data-save-alert]")?.addEventListener("click", saveCurrentAlert);
  document.querySelectorAll("[data-remove-saved-alert]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      removeSavedAlert(button.dataset.removeSavedAlert);
    });
  });
  document.querySelector("[data-action-dialog-close]")?.addEventListener("click", closeActionDialog);
  document.querySelector("[data-menu-open]")?.addEventListener("click", openMenu);
  document.querySelectorAll("[data-menu-close]").forEach((el) => el.addEventListener("click", closeMenu));
  document.querySelector("[data-search-input]")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    state.homeVisiblePublishers = 5;
    state.publishersLoaded = false;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => fetchPublicPublishers(state.search), 300);
  });
  document.querySelector("[data-my-alerts-search]")?.addEventListener("input", (event) => {
    state.myAlertsSearch = event.target.value;
    render();
  });
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      state.homeVisiblePublishers = 5;
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
  document.querySelectorAll("[data-publisher-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTab = button.dataset.publisherTab === "posts" ? "posts" : "topics";
      if (state.publisherTab === nextTab) return;
      state.publisherTab = nextTab;
      render();
      if (nextTab === "posts" && !state.publisherPostsLoaded) {
        fetchPublisherPosts({ reset: true }).catch((error) =>
          toast(error.message || "Could not load publisher posts.")
        );
      }
    });
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
  document.querySelector("[data-api-request-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitApiRequest().catch((error) => toast(error.message || "Could not send API request."));
  });
  document.querySelector("[data-api-request-name]")?.addEventListener("input", (event) => {
    state.apiRequestName = event.target.value;
  });
  document.querySelector("[data-api-request-phone]")?.addEventListener("input", (event) => {
    state.apiRequestPhone = event.target.value;
  });
  document.querySelector("[data-api-request-email]")?.addEventListener("input", (event) => {
    state.apiRequestEmail = event.target.value;
  });
  document.querySelector("[data-api-request-home]")?.addEventListener("click", () => {
    clearApiRequestDialog();
    routeTo("/");
  });
  document.querySelector("[data-wa-name]")?.addEventListener("input", (event) => {
    state.whatsappName = event.target.value;
    if (state.whatsappVerifiedPhone === normalizePhone(state.whatsappPhone)) {
      saveSavedContact({
        displayName: state.whatsappName.trim(),
        verifiedWhatsAppName: state.whatsappName.trim(),
      });
    }
  });
  document.querySelector("[data-wa-phone]")?.addEventListener("input", (event) => {
    const previous = normalizePhone(state.whatsappPhone);
    state.whatsappPhone = event.target.value;
    if (normalizePhone(state.whatsappPhone) !== previous) {
      resetWhatsappOtpState();
      applySavedWhatsAppVerification();
    }
  });
  document.querySelector("[data-request-wa-otp]")?.addEventListener("click", () => {
    requestWhatsAppOtp().catch((error) => toast(error.message || "Could not send OTP."));
  });
  document.querySelector("[data-wa-otp]")?.addEventListener("input", (event) => {
    window.clearTimeout(otpVerifyTimer);
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
    state.whatsappOtp = event.target.value;
    if (state.whatsappOtp.length === 4) {
      otpVerifyTimer = window.setTimeout(() => {
        verifyWhatsAppOtp().catch((error) => toast(error.message || "Could not verify OTP."));
      }, 450);
    }
  });
  document.querySelector("[data-verify-wa-otp]")?.addEventListener("click", () => {
    verifyWhatsAppOtp().catch((error) => toast(error.message || "Could not verify OTP."));
  });
  document.querySelector("[data-wa-consent]")?.addEventListener("change", (event) => {
    state.whatsappConsent = event.target.checked;
    render();
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
  document.querySelectorAll("[data-subscription-topic-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleManagedTopic(
        button.dataset.subscriptionId,
        button.dataset.topicId,
        button.dataset.topicEnabled !== "false"
      ).catch((error) =>
        showActionDialog("error", "Could not update topic", error.message || "Please try again.")
      );
    });
  });
  document.querySelectorAll("[data-unsubscribe-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      unsubscribeSubscription(button.dataset.subscriptionId, button.dataset.unsubscribeMode).catch((error) =>
        showActionDialog("error", "Could not unsubscribe", error.message || "Please try again.")
      );
    });
  });
}

function focusPublisherWhatsappFields() {
  if (!state.publisherFocusPending || !state.publisher || state.loading) return;
  state.publisherFocusPending = false;
  window.setTimeout(() => {
    const section = document.querySelector("[data-whatsapp-alerts]");
    const target =
      document.querySelector("[data-wa-name]")?.value.trim()
        ? document.querySelector("[data-wa-phone]")
        : document.querySelector("[data-wa-name]");
    section?.scrollIntoView({ block: "start", behavior: "smooth" });
    window.setTimeout(() => target?.focus({ preventScroll: true }), 160);
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
window.addEventListener("scroll", handleScrollLoaders, { passive: true });
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
