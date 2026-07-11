# Plan: Controlador de equipos AV (designer → generador → servidor local)

## Visión
App para **diseñar** interfaces de control AV (botones, sliders, imágenes, etiquetas) asignando a cada elemento un endpoint del backend AV. El diseño se **genera** como HTML+JS+CSS estático puro (sin framework en el reproductor) y se sirve a las tablets mediante un **servidor web local**. El backend AV es intocable: solo lo llamamos.

## Decisiones tomadas
- **Lenguaje:** TypeScript (único lenguaje para editor, generador y servidor)
- **Editor:** React + `dnd-kit` (drag-and-drop) — compila con Vite a `dist-editor/`
- **Salida del generador:** HTML + CSS + JS **vanilla, estático, sin framework**. El reproductor no interpreta nada: el HTML ya está construido.
- **Backend AV:** intocable. Cada elemento del diseño referencia endpoints suyos. La URL base del backend AV es un ajuste a nivel de diseño.
- **Distribución:** servidor web local (Node.js + Express) que sirve los diseños generados. Las tablets abren `http://<servidor-local>/designs/<nombre>/`.
- **Almacenamiento de diseños:** ficheros JSON locales en `data/designs/` (fuente de verdad interna; de ahí se genera el estático).
- **Conectividad:** siempre online (tablets en la misma red que el backend AV y el servidor local).
- **Comportamiento:** solo envía comandos (sin estado en vivo).

## Arquitectura

```
┌─────────────┐   guarda JSON   ┌──────────────┐   genera    ┌─────────────────┐
│   Editor     │───────────────▶│ Servidor     │────────────▶│ HTML+CSS+JS     │
│  (React)     │   carga JSON   │ local (Node) │            │ estático vanilla│
└─────────────┘◀───────────────│              │             └─────────────────┘
                               │  sirve ambos  │                      │
                               └──────┬───────┘                      │ sirve
                                      │                              ▼
                            /editor  │                   ┌───────────────────┐
                          (al diseñador)                │  Tablets (navegador)│
                                                        │  cargan el diseño  │
                                                        └─────────┬─────────┘
                                                                  │ HTTP
                                                                  ▼
                                                        ┌───────────────────┐
                                                        │  Backend AV (intocable) │
                                                        └───────────────────┘
```

## Estructura del proyecto

```
front-rc/
├── src/                    # Backend (servidor + generador + schema)
│   ├── schema/             # Tipos TypeScript del diseño (contrato compartido)
│   ├── generator/          # JSON → HTML+CSS+JS vanilla
│   └── server/             # Express: API + servir editor + servir diseños
├── editor/                 # Editor React (Vite)
│   └── src/
│       ├── components/     # Toolbar, Palette, Canvas, PropertiesPanel, etc.
│       ├── useDesign.ts    # Hook de estado del diseño
│       ├── useKeyboardShortcuts.ts
│       └── api.ts          # Cliente HTTP de la API
├── data/designs/           # Diseños guardados (JSON)
├── generated/              # Diseños generados (HTML+CSS+JS estáticos)
├── dist-editor/            # Editor compilado (build de Vite)
├── vite.config.ts
└── package.json
```

## Comandos
- `npm run dev` — servidor de desarrollo de Vite (puerto 5173, proxy a :3000)
- `npm start` — servidor local Express (puerto 3000)
- `npm run build:editor` — compila el editor a `dist-editor/`
- `npm run typecheck` — typecheck de backend + editor
- Uso completo: `npm run build:editor && npm start` → editor en `:3000`

## Elementos disponibles
- **Botón** — texto, estilo, acción HTTP o navegación
- **Slider** — rango (min/max/step/valor), etiqueta, envío en soltar o arrastrar, acción HTTP
- **Imagen** — URL, acción opcional al pulsar (HTTP o navegación)
- **Etiqueta** — texto, alineación (izq/centro/der), estilo (no interactiva)

## Fondo de pantalla
- Color sólido
- Gradiente (from/to/ángulo)
- Imagen (URL, cover)

## Acciones
- **HTTP** — endpoint + método + payload (con interpolación `{{value}}`)
- **Navegar** — cambia a otra pantalla del diseño

## API REST
| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/designs` | Listar nombres |
| `GET` | `/api/designs/:name` | Obtener JSON |
| `PUT` | `/api/designs/:name` | Crear/actualizar (con validación) |
| `DELETE` | `/api/designs/:name` | Borrar |
| `POST` | `/api/designs/:name/generate` | Generar estáticos |

## Estado del proyecto
- ✅ Fase 1: Esquema TypeScript
- ✅ Fase 2: Prototipo de generación
- ✅ Fase 3: Generador automático
- ✅ Fase 4: Servidor local
- ✅ Fase 5: Editor React
- ✅ Fase 6: Pulido (estilo táctil, UX, robustez, limpieza)
