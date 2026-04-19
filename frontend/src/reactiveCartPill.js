import { createApp, h } from "vue";
import { clientState } from "./clientStore.js";

var pillVueActive = false;

export function isCartPillVueActive() {
  return pillVueActive;
}

export function initReactiveCartPill() {
  var mountEl = document.getElementById("cart-summary-pill-total");
  if (!mountEl) return;
  createApp({
    setup: function () {
      return function () {
        return h(
          "span",
          {
            class: "cart-summary-pill__price",
            id: "cart-summary-pill-total",
          },
          clientState.cartTotalFormatted
        );
      };
    },
  }).mount(mountEl);
  pillVueActive = true;
}
