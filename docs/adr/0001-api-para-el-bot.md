# 1. API de la hoja para el Bot de IA Educativa

Fecha: 2026-10-27 · Estado: aceptado

## Contexto

El catálogo lee la hoja «Añade tu aplicación al repositorio educativo
(respuestas)», publicada en CSV, que hasta ahora solo llenaba el formulario de
Google. Juanjo quiere que el Bot de IA Educativa (@IAEducativa_bot) dé de
alta, cambie y quite recursos sin pasar por el formulario: el bot lee el
recurso, prepara la ficha y la persona da el visto bueno en Telegram.

## Decisión

`api.gs` (en Apps Script, `gas/api.js`), en el mismo proyecto de Apps Script vinculado a la hoja, se
publica como aplicación web (se ejecuta como el propietario y la puede llamar
cualquiera). Atiende peticiones POST en JSON con una clave que comparte con el
bot; en el código va solo su huella SHA-256, porque este repositorio es
público. Acciones: `listar`, `alta`, `modificar` (en su sitio, también el enlace, conservando la
fecha de alta), `borrar` y `codigo` (manda un código al correo de quien dio de
alta recursos con el formulario, para que el bot compruebe que son suyos).

La web del catálogo no cambia: sigue leyendo el mismo CSV con las mismas
columnas. Quién es dueño de cada recurso lo lleva el bot; el detalle está en
el ADR 0004 del bot (jjdeharo/bot-chatgpt-ia-edu).

## Correos fuera del CSV público

El 27-10-2026, con el formulario ya cerrado, los correos de quienes lo usaron
(41) pasaron de la hoja a Propiedades del script, que solo ve la cuenta
propietaria (`migrar_correos`), y la columna se vació: el CSV publicado ya no
los muestra. `listar` se los devuelve al bot junto a cada fila, de modo que
recuperar los recursos con el código por correo funciona igual. Los recursos
nuevos no llevan correo: el bot los liga a la cuenta de Telegram de quien los
da de alta y, para escribir a su autor, le escribe por Telegram.

Validación: la relación de cada enlace con su correo es la misma antes y
después; `/misrecursos` sigue encontrando los 107 recursos de Juanjo; el CSV
publicado tiene 0 correos en sus 347 filas.

Fallo y corrección: la web tenía el correo entre los campos obligatorios
(`REQUIRED_FIELDS` en `script.js`) y, con la columna vacía, descartó todas las
fichas durante unos 20 minutos hasta la versión 1.8.1, que ya no lo exige.
Comprobado después en la web publicada: 346 de 346 recursos en Chromium y
Firefox, en móvil y escritorio.

## Consecuencias

- Las filas del bot no llevan correo; el script de limpieza nocturna
  (`limpieza.gs`) las ignora y sigue tratando las del formulario.
- Despliegue: `clasp push` y `clasp deploy -i <id>` para actualizar la misma
  dirección que usa el bot.

## Validación

27-10-2026: con la clave del bot, `listar` devuelve las 347 filas; una fila de
prueba se dio de alta, se cambió, se rechazó su duplicado y se borró en el
acto. Con una clave falsa responde «Clave incorrecta».
