# front-rc

Diseñador y generador de interfaces de control AV. Crea diseños visuales con botones, sliders, imágenes, etiquetas, líneas y rectángulos, asígnalles endpoints de tu backend AV, y exporta HTML+CSS+JS estático puro que se sirve a tablets, Mac y web a través de un servidor local.

El backend AV es **intocable** — solo recibe peticiones HTTP. El reproductor no usa framework ni interpreta JSON en tiempo de ejecución: el HTML ya viene construido.

## Inicio rápido

### Local

```bash
npm install
npm run build:editor
npm start
```

Abre `http://localhost:3000` en el navegador.

### Docker

Copia `.env.example` a `.env` y rellénalo antes de arrancar.

```bash
docker compose up -d --build
```

O sin compose:

```bash
docker build -t front-rc .
docker run -d -p 3000:3000 \
  --env-file .env \
  --user "$(id -u):$(id -g)" \
  -v "$PWD/data:/app/data:z" \
  -v "$PWD/generated:/app/generated:z" \
  front-rc
```

Abre `http://localhost:3000` en el navegador.

- El `.env` **no** se copia dentro de la imagen: hornear el token de jaso-rc en una capa lo
  deja ahí para siempre. Las variables entran en el entorno del contenedor al arrancar, con
  `env_file` (compose) o `--env-file` (docker run). Sin ellas el editor arranca sin contraseña
  y los paneles devuelven 503 al pulsar cualquier botón.
- Los datos persisten en carpetas del host, no en volúmenes de Docker: `./data` (diseños en
  `data/designs/`, imágenes y SVG en `data/assets/`) y `./generated` (paneles generados). El
  backup es un `tar` o un `rsync` de esas carpetas, sin contenedores auxiliares de por medio.
- El contenedor corre con tu UID/GID para que los ficheros que crea no salgan como `root`. Si
  despliegas con otro usuario, ajusta `user:` en el compose.
- La `baseUrl` del diseño debe ser una IP alcanzable **desde el contenedor**: `localhost` apunta
  al propio contenedor, no a tu máquina.
- Al arrancar sin diseños, siembra automáticamente un diseño de ejemplo ("salon").

## Flujo de uso

1. **Crea un diseño** desde el editor (o carga uno existente).
2. **Arrastra componentes** desde la paleta al lienzo (botón, slider, imagen, etiqueta, línea, rectángulo).
3. **Configura cada elemento**: posición, estilo y acción (petición HTTP a tu backend AV o navegación entre pantallas).
4. **Sube imágenes** al directorio de assets desde el editor y asígnalas a elementos imagen o fondos con el botón "Examinar".
5. **Define el fondo** de cada pantalla (color sólido, gradiente o imagen).
6. **Genera** — el servidor guarda el JSON y produce `index.html` + `styles.css` + `app.js` vanilla.
7. **Sirve** — las tablets abren `http://<ip-del-servidor>:3000/designs/<nombre>/` y los controles disparan `fetch()` al backend AV.

## Comandos

| Comando | Descripción |
|---|---|
| `npm start` | Servidor local Express (puerto 3000) |
| `npm run dev` | Dev server de Vite (puerto 5173, proxy a :3000) |
| `npm run build:editor` | Compila el editor a `dist-editor/` |
| `npm run typecheck` | Typecheck de backend + editor |
| `docker build -t front-rc .` | Construye la imagen Docker |
| `docker run -p 3000:3000 --env-file .env front-rc` | Ejecuta el contenedor (ver montajes arriba) |
| `docker compose up -d --build` | Construye y arranca con `.env` y los montajes ya configurados |

> Para producción: `npm run build:editor && npm start`
> Para desarrollo: `npm start` en una terminal + `npm run dev` en otra (hot reload del editor).
> Para despliegue: `docker compose up -d --build` (persistencia de diseños e imágenes en `./data`).

## Elementos

| Tipo | Props | Acción |
|---|---|---|
| **Botón** | texto, estilo | HTTP o navegación |
| **Slider** | orientación (horizontal/vertical), min/max/step/valor, etiqueta, envío en soltar o arrastrar | Comando con `value` |
| **Imagen** | URL (selector de assets integrado) | HTTP o navegación (opcional) |
| **Etiqueta** | texto, alineación | no interactiva |
| **Línea** | orientación (horizontal/vertical), color, grosor | decorativa (no interactiva) |
| **Rectángulo** | fondo, borde, esquinas, opacidad | decorativo (no interactivo) |

## Assets de imagen

Las imágenes se gestionan desde el editor con el botón **"Examinar"** que aparece junto al campo de imagen (en elementos imagen y en fondos de pantalla). Abre un modal que permite:

- **Ver** las imágenes disponibles en `data/assets/` con thumbnails.
- **Subir** nuevas imágenes (PNG, JPG, GIF, SVG, WebP, ICO).
- **Borrar** imágenes que ya no se necesiten.
- **Seleccionar** una imagen para asignarla al elemento.

Las imágenes se sirven en `/assets/<nombre>` y están disponibles tanto en la previsualización del editor como en los diseños generados.

## Librería de iconos SVG de AV

El proyecto incluye una colección de **36 iconos SVG** en `data/assets/` listos para usar en diseños de control AV. Son iconos minimalistas (estilo line/feather) en blanco sobre transparente, viewBox 24x24, ideales para fondos oscuros.

| Categoría | Iconos |
|---|---|
| **Reproducción** | `play`, `pause`, `stop`, `record`, `eject`, `fast-forward`, `rewind`, `skip-forward`, `skip-backward` |
| **Volumen** | `volume-up`, `volume-down`, `volume-mute`, `speaker` |
| **Energía y entrada** | `power`, `input`, `hdmi`, `cast` |
| **Navegación** | `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `channel-up`, `channel-down`, `home`, `menu`, `settings` |
| **Dispositivos** | `tv`, `monitor`, `projector`, `camera`, `mic` |
| **Conectividad/AV** | `wifi`, `bluetooth`, `light`, `brightness`, `fullscreen` |

Para usarlos: arrastra un elemento **Imagen** al lienzo, pulsa **Examinar** y selecciona el icono. También pueden usarse como fondo de pantalla (opción Imagen).

## Fondos de pantalla

- **Color sólido** — un color hex
- **Gradiente** — from, to y ángulo
- **Imagen** — URL (cover)

## Acciones

### Comando de equipo (la habitual)

```json
{
  "type": "command",
  "deviceId": "monitor",
  "command": "power_on"
}
```

Se traduce a `POST /api/devices/monitor/commands/power_on`, que es la forma real de la API de
jaso-rc. El editor **no te deja teclear el nombre**: lo saca del catálogo del propio backend
(`GET /api/devices`), así que solo puedes elegir equipos y comandos que existen.

Los comandos parametrizados (faders de una Midas, nivel DALI) llevan `value`, y un slider lo
rellena con su posición:

```json
{
  "type": "command",
  "deviceId": "midas",
  "command": "main_fader",
  "value": "{{value}}"
}
```

Va en el cuerpo JSON y **como número**: por `GET` todo llegaría al driver como string y un
fader lo rechazaría. El rango del slider es el del comando (un fader de la Midas es 0–1, no
0–100).

### Petición HTTP (avanzado)

```json
{
  "type": "http",
  "endpoint": "/api/devices/monitor/status",
  "method": "GET"
}
```

Ruta cruda contra el backend AV, para lo que el catálogo no cubra. `{{value}}` se interpola con
el valor del slider; en GET el payload va como query string y en el resto como body JSON.

La URL base del backend AV se configura a nivel de diseño (campo "Backend AV" de la barra
superior).

## Feedback

Dos cosas distintas, y conviene no confundirlas al mirar un panel:

### Al pulsar (siempre, sin configurar nada)

El elemento se marca mientras la orden viaja (`rc-busy`), y termina en verde (`rc-ok`) o en rojo
(`rc-err`). Un comando AV no es instantáneo —viaja por red y acaba en un proyector que tarda en
contestar—, y un botón que no acusa recibo se pulsa tres veces. Las macros mantienen el estado de
"enviando" hasta que **la secuencia entera** termina, no hasta el 202.

### El estado del equipo (opcional, por elemento)

Sección **"Feedback de estado"** del panel de propiedades. El elemento sigue a un equipo y refleja
lo que ese equipo dice de sí mismo (`GET /api/devices/{id}/status`, sondeado cada 5 s):

| Elemento | Qué hace con el estado |
|---|---|
| **Botón** | Se ilumina (`rc-active`) cuando el valor coincide con el esperado |
| **Casilla / opción** | Se marca y se desmarca sola siguiendo al equipo |
| **Slider** | Se coloca en el valor real (no mientras lo arrastras: no se te mueve el dedo debajo) |
| **Etiqueta** | Pinta el valor. Con `{{value}}` en su texto, lo enmarca: `Volumen: {{value}}` |

Y en todos: **el equipo que no responde se ve apagado** (`rc-offline`, atenuado y en gris). Que un
proyector esté apagado y que no conteste son cosas distintas, y llevan a mirar sitios distintos.

Las claves de estado (`power`, `input`, `level`…) **las decide el driver** y la API no las publica
en ningún catálogo, así que el editor no puede ofrecer una lista cerrada: el botón **"Leer estado
del equipo"** le pregunta al equipo de verdad y ofrece las claves que ha devuelto, con su valor
actual al lado. Si el equipo no publica una clave, el panel **no inventa** su estado: deja el
elemento como está.

El estado lo dice el equipo, no el botón: pulsar "encender" no pinta el botón de encendido, lo
pinta el proyector cuando confirma que lo está. Es la diferencia entre un mando que informa y uno
que miente en cuanto alguien enciende el proyector con el mando de la pared.

### Qué ve el usuario cuando algo falla

jaso-rc devuelve todos los errores en el mismo sobre (`{"error": "..."}`), y el panel los
traduce a un aviso legible. Lo importante: **un 502 no es "el sistema está roto", es "el equipo
no responde"** —proyector apagado de la pared, cable suelto—, y es el error más frecuente en
producción. Un equipo inalcanzable, además, no siempre es un error HTTP: `/status` responde
**200** con `{"reachable": false, "error": "..."}`.

## Acceso al editor

El editor (`http://localhost:3000/`) pide contraseña: la de `EDITOR_PASSWORD` en el `.env`. Al
entrar se guarda una cookie de sesión (`httpOnly`, `SameSite=Strict`, 12 h de caducidad
absoluta). Sin sesión, **toda** la API de diseños responde 401.

Las sesiones viven en memoria: reiniciar el servidor obliga a volver a entrar. Y si no pones
`EDITOR_PASSWORD`, el editor queda **abierto** a cualquiera que llegue al puerto — el servidor
lo avisa por consola al arrancar, en vez de fingir que está protegido.

**Los paneles generados no piden contraseña, y es a propósito**: una tablet colgada en la pared
no puede escribirla. `/designs/…`, sus imágenes y el proxy `/av/…` quedan abiertos, así que
quien alcance el puerto 3000 puede mandar comandos a los equipos aunque no sepa la contraseña
del editor. La frontera que compra el login es *quién puede diseñar y ver la instalación*, no
*quién puede pulsar un botón*: para eso, la defensa es la red (una VLAN de control, y
`allow_cidrs` en jaso-rc). Es la misma separación que hace jaso-rc: cookie para las personas,
token para las máquinas.

## Autenticación contra jaso-rc

`/api/**` de jaso-rc exige `Authorization: Bearer <token>` y devuelve 401 sin él. El panel
generado **no lleva el token**: llama a `/av/<diseño>/<endpoint>` en su propio origen, y este
servidor reenvía a la `baseUrl` del diseño poniendo el Bearer. Así la credencial no viaja a la
tablet y, de paso, la petición del panel es *same-origin* (sin CORS ni preflight).

Configúralo en `.env` (copia de `.env.example`, no se versiona):

| Variable | Para qué |
|---|---|
| `JASO_RC_TOKEN` | Token de API de jaso-rc (`jaso-rc -gen-token NOMBRE`). Sin él, los paneles reciben 503. |
| `JASO_RC_INSECURE_TLS` | `true` si jaso-rc usa certificado autofirmado. Desactiva la validación TLS de todo el proceso. |
| `EDITOR_PASSWORD` | Contraseña del editor. Vacía = editor abierto. |
| `EDITOR_SESSION_TTL_HOURS` | Caducidad de la sesión (12 por defecto). |
| `EDITOR_SECURE_COOKIES` | `true` si sirves el editor por HTTPS. |

Un token `readonly` da 403 al ejecutar comandos: úsalo para paneles de solo visualización.

### Navegación entre pantallas

```json
{
  "type": "navigate",
  "screenId": "settings"
}
```

Cambia la pantalla visible sin recargar la página.

## Atajos de teclado (editor)

| Tecla | Acción |
|---|---|
| `Supr` / `Backspace` | Borrar elemento seleccionado |
| `Flechas` | Mover elemento 1px |
| `Shift + Flechas` | Mover elemento 10px |

## API REST

Todo `/api/**` exige sesión, salvo el login. Los paneles (`/designs/**`, `/assets/**`, `/av/**`)
no la exigen.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/login` | Iniciar sesión (contraseña en el cuerpo). Abierto |
| `POST` | `/api/logout` | Cerrar sesión. Abierto |
| `GET` | `/api/session` | ¿Hay sesión? ¿Hay contraseña configurada? Abierto |
| `GET` | `/api/designs` | Listar diseños |
| `GET` | `/api/designs/:name` | Obtener un diseño (JSON) |
| `PUT` | `/api/designs/:name` | Crear o actualizar |
| `DELETE` | `/api/designs/:name` | Borrar |
| `POST` | `/api/designs/:name/generate` | Generar estáticos |
| `GET` | `/api/assets` | Listar imágenes disponibles |
| `POST` | `/api/assets` | Subir una imagen (base64) |
| `DELETE` | `/api/assets/:filename` | Borrar una imagen |
| `GET` | `/assets/:filename` | Servir imagen estática |
| `GET` | `/api/designs/:name/devices` | Catálogo de equipos del backend AV del diseño (llena los desplegables) |
| `GET` | `/api/designs/:name/health` | Prueba de conexión: distingue URL caída, token inválido e IP no autorizada |
| `*` | `/av/:name/*` | Proxy al backend AV del diseño, añadiendo el Bearer del servidor |
| `GET` | `/api/backup` | Descargar copia de seguridad (diseños + assets, un JSON) |
| `POST` | `/api/backup/restore?mode=merge\|replace` | Restaurar una copia |

## Copias de seguridad

En el selector de diseños, botón **Configuración**.

- **Descargar copia**: un único fichero JSON con todos los diseños y los assets subidos. Los
  paneles de `generated/` no van dentro: son derivados y se reconstruyen al restaurar.
- **Restaurar**: sube el fichero y elige qué hacer con lo que ya hay. `Combinar` sobrescribe los
  diseños con el mismo nombre y deja el resto; `Reemplazar` borra además los que no estén en la
  copia (clonar un servidor entero). Los assets nunca se borran: los comparten varios diseños.
- Al terminar, los paneles se regeneran solos, así que `/designs/<nombre>/` responde sin tener
  que abrir cada diseño y darle a generar.

Como los datos viven en `./data`, el backup del servidor entero también vale con un `tar` o un
`rsync` de esa carpeta.

## Estructura del proyecto

```
front-rc/
├── src/                    # Backend
│   ├── schema/             # Tipos del diseño (contrato compartido)
│   ├── generator/          # JSON → HTML+CSS+JS vanilla
│   └── server/             # Express: API + servir estáticos
├── editor/                 # Editor React (Vite)
│   └── src/
│       ├── components/     # Toolbar, Palette, Canvas, PropertiesPanel, ...
│       ├── useDesign.ts    # Hook de estado del diseño
│       ├── useKeyboardShortcuts.ts
│       └── api.ts          # Cliente HTTP
├── data/designs/           # Diseños guardados (JSON)
├── data/assets/             # Imágenes subidas desde el editor
├── generated/              # Output del generador (HTML+CSS+JS)
├── dist-editor/            # Editor compilado
├── Dockerfile              # Imagen Docker multi-stage (build + runtime)
├── .dockerignore
└── vite.config.ts
```

## Arquitectura

```
Editor (React)  →  Servidor local (Express)  →  HTML+CSS+JS estático
     ↑                    ↑                              │
     │ guarda/carga JSON  │ genera + sirve               │ sirve
     └────────────────────┘                              ▼
                                              Tablets (navegador)
                                                        │ fetch()
                                                        ▼
                                              Backend AV (intocable)
```

- El editor y el servidor comparten un **esquema TypeScript** que define el diseño.
- El **generador** convierte ese esquema en ficheros estáticos sin dependencias.
- El **servidor local** cumple tres roles: servir el editor, servir los diseños generados y servir las imágenes de `data/assets/` en `/assets/`.
- Las **tablets** solo necesitan un navegador — abren una URL y funcionan.

## Tecnologías

- **TypeScript** — lenguaje único para todo el proyecto
- **React + dnd-kit** — editor con drag-and-drop
- **Vite** — build del editor
- **Express** — servidor local
- **HTML + CSS + JS vanilla** — output del generador (sin framework)
