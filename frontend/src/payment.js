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

function normalizeLast2(digits) {
  var d = String(digits || "").replace(/\D/g, "");
  if (!d.length) return "00";
  return d.slice(-2).padStart(2, "0");
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
        var last2 = "";
        if (parsed && parsed.last2) last2 = normalizeLast2(parsed.last2);
        else if (parsed && parsed.last4) last2 = normalizeLast2(parsed.last4);
        if (last2) {
          localStorage.setItem(k, JSON.stringify({ last2: last2 }));
          localStorage.removeItem(LEGACY_CARD_KEY);
          raw = localStorage.getItem(k);
        }
      }
    }
    if (!raw) return null;
    var o = JSON.parse(raw);
    if (!o || o.last2 == null) return null;
    var last2 = normalizeLast2(o.last2);
    return { last2: last2 };
  } catch (e) {
    return null;
  }
}

export function saveLinkedCardLast2(last2) {
  var k = cardStorageKey();
  if (!k) return false;
  try {
    localStorage.setItem(k, JSON.stringify({ last2: normalizeLast2(last2) }));
    return true;
  } catch (e) {
    return false;
  }
}

export function linkCardFromInputs(cardNumberRaw, expRaw, cvvRaw) {
  var err = validateCardFields(cardNumberRaw, expRaw, cvvRaw);
  if (err) return err;
  var digits = parseCardNumberDigits(cardNumberRaw);
  saveLinkedCardLast2(digits.slice(-2));
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
