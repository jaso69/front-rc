# front-rc

Diseñador y generador de interfaces de control AV. Crea diseños visuales con botones, sliders, imágenes y etiquetas, asígnalles endpoints de tu backend AV, y exporta HTML+CSS+JS estático puro que se sirve a tablets, Mac y web a través de un servidor local.

El backend AV es **intocable** — solo recibe peticiones HTTP. El reproductor no usa framework ni interpreta JSON en tiempo de ejecución: el HTML ya viene construido.

## Inicio rápido

```bash
npm install
npm run build:editor
npm start
```

Abre `http://localhost:3000` en el navegador.

## Flujo de uso

1. **Crea un diseño** desde el editor (o carga uno existente).
2. **Arrastra componentes** desde la paleta al lienzo (botón, slider, imagen, etiqueta).
3. **Configura cada elemento**: posición, estilo y acción (petición HTTP a tu backend AV o navegación entre pantallas).
4. **Define el fondo** de cada pantalla (color sólido, gradiente o imagen).
5. **Genera** — el servidor guarda el JSON y produce `index.html` + `styles.css` + `app.js` vanilla.
6. **Sirve** — las tablets abren `http://<ip-del-servidor>:3000/designs/<nombre>/` y los controles disparan `fetch()` al backend AV.

## Comandos

| Comando | Descripción |
|---|---|
| `npm start` | Servidor local Express (puerto 3000) |
| `npm run dev` | Dev server de Vite (puerto 5173, proxy a :3000) |
| `npm run build:editor` | Compila el editor a `dist-editor/` |
| `npm run typecheck` | Typecheck de backend + editor |

> Para producción: `npm run build:editor && npm start`
> Para desarrollo: `npm start` en una terminal + `npm run dev` en otra (hot reload del editor).

## Elementos

| Tipo | Props | Acción |
|---|---|---|
| **Botón** | texto, estilo | HTTP o navegación |
| **Slider** | min/max/step/valor, etiqueta, envío en soltar o arrastrar | HTTP (con `{{value}}`) |
| **Imagen** | URL | HTTP o navegación (opcional) |
| **Etiqueta** | texto, alineación | no interactiva |

## Fondos de pantalla

- **Color sólido** — un color hex
- **Gradiente** — from, to y ángulo
- **Imagen** — URL (cover)

## Acciones

### Petición HTTP

```json
{
  "type": "http",
  "endpoint": "/api/volume",
  "method": "POST",
  "payload": { "level": "{{value}}" }
}
```

- `{{value}}` se interpola con el valor del slider en tiempo de ejecución.
- GET envía el payload como query string; el resto como body JSON.
- La URL base del backend AV se configura a nivel de diseño.

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

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/designs` | Listar diseños |
| `GET` | `/api/designs/:name` | Obtener un diseño (JSON) |
| `PUT` | `/api/designs/:name` | Crear o actualizar |
| `DELETE` | `/api/designs/:name` | Borrar |
| `POST` | `/api/designs/:name/generate` | Generar estáticos |

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
├── generated/              # Output del generador (HTML+CSS+JS)
├── dist-editor/            # Editor compilado
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
- El **servidor local** cumple dos roles: servir el editor y servir los diseños generados.
- Las **tablets** solo necesitan un navegador — abren una URL y funcionan.

## Tecnologías

- **TypeScript** — lenguaje único para todo el proyecto
- **React + dnd-kit** — editor con drag-and-drop
- **Vite** — build del editor
- **Express** — servidor local
- **HTML + CSS + JS vanilla** — output del generador (sin framework)
