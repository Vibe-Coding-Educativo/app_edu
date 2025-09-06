# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del Proyecto

Este es un repositorio de aplicaciones educativas creado por la comunidad "Vibe Coding Educativo". Es una aplicación web frontend que presenta un catálogo de recursos educativos con funcionalidades de búsqueda, filtrado y gestión de favoritos.

## Estructura del Proyecto

**Archivos principales:**
- `index.html`: Página principal del catálogo de aplicaciones
- `script.js`: Lógica principal de la aplicación (319 líneas)
- `estilos.css`: Estilos CSS personalizados y variables de tema
- `est_apl.html`: Vista de estadísticas de las aplicaciones
- `ayuda.html`: Página de ayuda y documentación para usuarios
- `stats.html`: Página embebida con iframe para estadísticas
- `limpieza.gs`: Script de Google Apps Script para limpieza de datos

## Arquitectura Técnica

### Frontend Stack:
- **HTML5 + CSS3 + JavaScript vanilla**: Sin frameworks, código nativo
- **TailwindCSS**: Framework CSS utilizado via CDN (`https://cdn.tailwindcss.com`)
- **PapaParse**: Librería para parsing de CSV (`https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js`)
- **Tipografía**: Google Fonts Inter

### Fuente de datos:
- Google Sheets publicado como CSV: URL definida en `CSV_URL` variable en `script.js`
- Los datos se cargan dinámicamente desde Google Sheets vía PapaParse

### Funcionalidades clave:
- **Gestión de temas**: Sistema de modo claro/oscuro/automático con localStorage
- **Sistema de favoritos**: Organizado por categorías, persistido en localStorage
- **Filtrado avanzado**: Por área de conocimiento, nivel educativo, tipo de recurso, plataforma, autor
- **Búsqueda universal**: Búsqueda de texto libre en todos los campos
- **Paginación**: Configurable, con persistencia en localStorage
- **URLs compartibles**: Para vistas personalizadas y favoritos
- **Responsive design**: Adaptación a diferentes tamaños de pantalla

### Estado de la aplicación:
El estado se gestiona mediante variables globales en `script.js`:
- `allApps`: Array con todas las aplicaciones cargadas
- `favorites`: Objeto con categorías de favoritos 
- `activeFilters`: Sets con filtros activos
- `showingFavoritesOnly`: Boolean para vista de favoritos
- `currentPage`, `itemsPerPage`: Control de paginación

## Desarrollo

### No hay comandos de build:
Este proyecto es HTML/CSS/JS estático que funciona directamente en el navegador. No requiere instalación de dependencias ni procesos de build.

### Para desarrollo local:
1. Abrir `index.html` directamente en el navegador, o
2. Servir con cualquier servidor HTTP local (ej: `python -m http.server`)

### Testing:
No hay tests automatizados configurados. Las pruebas se realizan manualmente en el navegador.

## Gestión de datos

### Google Apps Script (`limpieza.gs`):
- Script para automatizar limpieza de datos duplicados
- Incluye función `runDailyCleanup()` para ejecución con triggers
- Función `runManualCleanup()` para limpieza manual desde el menú de Google Sheets

### Campos requeridos en CSV:
- `correo_autor`, `nombre_autor`, `titulo_app`, `url_app`

### Estructura de colores por plataforma:
Las tarjetas tienen bordes de color según la plataforma (definido en `estilos.css` con clases específicas).

## Convenciones del código

- **JavaScript**: Uso de ES6+ features, funciones modulares
- **CSS**: Combinación de Tailwind classes con CSS personalizado
- **HTML**: Estructura semántica con accesibilidad (ARIA labels, sr-only classes)
- **Naming**: Variables y funciones en camelCase, IDs con kebab-case
- **Localización**: Todo el contenido está en español

## Archivos de configuración

No hay archivos de configuración tradicionales. La configuración se gestiona mediante:
- Variables globales en `script.js` 
- CSS custom properties en `:root` (estilos.css)
- localStorage para preferencias del usuario