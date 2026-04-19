import { closeLoginModal } from "./auth.js";
import { PRODUCTS } from "./data/products.js";
import {
  addToCart,
  finalizeOrderFromCart,
  loadCart,
  renderCartDrawer,
  setCartProductQty,
} from "./cart.js";
import { showCartToast } from "./toast.js";

var DELIVERY_ADDR_KEY = "snackly-delivery-address";

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
  try {
    var raw = localStorage.getItem(DELIVERY_ADDR_KEY);
    if (!raw) return defaultDeliveryAddr();
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
  try {
    localStorage.setItem(DELIVERY_ADDR_KEY, JSON.stringify(d));
  } catch (e) {}
}

function fillDeliveryFieldsFromStorage() {
  var d = loadDeliveryAddr();
  var pairs = [
    ["cart-addr-street", d.street],
    ["cart-addr-apt", d.apt],
    ["cart-addr-intercom", d.intercom],
    ["cart-addr-entrance", d.entrance],
    ["cart-addr-floor", d.floor],
    ["cart-addr-comment", d.comment],
  ];
  pairs.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el) el.value = pair[1];
  });
}

function readDeliveryFieldsFromInputs() {
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
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

function updateCartAddressSummaryLine() {
  var el = document.getElementById("cart-address-value");
  if (!el) return;
  var d = loadDeliveryAddr();
  var line = String(d.street || "").trim();
  if (!line) {
    el.textContent = "Добавьте адрес доставки";
    el.classList.add("cart-drawer__address-value--placeholder");
  } else {
    el.textContent = line.length > 40 ? line.slice(0, 38) + "…" : line;
    el.classList.remove("cart-drawer__address-value--placeholder");
  }
}

export function initShop() {
  var loginModal = document.getElementById("login");

var productModal = document.getElementById("product-modal");
var productCards = document.querySelectorAll("[data-open-product]");
var lastProductCard = null;

var modalImg = document.getElementById("product-modal-img");
var modalTitle = document.getElementById("product-modal-title");
var modalBullets = document.getElementById("product-modal-bullets");
var modalDesc = document.getElementById("product-modal-desc");
var modalPrice = document.getElementById("product-modal-price");
var modalAddBtn = document.getElementById("product-modal-add");

function fillProductModal(id) {
  var data = PRODUCTS[id];
  if (!data || !modalImg || !modalTitle || !modalBullets || !modalDesc || !modalPrice) {
    return;
  }
  modalImg.src = data.image;
  modalImg.alt = data.title;
  modalTitle.textContent = data.title;
  modalDesc.textContent = data.desc;
  modalPrice.textContent = data.price;
  if (modalAddBtn) {
    modalAddBtn.setAttribute("data-product-id", id);
    modalAddBtn.hidden = !!data.hidePrice;
    modalAddBtn.setAttribute(
      "aria-label",
      "Добавить в корзину: " + data.title + ", " + data.price
    );
  }

  modalBullets.innerHTML = "";
  var bullets = data.bullets;
  if (bullets && bullets.length > 0) {
    modalBullets.hidden = false;
    bullets.forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      modalBullets.appendChild(li);
    });
  } else {
    modalBullets.hidden = true;
  }
}

var cartDrawerEl = document.getElementById("cart-drawer");

function closeCartDrawer() {
  if (!cartDrawerEl) return;
  cartDrawerEl.classList.remove("is-open");
  cartDrawerEl.setAttribute("aria-hidden", "true");
  var prof = document.getElementById("profile-drawer");
  var profileOpen = prof && prof.classList.contains("is-open");
  if (!productModal || productModal.hidden) {
    if (!loginModal || loginModal.hidden) {
      if (!profileOpen) document.body.style.overflow = "";
    }
  }
}

function openCartDrawer() {
  if (!cartDrawerEl) return;
  closeProductModal();
  if (loginModal && !loginModal.hidden) closeLoginModal();
  var pd = document.getElementById("profile-drawer");
  if (pd && pd.classList.contains("is-open")) {
    pd.classList.remove("is-open");
    pd.setAttribute("aria-hidden", "true");
  }
  cartDrawerEl.classList.add("is-open");
  cartDrawerEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderCartDrawer();
  fillDeliveryFieldsFromStorage();
  updateCartAddressSummaryLine();
}

function openProductModal(card) {
  if (!productModal || !card) return;
  if (cartDrawerEl && cartDrawerEl.classList.contains("is-open")) {
    closeCartDrawer();
  }
  lastProductCard = card;
  var id = card.getAttribute("data-product-id");
  if (id) fillProductModal(id);
  productModal.hidden = false;
  document.body.style.overflow = "hidden";
  var closeBtn = productModal.querySelector(".product-modal__close");
  if (closeBtn) closeBtn.focus();
}

function closeProductModal() {
  if (!productModal) return;
  productModal.hidden = true;
  var prof = document.getElementById("profile-drawer");
  var profileOpen = prof && prof.classList.contains("is-open");
  if (!cartDrawerEl || !cartDrawerEl.classList.contains("is-open")) {
    if (!loginModal || loginModal.hidden) {
      if (!profileOpen) document.body.style.overflow = "";
    }
  }
  if (lastProductCard) lastProductCard.focus();
}

if (productCards.length && productModal) {
  productCards.forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".catalog-card__price-row")) {
        e.preventDefault();
        e.stopPropagation();
        var id = card.getAttribute("data-product-id");
        if (id) {
          addToCart(id);
          showCartToast();
        }
        return;
      }
      openProductModal(card);
    });
    card.addEventListener("keydown", function (e) {
      if (e.target.closest(".catalog-card__price-row")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProductModal(card);
      }
    });
  });
  productModal.querySelectorAll("[data-close-product]").forEach(function (el) {
    el.addEventListener("click", closeProductModal);
  });
  productModal.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeProductModal();
  });
}

if (modalAddBtn) {
  modalAddBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var id = modalAddBtn.getAttribute("data-product-id");
    if (!id) return;
    addToCart(id);
    showCartToast();
    modalAddBtn.classList.add("product-modal__add-btn--pulse");
    window.clearTimeout(modalAddBtn._addedTimer);
    modalAddBtn._addedTimer = window.setTimeout(function () {
      modalAddBtn.classList.remove("product-modal__add-btn--pulse");
    }, 450);
  });
}

document.querySelectorAll("[data-open-cart]").forEach(function (cartLink) {
  cartLink.addEventListener("click", function (e) {
    e.preventDefault();
    openCartDrawer();
  });
});

if (cartDrawerEl) {
  cartDrawerEl.querySelectorAll("[data-close-cart]").forEach(function (el) {
    el.addEventListener("click", closeCartDrawer);
  });
  var cartList = document.getElementById("cart-drawer-list");
  if (cartList) {
    cartList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cart-qty]");
      if (!btn) return;
      var id = btn.getAttribute("data-product-id");
      var dir = btn.getAttribute("data-cart-qty");
      if (!id) return;
      var cart = loadCart();
      var q = Number(cart[id]) || 0;
      if (dir === "inc") setCartProductQty(id, q + 1);
      else setCartProductQty(id, q - 1);
    });
  }
  var cartContinue = document.getElementById("cart-drawer-continue");
  if (cartContinue) {
    cartContinue.addEventListener("click", function () {
      if (cartContinue.disabled) return;
      finalizeOrderFromCart();
      closeCartDrawer();
    });
  }
  var addrBtn = document.getElementById("cart-address-btn");
  var addrDetails = document.getElementById("cart-address-details");
  if (addrBtn && addrDetails) {
    addrBtn.addEventListener("click", function () {
      var nowOpen = addrBtn.classList.toggle("cart-drawer__address-btn--open");
      addrBtn.setAttribute("aria-expanded", nowOpen ? "true" : "false");
      addrDetails.hidden = !nowOpen;
    });
  }
  var saveAddrBtn = document.getElementById("cart-addr-save");
  if (saveAddrBtn) {
    saveAddrBtn.addEventListener("click", function () {
      saveDeliveryAddr(readDeliveryFieldsFromInputs());
      updateCartAddressSummaryLine();
    });
  }
}

fillDeliveryFieldsFromStorage();
updateCartAddressSummaryLine();

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if (!cartDrawerEl || !cartDrawerEl.classList.contains("is-open")) return;
  closeCartDrawer();
});
}
