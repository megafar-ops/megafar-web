// Decap CMS (backend: github) icin GitHub OAuth callback.
// Vercel serverless function - /api/callback
//
// Bilinen Decap/Netlify CMS "github oauth provider" el sikismasini
// (window.opener.postMessage) uygular. GITHUB_CLIENT_ID ve
// GITHUB_CLIENT_SECRET Vercel Environment Variables'tan okunur.

function htmlWithScript(res, script) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html><html><body><script>${script}</script></body></html>`);
}

// Decap'in beklediği el sıkışma: popup önce opener'a "authorizing:github"
// mesajını "*" ile yollar; opener (Decap) aynı mesajı popup'a geri
// yollayınca popup, o mesajın event.origin'ini güvenilir hedef olarak
// kullanıp asıl token/hata payload'unu oraya postMessage eder.
function postMessageScript(provider, payload) {
  const type = payload.error ? "error" : "success";
  const message = `authorization:${provider}:${type}:${JSON.stringify(payload)}`;
  return `
    (function() {
      function receiveMessage(e) {
        window.opener.postMessage(${JSON.stringify(message)}, e.origin);
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:${provider}", "*");
    })();
  `;
}

module.exports = async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    htmlWithScript(res, postMessageScript("github", {
      error: "config_error",
      error_description: "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET Vercel'de tanimli degil.",
    }));
    return;
  }

  const { code, state, error, error_description: errorDescription } = req.query || {};

  if (error) {
    htmlWithScript(res, postMessageScript("github", { error, error_description: errorDescription }));
    return;
  }

  const cookies = req.cookies || {};
  if (!state || state !== cookies.decap_oauth_state) {
    htmlWithScript(res, postMessageScript("github", {
      error: "invalid_state",
      error_description: "OAuth state dogrulamasi basarisiz oldu, lutfen tekrar giris yapin.",
    }));
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${protocol}://${host}/api/callback`;

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenRes.json();

    if (data.error || !data.access_token) {
      htmlWithScript(res, postMessageScript("github", {
        error: data.error || "no_token",
        error_description: data.error_description || "GitHub bir access token dondurmedi.",
      }));
      return;
    }

    res.setHeader("Set-Cookie", "decap_oauth_state=; Path=/; HttpOnly; Max-Age=0");
    htmlWithScript(res, postMessageScript("github", { token: data.access_token, provider: "github" }));
  } catch (err) {
    htmlWithScript(res, postMessageScript("github", {
      error: "token_exchange_failed",
      error_description: String(err),
    }));
  }
};
