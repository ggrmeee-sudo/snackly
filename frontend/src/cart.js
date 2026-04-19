import { PRODUCTS } from "./data/products.js";

var CART_STORAGE_KEY = "snackly-cart";
var SESSION_KEY = "snackly-session";
var ORDERS_KEY = "snackly-orders";

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
  if (continueBtn) continueBtn.disabled = !hasAny;
}

function setCartProductQty(productId, nextQty) {
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
  if (!productId || !PRODUCTS[productId]) return;
  var cart = loadCart();
  cart[productId] = (Number(cart[productId]) || 0) + 1;
  saveCart(cart);
  updateCartBadge();
  renderCartDrawerIfOpen();
}

function updateCartBadge() {
  syncCartChrome();
}

function syncCartChrome() {
  var cart = loadCart();
  var qty = cartTotalQty(cart);
  var show = isLoggedIn() && qty > 0;
  var pill = document.getElementById("cart-summary-pill");
  var pillTotal = document.getElementById("cart-summary-pill-total");
  if (pill) pill.hidden = !show;
  if (pillTotal) pillTotal.textContent = formatPriceRub(cartTotalRub(cart));
}

function finalizeOrderFromCart() {
  if (!isLoggedIn()) return false;
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
    var raw = localStorage.getItem(ORDERS_KEY);
    var orders = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(orders)) orders = [];
    orders.unshift({
      id: "o-" + Date.now(),
      createdAt: new Date().toISOString(),
      totalRub: totalRub,
      items: entries,
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
};
