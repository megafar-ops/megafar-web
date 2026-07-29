// Decap CMS (backend: github) icin OAuth baslangic noktasi.
// Vercel serverless function - /api/auth
//
// GITHUB_CLIENT_ID ve GITHUB_CLIENT_SECRET Vercel proje ayarlarindaki
// Environment Variables bolumunden okunur; kod icinde hic yazilmaz.

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    res.status(500).send("GITHUB_CLIENT_ID environment variable is not set on this Vercel project.");
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${protocol}://${host}/api/callback`;

  const state = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,user",
    state,
  });

  res.setHeader(
    "Set-Cookie",
    `decap_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`
  );
  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params.toString()}` });
  res.end();
};
