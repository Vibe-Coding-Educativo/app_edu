/**
 * @OnlyCurrentDoc
 */

// FUNCIÓN PARA EL MENÚ DE LA HOJA
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Herramientas de Depuración')
      .addItem('Depurar duplicados y eliminaciones', 'runManualCleanup')
      .addToUi();
}

// FUNCIÓN PARA EL ACTIVADOR DIARIO (TRIGGER)
// DEBES CONFIGURAR EL ACTIVADOR PARA QUE EJECUTE ESTA FUNCIÓN: runDailyCleanup
function runDailyCleanup() {
  const message = performCleanupLogic();
  // Registra el resultado en el historial de ejecuciones para poder consultarlo.
  console.log(message); 
  
  // OPCIONAL: Descomenta las siguientes líneas si quieres recibir un email con el resultado.
  /*
  const userEmail = Session.getActiveUser().getEmail();
  if (userEmail) {
    MailApp.sendEmail(userEmail, "Resultado de la limpieza de la hoja de cálculo", message);
  }
  */
}

// FUNCIÓN MANUAL QUE SÍ MUESTRA ALERTAS
function runManualCleanup() {
  const ui = SpreadsheetApp.getUi();
  const message = performCleanupLogic();
  ui.alert(message);
}

// ---------------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL CON TODA LA LÓGICA DE BORRADO (NO USA LA UI)
// ESTA FUNCIÓN DEVUELVE UN TEXTO CON EL RESULTADO EN LUGAR DE MOSTRAR UNA ALERTA.
// ---------------------------------------------------------------------------------
function performCleanupLogic() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0].map(h => normalizeString(h));

  const HEADER_MAPPING = {
      'timestamp': ['marca temporal'],
      'correo': ['dirección de correo electrónico'],
      'titulo': ['título de la aplicación'],
      'url': ['enlace (url) a la aplicación'],
      'eliminar': ['¿quieres eliminar un registro?']
  };

  const colIdx = {};
  for (const key in HEADER_MAPPING) {
    const possibleHeaders = HEADER_MAPPING[key];
    colIdx[key] = -1;
    for (const pHeader of possibleHeaders) {
        const foundIndex = headers.findIndex(sheetHeader => sheetHeader.startsWith(normalizeString(pHeader)));
        if (foundIndex !== -1) {
            colIdx[key] = foundIndex;
            break;
        }
    }
  }

  for (const key in colIdx) {
    if (colIdx[key] === -1) {
      const errorMessage = `Error: No se pudo encontrar la columna para '${key}'. Revisa que el nombre de la cabecera en la hoja de cálculo comience con: "${HEADER_MAPPING[key][0]}"`;
      console.error(errorMessage);
      return errorMessage;
    }
  }

  const titleMap = new Map();
  const urlMap = new Map();
  // --- SUSTITUIDO EL SET POR UN MAP ---
  const forcedDeletions = new Map(); // key (correo|url o correo|titulo) → fecha corte
  const allRowsData = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowNum = i + 1;
    
    const correo = normalizeString(row[colIdx.correo]);
    const url = normalizeString(row[colIdx.url]);
    const titulo = normalizeString(row[colIdx.titulo]);
    const timestamp = new Date(row[colIdx.timestamp]);
    const eliminarValue = row[colIdx.eliminar];
    const eliminarFlag = (typeof eliminarValue === 'boolean' && eliminarValue === true) || (typeof eliminarValue === 'string' && normalizeString(eliminarValue).length > 0);

    if (!correo || !timestamp || isNaN(timestamp.getTime())) continue;

    const rowData = { rowNum, correo, url, titulo, timestamp };
    allRowsData.push(rowData);
    
    // --- LÓGICA ACTUALIZADA PARA USAR EL MAP ---
    if (eliminarFlag && (url || titulo)) {
      // Usamos la URL si existe, si no, el título.
      const key = url ? `${correo}|${url}` : `${correo}|${titulo}`;
      const ts  = timestamp.getTime();
      const prev = forcedDeletions.get(key) ?? -Infinity;
      if (ts > prev) forcedDeletions.set(key, ts); // Guardamos la fecha más reciente
    }

    if (titulo) {
      const titleKey = `${correo}|${titulo}`;
      if (!titleMap.has(titleKey)) titleMap.set(titleKey, []);
      titleMap.get(titleKey).push(rowData);
    }
    
    if (url) {
      const urlKey = `${correo}|${url}`;
      if (!urlMap.has(urlKey)) urlMap.set(urlKey, []);
      urlMap.get(urlKey).push(rowData);
    }
  }

  const rowsToDelete = new Set();

  // --- LÓGICA ACTUALIZADA PARA DECIDIR QUÉ BORRAR ---
  allRowsData.forEach(r => {
    const urlKey = r.url ? `${r.correo}|${r.url}` : null;
    const titleKey = r.titulo ? `${r.correo}|${r.titulo}` : null;

    const urlCutoff = urlKey ? forcedDeletions.get(urlKey) : undefined;
    const titleCutoff = titleKey ? forcedDeletions.get(titleKey) : undefined;

    // Se borra si su fecha es menor o igual a la marca de borrado (por URL o por título)
    if ((urlCutoff !== undefined && r.timestamp.getTime() <= urlCutoff) || 
        (titleCutoff !== undefined && r.timestamp.getTime() <= titleCutoff)) {
      rowsToDelete.add(r.rowNum);
    }
  });


  for (const group of titleMap.values()) {
    if (group.length > 1) {
      group.sort((a, b) => b.timestamp - a.timestamp);
      const toDelete = group.slice(1);
      toDelete.forEach(item => rowsToDelete.add(item.rowNum));
    }
  }

  for (const group of urlMap.values()) {
    if (group.length > 1) {
      group.sort((a, b) => b.timestamp - a.timestamp);
      const toDelete = group.slice(1);
      toDelete.forEach(item => rowsToDelete.add(item.rowNum));
    }
  }
  
  if (rowsToDelete.size === 0) {
    return 'Revisión completada. No se encontraron filas para eliminar.';
  }
  
  const sortedRowsToDelete = Array.from(rowsToDelete).sort((a, b) => b - a);
  
  sortedRowsToDelete.forEach(rowNum => {
    sheet.deleteRow(rowNum);
  });
  
  return `Limpieza completada. Se han eliminado ${sortedRowsToDelete.length} filas.`;
}

// Función de utilidad que no ha cambiado
function normalizeString(str) {
  if (typeof str !== 'string' || !str) return '';
  return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
