// Admin panel gorsel/video yukleme endpoint'i.
// Vercel serverless function - POST /api/upload (multipart/form-data, "file" alani)
//
// Yetkilendirme: cagiran istekte "Authorization: token <github-token>" beklenir;
// bu token GitHub'a karsi dogrulanir (ayri bir "admin sifresi" sistemi kurulmuyor,
// zaten GitHub'a login olmus/repo yazma izni olan biri yukleme yapabilir).
//
// Depolama: Vercel Blob (@vercel/blob). BLOB_READ_WRITE_TOKEN Vercel Environment
// Variables'tan (Storage > Blob store baglaninca otomatik enjekte edilir) okunur.

const { put } = require("@vercel/blob");

function parseMultipart(buffer, boundary) {
  const boundaryBuf = Buffer.from("--" + boundary);
  const parts = [];
  let start = buffer.indexOf(boundaryBuf);

  while (start !== -1) {
    const next = buffer.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (next === -1) break;

    let partBuf = buffer.slice(start + boundaryBuf.length, next);
    if (partBuf.slice(0, 2).toString("latin1") === "\r\n") partBuf = partBuf.slice(2);
    if (partBuf.slice(-2).toString("latin1") === "\r\n") partBuf = partBuf.slice(0, -2);

    if (partBuf.length && partBuf.toString("latin1") !== "--") {
      const headerEnd = partBuf.indexOf("\r\n\r\n");
      if (headerEnd !== -1) {
        const headerStr = partBuf.slice(0, headerEnd).toString("utf8");
        const body = partBuf.slice(headerEnd + 4);
        const nameMatch = /name="([^"]+)"/.exec(headerStr);
        const filenameMatch = /filename="([^"]*)"/.exec(headerStr);
        const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerStr);
        parts.push({
          name: nameMatch ? nameMatch[1] : null,
          filename: filenameMatch ? filenameMatch[1] : null,
          contentType: typeMatch ? typeMatch[1].trim() : "application/octet-stream",
          data: body,
        });
      }
    }

    start = next;
  }

  return parts;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^token\s+/i, "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    res.status(401).json({ error: "missing_token", error_description: "Authorization header eksik." });
    return;
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: "token " + token, Accept: "application/vnd.github+json" },
  });
  if (!userRes.ok) {
    res.status(401).json({ error: "invalid_token", error_description: "GitHub token dogrulanamadi." });
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({
      error: "blob_not_configured",
      error_description: "BLOB_READ_WRITE_TOKEN Vercel projesinde tanimli degil. Storage > Blob store olusturup projeye baglayin.",
    });
    return;
  }

  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);
  const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;
  if (!boundary) {
    res.status(400).json({ error: "invalid_content_type", error_description: "multipart/form-data bekleniyor." });
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const parts = parseMultipart(buffer, boundary);
  const filePart = parts.find((p) => p.name === "file" && p.filename);
  if (!filePart) {
    res.status(400).json({ error: "no_file", error_description: "'file' alani bulunamadi." });
    return;
  }

  const safeName = filePart.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = "products/" + Date.now() + "-" + safeName;

  try {
    const blob = await put(pathname, filePart.data, {
      access: "public",
      contentType: filePart.contentType,
      addRandomSuffix: true,
    });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ error: "upload_failed", error_description: String(err) });
  }
};
