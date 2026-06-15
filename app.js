const data = window.siteData;

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const renderFeatures = () => {
  const container = document.querySelector("#feature-strip");
  if (!container) return;
  data.features.forEach((feature) => {
    const card = createElement("article", "feature");
    card.append(createElement("h3", "", feature.title));
    card.append(createElement("p", "", feature.copy));
    container.append(card);
  });
};

const setTheme = (mode) => {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem("site-theme", mode);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = mode === "dark" ? "Light" : "Dark";
  const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
  if (metaTheme) metaTheme.content = mode === "dark" ? "#111a18" : "#2f6f59";
};

const initTheme = () => {
  const saved = localStorage.getItem("site-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode = saved === "dark" ? "dark" : saved === "light" ? "light" : prefersDark ? "dark" : "light";
  setTheme(mode);
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
};

const setLang = (code) => {
  const t = (window.siteTranslations || {})[code] || (window.siteTranslations || {}).en;
  if (!t) return;
  document.documentElement.lang = code;
  localStorage.setItem("site-lang", code);
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });
  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.textContent = code === "si" ? "EN" : "සිං";
};

const initLang = () => {
  const saved = localStorage.getItem("site-lang");
  const code = saved === "si" ? "si" : "en";
  if (code === "si") setLang("si");
  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    setLang(document.documentElement.lang === "si" ? "en" : "si");
  });
};

const applyImageLoading = (img) => {
  if (img.complete && img.naturalWidth > 0) return;
  img.classList.add("img-shimmer");
  const done = () => img.classList.remove("img-shimmer");
  img.addEventListener("load", done, { once: true });
  img.addEventListener("error", done, { once: true });
};

const renderAttractions = () => {
  const container = document.querySelector("#attraction-grid");
  if (!container) return;
  data.attractions.forEach((attraction) => {
    const card = createElement("a", "attraction-card");
    card.href = attraction.url;
    card.setAttribute("aria-label", `Read more about ${attraction.title}`);
    const image = createElement("img");
    image.src = attraction.image;
    image.alt = attraction.alt;
    image.loading = "lazy";
    applyImageLoading(image);

    const body = createElement("div", "card-body");
    body.append(createElement("h3", "", attraction.title));
    body.append(createElement("p", "", attraction.copy));

    const tagRow = createElement("div", "tag-row");
    attraction.tags.forEach((tag) => tagRow.append(createElement("span", "tag", tag)));
    body.append(tagRow);
    body.append(createElement("span", "card-link", "Open guide →"));

    card.append(image, body);
    container.append(card);
  });
};

const renderItinerary = (key) => {
  const panel = document.querySelector("#itinerary-panel");
  if (!panel) return;
  panel.replaceChildren();

  data.itineraries[key].forEach((stop) => {
    const card = createElement("article", "stop");
    card.append(createElement("b", "stop-time", stop.time));

    const copy = createElement("div");
    copy.append(createElement("h3", "", stop.title));
    copy.append(createElement("p", "", stop.copy));
    card.append(copy);
    panel.append(card);
  });
};

const setupItineraryTabs = () => {
  const tabs = document.querySelectorAll("[data-itinerary]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((candidate) => candidate.classList.remove("is-active"));
      tab.classList.add("is-active");
      renderItinerary(tab.dataset.itinerary);
    });
  });
  renderItinerary("one-day");
};

const renderTravelNotes = () => {
  const list = document.querySelector("#travel-notes-list");
  if (!list) return;
  data.travelNotes.forEach((note) => list.append(createElement("li", "", note)));
};

const renderDirectory = () => {
  const container = document.querySelector("#directory-grid");
  if (!container) return;
  data.directory.forEach((item) => {
    const card = createElement("article", "directory-card");
    card.append(createElement("h3", "", item.title));
    card.append(createElement("p", "", item.copy));
    card.append(createElement("div", "listing-slot", item.slot));
    container.append(card);
  });
};

const setupNavigation = () => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#nav-menu");
  const header = document.querySelector(".site-header");

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
};

const setupRevealAnimations = () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = [
    ".section-heading",
    ".intro-grid > p",
    ".feature",
    ".attraction-card",
    ".stop",
    ".travel-notes",
    ".directory-card",
    ".map-copy",
    ".about-media",
    ".about-copy",
    ".contact-copy",
    ".inquiry-form",
    ".content-panel",
    ".info-panel",
    ".footer-brand",
    ".footer-column",
    ".footer-bottom"
  ];

  const elements = [...document.querySelectorAll(revealTargets.join(","))];
  const staggerGroups = new WeakMap();

  elements.forEach((element) => {
    const parent = element.parentElement;
    const currentIndex = staggerGroups.get(parent) ?? 0;
    staggerGroups.set(parent, currentIndex + 1);
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(currentIndex, 4) * 55}ms`);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
  );

  elements.forEach((element) => observer.observe(element));
};

const initMap = () => {
  const el = document.getElementById("attraction-map");
  if (!el || typeof L === "undefined") return;

  const map = L.map("attraction-map", { scrollWheelZoom: false }).setView([7.33, 81.00], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);

  const bounds = [];
  data.attractions.forEach((attraction) => {
    if (!attraction.lat || !attraction.lng) return;
    bounds.push([attraction.lat, attraction.lng]);
    L.marker([attraction.lat, attraction.lng])
      .addTo(map)
      .bindPopup(`<strong>${attraction.title}</strong><a href="${attraction.url}">Open guide →</a>`);
  });

  if (bounds.length) map.fitBounds(bounds, { padding: [32, 32] });
};

const setupLightbox = () => {
  const galleries = document.querySelectorAll(".detail-gallery");
  if (!galleries.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Image viewer");

  const inner = document.createElement("div");
  inner.className = "lightbox-inner";
  const img = document.createElement("img");
  img.className = "lightbox-img";
  inner.append(img);

  const closeBtn = createElement("button", "lightbox-close", "×");
  closeBtn.setAttribute("aria-label", "Close");
  const prevBtn = createElement("button", "lightbox-prev", "‹");
  prevBtn.setAttribute("aria-label", "Previous image");
  const nextBtn = createElement("button", "lightbox-next", "›");
  nextBtn.setAttribute("aria-label", "Next image");

  lightbox.append(closeBtn, prevBtn, inner, nextBtn);
  document.body.append(lightbox);

  let images = [];
  let current = 0;

  const show = (index) => {
    current = index;
    img.src = images[current].src;
    img.alt = images[current].alt;
    prevBtn.hidden = current === 0;
    nextBtn.hidden = current === images.length - 1;
  };

  const open = (galleryImages, index) => {
    images = galleryImages;
    show(index);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  galleries.forEach((gallery) => {
    const galleryImages = [...gallery.querySelectorAll("img")];
    galleryImages.forEach((galleryImg, index) => {
      galleryImg.addEventListener("click", () => open(galleryImages, index));
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(current - 1));
  nextBtn.addEventListener("click", () => show(current + 1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft" && current > 0) show(current - 1);
    if (e.key === "ArrowRight" && current < images.length - 1) show(current + 1);
  });
};

renderFeatures();
renderAttractions();
setupItineraryTabs();
renderTravelNotes();
renderDirectory();
setupNavigation();
setupRevealAnimations();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMap);
} else {
  initMap();
}

setupLightbox();
document.querySelectorAll(".detail-gallery img").forEach(applyImageLoading);
initTheme();
initLang();
