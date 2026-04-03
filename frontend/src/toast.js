export function showCartToast() {
  var el = document.getElementById("cart-toast");
  if (!el) return;
  el.hidden = false;
  window.requestAnimationFrame(function () {
    el.classList.add("cart-toast--visible");
  });
  window.clearTimeout(showCartToast._hideTimer);
  window.clearTimeout(showCartToast._hideTimer2);
  showCartToast._hideTimer = window.setTimeout(function () {
    el.classList.remove("cart-toast--visible");
    showCartToast._hideTimer2 = window.setTimeout(function () {
      el.hidden = true;
    }, 380);
  }, 2700);
}
