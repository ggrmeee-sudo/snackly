import { PRODUCTS } from "./data/products.js";

var CART_STORAGE_KEY = "snackly-cart";

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
  var n = String(cartTotalQty(loadCart()));
  var el = document.getElementById("cart-count");
  if (el) el.textContent = n;
  var elM = document.getElementById("cart-count-mobile");
  if (elM) elM.textContent = n;
  var badge = document.getElementById("cart-badge");
  if (badge) badge.hidden = n === "0";
}

export {
  loadCart,
  addToCart,
  updateCartBadge,
  renderCartDrawer,
  renderCartDrawerIfOpen,
  setCartProductQty,
};
