// Eye Tracker con WebGazer y Heatmap
class EyeTracker {
  constructor() {
    // Cargar estado y datos desde localStorage
    this.loadState();
    this.heatmapInstance = null;
    this.isInitialized = false;
    this.canvas = null;
    this.ctx = null;
    this.screenshotData = null;
  }

  // Cargar estado desde localStorage
  loadState() {
    try {
      const savedState = localStorage.getItem("eyetracker_state");
      const savedData = localStorage.getItem("eyetracker_data");

      if (savedState) {
        const state = JSON.parse(savedState);
        this.isTracking = state.isTracking || false;
        this.isCalibrating = state.isCalibrating || false;
      } else {
        this.isTracking = false;
        this.isCalibrating = false;
      }

      if (savedData) {
        this.gazeData = JSON.parse(savedData);
        console.log(`Datos cargados: ${this.gazeData.length} puntos`);
      } else {
        this.gazeData = [];
      }
    } catch (error) {
      console.error("Error al cargar estado:", error);
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
      };
      localStorage.setItem("eyetracker_state", JSON.stringify(state));
      localStorage.setItem("eyetracker_data", JSON.stringify(this.gazeData));
    } catch (error) {
      console.error("Error al guardar estado:", error);
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
        html2canvas(document.body, {
          allowTaint: true,
          useCORS: true,
          scrollY: -window.scrollY,
          scrollX: -window.scrollX,
          windowWidth: document.documentElement.scrollWidth,
          windowHeight: document.documentElement.scrollHeight,
        }).then((canvas) => {
          this.screenshotData = canvas.toDataURL("image/png");
          resolve(canvas);
        });
      } else {
        // Fallback: crear canvas con el tamaño de la página
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(
          document.documentElement.scrollWidth,
          window.innerWidth
        );
        canvas.height = Math.max(
          document.documentElement.scrollHeight,
          window.innerHeight
        );
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

    try {
      console.log("Iniciando WebGazer...");

      // Configurar WebGazer
      webgazer
        .setGazeListener((data, clock) => {
          if (data && this.isTracking) {
            // Ajustar coordenadas considerando el scroll
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

            // Guardar datos periódicamente (cada 50 puntos)
            if (this.gazeData.length % 50 === 0) {
              this.saveState();
            }

            // Actualizar heatmap en tiempo real (solo para visualización)
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
        .showVideoPreview(true)
        .showPredictionPoints(this.isCalibrating);

      await webgazer.begin();

      this.isInitialized = true;
      console.log("WebGazer iniciado correctamente");
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
    console.log("Calibración iniciada");
    alert(
      "Calibración iniciada. Mira los puntos rojos que aparecen en pantalla y haz click en ellos."
    );
  }

  // Detener calibración
  stopCalibration() {
    this.isCalibrating = false;
    webgazer.showPredictionPoints(false);
    console.log("Calibración completada");
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
        document.documentElement.scrollWidth,
        window.innerWidth
      );
      const fullHeight = Math.max(
        document.documentElement.scrollHeight,
        window.innerHeight
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

      console.log("Heatmap inicializado correctamente");
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

      console.log("Tracking iniciado");
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

    console.log("Tracking detenido");
    console.log(`Puntos capturados: ${this.gazeData.length}`);
    alert(
      `Tracking detenido. Total de puntos capturados: ${this.gazeData.length}`
    );
  }

  // Generar y descargar heatmap superpuesto en la página
  async downloadHeatmap() {
    if (this.gazeData.length === 0) {
      alert("No hay datos de tracking para generar el heatmap");
      return;
    }

    try {
      // Capturar screenshot actual de la página
      await this.capturePageScreenshot();

      // Crear canvas para combinar screenshot + heatmap
      const canvas = document.createElement("canvas");
      const fullWidth = Math.max(
        document.documentElement.scrollWidth,
        window.innerWidth
      );
      const fullHeight = Math.max(
        document.documentElement.scrollHeight,
        window.innerHeight
      );

      canvas.width = fullWidth;
      canvas.height = fullHeight;
      const ctx = canvas.getContext("2d");

      // Dibujar el screenshot de fondo
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0);

        // Obtener el canvas del heatmap
        const heatmapCanvas = this.heatmapInstance._renderer.canvas;

        // Superponer el heatmap con transparencia
        ctx.globalAlpha = 0.6;
        ctx.drawImage(heatmapCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Descargar la imagen combinada
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `heatmap_${new Date().getTime()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          alert("Heatmap descargado correctamente");
        }, "image/png");
      };
      bgImg.src = this.screenshotData;
    } catch (error) {
      console.error("Error al generar heatmap:", error);
      alert("Error al generar el heatmap: " + error.message);
    }
  }

  // Limpiar datos
  clearData() {
    if (this.heatmapInstance) {
      this.heatmapInstance.setData({ data: [], max: 1 });
    }
    this.gazeData = [];

    // Limpiar localStorage
    this.saveState();

    console.log("Datos limpiados");
    alert("Todos los datos han sido limpiados");
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

// Instancia global
let eyeTracker = null;

// Función para inicializar cuando todo esté listo
function initEyeTracker() {
  console.log("Inicializando Eye Tracker...");
  eyeTracker = new EyeTracker();

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

  // Si el tracking estaba activo, reiniciar automáticamente
  async function restoreTrackingState() {
    if (eyeTracker.isTracking || eyeTracker.isCalibrating) {
      console.log("Restaurando sesión de eye tracking...");
      const success = await eyeTracker.init();
      if (success) {
        updateButtonStates();
        console.log(
          `Sesión restaurada. Puntos acumulados: ${eyeTracker.gazeData.length}`
        );

        // Reiniciar el heatmap si hay datos previos
        if (eyeTracker.gazeData.length > 0 && eyeTracker.isTracking) {
          eyeTracker.initHeatmap();
          // Repoblar el heatmap con datos existentes de la página actual
          const currentPage = window.location.pathname;
          eyeTracker.gazeData
            .filter((point) => point.page === currentPage)
            .forEach((point) => {
              if (eyeTracker.heatmapInstance) {
                eyeTracker.heatmapInstance.addData({
                  x: point.x - point.scrollX,
                  y: point.y - point.scrollY,
                  value: 1,
                });
              }
            });
        }
      }
    } else {
      updateButtonStates();
    }
  }

  // Restaurar estado al cargar la página
  restoreTrackingState();

  // Botón iniciar cámara
  const btnInit = document.getElementById("btn-init-eyetracker");
  if (btnInit) {
    btnInit.addEventListener("click", async () => {
      console.log("Click en iniciar cámara");
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
      console.log("Click en iniciar calibración");
      eyeTracker.startCalibration();
      eyeTracker.saveState();
      updateButtonStates();
    });
  }

  // Botón detener calibración
  const btnStopCal = document.getElementById("btn-stop-calibration");
  if (btnStopCal) {
    btnStopCal.addEventListener("click", () => {
      console.log("Click en detener calibración");
      eyeTracker.stopCalibration();
      eyeTracker.saveState();
      updateButtonStates();
    });
  }

  // Botón iniciar tracking
  const btnStart = document.getElementById("btn-start-tracking");
  if (btnStart) {
    btnStart.addEventListener("click", async () => {
      console.log("Click en iniciar tracking");
      await eyeTracker.startTracking();
      updateButtonStates();
    });
  }

  // Botón detener tracking
  const btnStop = document.getElementById("btn-stop-tracking");
  if (btnStop) {
    btnStop.addEventListener("click", () => {
      console.log("Click en detener tracking");
      eyeTracker.stopTracking();
      updateButtonStates();
    });
  }

  // Botón descargar heatmap
  const btnDownload = document.getElementById("btn-download-heatmap");
  if (btnDownload) {
    btnDownload.addEventListener("click", async () => {
      console.log("Click en descargar heatmap");
      await eyeTracker.downloadHeatmap();
    });
  }

  // Botón limpiar datos
  const btnClear = document.getElementById("btn-clear-data");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      console.log("Click en limpiar datos");
      eyeTracker.clearData();
    });
  }

  // Botón exportar datos CSV
  const btnExport = document.getElementById("btn-export-data");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      console.log("Click en exportar datos");
      eyeTracker.exportData();
    });
  }

  console.log("Eye Tracker configurado correctamente");

  // Guardar estado antes de salir de la página
  window.addEventListener("beforeunload", () => {
    if (eyeTracker) {
      eyeTracker.saveState();
      console.log("Estado guardado antes de cambiar de página");
    }
  });
}

// Esperar a que el DOM y las librerías estén listas
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEyeTracker);
} else {
  initEyeTracker();
}
