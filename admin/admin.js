/* =========================================================
   MEGA FAR — admin panel mantigi (vanilla JS)
   Auth: /api/auth + /api/callback ile ayni postMessage el sikismasi
   (Decap/Sveltia CMS'in kullandigi protokolle birebir uyumlu).
   Veri: data/products.json GitHub Contents API uzerinden dogrudan
   tarayicidan okunur/yazilir (backend: github modeliyle tutarli).
   Yukleme: Vercel Blob'un client-upload akisi (@vercel/blob/client) -
   dosya baytlari dogrudan tarayicidan Blob'a gider, bizim /api/upload
   fonksiyonumuz sadece kucuk bir token uretir (Vercel serverless
   fonksiyonlarindaki ~4.5MB govde limitine hic takilmadan).
   ========================================================= */

import { upload } from "https://esm.sh/@vercel/blob@2.6.1/client";

(function () {
  "use strict";

  var REPO = "megafar-ops/megafar-web";
  var BRANCH = "main";
  var DATA_PATH = "data/products.json";
  var API_BASE = "https://api.github.com";
  var TOKEN_KEY = "megafar_admin_gh_token";

  var EDIT_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var DRAG_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';

  var state = {
    token: null,
    sha: null,
    products: [],
    editingId: null,
    draft: null,
    draftImages: [],
    videoUploading: false,
    videoProgress: 0,
    videoLocalUrl: null,
    formDirty: false
  };

  var draggingId = null;
  var saveDebounceTimer = null;

  var dom = {};

  function cacheDom() {
    dom.loginSection = document.querySelector("[data-admin-login]");
    dom.loginBtn = document.querySelector("[data-login-btn]");
    dom.loginError = document.querySelector("[data-login-error]");
    dom.panelSection = document.querySelector("[data-admin-panel]");
    dom.logoutBtn = document.querySelector("[data-logout-btn]");
    dom.userLabel = document.querySelector("[data-admin-user]");

    dom.addBtn = document.querySelector("[data-add-btn]");
    dom.sortSelect = document.querySelector("[data-sort-select]");
    dom.tagSelect = document.querySelector("[data-tag-select]");
    dom.saveStatus = document.querySelector("[data-save-status]");
    dom.manualHint = document.querySelector("[data-manual-hint]");
    dom.grid = document.querySelector("[data-admin-grid]");
    dom.emptyMsg = document.querySelector("[data-admin-empty]");

    dom.modal = document.querySelector("[data-admin-modal]");
    dom.modalTitle = document.querySelector("[data-modal-title]");
    dom.modalError = document.querySelector("[data-modal-error]");
    dom.modalClose = document.querySelector("[data-modal-close]");
    dom.form = document.querySelector("[data-product-form]") || dom.modal;
    dom.saveBtn = document.querySelector("[data-save-btn]");
    dom.deleteBtn = document.querySelector("[data-delete-btn]");
    dom.cancelBtn = document.querySelector("[data-cancel-btn]");

    dom.imageGallery = document.querySelector("[data-image-gallery]");
    dom.imageInput = document.querySelector("[data-image-input]");
    dom.videoPreview = document.querySelector("[data-video-preview]");
    dom.videoInput = document.querySelector("[data-video-input]");
    dom.videoAdd = document.querySelector("[data-video-add]");
    dom.videoRemove = document.querySelector("[data-video-remove]");
    dom.tagDatalist = document.querySelector("[data-tag-datalist]");
  }

  /* ---------------- helpers ---------------- */

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatPrice(price, currency) {
    var num = typeof price === "number" ? price : parseFloat(price) || 0;
    var symbol = currency === "TRY" || !currency ? "₺" : currency;
    return symbol + num.toLocaleString("tr-TR");
  }

  function pickField(product, base) {
    return product[base + "_tr"] || product[base + "_en"] || product[base + "_ar"] || "";
  }

  function base64ToUtf8(b64) {
    var binary = atob(b64.replace(/\n/g, ""));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function ghHeaders(token) {
    return { Authorization: "token " + token, Accept: "application/vnd.github+json" };
  }

  /* ---------------- auth ---------------- */

  function startLogin() {
    dom.loginError.hidden = true;
    var popup = window.open("/api/auth", "megafar-oauth", "width=600,height=700");
    if (!popup) {
      showLoginError("Popup engellendi olabilir, tarayici ayarlarini kontrol edin.");
      return;
    }

    function handleMessage(e) {
      if (!e.data || typeof e.data !== "string") return;

      if (e.data === "authorizing:github") {
        e.source.postMessage("authorizing:github", e.origin);
        return;
      }

      var match = /^authorization:github:(success|error):(.+)$/.exec(e.data);
      if (!match) return;

      window.removeEventListener("message", handleMessage);
      if (!popup.closed) popup.close();

      var payload = JSON.parse(match[2]);
      if (match[1] === "error") {
        showLoginError(payload.error_description || payload.error || "Giris basarisiz.");
        return;
      }

      state.token = payload.token;
      sessionStorage.setItem(TOKEN_KEY, payload.token);
      enterPanel();
    }

    window.addEventListener("message", handleMessage);
  }

  function showLoginError(msg) {
    dom.loginError.textContent = msg;
    dom.loginError.hidden = false;
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    state.token = null;
    dom.panelSection.hidden = true;
    dom.logoutBtn.hidden = true;
    dom.userLabel.hidden = true;
    dom.loginSection.hidden = false;
  }

  function enterPanel() {
    dom.loginSection.hidden = true;
    dom.panelSection.hidden = false;
    dom.logoutBtn.hidden = false;

    fetch(API_BASE + "/user", { headers: ghHeaders(state.token) })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (user) {
        if (user && user.login) {
          dom.userLabel.textContent = "@" + user.login;
          dom.userLabel.hidden = false;
        }
      })
      .catch(function () {});

    loadProducts().catch(function (err) {
      if (/HTTP (401|403)/.test(err.message)) {
        logout();
        showLoginError("Oturum gecersiz, tekrar giris yapin.");
      } else {
        alert("Urun verisi yuklenemedi: " + err.message);
      }
    });
  }

  /* ---------------- data layer ---------------- */

  function loadProducts() {
    return fetch(API_BASE + "/repos/" + REPO + "/contents/" + DATA_PATH + "?ref=" + BRANCH, {
      headers: ghHeaders(state.token)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        state.sha = data.sha;
        var parsed = JSON.parse(base64ToUtf8(data.content));
        state.products = parsed.products || [];
        renderGrid();
      });
  }

  function persistProducts(message) {
    setSaveStatus("saving");
    var payload = JSON.stringify({ products: state.products }, null, 2);
    return fetch(API_BASE + "/repos/" + REPO + "/contents/" + DATA_PATH, {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, ghHeaders(state.token)),
      body: JSON.stringify({
        message: message || "Urun katalogu guncellendi (admin panel)",
        content: utf8ToBase64(payload),
        sha: state.sha,
        branch: BRANCH
      })
    })
      .then(function (res) {
        if (res.status === 409) throw new Error("conflict");
        if (!res.ok) return res.json().then(function (e) { throw new Error(e.message || "HTTP " + res.status); });
        return res.json();
      })
      .then(function (data) {
        state.sha = data.content.sha;
        setSaveStatus("saved");
      })
      .catch(function (err) {
        setSaveStatus("error");
        if (err.message === "conflict") {
          alert("Baska biri ayni anda degisiklik yapmis olabilir. Guncel veri yeniden yuklenecek.");
          loadProducts();
        }
        throw err;
      });
  }

  function setSaveStatus(value) {
    dom.saveStatus.setAttribute("data-state", value);
    dom.saveStatus.textContent =
      value === "saving" ? "Kaydediliyor…" : value === "saved" ? "Kaydedildi" : value === "error" ? "Hata olustu" : "";
    if (value === "saved") {
      setTimeout(function () {
        if (dom.saveStatus.getAttribute("data-state") === "saved") {
          dom.saveStatus.textContent = "";
          dom.saveStatus.removeAttribute("data-state");
        }
      }, 2500);
    }
  }

  /* ---------------- upload ---------------- */

  // upload() kutuphanesi token uretimi basarisiz olursa jenerik
  // "Failed to retrieve the client token" mesaji verir; asil sebebi
  // (blob store baglanmamis, token gecersiz, vs.) gormek icin ayni
  // istegi kendimiz tekrar atip /api/upload'in gercek JSON hatasini okuruz.
  function diagnoseUploadError(pathname) {
    return fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: { pathname: pathname, clientPayload: JSON.stringify({ githubToken: state.token }), multipart: false }
      })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (result.ok) return null;
        return (result.data && (result.data.error_description || result.data.error)) || null;
      })
      .catch(function () { return null; });
  }

  // Telefon fotograflari genelde gereksiz yere buyuk (birkac MB, 3000px+)
  // oluyor. Yuklemeden once canvas ile makul bir boyuta indirip JPEG
  // olarak yeniden kodluyoruz - kutuphane yok, tum tarayicilarda calisir.
  // SVG (vektor, zaten kucuk) ve GIF (canvas sadece ilk kareyi yakalar,
  // animasyonu bozar) sikistirmadan atlanir.
  var COMPRESS_MAX_DIMENSION = 1600;
  var COMPRESS_QUALITY = 0.82;

  function compressImage(file) {
    if (!file.type || file.type === "image/svg+xml" || file.type === "image/gif") {
      return Promise.resolve(file);
    }
    if (typeof createImageBitmap !== "function") {
      return Promise.resolve(file);
    }

    return createImageBitmap(file)
      .catch(function () { return null; })
      .then(function (bitmap) {
        if (!bitmap) return file;

        var scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
        var targetW = Math.max(1, Math.round(bitmap.width * scale));
        var targetH = Math.max(1, Math.round(bitmap.height * scale));

        var canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        var ctx = canvas.getContext("2d");
        // Saydam PNG'lerde kenarlarin siyaha dusmemesi icin beyaz zemin.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        if (bitmap.close) bitmap.close();

        return new Promise(function (resolve) {
          canvas.toBlob(
            function (blob) {
              if (!blob || blob.size >= file.size) {
                resolve(file);
                return;
              }
              var newName = file.name.replace(/\.\w+$/, "") + ".jpg";
              resolve(new File([blob], newName, { type: "image/jpeg" }));
            },
            "image/jpeg",
            COMPRESS_QUALITY
          );
        });
      })
      .catch(function () { return file; });
  }

  function uploadFile(file, onProgress) {
    var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    var pathname = "products/" + Date.now() + "-" + safeName;

    return upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      clientPayload: JSON.stringify({ githubToken: state.token }),
      onUploadProgress: onProgress
        ? function (progress) { onProgress(Math.round(progress.percentage)); }
        : undefined
    })
      .then(function (blob) { return blob.url; })
      .catch(function (err) {
        return diagnoseUploadError(pathname).then(function (detail) {
          throw new Error(detail || (err && err.message) || "Yükleme başarısız oldu.");
        });
      });
  }

  /* ---------------- sort / filter / render ---------------- */

  function getViewList() {
    var mode = dom.sortSelect.value;
    var tag = dom.tagSelect.value;
    var list = state.products.slice();

    if (mode !== "manual" && tag) {
      list = list.filter(function (p) { return (p.tag || "") === tag; });
    }

    if (mode === "created_asc") {
      list.sort(function (a, b) { return (a.created_at || "").localeCompare(b.created_at || ""); });
    } else if (mode === "price_desc") {
      list.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    } else if (mode === "price_asc") {
      list.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
    } else if (mode === "manual") {
      list.sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
    } else {
      list.sort(function (a, b) { return (b.created_at || "").localeCompare(a.created_at || ""); });
    }

    return list;
  }

  function cardTemplate(product) {
    var manual = dom.grid.getAttribute("data-sort-mode") === "manual";
    var name = pickField(product, "name") || "(isimsiz)";
    var media = product.front_image
      ? '<img src="' + escapeHtml(product.front_image) + '" alt="" loading="lazy">'
      : '<div class="admin-media-empty">Gorsel yok</div>';
    var badge = product.is_new ? '<span class="card__badge">YENİ</span>' : "";

    return (
      '<li class="card" data-accent="' + escapeHtml(product.accent || "white") + '" data-id="' + escapeHtml(product.id) + '"' +
      (manual ? ' draggable="true"' : "") +
      ' tabindex="0">' +
      '<span class="card__corner card__corner--tl"></span>' +
      '<span class="card__corner card__corner--tr"></span>' +
      '<span class="card__corner card__corner--bl"></span>' +
      '<span class="card__corner card__corner--br"></span>' +
      badge +
      (manual ? '<span class="admin-card__drag" aria-hidden="true">' + DRAG_ICON + "</span>" : "") +
      '<button type="button" class="admin-card__edit" aria-label="Düzenle">' + EDIT_ICON + "</button>" +
      '<div class="card__media">' + media + "</div>" +
      '<div class="card__body">' +
      '<p class="card__name">' + escapeHtml(name) + "</p>" +
      '<p class="card__code mono">' + escapeHtml(product.code || "") + "</p>" +
      '<p class="card__price mono">' + formatPrice(product.price, product.currency) + "</p>" +
      "</div>" +
      "</li>"
    );
  }

  function renderGrid() {
    var list = getViewList();
    dom.grid.innerHTML = list.map(cardTemplate).join("");
    dom.emptyMsg.hidden = list.length !== 0;
    renderTagOptions();
  }

  function renderTagOptions() {
    var current = dom.tagSelect.value;
    var tags = Array.prototype.slice
      .call(new Set(state.products.map(function (p) { return p.tag; }).filter(Boolean)))
      .sort();

    dom.tagSelect.innerHTML =
      '<option value="">Tümü</option>' +
      tags.map(function (t) { return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + "</option>"; }).join("");
    if (tags.indexOf(current) !== -1) dom.tagSelect.value = current;

    dom.tagDatalist.innerHTML = tags.map(function (t) { return '<option value="' + escapeHtml(t) + '"></option>'; }).join("");
  }

  /* ---------------- drag & drop (manuel sirala) ---------------- */

  function reorderManual(fromId, toId) {
    var list = state.products;
    var fromIndex = list.findIndex(function (p) { return p.id === fromId; });
    var toIndex = list.findIndex(function (p) { return p.id === toId; });
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    var moved = list.splice(fromIndex, 1)[0];
    list.splice(toIndex, 0, moved);
    list.forEach(function (p, i) { p.sort_order = i + 1; });

    renderGrid();
    scheduleSave();
  }

  function scheduleSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(function () {
      persistProducts("Ürün sırası güncellendi").catch(function () {});
    }, 800);
  }

  /* ---------------- edit modal ---------------- */

  function blankDraft() {
    var maxOrder = state.products.reduce(function (m, p) { return Math.max(m, p.sort_order || 0); }, 0);
    return {
      id: "prod-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      code: "",
      name_tr: "", name_en: "", name_ar: "",
      description_tr: "", description_en: "", description_ar: "",
      price: 0,
      currency: "TRY",
      accent: "white",
      is_new: false,
      tag: "",
      front_image: null,
      back_images: [],
      video: null,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString()
    };
  }

  function openEditModal(product) {
    var isNewProduct = !product;
    state.editingId = isNewProduct ? null : product.id;
    state.draft = isNewProduct ? blankDraft() : JSON.parse(JSON.stringify(product));

    var existingUrls = [];
    if (state.draft.front_image) existingUrls.push(state.draft.front_image);
    if (state.draft.back_images && state.draft.back_images.length) {
      existingUrls = existingUrls.concat(state.draft.back_images);
    }
    state.draftImages = existingUrls.map(function (url) {
      return { url: url, localUrl: url, progress: 100, uploading: false };
    });
    state.videoUploading = false;
    state.videoProgress = 0;
    state.videoLocalUrl = null;

    dom.modalTitle.textContent = isNewProduct ? "Yeni Ürün Ekle" : "Ürün Düzenle";
    dom.deleteBtn.hidden = isNewProduct;
    dom.modalError.hidden = true;
    dom.modalError.textContent = "";

    var fields = dom.form.querySelectorAll("[data-field]");
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      var key = el.getAttribute("data-field");
      if (el.type === "checkbox") el.checked = !!state.draft[key];
      else el.value = state.draft[key] != null ? state.draft[key] : "";
    }

    updateFieldDots();
    renderImageGallery();
    renderVideoPreview();
    state.formDirty = false;

    dom.modal.classList.add("is-open");
  }

  function closeModal() {
    dom.modal.classList.remove("is-open");
    if (state.videoLocalUrl) URL.revokeObjectURL(state.videoLocalUrl);
    state.draftImages.forEach(function (img) {
      if (img.uploading && img.localUrl) URL.revokeObjectURL(img.localUrl);
    });
    state.draft = null;
    state.editingId = null;
    state.draftImages = [];
    state.videoUploading = false;
    state.videoProgress = 0;
    state.videoLocalUrl = null;
    state.formDirty = false;
  }

  // Modal disari tiklama/Iptal/Escape ile kapatilirken kaydedilmemis
  // degisiklik varsa kullaniciyi uyarir; Kaydet/Sil basariyla bittikten
  // sonra dogrudan closeModal() cagrilir (orada onay istemeye gerek yok).
  function attemptCloseModal() {
    if (state.formDirty && !confirm("Kaydedilmemiş değişiklikler var. Kapatmak istediğinize emin misiniz?")) {
      return;
    }
    closeModal();
  }

  function updateFieldDots() {
    var dots = dom.modal.querySelectorAll("[data-dot]");
    for (var i = 0; i < dots.length; i++) {
      var dot = dots[i];
      var key = dot.getAttribute("data-dot");
      var el = dom.form.querySelector('[data-field="' + key + '"]');
      var filled = !!(el && el.value && el.value.trim() !== "");
      dot.classList.toggle("field-dot--filled", filled);
    }
  }

  function progressOverlay(percent) {
    return (
      '<div class="admin-media-thumb__overlay">' +
      '<div class="admin-media-thumb__progress"><div class="admin-media-thumb__progress-bar" style="width:' + percent + '%"></div></div>' +
      "<span>" + percent + "%</span>" +
      "</div>"
    );
  }

  function renderImageGallery() {
    dom.imageGallery.innerHTML = state.draftImages
      .map(function (img, i) {
        var src = img.url || img.localUrl;
        return (
          '<div class="admin-media-thumb' + (img.uploading ? " is-uploading" : "") + '">' +
          '<img src="' + escapeHtml(src) + '" alt="">' +
          (img.uploading ? progressOverlay(img.progress) : "") +
          (i === 0 ? '<span class="admin-media-thumb__badge">Kapak</span>' : "") +
          (img.uploading
            ? ""
            : '<button type="button" class="admin-media-thumb__remove" data-remove-image="' + i + '" aria-label="Kaldır">×</button>') +
          "</div>"
        );
      })
      .join("");
    updateSaveAvailability();
  }

  function renderVideoPreview() {
    var hasVideo = !!state.draft.video;
    if (state.videoUploading) {
      dom.videoPreview.innerHTML =
        '<video src="' + escapeHtml(state.videoLocalUrl) + '" muted></video>' + progressOverlay(state.videoProgress);
    } else {
      dom.videoPreview.innerHTML = hasVideo
        ? '<video src="' + escapeHtml(state.draft.video) + '" muted controls></video>'
        : "<span>Video yok</span>";
    }
    dom.videoAdd.hidden = hasVideo || state.videoUploading;
    dom.videoRemove.hidden = !hasVideo || state.videoUploading;
    var previewVideo = dom.videoPreview.querySelector("video");
    if (previewVideo) previewVideo.muted = true;
    updateSaveAvailability();
  }

  function isAnyUploadPending() {
    return state.videoUploading || state.draftImages.some(function (img) { return img.uploading; });
  }

  function updateSaveAvailability() {
    var pending = isAnyUploadPending();
    dom.saveBtn.disabled = pending;
    dom.saveBtn.textContent = pending ? "Yükleniyor…" : "Kaydet";
  }

  function showModalError(err) {
    dom.modalError.textContent = err instanceof Error ? err.message : String(err);
    dom.modalError.hidden = false;
  }

  function setSaveBtnBusy(busy) {
    dom.saveBtn.disabled = busy;
    dom.saveBtn.textContent = busy ? "Kaydediliyor…" : "Kaydet";
    dom.deleteBtn.disabled = busy;
    dom.cancelBtn.disabled = busy;
  }

  /* ---------------- static event bindings ---------------- */

  function bindStaticEvents() {
    dom.loginBtn.addEventListener("click", startLogin);
    dom.logoutBtn.addEventListener("click", logout);

    dom.addBtn.addEventListener("click", function () { openEditModal(null); });

    dom.sortSelect.addEventListener("change", function () {
      if (dom.sortSelect.value === "manual") {
        dom.grid.setAttribute("data-sort-mode", "manual");
        dom.tagSelect.value = "";
        dom.tagSelect.disabled = true;
        dom.manualHint.hidden = false;
      } else {
        dom.grid.removeAttribute("data-sort-mode");
        dom.tagSelect.disabled = false;
        dom.manualHint.hidden = true;
      }
      renderGrid();
    });

    dom.tagSelect.addEventListener("change", renderGrid);

    dom.grid.addEventListener("click", function (e) {
      var li = e.target.closest(".card");
      if (!li) return;
      var product = state.products.find(function (p) { return p.id === li.getAttribute("data-id"); });
      if (product) openEditModal(product);
    });

    dom.grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var li = e.target.closest(".card");
      if (!li) return;
      e.preventDefault();
      var product = state.products.find(function (p) { return p.id === li.getAttribute("data-id"); });
      if (product) openEditModal(product);
    });

    dom.grid.addEventListener("dragstart", function (e) {
      var li = e.target.closest(".card");
      if (!li || dom.grid.getAttribute("data-sort-mode") !== "manual") return;
      draggingId = li.getAttribute("data-id");
      li.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    dom.grid.addEventListener("dragend", function (e) {
      var li = e.target.closest(".card");
      if (li) li.classList.remove("is-dragging");
      var overs = dom.grid.querySelectorAll(".drag-over");
      for (var i = 0; i < overs.length; i++) overs[i].classList.remove("drag-over");
    });

    dom.grid.addEventListener("dragover", function (e) {
      if (dom.grid.getAttribute("data-sort-mode") !== "manual") return;
      e.preventDefault();
      var li = e.target.closest(".card");
      if (!li) return;
      var overs = dom.grid.querySelectorAll(".drag-over");
      for (var i = 0; i < overs.length; i++) if (overs[i] !== li) overs[i].classList.remove("drag-over");
      li.classList.add("drag-over");
    });

    dom.grid.addEventListener("drop", function (e) {
      if (dom.grid.getAttribute("data-sort-mode") !== "manual") return;
      e.preventDefault();
      var li = e.target.closest(".card");
      if (!li || !draggingId) return;
      li.classList.remove("drag-over");
      reorderManual(draggingId, li.getAttribute("data-id"));
      draggingId = null;
    });

    dom.modalClose.addEventListener("click", attemptCloseModal);
    dom.cancelBtn.addEventListener("click", attemptCloseModal);
    dom.modal.addEventListener("click", function (e) { if (e.target === dom.modal) attemptCloseModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dom.modal.classList.contains("is-open")) attemptCloseModal();
    });

    dom.form.addEventListener("input", function () {
      state.formDirty = true;
      updateFieldDots();
    });

    dom.imageInput.addEventListener("change", function () {
      var file = dom.imageInput.files[0];
      dom.imageInput.value = "";
      if (!file) return;
      state.formDirty = true;

      var entry = { url: null, localUrl: URL.createObjectURL(file), progress: 0, uploading: true };
      state.draftImages.push(entry);
      renderImageGallery();

      compressImage(file)
        .then(function (fileToUpload) {
          return uploadFile(fileToUpload, function (percent) {
            entry.progress = percent;
            renderImageGallery();
          });
        })
        .then(function (url) {
          entry.url = url;
          entry.uploading = false;
          URL.revokeObjectURL(entry.localUrl);
          renderImageGallery();
        })
        .catch(function (err) {
          var idx = state.draftImages.indexOf(entry);
          if (idx !== -1) state.draftImages.splice(idx, 1);
          URL.revokeObjectURL(entry.localUrl);
          renderImageGallery();
          showModalError(err);
        });
    });
    dom.imageGallery.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-remove-image]");
      if (!btn) return;
      var idx = parseInt(btn.getAttribute("data-remove-image"), 10);
      state.draftImages.splice(idx, 1);
      state.formDirty = true;
      renderImageGallery();
    });

    dom.videoInput.addEventListener("change", function () {
      var file = dom.videoInput.files[0];
      dom.videoInput.value = "";
      if (!file) return;
      state.formDirty = true;

      state.videoLocalUrl = URL.createObjectURL(file);
      state.videoUploading = true;
      state.videoProgress = 0;
      renderVideoPreview();

      uploadFile(file, function (percent) {
        state.videoProgress = percent;
        renderVideoPreview();
      })
        .then(function (url) {
          state.draft.video = url;
          state.videoUploading = false;
          URL.revokeObjectURL(state.videoLocalUrl);
          state.videoLocalUrl = null;
          renderVideoPreview();
        })
        .catch(function (err) {
          state.videoUploading = false;
          URL.revokeObjectURL(state.videoLocalUrl);
          state.videoLocalUrl = null;
          renderVideoPreview();
          showModalError(err);
        });
    });
    dom.videoRemove.addEventListener("click", function () {
      state.draft.video = null;
      state.formDirty = true;
      renderVideoPreview();
    });

    dom.saveBtn.addEventListener("click", function () {
      var fields = dom.form.querySelectorAll("[data-field]");
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i];
        var key = el.getAttribute("data-field");
        if (el.type === "checkbox") state.draft[key] = el.checked;
        else if (el.type === "number") state.draft[key] = el.value === "" ? 0 : parseFloat(el.value);
        else state.draft[key] = el.value;
      }

      if (isAnyUploadPending()) {
        showModalError("Yükleme tamamlanmadan kaydedilemez, lütfen bekleyin.");
        return;
      }

      var imageUrls = state.draftImages.map(function (img) { return img.url; }).filter(Boolean);
      state.draft.front_image = imageUrls[0] || null;
      state.draft.back_images = imageUrls.slice(1);

      if (!state.draft.name_tr && !state.draft.name_en && !state.draft.name_ar) {
        showModalError("En az bir dilde ürün adı girmelisiniz.");
        return;
      }

      var isNewProduct = !state.editingId;
      var previous = state.products;
      var updated = state.products.slice();
      if (isNewProduct) {
        updated.push(state.draft);
      } else {
        var idx = updated.findIndex(function (p) { return p.id === state.editingId; });
        if (idx === -1) { showModalError("Ürün bulunamadı, sayfayı yenileyin."); return; }
        updated[idx] = state.draft;
      }

      setSaveBtnBusy(true);
      state.products = updated;
      persistProducts(isNewProduct ? "Yeni ürün: " + (state.draft.code || state.draft.name_tr) : "Ürün güncellendi: " + (state.draft.code || state.draft.name_tr))
        .then(function () { closeModal(); renderGrid(); })
        .catch(function (err) { state.products = previous; showModalError("Kaydedilemedi: " + err.message); })
        .finally(function () { setSaveBtnBusy(false); });
    });

    dom.deleteBtn.addEventListener("click", function () {
      var name = state.draft.name_tr || state.draft.name_en || state.draft.name_ar || state.draft.code || "Bu ürün";
      if (!confirm(name + " silinsin mi? Bu işlem geri alınamaz.")) return;

      var previous = state.products;
      var editingId = state.editingId;
      state.products = state.products.filter(function (p) { return p.id !== editingId; });

      setSaveBtnBusy(true);
      persistProducts("Ürün silindi: " + name)
        .then(function () { closeModal(); renderGrid(); })
        .catch(function (err) { state.products = previous; showModalError("Silinemedi: " + err.message); })
        .finally(function () { setSaveBtnBusy(false); });
    });
  }

  /* ---------------- init ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    cacheDom();
    bindStaticEvents();

    var saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      state.token = saved;
      enterPanel();
    }
  });
})();
