import "./styles.css";
import { runConnectivityProbe } from "./apiProbe.js";
import { initAuth } from "./auth.js";
import { updateCartBadge } from "./cart.js";
import { initLanding } from "./landing.js";
import { initCardExpiryAutoSlash } from "./payment.js";
import { initProfile } from "./profile.js";
import { initReactiveCartPill } from "./reactiveCartPill.js";
import { initShop } from "./shop.js";

initReactiveCartPill();
initAuth();
updateCartBadge();
void runConnectivityProbe();
initCardExpiryAutoSlash();
initLanding();
initProfile();
initShop();
