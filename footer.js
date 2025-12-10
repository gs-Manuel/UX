// Actualizar año actual y fecha de última modificación
document.addEventListener("DOMContentLoaded", function () {
  // Establecer el año actual
  const currentYearElement = document.getElementById("current-year");
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Establecer la fecha de última modificación
  const lastModifiedElement = document.getElementById("last-modified");
  if (lastModifiedElement) {
    updateLastModifiedDate();
  }
});

// Función para actualizar la fecha según el idioma
function updateLastModifiedDate() {
  const lastModifiedElement = document.getElementById("last-modified");
  if (!lastModifiedElement) return;

  const lastModified = new Date(document.lastModified);
  const locale = window.i18n ? window.i18n.currentLocale : "es";
  const localeCode = locale === "en" ? "en-US" : "es-ES";

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  lastModifiedElement.textContent = lastModified.toLocaleDateString(
    localeCode,
    options
  );
}
