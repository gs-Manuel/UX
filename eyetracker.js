// Eye Tracker con WebGazer y Heatmap
class EyeTracker {
  constructor() {
    // Inicializar propiedades PRIMERO
    this.heatmapInstance = null;
    this.isInitialized = false;
    this.canvas = null;
    this.ctx = null;
    this.screenshotData = null;

    // Cargar estado DEBE ser lo último
    this.loadState();
  }

  // Cargar estado desde localStorage
  loadState() {
    try {
      const savedState = localStorage.getItem("eyetracker_state");
      const savedData = localStorage.getItem("eyetracker_data");

      // Cargar datos primero
      this.gazeData = savedData ? JSON.parse(savedData) : [];

      // Cargar estado con comparación estricta
      if (savedState) {
        const state = JSON.parse(savedState);
        this.isTracking = state.isTracking === true;
        this.isCalibrating = state.isCalibrating === true;
      } else {
        this.isTracking = false;
        this.isCalibrating = false;
      }

      console.log(
        `[EyeTracker] Datos cargados - Puntos: ${this.gazeData.length}, Tracking: ${this.isTracking}, Calibrando: ${this.isCalibrating}`
      );
    } catch (error) {
      console.error("[EyeTracker] Error al cargar estado:", error);
      this.gazeData = [];
      this.isTracking = false;
      this.isCalibrating = false;
    }
  }

  // Guardar estado en localStorage
  saveState() {
    try {
      const state = {
        isTracking: this.isTracking,
        isCalibrating: this.isCalibrating,
        timestamp: Date.now(),
      };

      localStorage.setItem("eyetracker_state", JSON.stringify(state));
      localStorage.setItem("eyetracker_data", JSON.stringify(this.gazeData));

      console.log(
        `[EyeTracker] Estado guardado - Tracking: ${this.isTracking}, Puntos: ${this.gazeData.length}`
      );
    } catch (error) {
      console.error("[EyeTracker] Error al guardar estado:", error);

      // Si falla por tamaño, limpiar datos antiguos
      if (error.name === "QuotaExceededError") {
        console.warn(
          "[EyeTracker] localStorage lleno, limpiando datos antiguos..."
        );
        // Mantener solo los últimos 1000 puntos
        this.gazeData = this.gazeData.slice(-1000);

        // Reintentar guardar
        try {
          localStorage.setItem("eyetracker_state", JSON.stringify(state));
          localStorage.setItem(
            "eyetracker_data",
            JSON.stringify(this.gazeData)
          );
        } catch (e) {
          console.error(
            "[EyeTracker] No se pudo guardar después de limpiar:",
            e
          );
        }
      }
    }
  }

  // Verificar que las librerías estén cargadas
  checkLibraries() {
    if (typeof webgazer === "undefined") {
      console.error("WebGazer no está cargado");
      alert(
        "Error: WebGazer no está cargado. Verifica que webgazer.js esté en la carpeta."
      );
      return false;
    }
    if (typeof h337 === "undefined") {
      console.error("Heatmap.js no está cargado");
      alert("Error: Heatmap.js no pudo cargarse desde el CDN.");
      return false;
    }
    return true;
  }

  // Capturar screenshot de la página actual
  capturePageScreenshot() {
    return new Promise((resolve) => {
      // Usar html2canvas si está disponible, sino crear una captura básica
      if (typeof html2canvas !== "undefined") {
        // Ocultar el panel de tracking durante la captura
        const trackingPanel = document.getElementById("eyetracker-controls");
        const originalDisplay = trackingPanel
          ? trackingPanel.style.display
          : null;
        if (trackingPanel) {
          trackingPanel.style.display = "none";
        }

        // Obtener las dimensiones reales del body
        const bodyRect = document.body.getBoundingClientRect();
        const scrollWidth = Math.max(document.body.scrollWidth, bodyRect.width);
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          bodyRect.height
        );

        html2canvas(document.body, {
          allowTaint: true,
          useCORS: true,
          backgroundColor:
            window.getComputedStyle(document.body).backgroundColor || "#ffffff",
          scale: 1,
          width: scrollWidth,
          height: scrollHeight,
          windowWidth: scrollWidth,
          windowHeight: scrollHeight,
          scrollX: 0,
          scrollY: 0,
        }).then((canvas) => {
          // Restaurar visibilidad del panel
          if (trackingPanel && originalDisplay !== null) {
            trackingPanel.style.display = originalDisplay;
          }
          this.screenshotData = canvas.toDataURL("image/png");
          resolve(canvas);
        });
      } else {
        // Fallback: crear canvas con el tamaño de la página
        const canvas = document.createElement("canvas");
        canvas.width = document.body.scrollWidth;
        canvas.height = document.body.scrollHeight;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.screenshotData = canvas.toDataURL("image/png");
        resolve(canvas);
      }
    });
  }

  // Inicializar WebGazer
  async init() {
    if (!this.checkLibraries()) {
      return false;
    }

    // Verificar si WebGazer ya está corriendo (usando marca en localStorage)
    const webgazerRunning = localStorage.getItem("webgazer_running");

    if (webgazerRunning === "true" && typeof webgazer !== "undefined") {
      try {
        // Solo reconfigurar el listener para esta página
        webgazer.setGazeListener((data, clock) => {
          if (data && this.isTracking) {
            const x = Math.round(data.x + window.scrollX);
            const y = Math.round(data.y + window.scrollY);

            this.gazeData.push({
              x: x,
              y: y,
              timestamp: clock,
              scrollX: window.scrollX,
              scrollY: window.scrollY,
              page: window.location.pathname,
            });

            if (this.gazeData.length % 200 === 0) {
              this.saveState();
            }

            if (this.heatmapInstance) {
              this.heatmapInstance.addData({
                x: Math.round(data.x),
                y: Math.round(data.y),
                value: 1,
              });
            }
          }
        });

        this.isInitialized = true;
        return true;
      } catch (e) {
        console.error("Error al reconectar WebGazer:", e);
      }
    }

    try {
      // Configurar WebGazer por primera vez
      webgazer
        .setGazeListener((data, clock) => {
          if (data && this.isTracking) {
            const x = Math.round(data.x + window.scrollX);
            const y = Math.round(data.y + window.scrollY);

            this.gazeData.push({
              x: x,
              y: y,
              timestamp: clock,
              scrollX: window.scrollX,
              scrollY: window.scrollY,
              page: window.location.pathname,
            });

            if (this.gazeData.length % 200 === 0) {
              this.saveState();
            }

            if (this.heatmapInstance) {
              this.heatmapInstance.addData({
                x: Math.round(data.x),
                y: Math.round(data.y),
                value: 1,
              });
            }
          }
        })
        .saveDataAcrossSessions(true)
        .showVideoPreview(false)
        .showPredictionPoints(this.isCalibrating);

      await webgazer.begin();

      // Marcar que WebGazer está corriendo
      localStorage.setItem("webgazer_running", "true");

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error al inicializar WebGazer:", error);
      alert("Error al inicializar la cámara: " + error.message);
      return false;
    }
  }

  // Iniciar calibración
  startCalibration() {
    if (!this.isInitialized) {
      alert("Primero debes iniciar la cámara");
      return;
    }

    this.isCalibrating = true;
    webgazer.showPredictionPoints(true);
    alert(
      "Calibración iniciada. Mira los puntos rojos que aparecen en pantalla y haz click en ellos."
    );
  }

  // Detener calibración
  stopCalibration() {
    this.isCalibrating = false;
    webgazer.showPredictionPoints(false);
    alert("Calibración completada. Ya puedes iniciar el tracking.");
  }

  // Inicializar el heatmap (invisible, solo para captura)
  initHeatmap() {
    if (!this.checkLibraries()) {
      return false;
    }

    // Crear canvas oculto para el heatmap
    const heatmapContainer = document.getElementById("heatmap-container");
    if (!heatmapContainer) {
      console.error("Contenedor de heatmap no encontrado");
      return false;
    }

    try {
      // Configurar el contenedor con el tamaño completo del documento
      const fullWidth = Math.max(
        document.body.scrollWidth,
        document.body.getBoundingClientRect().width
      );
      const fullHeight = Math.max(
        document.body.scrollHeight,
        document.body.getBoundingClientRect().height
      );

      heatmapContainer.style.width = fullWidth + "px";
      heatmapContainer.style.height = fullHeight + "px";

      this.heatmapInstance = h337.create({
        container: heatmapContainer,
        radius: 50,
        maxOpacity: 0.6,
        minOpacity: 0,
        blur: 0.9,
        gradient: {
          0.0: "blue",
          0.5: "yellow",
          1.0: "red",
        },
      });

      return true;
    } catch (error) {
      console.error("Error al inicializar heatmap:", error);
      return false;
    }
  }

  // Iniciar tracking
  async startTracking() {
    if (!this.isInitialized) {
      alert("Primero debes iniciar la cámara");
      return;
    }

    if (!this.isTracking) {
      this.isTracking = true;
      // No limpiar gazeData aquí para mantener datos entre páginas

      // Capturar screenshot de la página al iniciar
      await this.capturePageScreenshot();

      if (!this.heatmapInstance) {
        const success = this.initHeatmap();
        if (!success) {
          this.isTracking = false;
          return;
        }
      }

      // Ocultar el punto de predicción durante el tracking
      webgazer.showPredictionPoints(false);

      // Guardar estado
      this.saveState();

      alert(
        "Tracking iniciado. Puedes navegar entre páginas. Los datos se mantendrán hasta que presiones 'Detener Tracking'."
      );
    }
  }

  // Detener tracking
  stopTracking() {
    this.isTracking = false;

    // Guardar estado final
    this.saveState();

    alert(
      `Tracking detenido. Total de puntos capturados: ${this.gazeData.length}`
    );
  }

  // Obtener lista de páginas visitadas
  getVisitedPages() {
    const pages = new Set();
    this.gazeData.forEach((point) => pages.add(point.page));
    return Array.from(pages);
  }

  // Generar y descargar heatmap superpuesto en la página con navegación automática
  async downloadHeatmap() {
    if (this.gazeData.length === 0) {
      alert("No hay datos de tracking para generar el heatmap");
      return;
    }

    const pages = this.getVisitedPages();

    const confirmMsg = `Se generarán heatmaps automáticamente para ${
      pages.length
    } página(s):\n${pages.join(
      "\n"
    )}\n\nEl navegador visitará cada página secuencialmente y generará los heatmaps.\n\n¿Continuar?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    // Guardar páginas pendientes en sessionStorage
    sessionStorage.setItem("eyetracker_pending_pages", JSON.stringify(pages));
    sessionStorage.setItem("eyetracker_generating_heatmaps", "true");

    // Navegar a la primera página
    window.location.href = pages[0];
  }

  // Procesar heatmap automático después de navegar
  async processAutomaticHeatmap() {
    const isGenerating = sessionStorage.getItem(
      "eyetracker_generating_heatmaps"
    );

    if (!isGenerating) return;

    const pendingPagesStr = sessionStorage.getItem("eyetracker_pending_pages");

    if (!pendingPagesStr) {
      sessionStorage.removeItem("eyetracker_generating_heatmaps");
      return;
    }

    const pendingPages = JSON.parse(pendingPagesStr);
    const currentPage = window.location.pathname;

    // Verificar si estamos en una de las páginas pendientes
    const currentIndex = pendingPages.indexOf(currentPage);

    if (currentIndex === -1) {
      sessionStorage.removeItem("eyetracker_generating_heatmaps");
      sessionStorage.removeItem("eyetracker_pending_pages");
      return;
    }

    // Esperar un momento para que la página se cargue completamente
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Filtrar datos solo de la página actual
    const currentPageData = this.gazeData.filter(
      (point) => point.page === currentPage
    );

    if (currentPageData.length === 0) {
      // Continuar con la siguiente página
      pendingPages.splice(currentIndex, 1);

      if (pendingPages.length > 0) {
        sessionStorage.setItem(
          "eyetracker_pending_pages",
          JSON.stringify(pendingPages)
        );
        window.location.href = pendingPages[0];
      } else {
        sessionStorage.removeItem("eyetracker_generating_heatmaps");
        sessionStorage.removeItem("eyetracker_pending_pages");
        alert("✓ Proceso completado");
      }
      return;
    }

    try {
      // Generar heatmap manualmente para esta página
      await this.generateHeatmapForPage(currentPage, currentPageData);

      // Eliminar la página actual de la lista
      pendingPages.splice(currentIndex, 1);

      if (pendingPages.length > 0) {
        // Actualizar la lista y navegar a la siguiente página
        sessionStorage.setItem(
          "eyetracker_pending_pages",
          JSON.stringify(pendingPages)
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        window.location.href = pendingPages[0];
      } else {
        // Terminamos, limpiar sessionStorage
        sessionStorage.removeItem("eyetracker_generating_heatmaps");
        sessionStorage.removeItem("eyetracker_pending_pages");
        alert("✓ Todos los heatmaps han sido generados exitosamente");
      }
    } catch (error) {
      console.error("Error al generar heatmap:", error);
      alert("Error al generar el heatmap: " + error.message);
      sessionStorage.removeItem("eyetracker_generating_heatmaps");
      sessionStorage.removeItem("eyetracker_pending_pages");
    }
  }

  // Generar heatmap para una página específica
  async generateHeatmapForPage(pagePath, pageData) {
    // Capturar screenshot actual de la página
    await this.capturePageScreenshot();

    // Crear un heatmap temporal con los datos de esta página
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.top = "0";
    tempContainer.style.left = "0";
    tempContainer.style.width = document.body.scrollWidth + "px";
    tempContainer.style.height = document.body.scrollHeight + "px";
    tempContainer.style.pointerEvents = "none";
    tempContainer.style.zIndex = "-9999";
    tempContainer.style.visibility = "hidden";
    document.body.appendChild(tempContainer);

    // Crear heatmap temporal
    const tempHeatmap = h337.create({
      container: tempContainer,
      radius: 50,
      maxOpacity: 0.6,
      minOpacity: 0,
      blur: 0.9,
      gradient: {
        0.0: "blue",
        0.5: "yellow",
        1.0: "red",
      },
    });

    // Añadir datos al heatmap temporal
    const heatmapData = pageData.map((point) => ({
      x: Math.round(point.x - point.scrollX),
      y: Math.round(point.y - point.scrollY),
      value: 1,
    }));

    tempHeatmap.setData({
      max: Math.max(10, Math.ceil(pageData.length / 100)),
      data: heatmapData,
    });

    // Esperar a que el heatmap se renderice
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Crear canvas para combinar screenshot + heatmap
    const canvas = document.createElement("canvas");
    const fullWidth = Math.max(
      document.body.scrollWidth,
      document.body.getBoundingClientRect().width
    );
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.body.getBoundingClientRect().height
    );

    canvas.width = fullWidth;
    canvas.height = fullHeight;
    const ctx = canvas.getContext("2d");

    // Dibujar el screenshot de fondo
    const bgImg = new Image();

    return new Promise((resolve, reject) => {
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, fullWidth, fullHeight);

        // Obtener el canvas del heatmap temporal
        const heatmapCanvas = tempContainer.querySelector("canvas");

        if (heatmapCanvas) {
          // Superponer el heatmap con transparencia
          ctx.globalAlpha = 0.6;
          ctx.drawImage(heatmapCanvas, 0, 0);
          ctx.globalAlpha = 1.0;
        }

        // Limpiar el contenedor temporal
        document.body.removeChild(tempContainer);

        // Descargar la imagen combinada
        const filename = `eyetracking-heatmap-${pagePath.replace(
          /\//g,
          "_"
        )}-${Date.now()}.png`;

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);

          resolve();
        }, "image/png");
      };

      bgImg.onerror = () => {
        document.body.removeChild(tempContainer);
        reject(new Error("Error al cargar screenshot"));
      };

      bgImg.src = this.screenshotData;
    });
  }

  // Restaurar estado al cargar página
  async restoreTrackingState() {
    // Si ya está inicializado, solo verificar estado de tracking
    if (this.isInitialized) {
      if (this.isTracking === true) {
        this.initHeatmap();
      }
      return true;
    }

    // Solo inicializar si está tracking o calibrando
    if (this.isTracking === true || this.isCalibrating === true) {
      const success = await this.init();

      if (success) {
        if (this.isTracking === true) {
          this.initHeatmap();
        }
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  // Limpiar datos
  clearData() {
    if (
      confirm(
        "¿Estás seguro de que quieres eliminar todos los datos de eye tracking?"
      )
    ) {
      if (this.heatmapInstance) {
        this.heatmapInstance.setData({ data: [], max: 1 });
      }
      this.gazeData = [];

      // Limpiar localStorage
      localStorage.removeItem("eyetracker_state");
      localStorage.removeItem("eyetracker_data");

      this.isTracking = false;
      this.isCalibrating = false;
      this.saveState();

      alert("Todos los datos han sido eliminados");
    }
  }

  // Exportar datos en formato CSV
  exportData() {
    if (this.gazeData.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    let csv = "x,y,timestamp,scrollX,scrollY,page\n";
    this.gazeData.forEach((point) => {
      csv += `${point.x},${point.y},${point.timestamp},${point.scrollX},${point.scrollY},${point.page}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eyetracking_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    alert(`Datos exportados: ${this.gazeData.length} puntos`);
  }

  // Detener completamente WebGazer
  end() {
    this.stopTracking();
    if (typeof webgazer !== "undefined") {
      webgazer.end();
    }
    this.isInitialized = false;
  }
}

// Instancia global (singleton)
let eyeTracker = null;

// Función para inicializar cuando todo esté listo
function initEyeTracker() {
  // SINGLETON: Solo crear instancia si no existe
  if (!eyeTracker) {
    eyeTracker = new EyeTracker();
  }

  // Función para actualizar el estado de los botones
  function updateButtonStates() {
    const btnInit = document.getElementById("btn-init-eyetracker");
    const btnStartCal = document.getElementById("btn-start-calibration");
    const btnStopCal = document.getElementById("btn-stop-calibration");
    const btnStart = document.getElementById("btn-start-tracking");
    const btnStop = document.getElementById("btn-stop-tracking");

    if (eyeTracker.isInitialized) {
      if (btnInit) {
        btnInit.textContent =
          btnInit.getAttribute("data-i18n") === "eyetracker.initCamera"
            ? i18n?.locale === "en"
              ? "Camera Active"
              : "Cámara Activa"
            : "Cámara Activa";
        btnInit.disabled = true;
      }
      btnStartCal?.removeAttribute("disabled");
      btnStart?.removeAttribute("disabled");
    }

    if (eyeTracker.isCalibrating) {
      btnStartCal?.setAttribute("disabled", "true");
      btnStopCal?.removeAttribute("disabled");
    } else {
      btnStopCal?.setAttribute("disabled", "true");
    }

    if (eyeTracker.isTracking) {
      btnStart?.setAttribute("disabled", "true");
      btnStop?.removeAttribute("disabled");
    } else {
      btnStop?.setAttribute("disabled", "true");
    }
  }

  // Restaurar estado al cargar la página
  async function restoreTrackingState() {
    const restored = await eyeTracker.restoreTrackingState();
    updateButtonStates();

    // Procesar heatmap automático si está en progreso
    if (restored || eyeTracker.isTracking) {
      await eyeTracker.processAutomaticHeatmap();
    }

    return restored;
  }

  restoreTrackingState();

  // Botón iniciar cámara
  const btnInit = document.getElementById("btn-init-eyetracker");
  if (btnInit) {
    btnInit.addEventListener("click", async () => {
      btnInit.disabled = true;
      const originalText = btnInit.textContent;
      btnInit.textContent =
        i18n?.locale === "en" ? "Starting..." : "Iniciando...";

      const success = await eyeTracker.init();

      if (success) {
        updateButtonStates();
        alert(
          i18n?.locale === "en"
            ? "Camera started. Now you can calibrate the system."
            : "Cámara iniciada. Ahora puedes calibrar el sistema."
        );
      } else {
        btnInit.disabled = false;
        btnInit.textContent = originalText;
      }
    });
  }

  // Botón iniciar calibración
  const btnStartCal = document.getElementById("btn-start-calibration");
  if (btnStartCal) {
    btnStartCal.addEventListener("click", () => {
      eyeTracker.startCalibration();
      eyeTracker.saveState();
      updateButtonStates();
    });
  }

  // Botón detener calibración
  const btnStopCal = document.getElementById("btn-stop-calibration");
  if (btnStopCal) {
    btnStopCal.addEventListener("click", () => {
      eyeTracker.stopCalibration();
      eyeTracker.saveState();
      updateButtonStates();
    });
  }

  // Botón iniciar tracking
  const btnStart = document.getElementById("btn-start-tracking");
  if (btnStart) {
    btnStart.addEventListener("click", async () => {
      await eyeTracker.startTracking();
      updateButtonStates();
    });
  }

  // Botón detener tracking
  const btnStop = document.getElementById("btn-stop-tracking");
  if (btnStop) {
    btnStop.addEventListener("click", () => {
      eyeTracker.stopTracking();
      updateButtonStates();
    });
  }

  // Botón descargar heatmap
  const btnDownload = document.getElementById("btn-download-heatmap");
  if (btnDownload) {
    btnDownload.addEventListener("click", async () => {
      await eyeTracker.downloadHeatmap();
    });
  }

  // Botón limpiar datos
  const btnClear = document.getElementById("btn-clear-data");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      eyeTracker.clearData();
    });
  }

  // Botón exportar datos CSV
  const btnExport = document.getElementById("btn-export-data");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      eyeTracker.exportData();
    });
  }

  // Guardar estado antes de salir de la página
  window.addEventListener("beforeunload", () => {
    if (eyeTracker) {
      eyeTracker.saveState();
    }
  });

  // Guardar estado periódicamente (cada 60 segundos si está tracking)
  setInterval(() => {
    if (eyeTracker && (eyeTracker.isTracking || eyeTracker.isCalibrating)) {
      eyeTracker.saveState();
    }
  }, 60000);
}

// Esperar a que el DOM y las librerías estén listas
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEyeTracker);
} else {
  initEyeTracker();
}
