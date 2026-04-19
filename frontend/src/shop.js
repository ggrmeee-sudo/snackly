import { closeLoginModal } from "./auth.js";
import { PRODUCTS } from "./data/products.js";
import {
  addToCart,
  loadCart,
  renderCartDrawer,
  setCartProductQty,
} from "./cart.js";
import { showCartToast } from "./toast.js";

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
  if (!productModal || productModal.hidden) {
    if (!loginModal || loginModal.hidden) document.body.style.overflow = "";
  }
}

function openCartDrawer() {
  if (!cartDrawerEl) return;
  closeProductModal();
  if (loginModal && !loginModal.hidden) closeLoginModal();
  cartDrawerEl.classList.add("is-open");
  cartDrawerEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderCartDrawer();
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
  if (!cartDrawerEl || !cartDrawerEl.classList.contains("is-open")) {
    if (!loginModal || loginModal.hidden) document.body.style.overflow = "";
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
      closeCartDrawer();
    });
  }
  var addrBtn = document.getElementById("cart-address-btn");
  if (addrBtn) {
    addrBtn.addEventListener("click", function () {
      addrBtn.classList.toggle("cart-drawer__address-btn--open");
    });
  }
}

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if (!cartDrawerEl || !cartDrawerEl.classList.contains("is-open")) return;
  closeCartDrawer();
});
}
