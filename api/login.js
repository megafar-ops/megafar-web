// Admin paneli icin e-posta/sifre girisi (GitHub OAuth'a alternatif).
// Vercel serverless function - POST /api/login
//
// Basarili girişte admin.js'in OAuth akışıyla ZATEN bildiği ayni sekli
// dondurur ({ token }) - boylece kaydetme/silme/yukleme kodunun geri
// kalani hic degismeden calismaya devam eder. Token, ADMIN_GITHUB_TOKEN
// ortam degiskeninde saklanan, repoya yazma yetkisi olan ortak bir
// GitHub erisim anahtaridir (kisisel OAuth token'i degil).
//
// ADMIN_EMAIL / ADMIN_PASSWORD_HASH / ADMIN_GITHUB_TOKEN Vercel proje
// ayarlarindaki Environment Variables bolumunden okunur; sifrenin duz
// metni hic bir yerde saklanmaz, sadece bcrypt hash'i karsilastirilir.

const bcrypt = require("bcryptjs");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const githubToken = process.env.ADMIN_GITHUB_TOKEN;

  if (!adminEmail || !passwordHash || !githubToken) {
    res.status(500).json({
      error: "config_error",
      error_description: "ADMIN_EMAIL / ADMIN_PASSWORD_HASH / ADMIN_GITHUB_TOKEN Vercel'de tanimli degil.",
    });
    return;
  }

  try {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      res.status(400).json({ error: "invalid_request", error_description: "E-posta ve sifre gerekli." });
      return;
    }

    const emailMatches = email === adminEmail.trim().toLowerCase();
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!emailMatches || !passwordMatches) {
      res.status(401).json({ error: "invalid_credentials", error_description: "E-posta veya sifre hatali." });
      return;
    }

    res.status(200).json({ token: githubToken });
  } catch (error) {
    res.status(500).json({ error: "server_error", error_description: String((error && error.message) || error) });
  }
};
