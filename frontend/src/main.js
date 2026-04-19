import "./styles.css";
import { initAuth } from "./auth.js";
import { updateCartBadge } from "./cart.js";
import { initLanding } from "./landing.js";
import { initShop } from "./shop.js";

initAuth();
updateCartBadge();
initLanding();
initShop();
