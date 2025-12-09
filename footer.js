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
    const lastModified = new Date(document.lastModified);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    lastModifiedElement.textContent = lastModified.toLocaleDateString(
      "es-ES",
      options
    );
  }
});
