import "./styles.css";
import { initAuth } from "./auth.js";
import { updateCartBadge } from "./cart.js";
import { initShop } from "./shop.js";

initAuth();
updateCartBadge();
initShop();
