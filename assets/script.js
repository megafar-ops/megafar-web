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
  // Mevcut dilde alan bossa TR > EN > AR sirasiyla ilk dolu deger kullanilir;
  // hicbiri dolu degilse bos string donulur (hata firlatilmaz).
  var LANG_FALLBACK_ORDER = ["tr", "en", "ar"];
  function pick(field) {
    if (typeof field === "string") return field;
    if (!field) return "";
    var lang = currentLang();
    if (field[lang]) return field[lang];
    for (var i = 0; i < LANG_FALLBACK_ORDER.length; i++) {
      if (field[LANG_FALLBACK_ORDER[i]]) return field[LANG_FALLBACK_ORDER[i]];
    }
    return "";
  }

  // frontImage/backImages/video degerleri ya "/assets/..." ile baslayan
  // mutlak bir yol (Decap CMS'in yazdigi) ya da "products/..." gibi
  // ASSETS_BASE'e gore bagil bir yoldur; resolveAsset ikisini de destekler.
  function resolveAsset(path) {
    if (!path) return path;
    if (/^(https?:)?\//.test(path)) return path;
    return ASSETS_BASE + path;
  }

  // Urun katalogu artik data/products.json icinde tutulur ve Decap CMS
  // (backend: github) tarafindan yonetilir; sayfa yuklenirken fetch edilir.
  var PRODUCTS = [];

  function normalizeProduct(raw) {
    return {
      id: raw.id || raw.code,
      code: raw.code || "",
      name: { tr: raw.name_tr || "", en: raw.name_en || "", ar: raw.name_ar || "" },
      price: raw.price,
      currency: raw.currency || "TRY",
      accent: raw.accent || "white",
      isNew: !!raw.is_new,
      frontImage: raw.front_image,
      backImages: raw.back_images || [],
      video: raw.video || null,
      desc: { tr: raw.description_tr || "", en: raw.description_en || "", ar: raw.description_ar || "" }
    };
  }

  function loadProducts() {
    return fetch("/data/products.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("products.json HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var list = (data && data.products) || [];
        list.sort(function (a, b) {
          return (a.sort_order || 0) - (b.sort_order || 0);
        });
        PRODUCTS = list.map(normalizeProduct);
      })
      .catch(function (err) {
        console.error("Urun verisi yuklenemedi:", err);
        PRODUCTS = [];
      });
  }

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
    slides: [], // [{ type: "image"|"video", src }]
    activeIndex: 0
  };

  function getLightboxEl() {
    return document.querySelector("[data-lightbox]");
  }

  // Once on gorsel, sonra arka gorseller, en sonda video - hepsi tek
  // bir kaydirilabilir galeri olarak gosterilir (video hicbir zaman
  // otomatik one gecmez, kullanici sirayla gezer).
  function buildSlides(product) {
    var slides = [];
    if (product.frontImage) slides.push({ type: "image", src: product.frontImage });
    (product.backImages || []).forEach(function (src) {
      slides.push({ type: "image", src: src });
    });
    if (product.video) slides.push({ type: "video", src: product.video });
    return slides;
  }

  function lightboxNavButtonsHtml() {
    return lightboxState.slides.length > 1
      ? '<button type="button" class="lightbox__nav-btn lightbox__nav-btn--prev" data-nav="-1" aria-label="Onceki">&#8249;</button>' +
        '<button type="button" class="lightbox__nav-btn lightbox__nav-btn--next" data-nav="1" aria-label="Sonraki">&#8250;</button>'
      : "";
  }

  function renderLightboxStage() {
    var stage = document.querySelector("[data-lightbox-stage]");
    if (!stage) return;

    var slide = lightboxState.slides[lightboxState.activeIndex];
    if (!slide) {
      stage.innerHTML = "";
      renderLightboxThumbs();
      return;
    }

    if (slide.type === "video") {
      stage.innerHTML =
        '<video src="' + resolveAsset(slide.src) + '" autoplay muted loop playsinline controls></video>' + lightboxNavButtonsHtml();
      var video = stage.querySelector("video");
      video.muted = true;
      video.addEventListener("error", function () {
        // Video yuklenemedi - listeden cikar, komsu slide'a gec (kullaniciya
        // eksiklik hissettirmez).
        lightboxState.slides.splice(lightboxState.activeIndex, 1);
        if (lightboxState.activeIndex >= lightboxState.slides.length) {
          lightboxState.activeIndex = Math.max(0, lightboxState.slides.length - 1);
        }
        renderLightboxStage();
      });
    } else {
      stage.innerHTML =
        '<img src="' + resolveAsset(slide.src) + '" alt="' + pick(lightboxState.product.name) + '">' + lightboxNavButtonsHtml();
    }

    renderLightboxThumbs();
  }

  function renderLightboxThumbs() {
    var thumbs = document.querySelector("[data-lightbox-thumbs]");
    if (!thumbs) return;

    if (lightboxState.slides.length <= 1) {
      thumbs.innerHTML = "";
      return;
    }

    thumbs.innerHTML = lightboxState.slides
      .map(function (slide, i) {
        var active = i === lightboxState.activeIndex ? " is-active" : "";
        if (slide.type === "video") {
          return (
            '<button type="button" class="lightbox__thumb lightbox__thumb--video' + active + '" data-thumb="' + i + '" aria-label="Video">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            "</button>"
          );
        }
        return (
          '<button type="button" class="lightbox__thumb' + active + '" data-thumb="' + i +
          '"><img src="' + resolveAsset(slide.src) + '" alt=""></button>'
        );
      })
      .join("");
  }

  function navigateLightbox(dir) {
    var len = lightboxState.slides.length;
    if (len < 2) return;
    lightboxState.activeIndex = (lightboxState.activeIndex + dir + len) % len;
    renderLightboxStage();
  }

  function openLightbox(index) {
    var product = PRODUCTS[index];
    if (!product) return;
    lightboxState.product = product;
    lightboxState.slides = buildSlides(product);
    lightboxState.activeIndex = 0;

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
      if (nav) navigateLightbox(parseInt(nav.getAttribute("data-nav"), 10));

      var thumb = e.target.closest("[data-thumb]");
      if (thumb) {
        lightboxState.activeIndex = parseInt(thumb.getAttribute("data-thumb"), 10);
        renderLightboxStage();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    });

    // Dokunmatik cihazlarda sola/saga kaydirarak slide degistirme.
    var stage = document.querySelector("[data-lightbox-stage]");
    if (stage) {
      var touchStartX = null;
      stage.addEventListener(
        "touchstart",
        function (e) { touchStartX = e.touches[0].clientX; },
        { passive: true }
      );
      stage.addEventListener(
        "touchend",
        function (e) {
          if (touchStartX === null) return;
          var deltaX = e.changedTouches[0].clientX - touchStartX;
          touchStartX = null;
          if (Math.abs(deltaX) < 40) return;
          navigateLightbox(deltaX > 0 ? -1 : 1);
        },
        { passive: true }
      );
    }
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
    if (document.querySelector("[data-product-grid]")) {
      loadProducts().then(renderGrid);
    }
    bindLightboxEvents();
    bindFloatingWa();
    bindNavToggle();
    bindThemeToggle();
  });
})();
