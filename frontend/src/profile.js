import { formatPriceRub } from "./cart.js";
import { closeMobileNavIfOpen } from "./landing.js";

var SESSION_KEY = "snackly-session";
var USERS_KEY = "snackly-users";
var ORDERS_KEY = "snackly-orders";
var SETTINGS_KEY = "snackly-profile-settings";

function getSession() {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function initialsFromName(name) {
  var parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function displayNameUpper(sess) {
  var n = sess && sess.name ? String(sess.name).trim() : "";
  if (n) return n.toUpperCase();
  if (sess && sess.email) return String(sess.email).split("@")[0].toUpperCase();
  return "ГОСТЬ";
}

function formatPhoneLine(phone) {
  var p = String(phone || "").replace(/\D/g, "");
  if (p.length === 11 && p[0] === "7") {
    return (
      "+7 " +
      p.slice(1, 4) +
      " " +
      p.slice(4, 7) +
      " " +
      p.slice(7, 9) +
      " " +
      p.slice(9, 11)
    );
  }
  if (p.length === 10) {
    return (
      "+7 " +
      p.slice(0, 3) +
      " " +
      p.slice(3, 6) +
      " " +
      p.slice(6, 8) +
      " " +
      p.slice(8, 10)
    );
  }
  return phone && String(phone).trim() ? String(phone).trim() : "Телефон не указан";
}

function loadOrders() {
  try {
    var raw = localStorage.getItem(ORDERS_KEY);
    var a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch (e) {
    return [];
  }
}

function loadSettings() {
  try {
    var raw = localStorage.getItem(SETTINGS_KEY);
    var o = raw ? JSON.parse(raw) : {};
    return {
      email: o.email !== false,
      sms: o.sms !== false,
    };
  } catch (e) {
    return { email: true, sms: true };
  }
}

function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {}
}

function setToggleUi(btn, on) {
  if (!btn) return;
  btn.setAttribute("aria-checked", on ? "true" : "false");
  btn.classList.toggle("is-on", on);
}

export function initProfile() {
  var drawer = document.getElementById("profile-drawer");
  if (!drawer) return;

  var profileBtn = document.getElementById("nav-profile-btn");
  var mobileProfile = document.getElementById("mobile-nav-profile-btn");
  var avatarEl = document.getElementById("profile-avatar");
  var nameEl = document.getElementById("profile-name");
  var phoneEl = document.getElementById("profile-phone");
  var ordersEmpty = document.getElementById("profile-orders-empty");
  var ordersRail = document.getElementById("profile-orders-rail");
  var paymentModal = document.getElementById("profile-payment-modal");
  var settingsModal = document.getElementById("profile-settings-modal");
  var contactSheet = document.getElementById("profile-contact-sheet");
  var toggleEmail = document.getElementById("settings-toggle-email");
  var toggleSms = document.getElementById("settings-toggle-sms");

  function openProfileDrawer() {
    var sess = getSession();
    if (!sess || !sess.email) return;
    closeMobileNavIfOpen();
    var cd = document.getElementById("cart-drawer");
    if (cd && cd.classList.contains("is-open")) {
      cd.classList.remove("is-open");
      cd.setAttribute("aria-hidden", "true");
    }
    var lm = document.getElementById("login");
    if (lm && !lm.hidden) {
      lm.hidden = true;
    }
    populateProfile();
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeProfileDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    var cartOpen =
      document.getElementById("cart-drawer") &&
      document.getElementById("cart-drawer").classList.contains("is-open");
    var pm = document.getElementById("product-modal");
    var productOpen = pm && !pm.hidden;
    var lm = document.getElementById("login");
    var loginOpen = lm && !lm.hidden;
    if (!cartOpen && !productOpen && !loginOpen) document.body.style.overflow = "";
  }

  function populateProfile() {
    var sess = getSession();
    if (!sess) return;
    if (avatarEl) avatarEl.textContent = initialsFromName(sess.name);
    if (nameEl) nameEl.textContent = displayNameUpper(sess);
    if (phoneEl) phoneEl.textContent = formatPhoneLine(sess.phone);
    renderOrders();
  }

  function renderOrders() {
    var orders = loadOrders();
    if (!ordersEmpty || !ordersRail) return;
    if (!orders.length) {
      ordersEmpty.hidden = false;
      ordersRail.hidden = true;
      ordersRail.innerHTML = "";
      return;
    }
    ordersEmpty.hidden = true;
    ordersRail.hidden = false;
    ordersRail.innerHTML = "";
    orders.slice(0, 12).forEach(function (order) {
      var card = document.createElement("article");
      card.className = "profile-order-card";
      var thumbs = document.createElement("div");
      thumbs.className = "profile-order-card__thumbs";
      (order.items || []).slice(0, 4).forEach(function (it) {
        var img = document.createElement("img");
        img.className = "profile-order-card__thumb";
        img.src = it.image || "";
        img.alt = "";
        thumbs.appendChild(img);
      });
      var meta = document.createElement("div");
      meta.className = "profile-order-card__meta";
      var d = order.createdAt ? new Date(order.createdAt) : new Date();
      var dateStr =
        d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) +
        " · " +
        d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      meta.innerHTML =
        '<p class="profile-order-card__total">' +
        formatPriceRub(order.totalRub || 0) +
        "</p>" +
        '<p class="profile-order-card__date">' +
        dateStr +
        "</p>";
      card.appendChild(thumbs);
      card.appendChild(meta);
      ordersRail.appendChild(card);
    });
  }

  function openPaymentModal() {
    if (!paymentModal) return;
    paymentModal.hidden = false;
  }

  function closePaymentModal() {
    if (!paymentModal) return;
    paymentModal.hidden = true;
  }

  function openSettingsModal() {
    if (!settingsModal) return;
    var s = loadSettings();
    setToggleUi(toggleEmail, s.email);
    setToggleUi(toggleSms, s.sms);
    settingsModal.hidden = false;
  }

  function closeSettingsModal() {
    if (!settingsModal) return;
    settingsModal.hidden = true;
  }

  function openContactSheet() {
    if (!contactSheet) return;
    contactSheet.classList.add("is-open");
    contactSheet.setAttribute("aria-hidden", "false");
  }

  function closeContactSheet() {
    if (!contactSheet) return;
    contactSheet.classList.remove("is-open");
    contactSheet.setAttribute("aria-hidden", "true");
  }

  function toggleFromButton(btn) {
    if (!btn) return;
    var on = btn.getAttribute("aria-checked") !== "true";
    setToggleUi(btn, on);
    var s = loadSettings();
    if (btn === toggleEmail) s.email = on;
    if (btn === toggleSms) s.sms = on;
    saveSettings(s);
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    document.dispatchEvent(new CustomEvent("snackly-auth-updated"));
    closeProfileDrawer();
    closePaymentModal();
    closeSettingsModal();
    closeContactSheet();
  }

  function deleteAccount() {
    var sess = getSession();
    if (!sess || !sess.email) return;
    if (!window.confirm("Удалить аккаунт? Это действие нельзя отменить.")) return;
    try {
      var raw = localStorage.getItem(USERS_KEY);
      var users = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(users)) users = [];
      var e = String(sess.email).toLowerCase();
      users = users.filter(function (u) {
        return String(u.email || "").toLowerCase() !== e;
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(ORDERS_KEY);
    } catch (err) {}
    document.dispatchEvent(new CustomEvent("snackly-auth-updated"));
    document.dispatchEvent(new CustomEvent("snackly-orders-updated"));
    closeProfileDrawer();
    closeSettingsModal();
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", function () {
      openProfileDrawer();
    });
  }
  if (mobileProfile) {
    mobileProfile.addEventListener("click", function () {
      openProfileDrawer();
    });
  }

  drawer.querySelectorAll("[data-close-profile]").forEach(function (el) {
    el.addEventListener("click", closeProfileDrawer);
  });

  var payBtn = document.getElementById("profile-open-payment");
  if (payBtn) payBtn.addEventListener("click", openPaymentModal);
  var setBtn = document.getElementById("profile-open-settings");
  if (setBtn) setBtn.addEventListener("click", openSettingsModal);
  var conBtn = document.getElementById("profile-open-contact");
  if (conBtn) conBtn.addEventListener("click", openContactSheet);

  var logoutBtn = document.getElementById("profile-logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  var delBtn = document.getElementById("profile-delete-account");
  if (delBtn) delBtn.addEventListener("click", deleteAccount);

  if (paymentModal) {
    paymentModal.querySelectorAll("[data-close-payment]").forEach(function (el) {
      el.addEventListener("click", closePaymentModal);
    });
    paymentModal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePaymentModal();
    });
  }

  var submitCard = document.getElementById("payment-card-submit");
  if (submitCard) {
    submitCard.addEventListener("click", function () {
      var numEl = document.getElementById("payment-card-number");
      var raw = numEl ? String(numEl.value || "").replace(/\D/g, "") : "";
      try {
        if (raw.length >= 4) {
          localStorage.setItem(
            "snackly-saved-card",
            JSON.stringify({ last4: raw.slice(-4) })
          );
        }
      } catch (e) {}
      closePaymentModal();
      window.alert("Карта привязана (демо). Данные не отправлялись.");
    });
  }

  if (settingsModal) {
    settingsModal.querySelectorAll("[data-close-settings]").forEach(function (el) {
      el.addEventListener("click", closeSettingsModal);
    });
    settingsModal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSettingsModal();
    });
  }

  if (toggleEmail) {
    toggleEmail.addEventListener("click", function () {
      toggleFromButton(toggleEmail);
    });
  }
  if (toggleSms) {
    toggleSms.addEventListener("click", function () {
      toggleFromButton(toggleSms);
    });
  }

  if (contactSheet) {
    contactSheet.querySelectorAll("[data-close-contact]").forEach(function (el) {
      el.addEventListener("click", closeContactSheet);
    });
  }

  document.addEventListener("snackly-orders-updated", function () {
    if (drawer.classList.contains("is-open")) renderOrders();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (contactSheet && contactSheet.classList.contains("is-open")) {
      closeContactSheet();
      return;
    }
    if (settingsModal && !settingsModal.hidden) {
      closeSettingsModal();
      return;
    }
    if (paymentModal && !paymentModal.hidden) {
      closePaymentModal();
      return;
    }
    if (drawer.classList.contains("is-open")) closeProfileDrawer();
  });
}
