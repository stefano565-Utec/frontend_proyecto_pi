import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background: linear-gradient(135deg, #FEFCF3 0%, #F5F5F5 100%);
  background-attachment: fixed;
  overflow-x: hidden;
  min-height: 100vh;
}

#root {
  width: 100%;
  min-height: 100vh;
}

/* Mejorar la apariencia de los tabs en web */
@media (min-width: 768px) {
  /* Estilos para desktop */
  body {
    background: linear-gradient(135deg, #FEFCF3 0%, #F5F5F5 100%);
    background-attachment: fixed;
  }
  
  /* Mejorar headers con gradiente sutil */
  [role="banner"] {
    background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%) !important;
  }
  
  /* Asegurar que los tabs se vean bien en desktop */
  [role="tablist"] {
    background-color: #FFFFFF !important;
    border-top: 1px solid #E0E0E0 !important;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05) !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 100 !important;
  }

  /* Ocultar el triángulo/indicador de tabs en web */
  [role="tablist"]::before,
  [role="tablist"]::after {
    display: none !important;
  }

  /* Ocultar cualquier indicador de triángulo */
  [role="tablist"] > *::before,
  [role="tablist"] > *::after,
  [role="tab"]::before,
  [role="tab"]::after {
    display: none !important;
    content: none !important;
  }

  /* Estilos para los tabs individuales */
  [role="tab"] {
    border: none !important;
    background: transparent !important;
    padding: 12px 16px !important;
    min-height: 60px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }

  [role="tab"]:hover {
    background-color: #F5F5F5 !important;
  }

  /* Ocultar cualquier elemento decorativo de triángulo (pero mantener los iconos) */
  [role="tablist"] [class*="triangle"],
  [role="tablist"] [class*="indicator"]:not([class*="icon"]),
  [role="tablist"] [class*="arrow"]:not([class*="icon"]),
  [role="tablist"] [aria-label*="indicator"],
  [role="tablist"] [data-testid*="indicator"] {
    display: none !important;
    visibility: hidden !important;
  }
  
  /* Ocultar SVG que sean solo decorativos (triángulos), pero mantener iconos */
  [role="tablist"] svg:not([class*="icon"]):not([class*="FontAwesome"]) {
    /* Solo ocultar si no tiene clases relacionadas con iconos */
    display: none !important;
  }

  /* Ocultar cualquier pseudo-elemento que pueda ser el triángulo */
  [role="tablist"] *::before,
  [role="tablist"] *::after {
    display: none !important;
    content: none !important;
    visibility: hidden !important;
  }

  /* Asegurar que no haya elementos flotantes o posicionados que sean triángulos */
  [role="tablist"] > * {
    position: relative !important;
  }

  [role="tablist"] > * > *::before,
  [role="tablist"] > * > *::after {
    display: none !important;
    content: none !important;
  }

  /* Mejorar el header */
  [role="banner"] {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%) !important;
    border-bottom: 1px solid rgba(190, 224, 231, 0.3) !important;
  }
  
  /* Agregar sombras suaves a contenedores principales */
  [class*="container"]:not([class*="modal"]):not([class*="overlay"]) {
    background: rgba(255, 255, 255, 0.6) !important;
    backdrop-filter: blur(10px) !important;
  }
  
  /* Mejorar secciones con padding y espaciado */
  section, [class*="section"] {
    padding: 24px !important;
  }
}

/* Scrollbar personalizado para web */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #F5F5F5;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #BEE0E7 0%, #9BC4D1 100%);
  border-radius: 5px;
  border: 2px solid #F5F5F5;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #9BC4D1 0%, #7BA8B5 100%);
}

/* Mejorar contenedores principales */
main, [data-testid="router-view"] {
  max-width: 100%;
  margin: 0 auto;
}

/* Mejorar ScrollView en web */
[data-scroll-container] {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Asegurar que los modales se vean bien */
[role="dialog"] {
  z-index: 1000;
}

/* Mejorar inputs en web */
input, textarea {
  font-family: inherit;
}

/* Asegurar que los botones tengan buen aspecto */
button {
  font-family: inherit;
  cursor: pointer;
}

/* Mejorar la apariencia de las cards */
[class*="card"] {
  transition: all 0.3s ease;
  background-color: #FFFFFF !important;
  border-radius: 16px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

[class*="card"]:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
  transform: translateY(-2px) !important;
}

/* Mejorar contenedores principales con más color */
main, [data-testid="router-view"] {
  background: transparent;
}

/* Agregar gradientes sutiles a secciones */
section, [class*="section"], [class*="container"] {
  background: transparent;
}

/* Mejorar inputs y textareas - respetar estilos inline de React Native */
/* Solo aplicar estilos base que no interfieran con React Native */
input, textarea {
  border-radius: 8px !important;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
}

/* Hover para inputs - solo si tienen backgroundColor inline oscuro (modo oscuro) */
input[style*="background-color: #2D2D2D"]:hover,
input[style*="background-color:#2D2D2D"]:hover,
input[style*="backgroundColor: #2D2D2D"]:hover,
input[style*="backgroundColor:#2D2D2D"]:hover,
textarea[style*="background-color: #2D2D2D"]:hover,
textarea[style*="background-color:#2D2D2D"]:hover,
textarea[style*="backgroundColor: #2D2D2D"]:hover,
textarea[style*="backgroundColor:#2D2D2D"]:hover {
  background-color: #353535 !important;
}

/* Hover para inputs - solo si tienen backgroundColor inline claro (modo claro) */
input[style*="background-color: #F8F9FA"]:hover,
input[style*="background-color:#F8F9FA"]:hover,
input[style*="backgroundColor: #F8F9FA"]:hover,
input[style*="backgroundColor:#F8F9FA"]:hover,
textarea[style*="background-color: #F8F9FA"]:hover,
textarea[style*="background-color:#F8F9FA"]:hover,
textarea[style*="backgroundColor: #F8F9FA"]:hover,
textarea[style*="backgroundColor:#F8F9FA"]:hover {
  background-color: #E8E8E8 !important;
}

/* Focus para inputs con backgroundColor oscuro (modo oscuro) */
input[style*="background-color: #2D2D2D"]:focus,
input[style*="background-color:#2D2D2D"]:focus,
input[style*="backgroundColor: #2D2D2D"]:focus,
input[style*="backgroundColor:#2D2D2D"]:focus,
textarea[style*="background-color: #2D2D2D"]:focus,
textarea[style*="background-color:#2D2D2D"]:focus,
textarea[style*="backgroundColor: #2D2D2D"]:focus,
textarea[style*="backgroundColor:#2D2D2D"]:focus {
  border-color: #4A9BA8 !important;
  box-shadow: 0 0 0 3px rgba(74, 155, 168, 0.2) !important;
  outline: none !important;
}

/* Focus para inputs con backgroundColor claro (modo claro) */
input[style*="background-color: #F8F9FA"]:focus,
input[style*="background-color:#F8F9FA"]:focus,
input[style*="backgroundColor: #F8F9FA"]:focus,
input[style*="backgroundColor:#F8F9FA"]:focus,
textarea[style*="background-color: #F8F9FA"]:focus,
textarea[style*="background-color:#F8F9FA"]:focus,
textarea[style*="backgroundColor: #F8F9FA"]:focus,
textarea[style*="backgroundColor:#F8F9FA"]:focus {
  border-color: #BEE0E7 !important;
  box-shadow: 0 0 0 3px rgba(190, 224, 231, 0.1) !important;
  outline: none !important;
}

/* Mejorar botones */
button {
  transition: all 0.2s ease !important;
}

button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

button:active {
  transform: translateY(0) !important;
}

/* Mejorar modales */
[role="dialog"], [class*="modal"] {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border-radius: 20px !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
}

/* Agregar efectos de hover a elementos interactivos */
[role="button"], [class*="button"], [class*="chip"], [class*="filter"] {
  transition: all 0.2s ease !important;
}

[role="button"]:hover, [class*="button"]:hover, [class*="chip"]:hover, [class*="filter"]:hover {
  transform: translateY(-1px) !important;
}

/* Mejorar espaciado general */
@media (min-width: 768px) {
  /* Agregar más padding en desktop */
  [class*="container"]:not([class*="modal"]) {
    padding: 24px !important;
  }
  
  /* Mejorar tipografía en desktop */
  h1, h2, h3, [class*="title"] {
    letter-spacing: -0.5px !important;
  }
  
  /* Mejorar headers con gradiente sutil */
  [class*="header"]:not([class*="modal"]) {
    background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
  }
  
  /* Agregar bordes redondeados a secciones */
  [class*="section"], [class*="features"] {
    border-radius: 0 !important;
  }
}

/* Agregar efectos visuales adicionales */
[class*="emptyContainer"], [class*="empty"] {
  background: rgba(255, 255, 255, 0.5) !important;
  border-radius: 12px !important;
  padding: 32px !important;
}

/* Mejorar filtros y chips */
[class*="filter"], [class*="chip"] {
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border-radius: 20px !important;
  cursor: pointer !important;
}

[class*="filter"]:hover, [class*="chip"]:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
}

/* Estilos específicos para filter-chip class */
.filter-chip {
  transition: background-color 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-color 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  cursor: pointer !important;
}

.filter-chip:hover {
  background-color: #E8E8E8 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
}

/* Estilos para elementos con borderRadius 20 (filtros) */
div[style*="borderRadius: 20"],
div[style*="borderRadius:20"],
button[style*="borderRadius: 20"],
button[style*="borderRadius:20"] {
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  cursor: pointer !important;
}

div[style*="borderRadius: 20"]:hover:not([style*="backgroundColor: #BEE0E7"]),
div[style*="borderRadius:20"]:hover:not([style*="backgroundColor: #BEE0E7"]),
button[style*="borderRadius: 20"]:hover:not([style*="backgroundColor: #BEE0E7"]),
button[style*="borderRadius:20"]:hover:not([style*="backgroundColor: #BEE0E7"]) {
  background-color: #E8E8E8 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
}

/* Mejorar listas y contenedores de items */
[class*="itemsContainer"], [class*="menuContainer"], [class*="pedidosContainer"] {
  background: transparent !important;
}

/* Agregar separadores visuales sutiles */
[class*="separator"], hr {
  border: none !important;
  border-top: 1px solid rgba(190, 224, 231, 0.3) !important;
  margin: 16px 0 !important;
}
`;
