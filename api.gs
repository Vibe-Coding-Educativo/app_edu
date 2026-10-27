// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * API del catálogo para el Bot de IA Educativa (@IAEducativa_bot).
 *
 * El bot da de alta, modifica y borra aplicaciones escribiendo directamente en
 * la hoja, sin pasar por el formulario. Quién es dueño de cada aplicación lo
 * lleva el bot (por su cuenta de Telegram); aquí solo se comprueba la clave
 * que comparte con el bot. En el código va su huella SHA-256, no la clave: el
 * repositorio es público.
 *
 * Se publica como aplicación web (ejecutar como el propietario, acceso para
 * cualquiera): sin la clave no hace nada.
 *
 * Peticiones POST con JSON {clave, accion, ...}:
 *   listar                      todas las filas, con su correo (el bot lo usa para las altas antiguas)
 *   alta       {ficha}          añade una fila
 *   modificar  {url, ficha}     cambia los campos de la fila con esa URL; conserva la fecha de alta
 *   borrar     {url}            borra las filas con esa URL
 *   codigo     {correo, codigo} si hay aplicaciones con ese correo, le envía el código
 *
 * Una ficha es {"Título de la aplicación": "...", ...} con los nombres de columna de la hoja.
 */

const HOJA_RESPUESTAS = 'Respuestas de formulario 1';
const COL_FECHA = 'Marca temporal';
const COL_CORREO = 'Dirección de correo electrónico';
const COL_URL = 'Enlace (URL) a la aplicación';
const HUELLA_CLAVE = 'b62d5280376774908becb93dd63ff2a7e5a8ed5994b758a6d62736497c95ff01';

function doPost(e) {
  let p;
  try {
    p = JSON.parse(e.postData.contents);
  } catch (error) {
    return respuesta_({ error: 'La petición no es JSON' });
  }
  if (huella_(p.clave) !== HUELLA_CLAVE) return respuesta_({ error: 'Clave incorrecta' });

  const cerrojo = LockService.getScriptLock();
  cerrojo.waitLock(20000);
  try {
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_RESPUESTAS);
    switch (p.accion) {
      case 'listar': return respuesta_({ filas: listar_(hoja) });
      case 'alta': return respuesta_(alta_(hoja, p.ficha));
      case 'modificar': return respuesta_(modificar_(hoja, p.url, p.ficha));
      case 'borrar': return respuesta_(borrar_(hoja, p.url));
      case 'codigo': return respuesta_(codigo_(hoja, p.correo, p.codigo));
      default: return respuesta_({ error: 'Acción desconocida: ' + p.accion });
    }
  } catch (error) {
    return respuesta_({ error: String(error) });
  } finally {
    cerrojo.releaseLock();
  }
}

function huella_(texto) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(texto || ''), Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function respuesta_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

function cabeceras_(hoja) {
  return hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
}

function normalizarUrl_(url) {
  return String(url || '').trim().toLowerCase().replace(/\/+$/, '');
}

function filasConUrl_(hoja, url) {
  const cab = cabeceras_(hoja);
  const col = cab.indexOf(COL_URL);
  const n = hoja.getLastRow() - 1;
  if (col < 0 || n < 1) return [];
  const valores = hoja.getRange(2, col + 1, n, 1).getValues();
  const buscada = normalizarUrl_(url);
  const filas = [];
  valores.forEach((v, i) => { if (normalizarUrl_(v[0]) === buscada) filas.push(i + 2); });
  return filas;
}

function listar_(hoja) {
  const valores = hoja.getDataRange().getValues();
  const cab = valores.shift().map(String);
  return valores
    .filter(fila => fila.some(v => v !== ''))
    .map(fila => {
      const o = {};
      cab.forEach((c, i) => { o[c] = fila[i] instanceof Date ? fila[i].toISOString() : String(fila[i]); });
      return o;
    });
}

function alta_(hoja, ficha) {
  if (!ficha || !ficha[COL_URL]) return { error: 'Falta la URL' };
  if (filasConUrl_(hoja, ficha[COL_URL]).length) return { error: 'Ya hay una aplicación con esa URL' };
  const cab = cabeceras_(hoja);
  const fila = cab.map(c => (c === COL_FECHA ? new Date() : (ficha[c] !== undefined ? String(ficha[c]) : '')));
  hoja.appendRow(fila);
  return { ok: true, fila: hoja.getLastRow() };
}

function modificar_(hoja, url, ficha) {
  const filas = filasConUrl_(hoja, url);
  if (!filas.length) return { error: 'No hay ninguna aplicación con esa URL' };
  const cab = cabeceras_(hoja);
  const n = filas[filas.length - 1];  // la más reciente; las demás, si las hay, sobran
  const rango = hoja.getRange(n, 1, 1, cab.length);
  const fila = rango.getValues()[0];
  cab.forEach((c, i) => {
    if (c !== COL_FECHA && c !== COL_CORREO && ficha[c] !== undefined) fila[i] = String(ficha[c]);
  });
  rango.setValues([fila]);
  filas.slice(0, -1).reverse().forEach(f => hoja.deleteRow(f));
  return { ok: true };
}

function borrar_(hoja, url) {
  const filas = filasConUrl_(hoja, url);
  filas.reverse().forEach(f => hoja.deleteRow(f));
  return { ok: true, borradas: filas.length };
}

function codigo_(hoja, correo, codigo) {
  const buscado = String(correo || '').trim().toLowerCase();
  if (!buscado || !/^\d{6}$/.test(String(codigo))) return { error: 'Faltan el correo o el código' };
  const urls = listar_(hoja)
    .filter(f => String(f[COL_CORREO]).trim().toLowerCase() === buscado)
    .map(f => f[COL_URL]);
  if (!urls.length) return { ok: true, urls: [] };
  MailApp.sendEmail({
    to: buscado,
    subject: 'Código para gestionar tus recursos en Vibe Coding Educativo',
    body: 'Tu código es ' + codigo + '.\n\n' +
      'Escríbeselo al Bot de IA Educativa (https://t.me/IAEducativa_bot) en Telegram para ' +
      'gestionar desde allí los recursos que diste de alta en el Repositorio de recursos educativos ' +
      'digitales de Vibe Coding Educativo con este correo.\n\nSi no lo has pedido tú, no hagas nada.',
    name: 'Vibe Coding Educativo',
  });
  return { ok: true, urls: urls };
}

// Para autorizar los permisos la primera vez: ejecutarla una vez desde el editor.
function autorizar() {
  SpreadsheetApp.getActive().getSheetByName(HOJA_RESPUESTAS).getLastRow();
  MailApp.getRemainingDailyQuota();
}
