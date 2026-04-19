import { syncCartChrome } from "./cart.js";

export function closeLoginModal() {
  var loginModal = document.getElementById("login");
  if (!loginModal) return;
  loginModal.hidden = true;
  var cd = document.getElementById("cart-drawer");
  var cartOpen = cd && cd.classList.contains("is-open");
  var pm = document.getElementById("product-modal");
  var productOpen = pm && !pm.hidden;
  var prof = document.getElementById("profile-drawer");
  var profileOpen = prof && prof.classList.contains("is-open");
  if (!cartOpen && !productOpen && !profileOpen) document.body.style.overflow = "";
}

export function initAuth() {
  var USERS_KEY = "snackly-users";
  var SESSION_KEY = "snackly-session";

  function getUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {}
  }

  function normalizeEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  function findUserByEmail(email) {
    var e = normalizeEmail(email);
    return getUsers().find(function (u) {
      return u.email === e;
    });
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setSession(sess) {
    try {
      if (sess) localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function updateAuthNav() {
    var sess = getSession();
    var openLink = document.getElementById("nav-auth-open");
    var profileBtn = document.getElementById("nav-profile-btn");
    var mobileLogin = document.getElementById("mobile-nav-login-link");
    var mobileProfile = document.getElementById("mobile-nav-profile-btn");
    if (!openLink) return;
    if (sess && sess.email) {
      openLink.hidden = true;
      if (profileBtn) profileBtn.hidden = false;
      if (mobileLogin) mobileLogin.hidden = true;
      if (mobileProfile) mobileProfile.hidden = false;
    } else {
      openLink.hidden = false;
      if (profileBtn) profileBtn.hidden = true;
      if (mobileLogin) mobileLogin.hidden = false;
      if (mobileProfile) mobileProfile.hidden = true;
    }
    syncCartChrome();
  }

  var loginModal = document.getElementById("login");
  var loginLinks = document.querySelectorAll('a[href="#login"]');
  var viewLogin = document.getElementById("auth-view-login");
  var viewRegister = document.getElementById("auth-view-register");
  var btnShowRegister = document.getElementById("auth-show-register");
  var btnShowLogin = document.getElementById("auth-show-login");
  var formLogin = document.getElementById("form-login");
  var formRegister = document.getElementById("form-register");
  var errLogin = document.getElementById("auth-login-error");
  var errRegister = document.getElementById("auth-register-error");
  var okRegister = document.getElementById("auth-register-success");

  function setAuthError(el, message) {
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function showAuthView(which) {
    if (!viewLogin || !viewRegister) return;
    if (which === "register") {
      viewLogin.hidden = true;
      viewRegister.hidden = false;
      if (loginModal) loginModal.setAttribute("aria-labelledby", "auth-register-title");
    } else {
      viewLogin.hidden = false;
      viewRegister.hidden = true;
      if (loginModal) loginModal.setAttribute("aria-labelledby", "auth-login-title");
    }
    setAuthError(errLogin, "");
    setAuthError(errRegister, "");
    if (okRegister) {
      okRegister.textContent = "";
      okRegister.hidden = true;
    }
  }

  function openLogin() {
    if (!loginModal) return;
    var pd = document.getElementById("profile-drawer");
    if (pd && pd.classList.contains("is-open")) {
      pd.classList.remove("is-open");
      pd.setAttribute("aria-hidden", "true");
    }
    var cd = document.getElementById("cart-drawer");
    if (cd && cd.classList.contains("is-open")) {
      cd.classList.remove("is-open");
      cd.setAttribute("aria-hidden", "true");
    }
    showAuthView("login");
    loginModal.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(function () {
      var el = viewLogin && !viewLogin.hidden
        ? document.getElementById("login-email")
        : document.getElementById("register-name");
      if (el) el.focus();
    }, 50);
  }

  loginLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openLogin();
    });
  });

  if (btnShowRegister) {
    btnShowRegister.addEventListener("click", function () {
      showAuthView("register");
      var el = document.getElementById("register-name");
      if (el) el.focus();
    });
  }

  if (btnShowLogin) {
    btnShowLogin.addEventListener("click", function () {
      showAuthView("login");
      var el = document.getElementById("login-email");
      if (el) el.focus();
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      setAuthError(errLogin, "");
      var email = normalizeEmail(document.getElementById("login-email").value);
      var password = document.getElementById("login-password").value;
      if (!email) {
        setAuthError(errLogin, "Укажите электронную почту.");
        return;
      }
      if (password.length < 6) {
        setAuthError(errLogin, "Пароль не короче 6 символов.");
        return;
      }
      var user = findUserByEmail(email);
      if (!user) {
        setAuthError(errLogin, "Пользователь с такой почтой не найден. Зарегистрируйтесь.");
        return;
      }
      if (user.password !== password) {
        setAuthError(errLogin, "Неверный пароль.");
        return;
      }
      setSession({
        email: user.email,
        name: user.name || "",
        phone: user.phone || "",
      });
      updateAuthNav();
      formLogin.reset();
      closeLoginModal();
    });
  }

  if (formRegister) {
    formRegister.addEventListener("submit", function (e) {
      e.preventDefault();
      setAuthError(errRegister, "");
      if (okRegister) okRegister.hidden = true;
      var name = document.getElementById("register-name").value.trim();
      var phone = document.getElementById("register-phone")
        ? document.getElementById("register-phone").value.trim()
        : "";
      var email = normalizeEmail(document.getElementById("register-email").value);
      var p1 = document.getElementById("register-password").value;
      var p2 = document.getElementById("register-password2").value;
      if (!email) {
        setAuthError(errRegister, "Укажите электронную почту.");
        return;
      }
      if (p1.length < 6) {
        setAuthError(errRegister, "Пароль — не менее 6 символов.");
        return;
      }
      if (p1 !== p2) {
        setAuthError(errRegister, "Пароли не совпадают.");
        return;
      }
      if (findUserByEmail(email)) {
        setAuthError(errRegister, "Эта почта уже зарегистрирована. Войдите.");
        return;
      }
      var users = getUsers();
      users.push({
        email: email,
        password: p1,
        name: name,
        phone: phone,
      });
      saveUsers(users);
      if (okRegister) {
        okRegister.textContent =
          "Аккаунт создан! Теперь можно войти с этой почтой и паролем.";
        okRegister.hidden = false;
      }
      formRegister.reset();
      document.getElementById("login-email").value = email;
      showAuthView("login");
      var lp = document.getElementById("login-password");
      if (lp) lp.focus();
    });
  }

  if (loginModal) {
    loginModal.querySelectorAll("[data-close-auth]").forEach(function (el) {
      el.addEventListener("click", closeLoginModal);
    });
    loginModal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLoginModal();
    });
  }

  document.addEventListener("snackly-auth-updated", function () {
    updateAuthNav();
  });

  updateAuthNav();
}

