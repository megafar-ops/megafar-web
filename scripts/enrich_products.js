// data/products.json icindeki, klasor isminden gelen dagitik name_tr alanlarini
// OpenRouter uzerinden openai/gpt-4o-mini modeliyle profesyonel bir isim + TR/EN/AR
// aciklamaya donusturur. Sadece henuz zenginlestirilmemis urunler (name_en bos olanlar)
// islenir; elle girilmis mevcut urunlere dokunulmaz.
//
// Kullanim:
//   OPENROUTER_API_KEY ortam degiskenini ayarlayip calistirin:
//     node scripts/enrich_products.js
//
// data/products.json dosyasi yerinde guncellenir (price/gorsel/video gibi diger
// alanlar degismez). Script git commit/push YAPMAZ.

"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const PRODUCTS_JSON = path.join(REPO_ROOT, "data", "products.json");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";

const SYSTEM_PROMPT = `Sen bir otomotiv aydinlatma urunleri (LED lamba, sinyal, sis farı, çakar vb.) için
e-ticaret metin editorusun. Sana ham, tutarsiz bir Turkce urun ismi verilecek (genelde bir
klasor isminden geliyor: yazim hatalari, tutarsiz buyuk/kucuk harf, dagitik kelime sirasi
icerebilir). Gorevin:

1. name_tr: Turkce ismi profesyonel, tutarli, duzgun Turkce yazim kurallarina uygun hale getir.
   Teknik detaylari (voltaj orn. 12-24V, LED sayisi, renk, urun tipi) KESINLIKLE koru, hicbirini
   kaybetme veya degistirme. Sadece ifade bicimini, yazimini ve kelime sirasini duzelt.
2. name_en: Ayni urunun profesyonel Ingilizce cevirisi (ayni teknik detaylari koru).
3. name_ar: Ayni urunun profesyonel Arapca cevirisi (ayni teknik detaylari koru).
4. description_tr / description_en / description_ar: Her dilde tek cumlelik, kisa, satis odakli
   bir urun aciklamasi.

SADECE gecerli bir JSON nesnesi dondur, baska hicbir metin ekleme. JSON su alanlari icermeli:
{"name_tr": "...", "name_en": "...", "name_ar": "...", "description_tr": "...", "description_en": "...", "description_ar": "..."}`;

function buildUserPrompt(product) {
  return `Ham urun ismi: "${product.name_tr}"\nUrun kodu: ${product.code || "(yok)"}`;
}

async function enrichOne(product, apiKey) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(product) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    throw new Error("Model yanitinda content bulunamadi: " + JSON.stringify(data).slice(0, 300));
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error("Model yaniti JSON olarak parse edilemedi: " + content.slice(0, 300));
  }

  const required = ["name_tr", "name_en", "name_ar", "description_tr", "description_en", "description_ar"];
  for (const key of required) {
    if (typeof parsed[key] !== "string" || !parsed[key].trim()) {
      throw new Error(`Model yanitinda '${key}' alani eksik veya bos: ${content.slice(0, 300)}`);
    }
  }

  return parsed;
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ortam degiskeni ayarlanmamis.");
  }

  const data = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  const products = data.products || [];

  const targets = products.filter((p) => !p.name_en || !p.name_en.trim());

  console.log(`Toplam urun: ${products.length}, zenginlestirilecek: ${targets.length}`);

  const results = { ok: [], errors: [] };

  for (let i = 0; i < targets.length; i++) {
    const product = targets[i];
    try {
      const enriched = await enrichOne(product, apiKey);
      product.name_tr = enriched.name_tr;
      product.name_en = enriched.name_en;
      product.name_ar = enriched.name_ar;
      product.description_tr = enriched.description_tr;
      product.description_en = enriched.description_en;
      product.description_ar = enriched.description_ar;
      results.ok.push({ id: product.id, name: enriched.name_tr });
    } catch (err) {
      results.errors.push({ id: product.id, name_tr: product.name_tr, error: (err && err.message) || String(err) });
      console.log(`HATA [${product.id}] "${product.name_tr}": ${(err && err.message) || err}`);
    }

    if ((i + 1) % 5 === 0 || i === targets.length - 1) {
      console.log(`[${i + 1}/${targets.length}] islendi...`);
    }
  }

  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify({ products }, null, 2) + "\n", "utf8");

  console.log("\n=== OZET ===");
  console.log("Zenginlestirilecek urun: " + targets.length);
  console.log("Basarili: " + results.ok.length);
  console.log("Hatali: " + results.errors.length);
  if (results.errors.length) {
    console.log("\nHatali urunler:");
    results.errors.forEach((e) => console.log(` - [${e.id}] "${e.name_tr}": ${e.error}`));
  }
}

main().catch((err) => {
  console.error("KRITIK HATA: " + ((err && err.stack) || err));
  process.exit(1);
});
