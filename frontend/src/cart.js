import { PRODUCTS } from "./data/products.js";
import { patchClientState } from "./clientStore.js";
import { isCartPillVueActive } from "./reactiveCartPill.js";

var CART_STORAGE_KEY = "snackly-cart";
var SESSION_KEY = "snackly-session";
var ORDERS_KEY = "snackly-orders";
var DELIVERY_PREFIX = "snackly-delivery-address:";
var LEGACY_DELIVERY_KEY = "snackly-delivery-address";

function getSessionEmailNorm() {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return "";
    var s = JSON.parse(raw);
    return s && s.email ? String(s.email).trim().toLowerCase() : "";
  } catch (e) {
    return "";
  }
}

function deliveryStorageKey() {
  var e = getSessionEmailNorm();
  return e ? DELIVERY_PREFIX + e : null;
}

function defaultDeliveryAddr() {
  return {
    street: "",
    apt: "",
    intercom: "",
    entrance: "",
    floor: "",
    comment: "",
  };
}

function loadDeliveryAddr() {
  var key = deliveryStorageKey();
  if (!key) return defaultDeliveryAddr();
  var raw = localStorage.getItem(key);
  if (!raw) {
    try {
      var leg = localStorage.getItem(LEGACY_DELIVERY_KEY);
      if (leg) {
        localStorage.setItem(key, leg);
        localStorage.removeItem(LEGACY_DELIVERY_KEY);
        raw = leg;
      }
    } catch (e) {}
  }
  if (!raw) return defaultDeliveryAddr();
  try {
    var o = JSON.parse(raw);
    if (!o || typeof o !== "object") return defaultDeliveryAddr();
    var d = defaultDeliveryAddr();
    d.street = String(o.street || "");
    d.apt = String(o.apt || "");
    d.intercom = String(o.intercom || "");
    d.entrance = String(o.entrance || "");
    d.floor = String(o.floor || "");
    d.comment = String(o.comment || "");
    return d;
  } catch (e) {
    return defaultDeliveryAddr();
  }
}

function saveDeliveryAddr(d) {
  var key = deliveryStorageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(d));
  } catch (e) {}
}

function collectDeliveryFromDom() {
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }
  if (!document.getElementById("cart-addr-street")) {
    return loadDeliveryAddr();
  }
  return {
    street: val("cart-addr-street"),
    apt: val("cart-addr-apt"),
    intercom: val("cart-addr-intercom"),
    entrance: val("cart-addr-entrance"),
    floor: val("cart-addr-floor"),
    comment: val("cart-addr-comment"),
  };
}

function deliveryRecordComplete(d) {
  return (
    String(d.street || "").trim().length > 0 &&
    String(d.apt || "").trim().length > 0 &&
    String(d.intercom || "").trim().length > 0 &&
    String(d.entrance || "").trim().length > 0 &&
    String(d.floor || "").trim().length > 0
  );
}

function isDeliveryAddressComplete() {
  return deliveryRecordComplete(collectDeliveryFromDom());
}

function loadOrdersRaw() {
  try {
    var raw = localStorage.getItem(ORDERS_KEY);
    var a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch (e) {
    return [];
  }
}

function userHasCompletedPurchase() {
  var e = getSessionEmailNorm();
  if (!e) return false;
  return loadOrdersRaw().some(function (o) {
    if (!o || !o.items || !o.items.length) return false;
    return String(o.userEmail || "").toLowerCase() === e;
  });
}

function migrateLegacyOrdersUserEmail() {
  var e = getSessionEmailNorm();
  if (!e) return;
  try {
    var orders = loadOrdersRaw();
    var changed = false;
    orders.forEach(function (o) {
      if (o && !o.userEmail) {
        o.userEmail = e;
        changed = true;
      }
    });
    if (changed) localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {}
}

function isLoggedIn() {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    var s = JSON.parse(raw);
    return !!(s && s.email);
  } catch (e) {
    return false;
  }
}

function loadCart() {
  try {
    var raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    var o = JSON.parse(raw);
    return typeof o === "object" && o !== null ? o : {};
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {}
}

function cartTotalQty(cart) {
  var n = 0;
  Object.keys(cart).forEach(function (k) {
    n += Number(cart[k]) || 0;
  });
  return n;
}

function cartTotalRub(cart) {
  var totalRub = 0;
  Object.keys(cart).forEach(function (id) {
    var qty = Number(cart[id]) || 0;
    if (qty <= 0) return;
    var p = PRODUCTS[id];
    if (!p) return;
    totalRub += parsePriceRub(p.price) * qty;
  });
  return totalRub;
}

function parsePriceRub(str) {
  var digits = String(str || "")
    .replace(/\s/g, "")
    .replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function formatPriceRub(n) {
  var num = Number(n) || 0;
  return num.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

function renderCartDrawer() {
  var listEl = document.getElementById("cart-drawer-list");
  var emptyEl = document.getElementById("cart-drawer-empty");
  var totalEl = document.getElementById("cart-drawer-total");
  var continueBtn = document.getElementById("cart-drawer-continue");
  if (!listEl || !totalEl) return;
  listEl.innerHTML = "";
  var cart = loadCart();
  var totalRub = 0;
  var hasAny = false;
  Object.keys(cart).forEach(function (id) {
    var qty = Number(cart[id]) || 0;
    if (qty <= 0) return;
    var p = PRODUCTS[id];
    if (!p) return;
    hasAny = true;
    var unit = parsePriceRub(p.price);
    totalRub += unit * qty;
    var row = document.createElement("article");
    row.className = "cart-item";
    var imgWrap = document.createElement("div");
    imgWrap.className = "cart-item__img-wrap";
    var img = document.createElement("img");
    img.className = "cart-item__img";
    img.src = p.image;
    img.alt = "";
    imgWrap.appendChild(img);
    var mid = document.createElement("div");
    mid.className = "cart-item__main";
    var nameEl = document.createElement("p");
    nameEl.className = "cart-item__name";
    nameEl.textContent = p.title;
    var wEl = document.createElement("p");
    wEl.className = "cart-item__weight";
    wEl.textContent = p.weight || "";
    var controls = document.createElement("div");
    controls.className = "cart-item__controls";
    var minus = document.createElement("button");
    minus.type = "button";
    minus.className = "cart-item__qty-btn";
    minus.setAttribute("data-cart-qty", "dec");
    minus.setAttribute("data-product-id", id);
    minus.setAttribute("aria-label", "Уменьшить количество");
    minus.textContent = "−";
    var qtySpan = document.createElement("span");
    qtySpan.className = "cart-item__qty";
    qtySpan.textContent = String(qty);
    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "cart-item__qty-btn";
    plus.setAttribute("data-cart-qty", "inc");
    plus.setAttribute("data-product-id", id);
    plus.setAttribute("aria-label", "Увеличить количество");
    plus.textContent = "+";
    controls.appendChild(minus);
    controls.appendChild(qtySpan);
    controls.appendChild(plus);
    mid.appendChild(nameEl);
    mid.appendChild(wEl);
    mid.appendChild(controls);
    var priceEl = document.createElement("div");
    priceEl.className = "cart-item__price";
    priceEl.textContent = formatPriceRub(unit * qty);
    row.appendChild(imgWrap);
    row.appendChild(mid);
    row.appendChild(priceEl);
    listEl.appendChild(row);
  });
  if (emptyEl) emptyEl.hidden = hasAny;
  totalEl.textContent = formatPriceRub(totalRub);
  if (continueBtn) continueBtn.disabled = !hasAny || !isDeliveryAddressComplete();
}

function setCartProductQty(productId, nextQty) {
  if (!isLoggedIn()) return;
  if (!productId || !PRODUCTS[productId]) return;
  var cart = loadCart();
  if (nextQty <= 0) delete cart[productId];
  else cart[productId] = nextQty;
  saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
}

function renderCartDrawerIfOpen() {
  var d = document.getElementById("cart-drawer");
  if (d && d.classList.contains("is-open")) renderCartDrawer();
}

function addToCart(productId) {
  if (!isLoggedIn()) return false;
  if (!productId || !PRODUCTS[productId]) return false;
  var cart = loadCart();
  cart[productId] = (Number(cart[productId]) || 0) + 1;
  saveCart(cart);
  updateCartBadge();
  renderCartDrawerIfOpen();
  return true;
}

function updateCartBadge() {
  syncCartChrome();
}

function syncCartChrome() {
  var cart = loadCart();
  var qty = cartTotalQty(cart);
  var show = isLoggedIn() && qty > 0;
  var totalRub = cartTotalRub(cart);
  var formatted = formatPriceRub(totalRub);
  var pill = document.getElementById("cart-summary-pill");
  if (pill) pill.hidden = !show;
  patchClientState({
    isLoggedIn: isLoggedIn(),
    cartQuantity: qty,
    cartTotalRub: totalRub,
    cartTotalFormatted: formatted,
  });
  if (!isCartPillVueActive()) {
    var pillTotal = document.getElementById("cart-summary-pill-total");
    if (pillTotal) pillTotal.textContent = formatted;
  }
}

function finalizeOrderFromCart() {
  if (!isLoggedIn()) return false;
  var d = collectDeliveryFromDom();
  if (!deliveryRecordComplete(d)) return false;
  saveDeliveryAddr(d);
  var cart = loadCart();
  var entries = [];
  var totalRub = 0;
  Object.keys(cart).forEach(function (id) {
    var qty = Number(cart[id]) || 0;
    if (qty <= 0) return;
    var p = PRODUCTS[id];
    if (!p) return;
    var unit = parsePriceRub(p.price);
    totalRub += unit * qty;
    entries.push({ id: id, qty: qty, title: p.title, image: p.image });
  });
  if (!entries.length) return false;
  try {
    var orders = loadOrdersRaw();
    orders.unshift({
      id: "o-" + Date.now(),
      createdAt: new Date().toISOString(),
      userEmail: getSessionEmailNorm(),
      totalRub: totalRub,
      items: entries,
      paid: true,
      paidAt: new Date().toISOString(),
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {}
  saveCart({});
  updateCartBadge();
  renderCartDrawerIfOpen();
  document.dispatchEvent(new CustomEvent("snackly-orders-updated"));
  return true;
}

export {
  loadCart,
  addToCart,
  updateCartBadge,
  syncCartChrome,
  renderCartDrawer,
  renderCartDrawerIfOpen,
  setCartProductQty,
  finalizeOrderFromCart,
  isLoggedIn,
  formatPriceRub,
  cartTotalRub,
  getSessionEmailNorm,
  loadDeliveryAddr,
  saveDeliveryAddr,
  collectDeliveryFromDom,
  isDeliveryAddressComplete,
  userHasCompletedPurchase,
  migrateLegacyOrdersUserEmail,
};
