// urun-fotograflari/ klasorunu tarayip her alt klasoru bir urun olarak
// data/products.json'a ekler. Gorsel/video Vercel Blob'a admin panelin
// kullandigi ayni client-upload akisiyla yuklenir (bkz. admin/admin.js
// uploadFile()), boylece uretilen urunler mevcut "ssfds" test urunuyle
// ayni sekilde barinir ve repo'ya binary commit edilmez.
//
// Kullanim: node scripts/bulk_import.js
// GitHub token varsayilan olarak `git remote get-url origin` icine
// gomulu PAT'ten okunur (GITHUB_TOKEN env degiskeniyle override edilebilir).

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { upload } = require("@vercel/blob/client");

const REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.resolve(REPO_ROOT, "..", "urun-fotograflari");
const PRODUCTS_JSON = path.join(REPO_ROOT, "data", "products.json");
const HANDLE_UPLOAD_URL = "https://megafar-web.vercel.app/api/upload";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm"]);
const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

function getGithubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const remoteUrl = execSync("git remote get-url origin", { cwd: REPO_ROOT }).toString().trim();
  const match = /https:\/\/([a-zA-Z0-9_]+)@github\.com/.exec(remoteUrl);
  if (!match) {
    throw new Error("git remote origin URL'sinde GitHub token bulunamadi (GITHUB_TOKEN env degiskeniyle de verilebilir).");
  }
  return match[1];
}

function naturalCompare(a, b) {
  return a.localeCompare(b, "tr", { numeric: true, sensitivity: "base" });
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function makeId() {
  return "prod-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function uploadOne(filePath, githubToken) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  const pathname = "products/" + Date.now() + "-" + safeName(path.basename(filePath));
  const blob = await upload(pathname, buffer, {
    access: "public",
    handleUploadUrl: HANDLE_UPLOAD_URL,
    clientPayload: JSON.stringify({ githubToken }),
    contentType: MIME[ext],
  });
  return blob.url;
}

async function main() {
  const githubToken = getGithubToken();

  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error("Kaynak klasor bulunamadi: " + SOURCE_DIR);
  }

  const data = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  const products = data.products || [];
  let maxSortOrder = products.reduce((m, p) => Math.max(m, p.sort_order || 0), 0);

  const folders = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort(naturalCompare);

  const results = { ok: [], errors: [] };
  let imageCount = 0;
  let videoCount = 0;
  const baseTime = Date.now();

  for (let i = 0; i < folders.length; i++) {
    const folderName = folders[i];
    const folderPath = path.join(SOURCE_DIR, folderName);
    try {
      const files = fs.readdirSync(folderPath).filter((f) => !f.startsWith("."));
      const images = [];
      const videos = [];
      const unknown = [];

      for (const f of files) {
        const ext = path.extname(f).toLowerCase();
        if (IMAGE_EXTS.has(ext)) images.push(f);
        else if (VIDEO_EXTS.has(ext)) videos.push(f);
        else unknown.push(f);
      }

      if (unknown.length) {
        console.log("UYARI [" + folderName + "]: taninmayan dosya(lar) atlandi -> " + unknown.join(", "));
      }
      if (images.length === 0) {
        throw new Error("klasorde hic gorsel yok");
      }
      if (videos.length > 1) {
        console.log("UYARI [" + folderName + "]: birden fazla video var, ilki kullanilacak -> " + videos.join(", "));
      }

      images.sort(naturalCompare);

      console.log(
        "[" + (i + 1) + "/" + folders.length + "] " + folderName + " -> " + images.length + " gorsel" + (videos.length ? " + video" : "")
      );

      const uploadedImages = [];
      for (const img of images) {
        uploadedImages.push(await uploadOne(path.join(folderPath, img), githubToken));
        imageCount++;
      }

      let videoUrl = null;
      if (videos.length) {
        videoUrl = await uploadOne(path.join(folderPath, videos[0]), githubToken);
        videoCount++;
      }

      maxSortOrder += 1;
      products.push({
        id: makeId(),
        code: "",
        name_tr: folderName,
        name_en: "",
        name_ar: "",
        description_tr: "",
        description_en: "",
        description_ar: "",
        price: null,
        currency: "TRY",
        accent: "white",
        is_new: false,
        tag: "",
        front_image: uploadedImages[0],
        back_images: uploadedImages.slice(1),
        video: videoUrl,
        sort_order: maxSortOrder,
        created_at: new Date(baseTime + i * 1000).toISOString(),
      });
      results.ok.push(folderName);
    } catch (err) {
      results.errors.push({ folder: folderName, error: (err && err.message) || String(err) });
      console.log("HATA [" + folderName + "]: " + ((err && err.message) || err));
    }
  }

  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify({ products }, null, 2) + "\n", "utf8");

  console.log("\n=== OZET ===");
  console.log("Islenen klasor: " + folders.length);
  console.log("Basarili urun: " + results.ok.length);
  console.log("Hatali klasor: " + results.errors.length);
  console.log("Yuklenen gorsel: " + imageCount);
  console.log("Yuklenen video: " + videoCount);
  if (results.errors.length) {
    console.log("\nHatalar:");
    results.errors.forEach((e) => console.log(" - " + e.folder + ": " + e.error));
  }
}

main().catch((err) => {
  console.error("KRITIK HATA: " + ((err && err.stack) || err));
  process.exit(1);
});
