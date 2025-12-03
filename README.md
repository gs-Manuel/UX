# Trabajo 1 - Sitio Web Personal

Sitio web personal de Manuel González Santos desarrollado con HTML5, CSS3 y recursos multimedia.

## 📋 Descripción

Este proyecto consiste en un sitio web personal estático compuesto por tres páginas HTML:

- **index.html** - Página "Sobre mí" con información personal y de contacto
- **intereses.html** - Página de intereses profesionales con contenido multimedia
- **proyectos.html** - Página de proyectos realizados

## 📁 Estructura del Proyecto

```
trabajo_1/
├── index.html           # Página principal "Sobre mí"
├── intereses.html       # Página de intereses
├── proyectos.html       # Página de proyectos
├── style.css            # Estilos CSS del sitio
├── img/                 # Recursos multimedia
│   ├── manuel.jpg       # Fotografía personal
│   ├── github-logo.jpg  # Logo de GitHub
│   ├── inetum-logo.png  # Logo de empresa
│   ├── oviedo.mp4       # Video en formato MP4
│   ├── oviedo.webm      # Video en formato WebM
│   └── oviedo.ogv       # Video en formato OGV
└── README.md            # Este archivo
```

## 🚀 Cómo Lanzar la Página Web

### Requisitos Previos

#### Instalar Node.js

Si no tienes **Node.js** instalado, descárgalo e instálalo:

1. **Windows:**

   - Descarga el instalador desde: https://nodejs.org/
   - Ejecuta el instalador y sigue las instrucciones
   - Verifica la instalación abriendo PowerShell y ejecutando:
     ```powershell
     node --version
     npm --version
     ```

2. **Alternativa con Chocolatey (Windows):**

   ```powershell
   choco install nodejs
   ```

3. **macOS:**

   ```bash
   brew install node
   ```

4. **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```

---

### Servidor HTTP con Node.js (serve)

Una vez tengas **Node.js** instalado:

```powershell
# Navegar a la carpeta del proyecto (usa la ruta relativa donde hayas descargado el proyecto)
cd trabajo_1

# Lanzar servidor con npx (no requiere instalación adicional)
npx serve .
```

El servidor se iniciará automáticamente (por defecto en puerto 3000).  
Abre tu navegador en: **http://localhost:3000**

Para especificar un puerto personalizado:

```powershell
npx serve . -l 8080
```

> 💡 **Nota:** `npx` viene incluido con Node.js, por lo que no necesitas instalar nada más. La primera vez que ejecutes `npx serve` puede tardar unos segundos mientras descarga el paquete temporalmente.
