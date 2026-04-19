/**
 * Интерактивность лендинга: мобильное меню, подсветка раздела в навигации, фильтр каталога.
 */
import { PRODUCTS } from "./data/products.js";

var SECTION_IDS = ["home", "catalog", "about", "reviews"];

function getNavLinks() {
  return document.querySelectorAll(".nav__link--section");
}

function setActiveSection(id) {
  getNavLinks().forEach(function (link) {
    var sec = link.getAttribute("data-section");
    if (sec === id) link.classList.add("nav__link--active");
    else link.classList.remove("nav__link--active");
  });
}

export function initScrollSpy() {
  var sections = SECTION_IDS.map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);

  if (!sections.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      var visible = entries
        .filter(function (e) {
          return e.isIntersecting;
        })
        .sort(function (a, b) {
          return (b.intersectionRatio || 0) - (a.intersectionRatio || 0);
        });
      if (!visible.length) return;
      var id = visible[0].target.id;
      if (SECTION_IDS.indexOf(id) !== -1) setActiveSection(id);
    },
    {
      root: null,
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0, 0.12, 0.25, 0.4, 0.6],
    }
  );

  sections.forEach(function (el) {
    observer.observe(el);
  });

  window.addEventListener(
    "hashchange",
    function () {
      var h = (location.hash || "").replace("#", "");
      if (SECTION_IDS.indexOf(h) !== -1) setActiveSection(h);
    },
    false
  );

  var initial = (location.hash || "").replace("#", "");
  if (SECTION_IDS.indexOf(initial) !== -1) setActiveSection(initial);
  else setActiveSection("home");
}

function closeMobileNav(mobileNav, toggle) {
  if (!mobileNav) return;
  mobileNav.classList.remove("is-open");
  mobileNav.setAttribute("aria-hidden", "true");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }
  var open =
    document.getElementById("cart-drawer") &&
    document.getElementById("cart-drawer").classList.contains("is-open");
  var login = document.getElementById("login");
  var loginOpen = login && !login.hidden;
  var pm = document.getElementById("product-modal");
  var productOpen = pm && !pm.hidden;
  var prof = document.getElementById("profile-drawer");
  var profileOpen = prof && prof.classList.contains("is-open");
  var contactModal = document.getElementById("contact-modal");
  var contactOpen = contactModal && !contactModal.hidden;
  if (!open && !loginOpen && !productOpen && !profileOpen && !contactOpen) {
    document.body.style.overflow = "";
  }
}

export function closeMobileNavIfOpen() {
  var mobileNav = document.getElementById("mobile-nav");
  var toggle = document.getElementById("nav-menu-toggle");
  if (mobileNav && mobileNav.classList.contains("is-open")) {
    closeMobileNav(mobileNav, toggle);
  }
}

function openMobileNav(mobileNav, toggle) {
  if (!mobileNav) return;
  mobileNav.classList.add("is-open");
  mobileNav.setAttribute("aria-hidden", "false");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

export function initMobileNav() {
  var mobileNav = document.getElementById("mobile-nav");
  var toggle = document.getElementById("nav-menu-toggle");
  if (!mobileNav || !toggle) return;

  toggle.addEventListener("click", function () {
    if (mobileNav.classList.contains("is-open")) closeMobileNav(mobileNav, toggle);
    else openMobileNav(mobileNav, toggle);
  });

  mobileNav.querySelectorAll("[data-close-mobile-nav]").forEach(function (el) {
    el.addEventListener("click", function () {
      closeMobileNav(mobileNav, toggle);
    });
  });

  mobileNav.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () {
      closeMobileNav(mobileNav, toggle);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!mobileNav.classList.contains("is-open")) return;
    closeMobileNav(mobileNav, toggle);
    toggle.focus();
  });
}

function applyCatalogNameSearch() {
  var grid = document.querySelector(".catalog-grid");
  if (!grid) return;
  var catalogInput = document.getElementById("catalog-search");
  var q = catalogInput ? String(catalogInput.value || "").trim().toLowerCase() : "";
  var cards = grid.querySelectorAll(".catalog-card[data-product-id]");
  cards.forEach(function (card) {
    var nameEl = card.querySelector(".catalog-card__name");
    var text = nameEl ? nameEl.textContent.toLowerCase() : "";
    var bad = q.length > 0 && text.indexOf(q) === -1;
    if (bad) card.setAttribute("data-search-hidden", "1");
    else card.removeAttribute("data-search-hidden");
  });
  document.dispatchEvent(new CustomEvent("snackly-catalog-search"));
}

function initCatalogToolbarSearch() {
  var input = document.getElementById("catalog-search");
  if (!input) return;
  input.addEventListener("input", function () {
    applyCatalogNameSearch();
  });
}

function parsePriceRubFromProductId(productId) {
  var p = PRODUCTS[productId];
  if (!p || !p.price) return 0;
  var digits = String(p.price).replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function applyCatalogSort(mode) {
  var grid = document.querySelector(".catalog-grid");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".catalog-card--product"));
  if (!cards.length) return;
  if (mode === "price-asc") {
    cards.sort(function (a, b) {
      var ida = a.getAttribute("data-product-id");
      var idb = b.getAttribute("data-product-id");
      return parsePriceRubFromProductId(ida) - parsePriceRubFromProductId(idb);
    });
  } else if (mode === "price-desc") {
    cards.sort(function (a, b) {
      var ida = a.getAttribute("data-product-id");
      var idb = b.getAttribute("data-product-id");
      return parsePriceRubFromProductId(idb) - parsePriceRubFromProductId(ida);
    });
  } else if (mode === "name-asc") {
    cards.sort(function (a, b) {
      var na = (a.querySelector(".catalog-card__name") || {}).textContent || "";
      var nb = (b.querySelector(".catalog-card__name") || {}).textContent || "";
      return na.localeCompare(nb, "ru", { sensitivity: "base" });
    });
  } else {
    cards.sort(function (a, b) {
      return (
        Number(a.getAttribute("data-sort-default") || 0) -
        Number(b.getAttribute("data-sort-default") || 0)
      );
    });
  }
  cards.forEach(function (c) {
    grid.appendChild(c);
  });
}

export function initCatalogFilter() {
  var grid = document.querySelector(".catalog-grid");
  var chips = document.querySelectorAll("[data-catalog-filter]");
  var status = document.getElementById("catalog-filter-status");
  var sortSelect = document.getElementById("catalog-sort");
  if (!grid || !chips.length) return;

  var cards = grid.querySelectorAll("[data-product-category]");
  var currentFilter = "all";

  grid.querySelectorAll(".catalog-card--product").forEach(function (c, i) {
    if (!c.getAttribute("data-sort-default")) {
      c.setAttribute("data-sort-default", String(i));
    }
  });

  function apply(filter) {
    currentFilter = filter || "all";
    var shown = 0;
    cards.forEach(function (card) {
      var cat = card.getAttribute("data-product-category") || "";
      var matchCat = currentFilter === "all" || cat === currentFilter;
      var searchHidden = card.getAttribute("data-search-hidden") === "1";
      var match = matchCat && !searchHidden;
      card.hidden = !match;
      if (match) shown += 1;
    });
    chips.forEach(function (chip) {
      var f = chip.getAttribute("data-catalog-filter");
      var on = f === currentFilter;
      chip.classList.toggle("catalog-filter__chip--active", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (status) {
      status.textContent =
        shown === cards.length
          ? "Показаны все товары: " + shown
          : "Показано товаров: " + shown + " из " + cards.length;
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      apply(chip.getAttribute("data-catalog-filter") || "all");
    });
  });

  document.addEventListener("snackly-catalog-search", function () {
    apply(currentFilter);
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      applyCatalogSort(sortSelect.value || "default");
    });
  }

  initCatalogToolbarSearch();
  apply("all");
}

export function initLanding() {
  initScrollSpy();
  initMobileNav();
  initCatalogFilter();
}
