/* =========================================================
   MEGA FAR — shared script (tr / en / ar)
   Urun kartlari artik sunucu tarafinda (scripts/generate_pages.py)
   statik HTML olarak gomulu geliyor (SEO icin ham HTML'de gercek veri
   bulunsun diye) - bu dosya kartlari sifirdan DOM'a yazmiyor, sadece
   mevcut kartlara davranisi (lightbox acma) "hydrate" ediyor.
   Detay galerisi (arka gorseller/video/aciklama) icin products.json
   yine fetch edilir, cunku bu veriler statik kartta bulunmuyor.
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
    if (price === null || price === undefined || price === "") return "";
    var symbol = currency === "TRY" ? "₺" : currency;
    return symbol + price.toLocaleString("tr-TR");
  }

  // Kartlar artik statik HTML'de (generate_pages.py tarafindan) hazir
  // geliyor; burada sadece davranis "hydrate" edilir - grid.innerHTML
  // yeniden yazilmaz (cift render/flash olmasin, JS calismasa bile
  // kartlar + WhatsApp linkleri zaten calisir durumda kalir).
  function hydrateGrid() {
    var grid = document.querySelector("[data-product-grid]");
    if (!grid) return;

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
      // controls kasten yok: urunler sessiz, dongu halinde oynayan
      // vitrin videolari - kullaniciya ses acma/kapama dugmesi hic
      // gosterilmiyor, boylece video dosyasinda ses izi olsa bile
      // duyulma ihtimali kalmiyor.
      stage.innerHTML =
        '<video src="' + resolveAsset(slide.src) + '" autoplay muted loop playsinline disablepictureinpicture></video>' + lightboxNavButtonsHtml();
      var video = stage.querySelector("video");
      video.muted = true;
      video.volume = 0;
      // Bazi tarayicilar/uzantilar programatik olarak sesi acmayi dener -
      // her denemede zorla tekrar sessize al, kullaniciya ses acma imkani hic verilmesin.
      video.addEventListener("volumechange", function () {
        if (!video.muted || video.volume !== 0) {
          video.muted = true;
          video.volume = 0;
        }
      });
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
    var priceText = formatPrice(product.price, product.currency);
    var priceEl = root.querySelector("[data-lightbox-price]");
    priceEl.textContent = priceText;
    priceEl.style.display = priceText ? "" : "none";
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
      hydrateGrid();
      // Statik kartlar zaten ekranda; bu sadece lightbox'in ihtiyac
      // duydugu detay verisini (arka gorseller/video/aciklama)
      // arka planda hazirlar - grid'in gorunumunu etkilemez.
      loadProducts();
    }
    bindLightboxEvents();
    bindFloatingWa();
    bindNavToggle();
    bindThemeToggle();
  });
})();
