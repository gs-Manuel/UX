// Mouse Tracker con Heatmaps para movimiento, clicks y scroll
class MouseTracker {
  constructor() {
    this.heatmapInstances = {
      movement: null,
      clicks: null,
      scroll: null,
    };
    this.screenshotData = null;

    // Bindings de métodos
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    // Cargar estado DEBE ser lo último
    this.loadState();
  }

  // Cargar estado desde localStorage
  loadState() {
    try {
      const savedState = localStorage.getItem("mousetracker_state");
      const savedMovement = localStorage.getItem("mousetracker_movement");
      const savedClicks = localStorage.getItem("mousetracker_clicks");
      const savedScroll = localStorage.getItem("mousetracker_scroll");

      // Cargar datos primero
      this.movementData = savedMovement ? JSON.parse(savedMovement) : [];
      this.clicksData = savedClicks ? JSON.parse(savedClicks) : [];
      this.scrollData = savedScroll ? JSON.parse(savedScroll) : [];

      // Cargar estado de tracking AL FINAL
      if (savedState) {
        const state = JSON.parse(savedState);
        this.isTracking = state.isTracking === true; // Forzar comparación estricta
      } else {
        this.isTracking = false;
      }

      console.log(
        `[MouseTracker] Datos cargados - Movimientos: ${this.movementData.length}, Clicks: ${this.clicksData.length}, Scroll: ${this.scrollData.length}, Tracking: ${this.isTracking}`
      );
    } catch (error) {
      console.error("Error al cargar estado:", error);
      this.movementData = [];
      this.clicksData = [];
      this.scrollData = [];
      this.isTracking = false;
    }
  }

  // Guardar estado en localStorage
  saveState() {
    try {
      const state = {
        isTracking: this.isTracking,
        timestamp: Date.now(),
      };

      localStorage.setItem("mousetracker_state", JSON.stringify(state));
      localStorage.setItem(
        "mousetracker_movement",
        JSON.stringify(this.movementData)
      );
      localStorage.setItem(
        "mousetracker_clicks",
        JSON.stringify(this.clicksData)
      );
      localStorage.setItem(
        "mousetracker_scroll",
        JSON.stringify(this.scrollData)
      );

      console.log(
        `[MouseTracker] Estado guardado - Tracking: ${this.isTracking}`
      );
    } catch (error) {
      console.error("Error al guardar estado:", error);

      // Si falla por tamaño, limpiar datos antiguos
      if (error.name === "QuotaExceededError") {
        console.warn(
          "[MouseTracker] localStorage lleno, limpiando datos antiguos..."
        );
        // Mantener solo los últimos 500 puntos de cada tipo
        this.movementData = this.movementData.slice(-500);
        this.clicksData = this.clicksData.slice(-100);
        this.scrollData = this.scrollData.slice(-100);

        // Reintentar guardar
        try {
          localStorage.setItem("mousetracker_state", JSON.stringify(state));
          localStorage.setItem(
            "mousetracker_movement",
            JSON.stringify(this.movementData)
          );
          localStorage.setItem(
            "mousetracker_clicks",
            JSON.stringify(this.clicksData)
          );
          localStorage.setItem(
            "mousetracker_scroll",
            JSON.stringify(this.scrollData)
          );
        } catch (e) {
          console.error(
            "[MouseTracker] No se pudo guardar después de limpiar:",
            e
          );
        }
      }
    }
  }

  // Iniciar tracking
  startTracking() {
    if (this.isTracking) {
      alert("El tracking ya está activo");
      return;
    }

    this.isTracking = true;

    // Agregar event listeners
    document.addEventListener("mousemove", this.handleMouseMove, {
      passive: true,
    });
    document.addEventListener("click", this.handleClick, { passive: true });
    window.addEventListener("scroll", this.handleScroll, { passive: true });

    this.saveState();

    alert(
      "Tracking de ratón iniciado. Navega entre páginas libremente.\nLos datos se mantendrán hasta que presiones 'Detener Mouse Tracking'."
    );
  }

  // Detener tracking
  stopTracking() {
    if (!this.isTracking) {
      alert("El tracking no está activo");
      return;
    }

    this.isTracking = false;

    // Remover event listeners
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("click", this.handleClick);
    window.removeEventListener("scroll", this.handleScroll);

    this.saveState();

    console.log(
      `Datos capturados - Movimientos: ${this.movementData.length}, Clicks: ${this.clicksData.length}, Scroll: ${this.scrollData.length}`
    );
    alert(
      `Tracking detenido.\nMovimientos: ${this.movementData.length}\nClicks: ${this.clicksData.length}\nScroll: ${this.scrollData.length}`
    );
  }

  // Handler para movimiento del ratón
  handleMouseMove(event) {
    if (!this.isTracking) return;

    const dataPoint = {
      x: event.pageX,
      y: event.pageY,
      timestamp: Date.now(),
      pathname: window.location.pathname,
    };

    this.movementData.push(dataPoint);

    // Guardar cada 100 puntos para no sobrecargar
    if (this.movementData.length % 100 === 0) {
      this.saveState();
    }
  }

  // Handler para clicks
  handleClick(event) {
    if (!this.isTracking) return;

    const dataPoint = {
      x: event.pageX,
      y: event.pageY,
      timestamp: Date.now(),
      pathname: window.location.pathname,
      target: event.target.tagName,
      targetId: event.target.id || null,
    };

    this.clicksData.push(dataPoint);
    this.saveState();
  }

  // Handler para scroll
  handleScroll() {
    if (!this.isTracking) return;

    const dataPoint = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset,
      timestamp: Date.now(),
      pathname: window.location.pathname,
    };

    this.scrollData.push(dataPoint);

    // Guardar cada 20 eventos de scroll
    if (this.scrollData.length % 20 === 0) {
      this.saveState();
    }
  }

  // Capturar screenshot de la página
  capturePageScreenshot() {
    return new Promise((resolve) => {
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

  // Inicializar heatmap para un tipo específico
  initHeatmap(type, data) {
    const container = document.getElementById("heatmap-container");
    if (!container) {
      console.error("Contenedor de heatmap no encontrado");
      return null;
    }

    // Limpiar contenedor
    container.innerHTML = "";
    container.style.display = "block";

    const fullWidth = Math.max(
      document.body.scrollWidth,
      document.body.getBoundingClientRect().width
    );
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.body.getBoundingClientRect().height
    );

    container.style.width = fullWidth + "px";
    container.style.height = fullHeight + "px";

    // Configuración específica según el tipo
    const configs = {
      movement: {
        radius: 40,
        maxOpacity: 0.7,
        minOpacity: 0,
        blur: 0.75,
        gradient: {
          0.0: "blue",
          0.5: "green",
          1.0: "yellow",
        },
      },
      clicks: {
        radius: 60,
        maxOpacity: 1.0,
        minOpacity: 0.3,
        blur: 0.5,
        gradient: {
          0.0: "rgba(255, 255, 0, 0)",
          0.5: "rgba(255, 255, 0, 0.8)",
          1.0: "rgba(255, 255, 0, 1)",
        },
      },
      scroll: {
        radius: 60,
        maxOpacity: 0.7,
        minOpacity: 0,
        blur: 0.85,
        gradient: {
          0.0: "purple",
          0.5: "pink",
          1.0: "red",
        },
      },
    };

    const config = configs[type];
    const heatmap = h337.create({
      container: container,
      ...config,
    });

    // Filtrar datos para la página actual
    const currentPath = window.location.pathname;
    const filteredData = data.filter((point) => point.pathname === currentPath);

    if (filteredData.length > 0) {
      // Preparar datos para heatmap
      const heatmapData = filteredData.map((point) => ({
        x: Math.round(point.x),
        y: Math.round(point.y),
        value: 1,
      }));

      heatmap.setData({
        max: Math.max(10, Math.ceil(filteredData.length / 100)),
        data: heatmapData,
      });
    }

    return heatmap;
  }

  // Descargar heatmap de movimiento para todas las páginas
  async downloadMovementHeatmap() {
    if (this.movementData.length === 0) {
      alert("No hay datos de movimiento del ratón");
      return;
    }

    await this.downloadHeatmapForAllPages(
      "movement",
      this.movementData,
      "mouse-movement-heatmap"
    );
  }

  // Descargar heatmap de clicks para todas las páginas
  async downloadClicksHeatmap() {
    if (this.clicksData.length === 0) {
      alert("No hay datos de clicks");
      return;
    }

    await this.downloadHeatmapForAllPages(
      "clicks",
      this.clicksData,
      "mouse-clicks-heatmap"
    );
  }

  // Descargar heatmap de scroll para todas las páginas
  async downloadScrollHeatmap() {
    if (this.scrollData.length === 0) {
      alert("No hay datos de scroll");
      return;
    }

    // Los datos de scroll necesitan ser convertidos a posiciones en la página
    const scrollPositions = this.scrollData.map((point) => ({
      x: window.innerWidth / 2, // Centro horizontal
      y: point.y + window.innerHeight / 2, // Posición vertical del scroll
      timestamp: point.timestamp,
      pathname: point.pathname,
    }));

    await this.downloadHeatmapForAllPages(
      "scroll",
      scrollPositions,
      "scroll-heatmap"
    );
  }

  // Descargar heatmap para todas las páginas visitadas con navegación automática
  async downloadHeatmapForAllPages(type, data, baseFilename) {
    const pages = this.getVisitedPages();

    if (pages.length === 0) {
      alert("No hay páginas visitadas");
      return;
    }

    const confirmMsg = `Se generarán heatmaps automáticamente para ${
      pages.length
    } página(s):\n${pages.join(
      "\n"
    )}\n\nEl navegador visitará cada página secuencialmente y generará los heatmaps.\n\n¿Continuar?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    // Guardar páginas pendientes en sessionStorage
    sessionStorage.setItem("mousetracker_pending_pages", JSON.stringify(pages));
    sessionStorage.setItem("mousetracker_heatmap_type", type);
    sessionStorage.setItem("mousetracker_base_filename", baseFilename);
    sessionStorage.setItem("mousetracker_generating_heatmaps", "true");

    // Navegar a la primera página
    window.location.href = pages[0];
  }

  // Procesar heatmap automático después de navegar
  async processAutomaticHeatmap() {
    const isGenerating = sessionStorage.getItem(
      "mousetracker_generating_heatmaps"
    );

    if (!isGenerating) return;

    const pendingPagesStr = sessionStorage.getItem(
      "mousetracker_pending_pages"
    );
    const type = sessionStorage.getItem("mousetracker_heatmap_type");
    const baseFilename = sessionStorage.getItem("mousetracker_base_filename");

    if (!pendingPagesStr) {
      sessionStorage.removeItem("mousetracker_generating_heatmaps");
      return;
    }

    const pendingPages = JSON.parse(pendingPagesStr);
    const currentPage = window.location.pathname;

    // Verificar si estamos en una de las páginas pendientes
    const currentIndex = pendingPages.indexOf(currentPage);

    if (currentIndex === -1) {
      // No estamos en una página de la lista, saltar
      sessionStorage.removeItem("mousetracker_generating_heatmaps");
      sessionStorage.removeItem("mousetracker_pending_pages");
      sessionStorage.removeItem("mousetracker_heatmap_type");
      sessionStorage.removeItem("mousetracker_base_filename");
      return;
    }

    // Esperar un momento para que la página se cargue completamente
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Obtener datos según el tipo
    let dataToUse;
    if (type === "movement") {
      dataToUse = this.movementData;
    } else if (type === "clicks") {
      dataToUse = this.clicksData;
    } else if (type === "scroll") {
      dataToUse = this.scrollData.map((point) => ({
        x: window.innerWidth / 2,
        y: point.y + window.innerHeight / 2,
        timestamp: point.timestamp,
        pathname: point.pathname,
      }));
    }

    // Generar heatmap para la página actual
    const filename = `${baseFilename}-${currentPage.replace(/\//g, "_")}.png`;
    await this.downloadHeatmapForType(type, dataToUse, filename);

    // Eliminar la página actual de la lista
    pendingPages.splice(currentIndex, 1);

    if (pendingPages.length > 0) {
      // Actualizar la lista y navegar a la siguiente página
      sessionStorage.setItem(
        "mousetracker_pending_pages",
        JSON.stringify(pendingPages)
      );
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Esperar a que se complete la descarga
      window.location.href = pendingPages[0];
    } else {
      // Terminamos, limpiar sessionStorage
      sessionStorage.removeItem("mousetracker_generating_heatmaps");
      sessionStorage.removeItem("mousetracker_pending_pages");
      sessionStorage.removeItem("mousetracker_heatmap_type");
      sessionStorage.removeItem("mousetracker_base_filename");
      alert("✓ Todos los heatmaps han sido generados exitosamente");
    }
  }

  // Descargar heatmap combinado (todos los tipos)
  async downloadCombinedHeatmap() {
    if (
      this.movementData.length === 0 &&
      this.clicksData.length === 0 &&
      this.scrollData.length === 0
    ) {
      alert("No hay datos para generar heatmap combinado");
      return;
    }

    try {
      await this.capturePageScreenshot();

      const canvas = document.createElement("canvas");
      const bodyRect = document.body.getBoundingClientRect();
      const fullWidth = Math.max(document.body.scrollWidth, bodyRect.width);
      const fullHeight = Math.max(document.body.scrollHeight, bodyRect.height);

      canvas.width = fullWidth;
      canvas.height = fullHeight;
      const ctx = canvas.getContext("2d");

      // Dibujar screenshot de fondo
      const bgImage = new Image();
      bgImage.onload = async () => {
        ctx.drawImage(bgImage, 0, 0, fullWidth, fullHeight);

        // Generar y superponer cada tipo de heatmap con transparencia
        await this.overlayHeatmap(
          ctx,
          "movement",
          this.movementData,
          fullWidth,
          fullHeight,
          0.5
        );
        await this.overlayHeatmap(
          ctx,
          "clicks",
          this.clicksData,
          fullWidth,
          fullHeight,
          0.6
        );

        const scrollPositions = this.scrollData.map((point) => ({
          x: window.innerWidth / 2,
          y: point.y + window.innerHeight / 2,
          timestamp: point.timestamp,
          pathname: point.pathname,
        }));
        await this.overlayHeatmap(
          ctx,
          "scroll",
          scrollPositions,
          fullWidth,
          fullHeight,
          0.5
        );

        // Descargar imagen combinada
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `mouse-tracking-combined-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);

          // Ocultar contenedor
          const container = document.getElementById("heatmap-container");
          if (container) {
            container.style.display = "none";
          }

          alert("Heatmap combinado descargado exitosamente");
        });
      };
      bgImage.src = this.screenshotData;
    } catch (error) {
      console.error("Error al generar heatmap combinado:", error);
      alert("Error al generar el heatmap combinado");
    }
  }

  // Superponer un heatmap en el canvas con transparencia
  async overlayHeatmap(ctx, type, data, width, height, alpha) {
    return new Promise((resolve) => {
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.top = "0";
      tempContainer.style.left = "0";
      tempContainer.style.width = width + "px";
      tempContainer.style.height = height + "px";
      tempContainer.style.pointerEvents = "none";
      tempContainer.style.zIndex = "-1";
      document.body.appendChild(tempContainer);

      const configs = {
        movement: {
          radius: 40,
          maxOpacity: 0.7,
          blur: 0.75,
          gradient: { 0.0: "blue", 0.5: "green", 1.0: "yellow" },
        },
        clicks: {
          radius: 60,
          maxOpacity: 1.0,
          blur: 0.5,
          gradient: {
            0.0: "rgba(255, 255, 0, 0)",
            0.5: "rgba(255, 255, 0, 0.8)",
            1.0: "rgba(255, 255, 0, 1)",
          },
        },
        scroll: {
          radius: 60,
          maxOpacity: 0.7,
          blur: 0.85,
          gradient: { 0.0: "purple", 0.5: "pink", 1.0: "red" },
        },
      };

      const config = configs[type];
      const heatmap = h337.create({ container: tempContainer, ...config });

      const currentPath = window.location.pathname;
      const filteredData = data.filter(
        (point) => point.pathname === currentPath
      );

      if (filteredData.length > 0) {
        const heatmapData = filteredData.map((point) => ({
          x: Math.round(point.x),
          y: Math.round(point.y),
          value: 1,
        }));

        heatmap.setData({
          max: Math.max(10, Math.ceil(filteredData.length / 100)),
          data: heatmapData,
        });
      }

      setTimeout(() => {
        const heatmapCanvas = tempContainer.querySelector("canvas");
        if (heatmapCanvas) {
          ctx.globalAlpha = alpha;
          ctx.drawImage(heatmapCanvas, 0, 0, width, height);
          ctx.globalAlpha = 1.0;
        }
        document.body.removeChild(tempContainer);
        resolve();
      }, 100);
    });
  }

  // Función genérica para descargar heatmap por tipo
  async downloadHeatmapForType(type, data, filename) {
    try {
      await this.capturePageScreenshot();

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

      const bgImage = new Image();
      bgImage.onload = () => {
        ctx.drawImage(bgImage, 0, 0, fullWidth, fullHeight);

        const heatmap = this.initHeatmap(type, data);
        if (!heatmap) {
          alert("Error al generar el heatmap");
          return;
        }

        setTimeout(() => {
          const heatmapCanvas = document.querySelector(
            "#heatmap-container canvas"
          );
          if (heatmapCanvas) {
            ctx.drawImage(heatmapCanvas, 0, 0, fullWidth, fullHeight);
          }

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

            const container = document.getElementById("heatmap-container");
            if (container) {
              container.style.display = "none";
            }

            alert(`Heatmap de ${type} descargado exitosamente`);
          });
        }, 500);
      };
      bgImage.src = this.screenshotData;
    } catch (error) {
      console.error(`Error al generar heatmap de ${type}:`, error);
      alert(`Error al generar el heatmap de ${type}`);
    }
  }

  // Obtener lista de páginas visitadas
  getVisitedPages() {
    const pages = new Set();

    this.movementData.forEach((point) => pages.add(point.pathname));
    this.clicksData.forEach((point) => pages.add(point.pathname));
    this.scrollData.forEach((point) => pages.add(point.pathname));

    return Array.from(pages);
  }

  // Mostrar estadísticas de páginas visitadas
  showPageStats() {
    const pages = this.getVisitedPages();

    if (pages.length === 0) {
      alert("No hay datos de tracking disponibles");
      return;
    }

    let stats = "📊 PÁGINAS VISITADAS DURANTE EL TRACKING:\n\n";

    pages.forEach((page) => {
      const movements = this.movementData.filter(
        (p) => p.pathname === page
      ).length;
      const clicks = this.clicksData.filter((p) => p.pathname === page).length;
      const scrolls = this.scrollData.filter((p) => p.pathname === page).length;

      stats += `📄 ${page}\n`;
      stats += `   Movimientos: ${movements}\n`;
      stats += `   Clicks: ${clicks}\n`;
      stats += `   Scrolls: ${scrolls}\n\n`;
    });

    alert(stats);
  }

  // Descargar heatmaps de todas las páginas visitadas
  async downloadAllPagesHeatmaps() {
    const pages = this.getVisitedPages();

    if (pages.length === 0) {
      alert("No hay datos para generar heatmaps");
      return;
    }

    const currentPage = window.location.pathname;
    let message = `Se detectaron ${pages.length} página(s) visitada(s):\n\n`;
    pages.forEach((page) => (message += `• ${page}\n`));
    message += `\n⚠️ Solo puedes generar el heatmap de la página actual: ${currentPage}\n\n`;
    message +=
      "Para generar heatmaps de otras páginas, navega a ellas y descarga el heatmap desde allí.";

    alert(message);
  }

  // Exportar datos a CSV
  exportToCSV() {
    const types = ["movement", "clicks", "scroll"];
    const data = {
      movement: this.movementData,
      clicks: this.clicksData,
      scroll: this.scrollData,
    };

    types.forEach((type) => {
      if (data[type].length === 0) return;

      let csv = "Tipo,X,Y,Timestamp,Pathname";
      if (type === "clicks") {
        csv += ",Target,TargetId";
      }
      csv += "\n";

      data[type].forEach((point) => {
        let row = `${type},${point.x},${point.y},${point.timestamp},${point.pathname}`;
        if (type === "clicks") {
          row += `,${point.target || ""},${point.targetId || ""}`;
        }
        csv += row + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mouse-${type}-data.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });

    alert("Datos exportados a CSV exitosamente");
  }

  // Restaurar estado al cargar página
  restoreTrackingState() {
    console.log(
      `[MouseTracker] Verificando estado: isTracking=${this.isTracking}`
    );

    if (this.isTracking === true) {
      // Remover cualquier listener previo para evitar duplicados
      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("click", this.handleClick);
      window.removeEventListener("scroll", this.handleScroll);

      // Agregar event listeners
      document.addEventListener("mousemove", this.handleMouseMove, {
        passive: true,
      });
      document.addEventListener("click", this.handleClick, { passive: true });
      window.addEventListener("scroll", this.handleScroll, { passive: true });

      console.log(
        `[MouseTracker] Datos actuales - Movimientos: ${this.movementData.length}, Clicks: ${this.clicksData.length}, Scroll: ${this.scrollData.length}`
      );
    } else {
    }
  }

  // Limpiar todos los datos
  clearAllData() {
    if (
      confirm(
        "¿Estás seguro de que quieres eliminar todos los datos de tracking?"
      )
    ) {
      this.movementData = [];
      this.clicksData = [];
      this.scrollData = [];

      // Limpiar localStorage
      localStorage.removeItem("mousetracker_state");
      localStorage.removeItem("mousetracker_movement");
      localStorage.removeItem("mousetracker_clicks");
      localStorage.removeItem("mousetracker_scroll");

      this.isTracking = false;
      this.saveState();
      alert("Todos los datos han sido eliminados");
    }
  }
}

// Inicializar MouseTracker
let mouseTracker = null;

function initMouseTracker() {
  if (!mouseTracker) {
    mouseTracker = new MouseTracker();

    // Restaurar estado si estaba activo
    mouseTracker.restoreTrackingState();

    // Procesar heatmap automático si está en progreso
    mouseTracker.processAutomaticHeatmap();

    // Guardar estado antes de salir de la página
    window.addEventListener("beforeunload", () => {
      if (mouseTracker.isTracking) {
        mouseTracker.saveState();
      }
    });

    // Guardar estado periódicamente (cada 30 segundos si está tracking)
    setInterval(() => {
      if (mouseTracker && mouseTracker.isTracking) {
        mouseTracker.saveState();
      }
    }, 30000);
  }

  return mouseTracker;
}

// Inicializar al cargar la página - múltiples puntos de entrada para mayor confiabilidad
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMouseTracker);
} else {
  initMouseTracker();
}

// Backup: inicializar después de que todo esté cargado
window.addEventListener("load", () => {
  if (!mouseTracker) {
    initMouseTracker();
  }
});
