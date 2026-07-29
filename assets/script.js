/* =========================================================
   MEGA FAR — shared script (tr / en / ar)
   Ürün grid + detay lightbox mekanizması.
   Her ürün nesnesi: { id, code, name, price, currency, accent,
                        isNew, frontImage, backImages[], video, desc }
   video alanı opsiyoneldir — yoksa veya yüklenemezse arka görsel
   galerisine otomatik düşülür (kullanıcıya eksiklik hissettirmez).
   ========================================================= */

(function () {
  "use strict";

  var WHATSAPP_NUMBER = "905343554217"; // +90 534 355 42 17

  // Bu script'in kendi <script src> konumundan "assets/" taban yolunu hesapla.
  // Boylece site kok domain'de veya GitHub Pages gibi bir alt yolda
  // (kullanici.github.io/repo-adi/) barindirilsa da urun gorselleri kirilmiyor.
  var ASSETS_BASE = (function () {
    var cur = document.currentScript;
    if (!cur) {
      var scripts = document.getElementsByTagName("script");
      cur = scripts[scripts.length - 1];
    }
    return cur.src.replace(/script\.js(?:\?.*)?(?:#.*)?$/, "");
  })();

  function currentLang() {
    var lang = document.documentElement.getAttribute("lang");
    return lang === "en" || lang === "ar" ? lang : "tr";
  }

  // name/desc dil bazli obje ({tr,en,ar}) - pick() ile o anki dile cevrilir.
  function pick(field) {
    if (typeof field === "string") return field;
    return field[currentLang()] || field.tr;
  }

  // PRODUCTS icindeki frontImage/backImages/video degerleri "products/..."
  // seklinde (assets/ ONCESIZ) tutulur; gercek URL'e ASSETS_BASE ile cevrilir.
  function resolveAsset(path) {
    return path ? ASSETS_BASE + path : path;
  }

  // ---- DEMO ürün verisi (onay sonrası 60 ürünle değiştirilecek) ----
  var PRODUCTS = [
    {
      id: "mf-ms-201",
      code: "MF-MS-201",
      name: { tr: "Mini Sinyal Lamba Çift Renk", en: "Mini Dual-Color Signal Lamp", ar: "مصباح إشارة صغير ثنائي اللون" },
      price: 380,
      currency: "TRY",
      accent: "red",
      isNew: true,
      frontImage: "products/ph-6-front.svg",
      backImages: ["products/ph-6-back-a.svg"],
      video: null,
      desc: {
        tr: "Kompakt gövde, çift renk sinyal çıkışı. Kalıptan seri üretim.",
        en: "Compact housing, dual-color signal output. Mass-produced from our own mold.",
        ar: "هيكل مدمج بمخرج إشارة ثنائي اللون. إنتاج متسلسل من قالبنا الخاص."
      }
    },
    {
      id: "mf-lf-001",
      code: "MF-LF-001",
      name: { tr: "LED Çubuk Far Seti 120W", en: "LED Light Bar Kit 120W", ar: "طقم قضيب إضاءة LED بقوة 120 واط" },
      price: 1450,
      currency: "TRY",
      accent: "amber",
      isNew: false,
      frontImage: "products/ph-1-front.svg",
      backImages: ["products/ph-1-back-a.svg", "products/ph-1-back-b.svg"],
      video: "products/demo-video-not-found.mp4",
      desc: {
        tr: "Yüksek çıkışlı LED çubuk far, tam su geçirmez gövde ve amber çakar modu.",
        en: "High-output LED light bar, fully waterproof housing with amber strobe mode.",
        ar: "قضيب إضاءة LED عالي الإخراج، هيكل مقاوم للماء بالكامل ووضع وميض كهرماني."
      }
    },
    {
      id: "mf-st-014",
      code: "MF-ST-014",
      name: { tr: "Stop Lambası Seti (Sinyal Kırmızı)", en: "Brake Light Set (Signal Red)", ar: "طقم مصباح المكابح (أحمر الإشارة)" },
      price: 620,
      currency: "TRY",
      accent: "red",
      isNew: false,
      frontImage: "products/ph-2-front.svg",
      backImages: ["products/ph-2-back-a.svg", "products/ph-2-back-b.svg"],
      video: null,
      desc: {
        tr: "Orijinal kalıptan üretim stop lambası, direkt takım uyumlu montaj.",
        en: "Brake lamp made from our original mold, direct-fit installation.",
        ar: "مصباح توقف مصنوع من قالبنا الأصلي، تركيب مباشر ومتوافق."
      }
    },
    {
      id: "mf-sf-027",
      code: "MF-SF-027",
      name: { tr: "Sis Farı Kalıp Seti", en: "Fog Light Mold Set", ar: "طقم قالب مصباح الضباب" },
      price: 540,
      currency: "TRY",
      accent: "white",
      isNew: false,
      frontImage: "products/ph-3-front.svg",
      backImages: ["products/ph-3-back-a.svg"],
      video: null,
      desc: {
        tr: "Kendi kalıbımızdan çıkan sis farı gövdesi, yüksek darbe dayanımı.",
        en: "Fog light housing from our own mold, high impact resistance.",
        ar: "هيكل مصباح الضباب من قالبنا الخاص، مقاومة عالية للصدمات."
      }
    },
    {
      id: "mf-or-108",
      code: "MF-OR-108",
      name: { tr: "Off-Road LED Bar 300W", en: "Off-Road LED Bar 300W", ar: "قضيب LED للطرق الوعرة 300 واط" },
      price: 2890,
      currency: "TRY",
      accent: "amber",
      isNew: false,
      frontImage: "products/ph-4-front.svg",
      backImages: ["products/ph-4-back-a.svg", "products/ph-4-back-b.svg"],
      video: null,
      desc: {
        tr: "Ağır hizmet tipi off-road LED bar, tam alüminyum gövde.",
        en: "Heavy-duty off-road LED bar, full aluminum housing.",
        ar: "قضيب LED للطرق الوعرة للخدمة الشاقة، هيكل ألومنيوم بالكامل."
      }
    },
    {
      id: "mf-xn-033",
      code: "MF-XN-033",
      name: { tr: "Xenon Far Kiti H7", en: "Xenon Headlight Kit H7", ar: "طقم مصباح زينون H7" },
      price: 990,
      currency: "TRY",
      accent: "white",
      isNew: false,
      frontImage: "products/ph-5-front.svg",
      backImages: ["products/ph-5-back-a.svg", "products/ph-5-back-b.svg"],
      video: null,
      desc: {
        tr: "Yüksek ışık şiddeti, uzun ömürlü xenon far kiti, kolay montaj.",
        en: "High light intensity, long-lasting xenon headlight kit, easy installation.",
        ar: "شدة إضاءة عالية، طقم مصباح زينون طويل الأمد، تركيب سهل."
      }
    }
  ];

  function buildWaLink(productName, productCode) {
    var text = "Merhaba, " + productName + " (" + productCode + ") ürünü hakkında bilgi almak istiyorum.";
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }

  function formatPrice(price, currency) {
    var symbol = currency === "TRY" ? "₺" : currency;
    return symbol + price.toLocaleString("tr-TR");
  }

  var waIconSvg =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.83 14.05c-.24.68-1.4 1.3-1.93 1.34-.5.05-1.02.24-3.42-.71-2.9-1.15-4.77-4.06-4.92-4.25-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.02-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.65-.07.18-.19.76-.88.96-1.18.2-.3.4-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.72-.17 1.4Z"/></svg>';

  function cardTemplate(product, index) {
    var name = pick(product.name);
    var wa = buildWaLink(name, product.code);
    var badge = product.isNew
      ? '<span class="card__badge" data-i18n-badge>' + (window.MEGAFAR_I18N ? window.MEGAFAR_I18N.newBadge : "YENI") + "</span>"
      : "";
    return (
      '<li class="card" data-accent="' + product.accent + '" data-index="' + index +
      '" tabindex="0" role="button" aria-label="' + name + '">' +
      '<span class="card__corner card__corner--tl"></span>' +
      '<span class="card__corner card__corner--tr"></span>' +
      '<span class="card__corner card__corner--bl"></span>' +
      '<span class="card__corner card__corner--br"></span>' +
      badge +
      '<div class="card__media">' +
      '<img src="' + resolveAsset(product.frontImage) + '" alt="' + name + '" loading="lazy">' +
      '<span class="card__zoom-hint">' + (window.MEGAFAR_I18N ? window.MEGAFAR_I18N.zoomHint : "Detay icin tikla") + "</span>" +
      "</div>" +
      '<div class="card__body">' +
      '<p class="card__name">' + name + "</p>" +
      '<p class="card__code mono">' + product.code + "</p>" +
      '<p class="card__price mono">' + formatPrice(product.price, product.currency) + "</p>" +
      '<a class="btn-wa" href="' + wa + '" target="_blank" rel="noopener">' + waIconSvg +
      "<span>" + (window.MEGAFAR_I18N ? window.MEGAFAR_I18N.askWhatsapp : "WhatsApp'tan Sor") + "</span></a>" +
      "</div>" +
      "</li>"
    );
  }

  function renderGrid() {
    var grid = document.querySelector("[data-product-grid]");
    if (!grid) return;
    var html = PRODUCTS.map(cardTemplate).join("");
    grid.innerHTML = html;

    // Kartın herhangi bir yerine tıklamak lightbox'ı açar; WhatsApp
    // butonu bundan hariçtir ve kendi linkine gitmeye devam eder.
    grid.addEventListener("click", function (e) {
      if (e.target.closest(".btn-wa")) return;
      var card = e.target.closest(".card");
      if (!card) return;
      openLightbox(parseInt(card.getAttribute("data-index"), 10));
    });

    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest(".btn-wa")) return;
      var card = e.target.closest(".card");
      if (!card) return;
      e.preventDefault();
      openLightbox(parseInt(card.getAttribute("data-index"), 10));
    });
  }

  /* ---------------- Lightbox ---------------- */

  var lightboxState = {
    product: null,
    gallery: [],
    activeIndex: 0,
    mode: "video" // "video" | "gallery"
  };

  function getLightboxEl() {
    return document.querySelector("[data-lightbox]");
  }

  function renderLightboxStage() {
    var stage = document.querySelector("[data-lightbox-stage]");
    var thumbs = document.querySelector("[data-lightbox-thumbs]");
    if (!stage) return;

    if (lightboxState.mode === "video") {
      stage.innerHTML =
        '<video src="' + resolveAsset(lightboxState.product.video) + '" autoplay muted loop playsinline controls></video>';
      var video = stage.querySelector("video");
      video.addEventListener("error", function () {
        lightboxState.mode = "gallery";
        lightboxState.activeIndex = 0;
        renderLightboxStage();
      });
    } else {
      var img = lightboxState.gallery[lightboxState.activeIndex];
      stage.innerHTML =
        '<img src="' + resolveAsset(img) + '" alt="' + pick(lightboxState.product.name) + '">' +
        (lightboxState.gallery.length > 1
          ? '<button type="button" class="lightbox__nav-btn lightbox__nav-btn--prev" data-nav="-1" aria-label="Onceki">&#8249;</button>' +
            '<button type="button" class="lightbox__nav-btn lightbox__nav-btn--next" data-nav="1" aria-label="Sonraki">&#8250;</button>'
          : "");
    }

    if (thumbs) {
      if (lightboxState.mode === "gallery" && lightboxState.gallery.length > 1) {
        thumbs.innerHTML = lightboxState.gallery
          .map(function (src, i) {
            return (
              '<button type="button" class="lightbox__thumb' +
              (i === lightboxState.activeIndex ? " is-active" : "") +
              '" data-thumb="' + i + '"><img src="' + resolveAsset(src) + '" alt=""></button>'
            );
          })
          .join("");
      } else {
        thumbs.innerHTML = "";
      }
    }
  }

  function openLightbox(index) {
    var product = PRODUCTS[index];
    if (!product) return;
    lightboxState.product = product;
    lightboxState.gallery = product.backImages || [];
    lightboxState.activeIndex = 0;
    lightboxState.mode = product.video ? "video" : "gallery";

    var root = getLightboxEl();
    if (!root) return;

    var name = pick(product.name);
    var wa = buildWaLink(name, product.code);
    root.querySelector("[data-lightbox-name]").textContent = name;
    root.querySelector("[data-lightbox-code]").textContent = product.code;
    root.querySelector("[data-lightbox-price]").textContent = formatPrice(product.price, product.currency);
    root.querySelector("[data-lightbox-desc]").textContent = pick(product.desc) || "";
    var waBtn = root.querySelector("[data-lightbox-wa]");
    waBtn.setAttribute("href", wa);

    renderLightboxStage();

    root.classList.add("is-open");
    document.body.style.overflow = "hidden";
    root.querySelector(".lightbox__close").focus();
  }

  function closeLightbox() {
    var root = getLightboxEl();
    if (!root) return;
    var video = root.querySelector("[data-lightbox-stage] video");
    if (video) video.pause();
    root.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function bindLightboxEvents() {
    var root = getLightboxEl();
    if (!root) return;

    root.addEventListener("click", function (e) {
      if (e.target === root) closeLightbox();

      var closeBtn = e.target.closest(".lightbox__close");
      if (closeBtn) closeLightbox();

      var nav = e.target.closest("[data-nav]");
      if (nav) {
        var dir = parseInt(nav.getAttribute("data-nav"), 10);
        var len = lightboxState.gallery.length;
        lightboxState.activeIndex = (lightboxState.activeIndex + dir + len) % len;
        renderLightboxStage();
      }

      var thumb = e.target.closest("[data-thumb]");
      if (thumb) {
        lightboxState.activeIndex = parseInt(thumb.getAttribute("data-thumb"), 10);
        renderLightboxStage();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        var navBtn = root.querySelector(
          e.key === "ArrowLeft" ? "[data-nav='-1']" : "[data-nav='1']"
        );
        if (navBtn) navBtn.click();
      }
    });
  }

  /* ---------------- Floating WhatsApp button ---------------- */

  function bindFloatingWa() {
    var el = document.querySelector("[data-wa-float]");
    if (!el) return;
    var text = window.MEGAFAR_I18N ? window.MEGAFAR_I18N.waFloatMessage : "Merhaba, Mega Far urunleri hakkinda bilgi almak istiyorum.";
    el.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text));
  }

  /* ---------------- Mobile nav toggle ---------------- */

  function bindNavToggle() {
    var burger = document.querySelector("[data-nav-toggle]");
    var links = document.querySelector("[data-nav-links]");
    if (!burger || !links) return;
    burger.addEventListener("click", function () {
      var isOpen = links.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- Theme toggle (light / dark) ---------------- */

  function bindThemeToggle() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    function currentTheme() {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    btn.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false");

    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("megafar-theme", next);
      } catch (e) {}
      btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGrid();
    bindLightboxEvents();
    bindFloatingWa();
    bindNavToggle();
    bindThemeToggle();
  });
})();
