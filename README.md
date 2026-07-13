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

```bash
docker build -t front-rc .
docker run -d -p 3000:3000 \
  -v front-rc-data:/app/data \
  -v front-rc-gen:/app/generated \
  front-rc
```

Abre `http://localhost:3000` en el navegador.

- El volumen `front-rc-data` persiste los diseños (`data/designs/`) y las imágenes subidas (`data/assets/`).
- El volumen `front-rc-gen` persiste los diseños generados (`generated/`).
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
| `docker run -p 3000:3000 front-rc` | Ejecuta el contenedor (ver volúmenes arriba) |

> Para producción: `npm run build:editor && npm start`
> Para desarrollo: `npm start` en una terminal + `npm run dev` en otra (hot reload del editor).
> Para despliegue: `docker build` + `docker run` con volúmenes (persistencia de diseños e imágenes).

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
