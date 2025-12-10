// Mapeo de páginas a sus configuraciones
const pageConfig = {
  "index.html": {
    id: "nav-index",
    i18nKey: "breadcrumb.about",
  },
  "formacion.html": {
    id: "nav-formacion",
    i18nKey: "breadcrumb.education",
  },
  "intereses.html": {
    id: "nav-intereses",
    i18nKey: "breadcrumb.interests",
  },
  "proyectos.html": {
    id: "nav-proyectos",
    i18nKey: "breadcrumb.projects",
  },
};

// Obtener la página actual
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf("/") + 1);
  return page || "index.html";
}

// Generar breadcrumbs
function generateBreadcrumbs() {
  const currentPage = getCurrentPage();
  const breadcrumbList = document.getElementById("breadcrumb-list");

  if (!breadcrumbList) return;

  // Limpiar breadcrumbs existentes
  breadcrumbList.innerHTML = "";

  // Siempre añadir "Inicio"
  const homeItem = document.createElement("li");
  const homeLink = document.createElement("a");
  homeLink.href = "index.html";
  homeLink.setAttribute("data-i18n", "breadcrumb.home");
  homeLink.textContent = window.i18n
    ? window.i18n.t("breadcrumb.home")
    : "Manuel González Santos";
  homeItem.appendChild(homeLink);
  breadcrumbList.appendChild(homeItem);

  // Si no estamos en index.html, añadir la página actual
  if (currentPage !== "index.html" && pageConfig[currentPage]) {
    const currentItem = document.createElement("li");
    currentItem.setAttribute("aria-current", "page");
    currentItem.setAttribute("data-i18n", pageConfig[currentPage].i18nKey);
    currentItem.textContent = window.i18n.t(pageConfig[currentPage].i18nKey);
    breadcrumbList.appendChild(currentItem);
  }
}

// Destacar el elemento activo en el nav
function highlightActiveNav() {
  const currentPage = getCurrentPage();

  if (pageConfig[currentPage]) {
    const activeLink = document.getElementById(pageConfig[currentPage].id);
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  generateBreadcrumbs();
  highlightActiveNav();
});
