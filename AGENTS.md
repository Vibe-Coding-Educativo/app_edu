# Agent Notes

- Mantener el número de versión del pie de página (`index.html`) siempre sincronizado con la última release publicada.
- `index.html` pide `script.js` y `estilos.css` con `?v=<versión>`: al publicar una versión, cambiar también ese número. GitHub Pages deja guardar los archivos 10 minutos en el navegador; sin él, una página nueva puede usar el programa de la versión anterior (27-10-2026: la 1.8.1 se vio vacía por eso).
