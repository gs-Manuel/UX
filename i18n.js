// Sistema de internacionalización con carga de archivos JSON
const i18n = {
  currentLocale: "es",
  translations: {},
  initialized: false,

  async init() {
    // Detectar idioma del navegador o usar el guardado
    const savedLocale = localStorage.getItem("locale");
    const browserLocale = navigator.language.split("-")[0];
    this.currentLocale = savedLocale || (browserLocale === "en" ? "en" : "es");

    // Cargar traducciones
    await this.loadTranslations(this.currentLocale);
    this.updateHTMLLang();
    this.initialized = true;
  },

  async loadTranslations(locale) {
    try {
      const response = await fetch(`${locale}.json`);
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${locale}.json`);
      }
      this.translations[locale] = await response.json();
    } catch (error) {
      console.error(`Error cargando traducciones para ${locale}:`, error);
      // Si falla, intentar cargar español por defecto
      if (locale !== "es") {
        const fallbackResponse = await fetch("es.json");
        this.translations["es"] = await fallbackResponse.json();
        this.currentLocale = "es";
      }
    }
  },

  async setLocale(locale) {
    // Si no tenemos las traducciones de ese idioma, cargarlas
    if (!this.translations[locale]) {
      await this.loadTranslations(locale);
    }

    if (this.translations[locale]) {
      this.currentLocale = locale;
      localStorage.setItem("locale", locale);
      this.updateHTMLLang();
      this.translatePage();
    }
  },

  updateHTMLLang() {
    document.documentElement.lang = this.currentLocale;
  },

  t(key) {
    const keys = key.split(".");
    let value = this.translations[this.currentLocale];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  },

  translatePage() {
    // Traducir elementos con data-i18n
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.t(key);

      // Usar innerHTML si contiene etiquetas HTML, sino textContent
      if (element.hasAttribute("data-i18n-html") || translation.includes("<")) {
        element.innerHTML = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Traducir tooltips
    document.querySelectorAll("[data-i18n-tooltip]").forEach((element) => {
      const key = element.getAttribute("data-i18n-tooltip");
      element.setAttribute("data-tooltip", this.t(key));
    });

    // Traducir placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      element.setAttribute("placeholder", this.t(key));
    });

    // Actualizar títulos de página
    const pageTitles = {
      "index.html": this.t("index.title"),
      "formacion.html": this.t("education.title"),
      "intereses.html": this.t("interests.title"),
      "proyectos.html": this.t("projects.title"),
    };

    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";
    if (pageTitles[currentPage]) {
      document.title = `${pageTitles[currentPage]} - Manuel González Santos`;
    }

    // Actualizar selector de idioma
    document.querySelectorAll(".language-selector button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === this.currentLocale);
    });

    // Regenerar breadcrumbs con el nuevo idioma
    if (typeof generateBreadcrumbs === "function") {
      generateBreadcrumbs();
    }

    // Actualizar la fecha de última modificación con el nuevo formato de locale
    if (typeof updateLastModifiedDate === "function") {
      updateLastModifiedDate();
    }
  },
};

// Inicializar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", async () => {
    await i18n.init();
    i18n.translatePage();
  });
} else {
  (async () => {
    await i18n.init();
    i18n.translatePage();
  })();
}

// Exponer i18n globalmente
window.i18n = i18n;
