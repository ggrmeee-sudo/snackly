import { getSessionEmailNorm } from "./cart.js";

var CARD_PREFIX = "snackly-saved-card:";
var LEGACY_CARD_KEY = "snackly-saved-card";

function cardStorageKey() {
  var e = getSessionEmailNorm();
  return e ? CARD_PREFIX + e : null;
}

export function parseCardNumberDigits(input) {
  return String(input || "").replace(/\D/g, "");
}

export function validateCardFields(numRaw, expRaw, cvvRaw) {
  var num = parseCardNumberDigits(numRaw);
  if (num.length < 16) return "Введите номер карты (16 цифр).";
  var exp = String(expRaw || "").trim();
  if (!/^\d{2}\/\d{2}$/.test(exp)) return "Срок действия в формате ММ/ГГ.";
  var m = parseInt(exp.slice(0, 2), 10);
  if (m < 1 || m > 12) return "Некорректный месяц.";
  var cvv = String(cvvRaw || "").replace(/\D/g, "");
  if (cvv.length < 3) return "Укажите CVC/CVV.";
  return "";
}

function normalizeLast4(digits) {
  var d = String(digits || "").replace(/\D/g, "");
  if (!d.length) return "0000";
  return d.slice(-4).padStart(4, "0");
}

/** Отображение: *1234 */
export function formatCardMaskLast4(last4) {
  return "*" + normalizeLast4(last4);
}

export function getLinkedCard() {
  var k = cardStorageKey();
  if (!k) return null;
  try {
    var raw = localStorage.getItem(k);
    if (!raw) {
      var leg = localStorage.getItem(LEGACY_CARD_KEY);
      if (leg) {
        var parsed = JSON.parse(leg);
        var last4 = "";
        if (parsed && parsed.last4) last4 = normalizeLast4(parsed.last4);
        else if (parsed && parsed.last2) last4 = normalizeLast4("00" + String(parsed.last2).replace(/\D/g, ""));
        if (last4 && last4 !== "0000") {
          localStorage.setItem(k, JSON.stringify({ last4: last4 }));
          localStorage.removeItem(LEGACY_CARD_KEY);
          raw = localStorage.getItem(k);
        }
      }
    }
    if (!raw) return null;
    var o = JSON.parse(raw);
    var last4 = "";
    if (o && o.last4 != null) {
      last4 = normalizeLast4(o.last4);
    } else if (o && o.last2 != null) {
      last4 = normalizeLast4("00" + String(o.last2).replace(/\D/g, ""));
    } else {
      return null;
    }
    if (last4 === "0000") return null;
    if (o && o.last2 != null && o.last4 == null) {
      try {
        localStorage.setItem(k, JSON.stringify({ last4: last4 }));
      } catch (e2) {}
    }
    return { last4: last4 };
  } catch (e) {
    return null;
  }
}

function saveLinkedCardLast4FromDigits(cardDigits) {
  var k = cardStorageKey();
  if (!k) return false;
  try {
    localStorage.setItem(k, JSON.stringify({ last4: normalizeLast4(cardDigits) }));
    return true;
  } catch (e) {
    return false;
  }
}

export function linkCardFromInputs(cardNumberRaw, expRaw, cvvRaw) {
  var err = validateCardFields(cardNumberRaw, expRaw, cvvRaw);
  if (err) return err;
  var digits = parseCardNumberDigits(cardNumberRaw);
  saveLinkedCardLast4FromDigits(digits);
  return "";
}

export function removeLinkedCardForEmail(emailNorm) {
  var e = String(emailNorm || "")
    .trim()
    .toLowerCase();
  if (!e) return;
  try {
    localStorage.removeItem(CARD_PREFIX + e);
  } catch (err) {}
}

export function unlinkLinkedCard() {
  removeLinkedCardForEmail(getSessionEmailNorm());
}
