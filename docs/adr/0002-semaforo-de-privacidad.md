# 2. Semáforo de privacidad de cada recurso

Fecha: 2026-11-24 · Estado: aceptado

## Contexto

La [Guía de privacidad de herramientas educativas](https://guia-privacidad-edu.github.io/)
evalúa cada aplicación de este repositorio con los criterios del anexo I de las
*Orientaciones* del INTEF (v3.0, junio de 2026). Abre cada aplicación en un navegador
y anota con qué servidores conecta, qué les manda, qué cookies pone y si pide iniciar
sesión o datos personales. El resultado es un semáforo: verde (no trata datos
personales), amarillo (los trata) o rojo (seguimiento con analítica comercial).

Juanjo quiso que el semáforo se viera también aquí, y que la evaluación fuera una sola
para los dos sitios.

## Decisión

- **La base común es la hoja del repositorio**, la misma que escribe el Bot de IA
  Educativa y que lee esta web. Tiene tres columnas nuevas: «Semáforo de privacidad»
  (`VERDE`, `AMARILLO`, `ROJO`, `VERDE/AMARILLO` si depende de usarla con registro o
  sin él, o `SIN EVALUAR` si el enlace no lleva a una aplicación que se pueda abrir),
  «Motivo del semáforo» y «Fecha del semáforo».
- **Las escribe el semáforo del Bot de IA Educativa** (su ADR 0053): al dar de alta un
  recurso, con el resto de la ficha, y cada noche, con la acción `semaforos` de `api.gs`,
  en las filas que cambian. Hasta el 24-11-2026 por la mañana lo hacía la guía de
  privacidad, que desde entonces es solo del INTEF. La acción crea las columnas si faltan y no toca nada más de la fila.
  Al cambiar una ficha, `modificar` conserva las columnas que no recibe. Si un recurso
  cambia de enlace, el bot evalúa el nuevo y manda su color. Si no lo manda (el servicio
  no responde), `modificar` vacía las tres columnas: el semáforo del enlace antiguo ya
  no vale, y la fila queda pendiente hasta la noche.
- **En cada tarjeta**, una línea «Privacidad:» con el color y su nombre, que no
  depende solo del color. Al pulsarla se despliegan el motivo, la fecha, la aclaración
  de que es una evaluación técnica orientativa y no oficial, con «anexo I del INTEF» enlazado
  al PDF oficial de las *Orientaciones*, para quien quiera revisar el criterio (Juanjo,
  24-11-2026). La ayuda también lo enlaza. Al principio llevaba también
  un enlace a la ficha de la guía; se quitó al pasar la guía a ser solo del INTEF. Se despliega al tocarla, sin depender de pasar
  el ratón, para que funcione en el móvil. Si la fila aún no tiene semáforo, sale
  «Pendiente de evaluar», con la explicación de que se evalúa cada noche.
- **Las rojas no se abren** (Juanjo, 24-11-2026, también las dos que ya había): la
  tarjeta se ve, pero en lugar de «Visitar recurso» sale «Enlace desactivado», con la
  explicación de que el enlace volverá cuando su autor lo arregle.
  No se desactiva si el motivo empieza por «Admitida tras revisión manual»: Juanjo la
  revisó y dijo que cumple. Lo rojo no entra en las altas nuevas (ADR 0053 del bot), y la
  ayuda lo dice en los cinco idiomas.
- **`avisar_correo {url, asunto, texto}`**: escribe al correo con que se dio de alta un
  recurso en el antiguo formulario, para avisar a su autor si no usa el bot. El bot no ve
  la dirección.
- **La franja de arriba de cada tarjeta lleva el color del semáforo** (Juanjo, 24-11-2026):
  verde, amarillo o rojo; gris si está pendiente o sin evaluar; mitad verde y mitad amarilla
  si depende de usarla con registro o sin él. Antes, su color salía del nombre del autor
  y no significaba nada para quien miraba. La ayuda lo explica.
- **Un filtro «Semáforo de privacidad»** con los colores en orden fijo. Un recurso
  `VERDE/AMARILLO` aparece en los dos. En la dirección para compartir se llama
  `privacy`.
- El motivo está solo en castellano, como el resto de las fichas. Los rótulos están en
  los cinco idiomas de la web.

## Alternativas descartadas

- **Que esta web leyera la lista de la guía (`vce-evaluadas.json`)**: habría dos fuentes
  que casar por el enlace, y el repositorio dependería de otra web.
- **Que el bot evaluara cada recurso al darlo de alta**: lee las páginas sin navegador,
  así que no ve qué servidores llama una aplicación al abrirse.

## Consecuencias

- El color se ve desde el momento del alta. Si el servicio del semáforo no responde,
  el recurso sale como «pendiente» hasta la noche.
- Más adelante habrá que ver si la hoja se sustituye por un JSON (Juanjo, 24-11-2026).
  Entonces, el semáforo pasaría con lo demás.
- Despliegue de la API: `clasp push` y `clasp deploy -i <id>`, como en el ADR 0001.
