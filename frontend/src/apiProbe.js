/**
 * Асинхронная проверка доступности API (fetch + AbortController).
 * На GitHub Pages отдаётся статический public/api/health.json; при Express — /api/health.
 */
function basePath() {
  var b = import.meta.env.BASE_URL || "/";
  if (!b.endsWith("/")) b += "/";
  return b;
}

function tryJson(url) {
  var ac = new AbortController();
  var t = window.setTimeout(function () {
    ac.abort();
  }, 4500);
  return fetch(url, {
    method: "GET",
    credentials: "same-origin",
    signal: ac.signal,
    headers: { Accept: "application/json" },
  })
    .then(function (res) {
      window.clearTimeout(t);
      if (!res.ok) return null;
      return res.json();
    })
    .catch(function (e) {
      window.clearTimeout(t);
      throw e;
    });
}

export async function runConnectivityProbe() {
  var base = basePath();
  var detail = { staticHealth: null, liveHealth: null, error: null };

  try {
    detail.staticHealth = await tryJson(base + "api/health.json");
  } catch (e) {
    detail.error = e && e.name ? e.name : String(e);
  }
  try {
    detail.liveHealth = await tryJson(base + "api/health");
  } catch (e) {
    if (!detail.error) detail.error = e && e.name ? e.name : String(e);
  }

  document.dispatchEvent(new CustomEvent("snackly-connectivity", { detail: detail }));
  return detail;
}
