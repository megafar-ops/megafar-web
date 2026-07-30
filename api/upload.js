// Admin panel gorsel/video yukleme endpoint'i.
// Vercel serverless function - POST /api/upload
//
// ONEMLI: Bu endpoint artik dosya baytlarini KENDISI ALMIYOR. Vercel'in
// klasik Node.js serverless fonksiyonlarinda istek govdesi ~4.5MB ile
// sinirlidir (platform limiti, kod ile degistirilemez) - videolar ve
// buyuk gorseller bu siniri kolayca asar. Bunun yerine Vercel Blob'un
// "client upload" akisini kullaniyoruz: tarayici (admin.js) dosyayi
// DOGRUDAN Vercel Blob'a yukluyor, bu endpoint sadece kisa omurlu bir
// yukleme "token"i uretiyor (kucuk bir JSON istek/yanit, boyut limitine
// hic takilmiyor).
//
// Yetkilendirme: tarayicidan gelen istekte clientPayload icinde GitHub
// token'i tasinir; burada GitHub'a karsi dogrulanir.

const { handleUpload } = require("@vercel/blob/client");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let githubToken = null;
        try {
          githubToken = clientPayload ? JSON.parse(clientPayload).githubToken : null;
        } catch (e) {
          githubToken = null;
        }

        if (!githubToken) {
          throw new Error("missing_token");
        }

        const userRes = await fetch("https://api.github.com/user", {
          headers: { Authorization: "token " + githubToken, Accept: "application/vnd.github+json" },
        });
        if (!userRes.ok) {
          throw new Error("invalid_token");
        }

        return {
          allowedContentTypes: ["image/*", "video/*"],
          addRandomSuffix: true,
        };
      },
    });

    res.status(200).json(jsonResponse);
  } catch (error) {
    res.status(400).json({ error: "upload_failed", error_description: String((error && error.message) || error) });
  }
};
