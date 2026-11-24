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
- **Solo las escribe la tarea nocturna de la guía**, con la acción nueva `semaforos`
  de `api.gs`. La acción crea las columnas si faltan y no toca nada más de la fila.
  El bot no las toca. Al cambiar una ficha, `modificar` ya conservaba las columnas que
  no recibe. Si un recurso cambia de enlace, `modificar` vacía las tres columnas: el
  semáforo del enlace antiguo ya no vale, y la fila queda pendiente hasta la noche.
- **En cada tarjeta**, una línea «Privacidad:» con el color y su nombre, que no
  depende solo del color. Al pulsarla se despliegan el motivo, la fecha, la aclaración
  de que es una evaluación técnica orientativa y no oficial, y un enlace a la ficha de
  la guía (`?u=<enlace del recurso>`). Se despliega al tocarla, sin depender de pasar
  el ratón, para que funcione en el móvil. Si la fila aún no tiene semáforo, sale
  «Pendiente de evaluar», con la explicación de que se evalúa cada noche.
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

- Una aplicación nueva sale como «pendiente» hasta la noche. El bot lo avisa al
  publicarla (ADR 0053 del bot).
- Más adelante habrá que ver si la hoja se sustituye por un JSON (Juanjo, 24-11-2026).
  Entonces, el semáforo pasaría con lo demás.
- Despliegue de la API: `clasp push` y `clasp deploy -i <id>`, como en el ADR 0001.
