// Clase para manejar el buscador personalizado
class Search {
  constructor(formId, inputId, resultsId) {
    this.form = document.getElementById(formId);
    this.input = document.getElementById(inputId);
    this.resultsContainer = document.getElementById(resultsId);
    this.pages = [
      {
        title: "Sobre mí",
        titleEn: "About Me",
        url: "index.html",
        content: "",
      },
      {
        title: "Formación y Experiencia",
        titleEn: "Education & Experience",
        url: "formacion.html",
        content: "",
      },
      {
        title: "Intereses",
        titleEn: "Interests",
        url: "intereses.html",
        content: "",
      },
      {
        title: "Proyectos",
        titleEn: "Projects",
        url: "proyectos.html",
        content: "",
      },
    ];
    this.contentLoaded = false;

    if (this.form && this.input) {
      this.init();
    }
  }

  async init() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.input.addEventListener("input", (e) => this.handleInput(e));

    // Cargar contenido de las páginas
    await this.loadPagesContent();
  }

  async loadPagesContent() {
    try {
      for (let page of this.pages) {
        const response = await fetch(page.url);
        const html = await response.text();

        // Crear un DOM temporal para extraer el contenido
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Extraer texto del main (contenido principal)
        const main = doc.querySelector("main");
        if (main) {
          // Remover scripts y estilos
          main.querySelectorAll("script, style").forEach((el) => el.remove());
          page.content = main.textContent.toLowerCase().trim();
        }
      }
      this.contentLoaded = true;
    } catch (error) {
      console.error("Error cargando contenido de páginas:", error);
    }
  }

  handleInput(e) {
    const query = e.target.value.trim();

    if (query.length < 2) {
      this.hideResults();
      return;
    }

    this.search(query);
  }

  handleSubmit(e) {
    e.preventDefault();
    const query = this.input.value.trim();

    if (query.length >= 2) {
      this.search(query);
    }
  }

  search(query) {
    if (!this.contentLoaded) {
      this.showResults([
        {
          title: "Cargando...",
          titleEn: "Loading...",
          url: "#",
          snippet: "",
        },
      ]);
      return;
    }

    const queryLower = query.toLowerCase();
    const results = [];
    const currentLocale = window.i18n ? window.i18n.currentLocale : "es";

    for (let page of this.pages) {
      const title = currentLocale === "en" ? page.titleEn : page.title;

      // Buscar en título y contenido
      if (
        title.toLowerCase().includes(queryLower) ||
        page.content.includes(queryLower)
      ) {
        // Extraer snippet (contexto alrededor de la coincidencia)
        const index = page.content.indexOf(queryLower);
        let snippet = "";

        if (index !== -1) {
          const start = Math.max(0, index - 60);
          const end = Math.min(
            page.content.length,
            index + queryLower.length + 60
          );
          snippet = "..." + page.content.substring(start, end).trim() + "...";

          // Resaltar término de búsqueda
          const regex = new RegExp(`(${queryLower})`, "gi");
          snippet = snippet.replace(regex, "<strong>$1</strong>");
        } else {
          // Si coincide en el título pero no en el contenido
          snippet = page.content.substring(0, 120) + "...";
        }

        results.push({
          title: title,
          url: page.url,
          snippet: snippet,
        });
      }
    }

    if (results.length === 0) {
      const noResultsText =
        currentLocale === "en"
          ? "No results found"
          : "No se encontraron resultados";

      results.push({
        title: noResultsText,
        url: "#",
        snippet: "",
      });
    }

    this.showResults(results);
  }

  showResults(results) {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = "";
    this.resultsContainer.style.display = "block";

    results.forEach((result) => {
      const resultItem = document.createElement("div");
      resultItem.className = "search-result-item";

      const link = document.createElement("a");
      link.href = result.url;
      link.className = "search-result-title";
      link.textContent = result.title;

      if (result.url === "#") {
        link.style.cursor = "default";
        link.onclick = (e) => e.preventDefault();
      }

      resultItem.appendChild(link);

      if (result.snippet) {
        const snippet = document.createElement("p");
        snippet.className = "search-result-snippet";
        snippet.innerHTML = result.snippet;
        resultItem.appendChild(snippet);
      }

      this.resultsContainer.appendChild(resultItem);
    });
  }

  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.style.display = "none";
      this.resultsContainer.innerHTML = "";
    }
  }
}

// Inicializar el buscador cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  new Search("search-form", "search-input", "search-results");

  // Cerrar resultados al hacer clic fuera
  document.addEventListener("click", function (e) {
    const searchForm = document.getElementById("search-form");
    const searchResults = document.getElementById("search-results");

    if (searchResults && !searchForm.contains(e.target)) {
      searchResults.style.display = "none";
    }
  });
});
