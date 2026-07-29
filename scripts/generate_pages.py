# -*- coding: utf-8 -*-
"""
Mega Far — statik sayfa üretici (tek seferlik yazar aracı).
Bu script bir build adimi DEGILDIR: sonuc olarak duz .html dosyalari
uretir, siteye hicbir calisma-zamani bagimliligi eklemez. Urunler/
icerikler degistiginde bu script tekrar calistirilir, sonra dosyalar
oldugu gibi (npm/node olmadan) sunucuya konur.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

WA_NUMBER = "905343554217"

PAGE_PATHS = {
    "home": {"tr": "/index.html", "en": "/en/index.html", "ar": "/ar/index.html"},
    "products": {"tr": "/urunler/index.html", "en": "/en/products/index.html", "ar": "/ar/products/index.html"},
    "about": {"tr": "/hakkimizda/index.html", "en": "/en/about/index.html", "ar": "/ar/about/index.html"},
    "contact": {"tr": "/iletisim/index.html", "en": "/en/contact/index.html", "ar": "/ar/contact/index.html"},
}

FILE_PATHS = {
    "home": {"tr": "index.html", "en": "en/index.html", "ar": "ar/index.html"},
    "products": {"tr": "urunler/index.html", "en": "en/products/index.html", "ar": "ar/products/index.html"},
    "about": {"tr": "hakkimizda/index.html", "en": "en/about/index.html", "ar": "ar/about/index.html"},
    "contact": {"tr": "iletisim/index.html", "en": "en/contact/index.html", "ar": "ar/contact/index.html"},
}

NAV_LABELS = {
    "tr": {"home": "Ana Sayfa", "products": "Ürünler", "about": "Hakkımızda", "contact": "İletişim"},
    "en": {"home": "Home", "products": "Products", "about": "About", "contact": "Contact"},
    "ar": {"home": "الرئيسية", "products": "المنتجات", "about": "من نحن", "contact": "اتصل بنا"},
}

HTML_LANG = {"tr": "tr", "en": "en", "ar": "ar"}
HTML_DIR = {"tr": "ltr", "en": "ltr", "ar": "rtl"}

T = {
    "tr": {
        "footer_tagline": "Kalıbından aydınlatmasına, kendi imalatımızla yollardayız.",
        "quick_links": "Hızlı Linkler",
        "contact_head": "İletişim",
        "hours": "Hafta içi 09:00–18:00",
        "copyright": "© 2026 Mega Far. Tüm hakları saklıdır.",
        "ask_whatsapp": "WhatsApp'tan Sor",
        "zoom_hint": "Detay için tıkla",
        "new_badge": "YENİ",
        "wa_float_message": "Merhaba, Mega Far ürünleriniz hakkında bilgi almak istiyorum.",
        "menu_open": "Menüyü aç",
        "theme_toggle": "Temayı değiştir",
        "close": "Kapat",
        "footer_form_head": "Bize Yazın",
        "sent_ok": "Teşekkürler, e-posta istemciniz açılacak.",
    },
    "en": {
        "footer_tagline": "From mold to lighting, we're on the road with our own manufacturing.",
        "quick_links": "Quick Links",
        "contact_head": "Contact",
        "hours": "Weekdays 09:00–18:00",
        "copyright": "© 2026 Mega Far. All rights reserved.",
        "ask_whatsapp": "Ask on WhatsApp",
        "zoom_hint": "Click for details",
        "new_badge": "NEW",
        "wa_float_message": "Hello, I would like information about your Mega Far products.",
        "menu_open": "Open menu",
        "theme_toggle": "Toggle theme",
        "close": "Close",
        "footer_form_head": "Write to Us",
        "sent_ok": "Thanks, your email client will open now.",
    },
    "ar": {
        "footer_tagline": "من القالب إلى الإضاءة، نمضي في الطريق بتصنيعنا الخاص.",
        "quick_links": "روابط سريعة",
        "contact_head": "اتصل بنا",
        "hours": "أيام الأسبوع 09:00–18:00",
        "copyright": "© 2026 ميغا فار. جميع الحقوق محفوظة.",
        "ask_whatsapp": "اسأل عبر واتساب",
        "zoom_hint": "انقر للتفاصيل",
        "new_badge": "جديد",
        "wa_float_message": "مرحبًا، أرغب في الحصول على معلومات حول منتجات ميغا فار الخاصة بكم.",
        "menu_open": "افتح القائمة",
        "theme_toggle": "تبديل المظهر",
        "close": "إغلاق",
        "footer_form_head": "راسلنا",
        "sent_ok": "شكرًا، سيتم فتح برنامج البريد الإلكتروني الآن.",
    },
}

ADDRESS = "Dudullu OSB 3. Cad. No:5 Saraçoğlu İş Merkezi 3. Kat İç Kapı No:67 Ümraniye / İstanbul"
EMAIL = "megafarinfo@gmail.com"
PHONE_DISPLAY = "+90 534 355 42 17"
INSTAGRAM_HANDLE = "@mega_faar"
INSTAGRAM_URL = "https://instagram.com/mega_faar"
MAP_QUERY = "Dudullu+OSB+3.+Cad.+No:5+Sara%C3%A7o%C4%9Flu+%C4%B0%C5%9F+Merkezi+%C3%9Cmraniye+%C4%B0stanbul"
MAP_SRC = "https://maps.google.com/maps?q=" + MAP_QUERY + "&t=&z=15&ie=UTF8&iwloc=&output=embed"

ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>'
ICON_INSTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>'
ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.83 14.05c-.24.68-1.4 1.3-1.93 1.34-.5.05-1.02.24-3.42-.71-2.9-1.15-4.77-4.06-4.92-4.25-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.02-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.65-.07.18-.19.76-.88.96-1.18.2-.3.4-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.72-.17 1.4Z"/></svg>'
ICON_MOON = '<svg class="icon-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>'
ICON_SUN = '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'


def wa_href(lang):
    text = T[lang]["wa_float_message"]
    import urllib.parse
    return "https://wa.me/" + WA_NUMBER + "?text=" + urllib.parse.quote(text)


def theme_init_script():
    return (
        '<script>(function(){try{if(localStorage.getItem("megafar-theme")==="dark"){'
        'document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();</script>'
    )


def depth_of(page_key, lang):
    """Klasor derinligi (index.html haric '/' sayisi) - GitHub Pages gibi
    alt-yol (repo-adi/) altinda barindirildiginda mutlak yollar kirilir,
    bu yuzden her sey siteye goreli (../..) hesaplanir."""
    return FILE_PATHS[page_key][lang].count("/")


def rel_to(from_page_key, from_lang, to_page_key, to_lang=None):
    if to_lang is None:
        to_lang = from_lang
    d = depth_of(from_page_key, from_lang)
    return ("../" * d) + FILE_PATHS[to_page_key][to_lang]


def rel_asset(from_page_key, from_lang, asset_relpath):
    d = depth_of(from_page_key, from_lang)
    return ("../" * d) + asset_relpath


def hreflang_tags(from_page_key, from_lang):
    tags = []
    for lg in ("tr", "en", "ar"):
        tags.append('  <link rel="alternate" hreflang="%s" href="%s">' % (lg, rel_to(from_page_key, from_lang, from_page_key, lg)))
    tags.append('  <link rel="alternate" hreflang="x-default" href="%s">' % rel_to(from_page_key, from_lang, from_page_key, "tr"))
    return "\n".join(tags)


def navbar_html(lang, active_key):
    labels = NAV_LABELS[lang]
    links = []
    for key in ("home", "products", "about", "contact"):
        cls = ' class="is-active"' if key == active_key else ""
        links.append('        <a href="%s"%s>%s</a>' % (rel_to(active_key, lang, key, lang), cls, labels[key]))
    nav_links_html = "\n".join(links)

    lang_links = []
    lang_order = ["tr", "en", "ar"]
    for i, lg in enumerate(lang_order):
        cls = ' class="is-active"' if lg == lang else ""
        lang_links.append('<a href="%s"%s>%s</a>' % (rel_to(active_key, lang, active_key, lg), cls, lg.upper()))
        if i < len(lang_order) - 1:
            lang_links.append('<span class="sep">/</span>')
    lang_switch_html = "".join(lang_links)

    t = T[lang]
    return '''  <header class="navbar">
    <div class="navbar__inner">
      <a class="navbar__brand" href="%(home)s">MEGA <span>FAR</span></a>
      <nav class="navbar__links" data-nav-links aria-label="%(nav_label)s">
%(nav_links)s
      </nav>
      <div class="navbar__actions">
        <div class="lang-switch" aria-label="%(lang_label)s">%(lang_switch)s</div>
        <button type="button" class="theme-toggle" data-theme-toggle aria-label="%(theme_toggle)s" aria-pressed="false">
          %(icon_moon)s
          %(icon_sun)s
        </button>
        <button type="button" class="navbar__burger" data-nav-toggle aria-label="%(menu_open)s" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>''' % {
        "home": rel_to(active_key, lang, "home", lang),
        "nav_label": labels["home"],
        "nav_links": nav_links_html,
        "lang_label": "Language" if lang != "tr" else "Dil seçimi",
        "lang_switch": lang_switch_html,
        "theme_toggle": t["theme_toggle"],
        "icon_moon": ICON_MOON,
        "icon_sun": ICON_SUN,
        "menu_open": t["menu_open"],
    }


def footer_html(lang, page_key):
    t = T[lang]
    labels = NAV_LABELS[lang]
    quick_links = "\n".join(
        '          <li><a href="%s">%s</a></li>' % (rel_to(page_key, lang, k, lang), labels[k])
        for k in ("home", "products", "about", "contact")
    )
    return '''  <footer class="footer">
    <div class="footer__inner">
      <div>
        <p class="footer__logo">MEGA <span>FAR</span></p>
        <p>%(tagline)s</p>
      </div>
      <div>
        <h3>%(quick_links_head)s</h3>
        <ul>
%(quick_links)s
        </ul>
      </div>
      <div>
        <h3>%(contact_head)s</h3>
        <ul>
          <li>%(icon_phone)s<a href="tel:+%(wa_number)s">%(phone)s</a></li>
          <li>%(icon_mail)s<a href="mailto:%(email)s">%(email)s</a></li>
          <li>%(icon_insta)s<a href="%(insta_url)s" target="_blank" rel="noopener">%(insta_handle)s</a></li>
          <li>%(icon_pin)s<span>%(address)s</span></li>
          <li>%(icon_clock)s<span>%(hours)s</span></li>
        </ul>
      </div>
      <div>
        <h3>%(form_head)s</h3>
        <form class="footer-form" action="mailto:%(email)s" method="post" enctype="text/plain">
          <input type="text" name="name" placeholder="%(label_name)s" required>
          <input type="email" name="email" placeholder="%(label_email)s" required>
          <textarea name="message" rows="2" placeholder="%(label_message)s" required></textarea>
          <button type="submit">%(btn_send)s</button>
        </form>
      </div>
    </div>
    <div class="footer__bottom">%(copyright)s</div>
  </footer>''' % {
        "tagline": t["footer_tagline"],
        "quick_links_head": t["quick_links"],
        "quick_links": quick_links,
        "contact_head": t["contact_head"],
        "icon_phone": ICON_PHONE,
        "wa_number": WA_NUMBER,
        "phone": PHONE_DISPLAY,
        "icon_mail": ICON_MAIL,
        "email": EMAIL,
        "icon_insta": ICON_INSTA,
        "insta_url": INSTAGRAM_URL,
        "insta_handle": INSTAGRAM_HANDLE,
        "icon_pin": ICON_PIN,
        "address": ADDRESS,
        "icon_clock": ICON_CLOCK,
        "hours": t["hours"],
        "copyright": t["copyright"],
        "form_head": t["footer_form_head"],
        "label_name": CONTACT_COPY[lang]["label_name"],
        "label_email": CONTACT_COPY[lang]["label_email"],
        "label_message": CONTACT_COPY[lang]["label_message"],
        "btn_send": CONTACT_COPY[lang]["btn_send"],
    }


def wa_float_html(lang):
    t = T[lang]
    return '''  <a class="wa-float" href="%s" target="_blank" rel="noopener" aria-label="WhatsApp">
    %s
    <span>WhatsApp</span>
  </a>''' % (wa_href(lang), ICON_WA)


def page_shell(lang, page_key, title, description, body, extra_head="", robots=None):
    dirattr = ' dir="rtl"' if HTML_DIR[lang] == "rtl" else ""
    robots_tag = '\n  <meta name="robots" content="%s">' % robots if robots else ""
    return '''<!doctype html>
<html lang="%(html_lang)s"%(dirattr)s>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  %(theme_init)s
  <title>%(title)s</title>
  <meta name="description" content="%(description)s">%(robots)s
%(hreflang)s
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="%(style_href)s">
%(extra_head)s
</head>
<body>

%(navbar)s

%(body)s

%(footer)s

%(wa_float)s

  <script src="%(script_href)s"></script>
</body>
</html>
''' % {
        "html_lang": HTML_LANG[lang],
        "dirattr": dirattr,
        "theme_init": theme_init_script(),
        "title": title,
        "description": description,
        "robots": robots_tag,
        "hreflang": hreflang_tags(page_key, lang),
        "style_href": rel_asset(page_key, lang, "assets/style.css"),
        "script_href": rel_asset(page_key, lang, "assets/script.js"),
        "extra_head": extra_head,
        "navbar": navbar_html(lang, page_key),
        "body": body,
        "footer": footer_html(lang, page_key),
        "wa_float": wa_float_html(lang),
    }


# =========================================================
# HOME
# =========================================================

HOME_COPY = {
    "tr": {
        "title": "Mega Far — Kalıbından Aydınlatmasına Kendi İmalatımız",
        "desc": "Mega Far; LED aydınlatma, çakar ve kalıp imalatında kendi üretimiyle hızlı teslimat ve güçlü destek sunar.",
        "h1": "Kalıbından Aydınlatmasına, Kendi İmalatımızla Yollardayız",
        "p": "Kaliteli ürünleri hızlı teslimat ve güçlü destek ile müşterilerimizle buluşturuyoruz.",
        "btn_products": "Ürünleri İncele",
        "btn_contact": "Bize Ulaşın",
        "groups_title": "İmalat Gruplarımız",
        "groups_desc": "Kendi kalıp ve üretim hattımızdan çıkan üç ana ürün grubu.",
        "g1_h": "LED Aydınlatma &amp; Çakar", "g1_p": "Yüksek çıkışlı LED bar, sinyal ve çakar ürünleri.",
        "g2_h": "Kalıp İmalatı", "g2_p": "Kendi kalıbımızdan çıkan gövde ve yedek parçalar.",
        "g3_h": "Yeni Çıkanlar", "g3_p": "Üretim hattımıza yeni eklenen ürünler.",
    },
    "en": {
        "title": "Mega Far — From Mold to Lighting, Our Own Manufacturing",
        "desc": "Mega Far delivers LED lighting, beacons and mold manufacturing with fast delivery and strong support.",
        "h1": "From Mold to Lighting, We're on the Road with Our Own Manufacturing",
        "p": "We bring quality products to our customers with fast delivery and strong support.",
        "btn_products": "View Products",
        "btn_contact": "Contact Us",
        "groups_title": "Our Manufacturing Groups",
        "groups_desc": "Three core product groups from our own mold and production line.",
        "g1_h": "LED Lighting &amp; Beacons", "g1_p": "High-output LED bars, signal and beacon products.",
        "g2_h": "Mold Manufacturing", "g2_p": "Housings and spare parts made from our own molds.",
        "g3_h": "New Arrivals", "g3_p": "Newly added products from our production line.",
    },
    "ar": {
        "title": "ميغا فار — من القالب إلى الإضاءة، تصنيعنا الخاص",
        "desc": "تقدم ميغا فار إضاءة LED والومضات وتصنيع القوالب بتوصيل سريع ودعم قوي.",
        "h1": "من القالب إلى الإضاءة، نمضي في الطريق بتصنيعنا الخاص",
        "p": "نقدم لعملائنا منتجات عالية الجودة مع توصيل سريع ودعم قوي.",
        "btn_products": "استعرض المنتجات",
        "btn_contact": "تواصل معنا",
        "groups_title": "مجموعات التصنيع لدينا",
        "groups_desc": "ثلاث مجموعات منتجات رئيسية من خط القالب والإنتاج الخاص بنا.",
        "g1_h": "إضاءة LED والومضات", "g1_p": "قضبان LED عالية الإخراج ومنتجات الإشارة والومضات.",
        "g2_h": "تصنيع القوالب", "g2_p": "هياكل وقطع غيار مصنوعة من قوالبنا الخاصة.",
        "g3_h": "وصل حديثًا", "g3_p": "منتجات أضيفت حديثًا إلى خط إنتاجنا.",
    },
}


def build_home(lang):
    c = HOME_COPY[lang]
    body = '''  <main>
    <section class="hero container">
      <h1>%(h1)s</h1>
      <p>%(p)s</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="%(products_url)s">%(btn_products)s</a>
        <a class="btn btn--ghost" href="%(contact_url)s">%(btn_contact)s</a>
      </div>
    </section>

    <section class="section container">
      <div class="section__head">
        <h2>%(groups_title)s</h2>
        <p>%(groups_desc)s</p>
      </div>
      <div class="groups">
        <a class="groups__item" href="%(products_url)s">
          <span class="tag mono">01</span>
          <h3>%(g1_h)s</h3>
          <p>%(g1_p)s</p>
        </a>
        <a class="groups__item" href="%(products_url)s">
          <span class="tag mono">02</span>
          <h3>%(g2_h)s</h3>
          <p>%(g2_p)s</p>
        </a>
        <a class="groups__item" href="%(products_url)s">
          <span class="tag mono">03</span>
          <h3>%(g3_h)s</h3>
          <p>%(g3_p)s</p>
        </a>
      </div>
    </section>
  </main>''' % {
        "h1": c["h1"], "p": c["p"],
        "products_url": PAGE_PATHS["products"][lang],
        "contact_url": PAGE_PATHS["contact"][lang],
        "btn_products": c["btn_products"], "btn_contact": c["btn_contact"],
        "groups_title": c["groups_title"], "groups_desc": c["groups_desc"],
        "g1_h": c["g1_h"], "g1_p": c["g1_p"],
        "g2_h": c["g2_h"], "g2_p": c["g2_p"],
        "g3_h": c["g3_h"], "g3_p": c["g3_p"],
    }
    return page_shell(lang, "home", c["title"], c["desc"], body)


# =========================================================
# ABOUT (Hakkımızda) — Misyon/Vizyon/Degerler still pending from client
# =========================================================

ABOUT_COPY = {
    "tr": {
        "title": "Hakkımızda — Mega Far",
        "desc": "Mega Far'ın misyonu, vizyonu ve değerleri.",
        "h1": "Hakkımızda",
        "note": "Not: Misyon / vizyon / değerler metinlerini iletmeni bekliyorum — onları aldığımda bu üç kutuyu senin verdiğin kesin metinle dolduracağım. Şimdilik yer tutucu (placeholder) olarak duruyor.",
        "mission_h": "Misyon", "mission_p": "[Misyon metni buraya gelecek]",
        "vision_h": "Vizyon", "vision_p": "[Vizyon metni buraya gelecek]",
        "values_h": "Değerler", "values_p": "[Değerler metni buraya gelecek]",
    },
    "en": {
        "title": "About Us — Mega Far",
        "desc": "Mega Far's mission, vision and values.",
        "h1": "About Us",
        "note": "Note: mission / vision / values copy is still pending from the client — placeholder for now.",
        "mission_h": "Mission", "mission_p": "[Mission text goes here]",
        "vision_h": "Vision", "vision_p": "[Vision text goes here]",
        "values_h": "Values", "values_p": "[Values text goes here]",
    },
    "ar": {
        "title": "من نحن — ميغا فار",
        "desc": "رسالة ورؤية وقيم ميغا فار.",
        "h1": "من نحن",
        "note": "ملاحظة: نص الرسالة / الرؤية / القيم بانتظار العميل — نص مؤقت حاليًا.",
        "mission_h": "الرسالة", "mission_p": "[نص الرسالة هنا]",
        "vision_h": "الرؤية", "vision_p": "[نص الرؤية هنا]",
        "values_h": "القيم", "values_p": "[نص القيم هنا]",
    },
}


def build_about(lang):
    c = ABOUT_COPY[lang]
    body = '''  <main class="container">
    <div class="page-head">
      <h1>%(h1)s</h1>
      <p><em>%(note)s</em></p>
    </div>
    <div class="trio" style="padding-bottom: 64px;">
      <div class="trio__item">
        <h3>%(mission_h)s</h3>
        <p>%(mission_p)s</p>
      </div>
      <div class="trio__item">
        <h3>%(vision_h)s</h3>
        <p>%(vision_p)s</p>
      </div>
      <div class="trio__item">
        <h3>%(values_h)s</h3>
        <p>%(values_p)s</p>
      </div>
    </div>
  </main>''' % c
    return page_shell(lang, "about", c["title"], c["desc"], body, robots="noindex")


# =========================================================
# CONTACT (Iletisim)
# =========================================================

CONTACT_COPY = {
    "tr": {
        "title": "İletişim — Mega Far",
        "desc": "Mega Far ile iletişime geçin: telefon, e-posta, adres ve harita.",
        "h1": "İletişim",
        "p": "Sorularınız için bize ulaşın, en kısa sürede dönüş yapalım.",
        "label_name": "Ad Soyad", "label_email": "E-posta", "label_message": "Mesaj", "btn_send": "Gönder",
    },
    "en": {
        "title": "Contact — Mega Far",
        "desc": "Get in touch with Mega Far: phone, email, address and map.",
        "h1": "Contact",
        "p": "Reach out with any questions — we'll get back to you as soon as possible.",
        "label_name": "Full Name", "label_email": "Email", "label_message": "Message", "btn_send": "Send",
    },
    "ar": {
        "title": "اتصل بنا — ميغا فار",
        "desc": "تواصل مع ميغا فار: الهاتف، البريد الإلكتروني، العنوان والخريطة.",
        "h1": "اتصل بنا",
        "p": "تواصل معنا لأي استفسار، سنرد عليك في أقرب وقت ممكن.",
        "label_name": "الاسم الكامل", "label_email": "البريد الإلكتروني", "label_message": "الرسالة", "btn_send": "إرسال",
    },
}


def build_contact(lang):
    c = CONTACT_COPY[lang]
    body = '''  <main class="container">
    <div class="page-head">
      <h1>%(h1)s</h1>
      <p>%(p)s</p>
    </div>
    <div class="contact" style="padding-bottom: 64px;">
      <div class="contact__info">
        <ul>
          <li>%(icon_phone)s<a href="tel:+%(wa_number)s">%(phone)s</a></li>
          <li>%(icon_mail)s<a href="mailto:%(email)s">%(email)s</a></li>
          <li>%(icon_insta)s<a href="%(insta_url)s" target="_blank" rel="noopener">%(insta_handle)s</a></li>
          <li>%(icon_pin)s<span>%(address)s</span></li>
          <li>%(icon_clock)s<span>%(hours)s</span></li>
        </ul>
      </div>
      <div class="map-embed">
        <iframe src="%(map_src)s" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mega Far - Google Maps"></iframe>
      </div>
    </div>
  </main>''' % {
        "h1": c["h1"], "p": c["p"],
        "icon_phone": ICON_PHONE, "wa_number": WA_NUMBER, "phone": PHONE_DISPLAY,
        "icon_mail": ICON_MAIL, "email": EMAIL,
        "icon_insta": ICON_INSTA, "insta_url": INSTAGRAM_URL, "insta_handle": INSTAGRAM_HANDLE,
        "icon_pin": ICON_PIN, "address": ADDRESS,
        "icon_clock": ICON_CLOCK, "hours": T[lang]["hours"],
        "map_src": MAP_SRC,
    }
    return page_shell(lang, "contact", c["title"], c["desc"], body)


# =========================================================
# PRODUCTS (Urunler) — demo grid, shares script.js PRODUCTS (still TR names,
# real 60-product content per language pending from client)
# =========================================================

PRODUCTS_COPY = {
    "tr": {
        "title": "Ürünler — Mega Far",
        "desc": "Mega Far ürün kataloğu — LED aydınlatma, çakar ve kalıp imalatı ürünlerimizi inceleyin, WhatsApp'tan hemen sorun.",
        "h1": "Ürünler",
        "p": "Karta tıklayınca arka görseller ve (varsa) ürün videosu detay görünümünde açılır. Bu demo, 6 örnek ürünle grid + lightbox mekanizmasını gösterir.",
        "grid_label": "Ürün listesi",
        "dialog_label": "Ürün detayı",
        "nav_prev": "Önceki", "nav_next": "Sonraki",
    },
    "en": {
        "title": "Products — Mega Far",
        "desc": "Mega Far product catalog — browse our LED lighting, beacon and mold manufacturing products, ask instantly on WhatsApp.",
        "h1": "Products",
        "p": "Click a card to open the detail view with back photos and (if available) a product video. This demo shows the grid + lightbox mechanism with 6 sample products.",
        "grid_label": "Product list",
        "dialog_label": "Product detail",
        "nav_prev": "Previous", "nav_next": "Next",
    },
    "ar": {
        "title": "المنتجات — ميغا فار",
        "desc": "كتالوج منتجات ميغا فار — تصفح منتجات إضاءة LED والومضات وتصنيع القوالب، واسأل فورًا عبر واتساب.",
        "h1": "المنتجات",
        "p": "انقر على البطاقة لفتح العرض التفصيلي مع الصور الخلفية وفيديو المنتج (إن وجد). يعرض هذا العرض التجريبي آلية الشبكة والعارض المنبثق بستة منتجات نموذجية.",
        "grid_label": "قائمة المنتجات",
        "dialog_label": "تفاصيل المنتج",
        "nav_prev": "السابق", "nav_next": "التالي",
    },
}


def build_products(lang):
    c = PRODUCTS_COPY[lang]
    t = T[lang]
    i18n_script = '''  <script>
    window.MEGAFAR_I18N = {
      askWhatsapp: "%s",
      zoomHint: "%s",
      newBadge: "%s",
      waFloatMessage: "%s"
    };
  </script>''' % (t["ask_whatsapp"], t["zoom_hint"], t["new_badge"], t["wa_float_message"])

    body = '''  <main class="container">
    <div class="page-head">
      <h1>%(h1)s</h1>
      <p>%(p)s</p>
    </div>

    <ul class="grid" data-product-grid aria-label="%(grid_label)s"></ul>
  </main>

  <div class="lightbox" data-lightbox>
    <div class="lightbox__panel" role="dialog" aria-modal="true" aria-label="%(dialog_label)s">
      <span class="lightbox__corner lightbox__corner--tl"></span>
      <span class="lightbox__corner lightbox__corner--tr"></span>
      <span class="lightbox__corner lightbox__corner--bl"></span>
      <span class="lightbox__corner lightbox__corner--br"></span>
      <button type="button" class="lightbox__close" aria-label="%(close)s">&times;</button>
      <div class="lightbox__grid">
        <div>
          <div class="lightbox__stage" data-lightbox-stage></div>
          <div class="lightbox__thumbs" data-lightbox-thumbs></div>
        </div>
        <div class="lightbox__info">
          <h2 data-lightbox-name></h2>
          <p class="code mono" data-lightbox-code></p>
          <p class="price mono" data-lightbox-price></p>
          <p class="desc" data-lightbox-desc></p>
          <a class="btn-wa" data-lightbox-wa href="#" target="_blank" rel="noopener">
            %(icon_wa)s
            <span>%(ask_whatsapp)s</span>
          </a>
        </div>
      </div>
    </div>
  </div>''' % {
        "h1": c["h1"], "p": c["p"], "grid_label": c["grid_label"], "dialog_label": c["dialog_label"],
        "close": t["close"], "icon_wa": ICON_WA, "ask_whatsapp": t["ask_whatsapp"],
    }
    return page_shell(lang, "products", c["title"], c["desc"], body, extra_head=i18n_script, robots="noindex")


BUILDERS = {"home": build_home, "about": build_about, "contact": build_contact, "products": build_products}


def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote", path)


def build_sitemap():
    urls = []
    for page_key in ("home", "products", "about", "contact"):
        for lang in ("tr", "en", "ar"):
            loc = PAGE_PATHS[page_key][lang]
            alt_tags = "\n".join(
                '    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>' % (lg, PAGE_PATHS[page_key][lg])
                for lg in ("tr", "en", "ar")
            )
            alt_tags += '\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % PAGE_PATHS[page_key]["tr"]
            urls.append('  <url>\n    <loc>%s</loc>\n%s\n  </url>' % (loc, alt_tags))
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
%s
</urlset>
''' % "\n".join(urls)
    write("sitemap.xml", xml)


def main():
    for page_key, builder in BUILDERS.items():
        for lang in ("tr", "en", "ar"):
            content = builder(lang)
            write(FILE_PATHS[page_key][lang], content)
    build_sitemap()


if __name__ == "__main__":
    main()
