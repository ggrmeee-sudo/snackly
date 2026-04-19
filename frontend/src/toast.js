function showToastEl(el, durationMs) {
  if (!el) return;
  var ms = typeof durationMs === "number" ? durationMs : 2700;
  el.hidden = false;
  window.requestAnimationFrame(function () {
    el.classList.add("cart-toast--visible");
  });
  window.clearTimeout(showToastEl._hideTimer);
  window.clearTimeout(showToastEl._hideTimer2);
  showToastEl._hideTimer = window.setTimeout(function () {
    el.classList.remove("cart-toast--visible");
    showToastEl._hideTimer2 = window.setTimeout(function () {
      el.hidden = true;
    }, 380);
  }, ms);
}

export function showCartToast() {
  var el = document.getElementById("cart-toast");
  if (!el) return;
  el.classList.remove("cart-toast--notice");
  var textEl = el.querySelector(".cart-toast__text");
  if (textEl) textEl.textContent = "Товар добавлен в корзину";
  showToastEl(el, 2700);
}

export function showSnacklyToast(message, durationMs) {
  var el = document.getElementById("cart-toast");
  if (!el) return;
  var textEl = el.querySelector(".cart-toast__text");
  if (textEl) textEl.textContent = String(message || "");
  var long = String(message || "").length > 40;
  el.classList.toggle("cart-toast--notice", long);
  showToastEl(el, durationMs != null ? durationMs : 3200);
}
