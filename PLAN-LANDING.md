# PLAN-LANDING — Guía para construir la landing page (jaso-rc + front-rc)

> Documento de referencia para quien (persona o agente) vaya a construir la **página de
> producto**: qué decimos, a quién, con qué pruebas y con qué límites.
>
> **Fusiona el plan de landing de jaso-rc (el servidor de control) con el de front-rc (el
> diseñador de paneles).** Son dos repositorios y dos artefactos, pero **una sola venta**: el
> integrador no compra un servidor, compra *que la sala funcione con un mando que él mismo puede
> cambiar*.
>
> Va de la mano de `PLAN-FRONTEND.md` (jaso-rc), que describe la API real, y del `README.md` de
> cada repo. La diferencia de papel se mantiene: **los READMEs dicen lo que el sistema hace; este
> documento dice lo que podemos prometer**. Nada de la página puede afirmar algo que el código no
> respalde. Cuando dudes, gana el backend.
>
> Documento vivo.

**Las tres decisiones que enmarcan todo lo demás (sin cambios respecto al plan original):**

| | |
|---|---|
| **Objetivo** | Vender. La landing existe para que un integrador **pida una demo o un presupuesto**, no para que se descargue un binario |
| **Formato** | **Sitio estático aparte** (HTML/CSS propio). No lo sirve ningún binario, no vive en la LAN de la instalación |
| **Público principal** | **El integrador AV**: la persona o empresa que monta salas y hoy programa AMX o Crestron |

---

## 0. Lo que cambia al entrar front-rc (léelo antes que nada)

Si vienes del plan anterior de jaso-rc, hay **cuatro cosas que ya no son verdad**, y son
justamente las que más limitaban la venta:

| Antes decía | Ahora |
|---|---|
| «**No hay panel de sala incluido**; lo construye el integrador contra la API» (§5.4) | **Sí lo hay, y se dibuja arrastrando.** front-rc es un diseñador visual que genera el panel |
| «**No enseñes un mockup de panel bonito** dando a entender que viene en la caja» | **Enseña el panel real**: viene en la caja, y una captura suya es de los mejores activos que tenemos |
| «**No hay CORS**: un panel web de otro origen necesita proxy o BFF» (§5.5) | **El BFF es front-rc.** El panel llama a su propio servidor, que reenvía con el token. Resuelto |
| «¿Puedo hacerme mi propio panel? Sí, contra la API» (FAQ) | «**Ya viene hecho el editor**; y si prefieres el tuyo, la API sigue ahí» |

Esto **reordena la jerarquía del mensaje** (§2) y añade dos secciones nuevas a la página (§3.4 y
§3.5). El resto del plan original se mantiene casi intacto, incluidas —sobre todo— las
prohibiciones de §5, que siguen vigentes.

Y añade **una contradicción nueva que hay que gestionar con cuidado**: ver §2.3.

---

## 1. Qué vendemos, y a quién

El producto es **un sistema de control AV dirigido por configuración, con su diseñador de mandos
incluido**. En dos piezas, y conviene contarlas así:

| Pieza | Qué hace | Cómo se despliega |
|---|---|---|
| **jaso-rc** | Habla con los equipos (proyectores, pantallas, mesas de sonido, luces DALI) y publica su control como API HTTP. | Un binario Go + systemd, en un mini-PC Ubuntu |
| **front-rc** | Diseña, genera y sirve el mando táctil que la gente toca en la sala. | Un contenedor Docker, en la misma máquina |

**El integrador da de alta el equipo desde una web y su control queda publicado solo. Luego dibuja
el mando arrastrando y lo abre en una tablet.** Eso es todo el producto, y es todo el argumento.

El público es **el integrador AV**. No es un desarrollador (aunque agradecerá que sea un binario),
y no es el cliente final. Es quien monta la sala, quien vuelve a la obra cuando el cliente pide un
botón nuevo, y quien paga las licencias.

### 1.1 El dolor, en sus palabras

La landing entera se sostiene sobre esto. Ahora son **cinco** huesos, no cuatro: el quinto lo
abre front-rc y es el más caro de todos.

1. **«Cada cambio es programar.»** Añadir un proyector o cambiar un botón en AMX/Crestron
   significa abrir el entorno del fabricante, escribir código, compilar, subir. Un cambio de cinco
   minutos se convierte en una visita a obra.
2. **«Dependo del fabricante.»** Herramientas propietarias, certificaciones, licencias por
   procesador, y un ecosistema del que no se sale.
3. **«El cliente no puede tocar nada.»** Todo pasa por mí, incluso lo trivial.
4. **«No sé qué hay montado.»** La configuración vive dentro de un programa compilado, no en algo
   que se pueda leer.
5. **«El mando es la parte más cara y más rígida de la instalación.»** *(nuevo, front-rc)* Panel
   táctil propietario, licencia por pantalla, y mover un botón de sitio es un ticket. Y el cliente
   **siempre** quiere mover un botón de sitio.

### 1.2 La promesa, en una frase

> **Das de alta el equipo. El control se publica solo. El mando lo dibujas tú.**

Las tres partes importan y en ese orden. Las dos primeras son jaso-rc; la tercera es front-rc y es
la que el cliente final ve.

### 1.3 Qué NO somos (decirlo evita ventas malas)

- No es una consola de control con hardware propio. **Es software**: un binario y un contenedor,
  en un mini-PC con Ubuntu.
- No es un sistema de automatización de edificios. Es **control AV** (+ iluminación DALI).
- **El diseñador no es un editor web general.** Dibuja mandos de sala: botones, sliders,
  imágenes, pantallas. No es Figma, ni un CMS, ni hace webs.
- No es nube. No hay cuenta, no hay servicio, no llama a casa.

---

## 2. Mensaje: la jerarquía

Un visitante decide en cinco segundos. El orden importa más que las palabras. **Cambia respecto
al plan original**: el diseñador sube al nivel 2, porque es lo único de todo el sistema que se
puede *enseñar en una foto* y entender sin explicación.

| Nivel | Qué comunica | Dónde |
|---|---|---|
| **1** | Sustituye a AMX/Crestron sin programar | Titular del hero |
| **2** | Das de alta el equipo → el control existe solo → **dibujas el mando arrastrando** | Subtitular + demo visual |
| **3** | Es real: drivers reales, seguridad real, systemd, paneles en producción | Secciones de prueba |
| **4** | Es tuyo: un binario, YAML legible, HTML plano, sin licencias | Diferenciadores |
| **5** | Hablemos | CTA |

### 2.1 Titulares candidatos

Para elegir uno; están escritos, no son plantillas. **El primero es la recomendación**, y ahora
puede cerrar el círculo entero (equipo → control → mando):

1. **«Control AV sin programar la instalación.»**
   *Sub:* Das de alta el proyector desde el navegador y su control queda publicado al instante
   como API HTTP. Dibujas el mando arrastrando botones. Lo abres en una tablet. Sin recompilar,
   sin volver a la obra.

2. **«El sistema de control que se configura, no se programa.»**
   *Sub:* Lo que en AMX o Crestron es un proyecto de programación, aquí es un formulario y un
   lienzo.

3. **«Tu instalación, en un fichero que puedes leer. Tu mando, en un lienzo.»**
   *Sub:* Sin licencias, sin entorno propietario, sin depender de nadie para cambiar un botón.

⚠️ **Cuidado con la comparación.** AMX y Crestron son marcas registradas de terceros. Compararse
es legítimo, pero **solo con hechos verificables** («no requiere entorno de programación
propietario», «sin licencia por panel»), nunca con juicios de valor («mejor que», «más fiable
que»). Nombrarlas como referencia de categoría es correcto; usar sus logotipos, no.

### 2.2 La frase que resume el par (para el hero o el cierre)

> **jaso-rc habla con los equipos. front-rc es la cara que toca la gente.**

### 2.3 ⚠️ La contradicción que hay que gestionar: «un binario» vs. Docker

El plan original vende jaso-rc con **«Un binario. Sin Node, sin Docker, sin base de datos»** (§3.7)
y advierte de que una landing con 300 KB de JavaScript nos contradiría (§6.1). **front-rc es Node
y se despliega con Docker.** Si no lo abordamos, un lector técnico lo detecta y pierde confianza —
que es exactamente lo que este documento existe para evitar.

**Cómo se resuelve (y es honesto, no un parche):**

- **El control es un binario. El diseñador es una herramienta, y es opcional.** Lo que gobierna la
  sala —lo que no se puede caer— sigue sin runtime: un binario y systemd. front-rc **no está en el
  camino crítico del control**: si el diseñador se cae, los paneles ya generados siguen
  funcionando, porque son HTML estático servido… *(ver el matiz de §5.10: hoy los sirve el propio
  front-rc; dilo con precisión o no lo digas)*.
- **El panel que sale del diseñador sí es «un artefacto sin runtime»**: HTML+CSS+JS plano, sin
  framework. Coherente con el discurso.
- **Redacción recomendada:** «El servidor de control es un binario. El diseñador de paneles corre
  en Docker, en la misma máquina, y solo lo necesitas cuando diseñas.»
- **Lo que NO se puede escribir:** «sin Docker» o «sin Node» como eslogan del sistema completo.
  Era verdad de jaso-rc solo, y ya no lo es del producto que estamos vendiendo.

---

## 3. Estructura de la página, sección a sección

Una sola página larga, con el CTA repetido. Orden pensado para que el escéptico llegue al final;
el integrador AV desconfía por oficio, y con razón.

**Cambios respecto al plan original:** se insertan §3.4 (el diseñador) y §3.5 (el panel), que son
las dos secciones nuevas; el resto conserva su numeración lógica y su contenido.

### 3.1 Hero

- Titular (§2.1) + subtitular.
- **CTA principal**: `Pedir una demo`. **CTA secundario**: `Ver cómo funciona` (ancla).
- **Prueba visual inmediata, no una foto de stock.** Ahora hay dos candidatas y conviene decidir:
  - la captura real de `/ui/devices` con equipos dados de alta y sus badges de estado en vivo —el
    producto literal—, o
  - **el editor de front-rc con un panel a medio dibujar.**

  **Recomendación: el editor.** Es lo único que se entiende sin leer nada, y es lo que separa a
  este producto de «otra API REST». La captura de `/ui/devices` sostiene la sección 3.3, que es
  donde el escéptico quiere pruebas.

### 3.2 El problema (3–5 tarjetas)

Los dolores de §1.1, en su idioma. Corto. Nada de párrafos. **Incluir el nuevo (§1.1.5): el mando
es lo más caro y lo más rígido.**

### 3.3 Cómo funciona — **la sección que vende**

Ahora son **cuatro pasos**, con captura real en cada uno:

1. **Das de alta el equipo.** Eliges tipo → marca → modelo en el catálogo, y el driver, el puerto
   y los comandos ya vienen puestos. Tú pones la IP.
2. **El control se publica solo.** Aparecen los endpoints HTTP de ese equipo. Sin recompilar, sin
   reiniciar el servicio.
3. **Dibujas el mando.** *(nuevo)* Arrastras botones y sliders a un lienzo y **eliges el equipo y
   el comando de un desplegable** —que sale del propio servidor, no de tu memoria—.
4. **Lo cuelgas en la pared.** Generas, y la tablet abre una URL. Sin app, sin licencia por
   pantalla.

Cerrar con el diagrama, que ahora explica el producto entero de un vistazo:

```
Tablet / Web / App  ──HTTP JSON──▶  front-rc  ──HTTP JSON──▶  jaso-rc  ──PJLink · SICP · OSC · RS-232 · DALI──▶  Equipo
   (el panel generado)              (diseña, genera,           (publica el control)
                                     sirve y pone el token)
```

El mensaje: **el integrador nunca toca un protocolo, y ahora tampoco toca un editor de código.**
Eso es lo que compra.

### 3.4 El diseñador de mandos — *(sección nueva)*

La que más se recuerda. Cuatro ideas, con capturas:

- **Arrastras, no programas.** Botones, sliders, imágenes, etiquetas, líneas y rectángulos. Varias
  pantallas por diseño (vídeo, audio, luces) con navegación entre ellas.
- **No puedes equivocarte de comando.** El editor pregunta al servidor qué equipos hay y qué
  admite cada uno, y te ofrece **listas cerradas**. Un comando mal tecleado se descubre en la sala,
  con la reunión empezando: aquí no llega a existir. *(Este es el argumento más fuerte de toda la
  sección; que tenga su propia caja.)*
- **Con la cara del cliente.** Fondos, gradientes, su logo, y **36 iconos SVG de AV incluidos**.
- **Cambiar un botón de sitio son dos minutos.** Lo mueves, generas, la tablet lo tiene al
  recargar. Sin volver a compilar nada.
- **El panel no miente.** El botón se ilumina porque el proyector **dice** que está encendido, no
  porque alguien lo haya pulsado; el fader se coloca en el nivel real de la mesa; y el equipo que
  no responde se ve apagado en el panel. Si alguien enciende el proyector con el mando de la
  pared, el panel se entera.

### 3.5 El panel que sale — *(sección nueva)*

- **Es una web, no una app.** HTML, CSS y JavaScript planos, sin framework ni dependencias.
  Cualquier tablet, Mac, PC o móvil con navegador. Nada que instalar, nada que caduque, ninguna
  tienda de aplicaciones de por medio.
- **Cuelga los paneles que quieras: son URLs.** Sin licencia por pantalla.
- **Dura años.** No hay build que mantener ni framework que en tres años pida una migración. Una
  tablet vieja lo abre igual que una nueva. *(Coherente con el discurso de jaso-rc: un artefacto,
  sin runtime.)*

### 3.6 Escenas de sala (macros)

Un argumento comercial por sí solo, porque es el trabajo de verdad de una sala:

> «Encender sala» es **un botón**. El orden, las esperas y qué hacer si el proyector no contesta
> viven en el servidor, no repetidos en cada panel.

Con el YAML real de `encender-sala`, que se lee sin explicación. Que se vea el `wait_ms: 3000` con
su comentario: *el proyector tarda en arrancar*. Ese detalle le dice a un integrador que quien
escribió esto ha montado salas.

**Y ahora se cierra el círculo, que es lo nuevo:** el panel **no dispara la macro a ciegas**. La
sigue hasta el final y da un veredicto real: *completada*, o **qué paso se rompió y en qué equipo**.

### 3.7 El error dice la verdad — *(caja, va con §3.6)*

Diferenciador barato de contar y caro de imitar:

> Cuando un proyector no arranca, el panel no dice «error 502». Dice **«epson power_on no
> responde»**.

La mayoría de los fallos de una sala no son fallos del software —es un proyector apagado de la
pared o un cable suelto—, y confundirlos manda al técnico a mirar el sitio equivocado. Es un
detalle pequeño que demuestra oficio, que es exactamente lo que compra este público.

### 3.8 Compatibilidad — qué controla hoy

Tabla honesta, **solo drivers que existen** (`internal/drivers/`):

| Familia | Driver | Qué controla |
|---|---|---|
| Proyectores | **PJLink** | Estándar de facto: Epson, Panasonic, NEC, Sony… |
| Displays / cartelería | **Philips SICP** | Pantallas profesionales Philips |
| Audio | **Midas M32 / Behringer X32** (OSC) | Faders, mutes, escenas |
| Iluminación | **DALI** vía pasarela | Direcciones, grupos, escenas, regulación 0–254 |
| Cualquier equipo TCP/UDP | **TCP genérico** | La cadena cruda que el equipo entienda |
| Cualquier equipo serie | **RS-232** | Matrices, pantallas motorizadas, relés |

Y debajo, la frase que convierte la lista corta en una fortaleza:

> ¿Un equipo que no está en la lista? Si habla TCP, UDP o RS-232, ya se controla hoy con los
> drivers genéricos. Y añadir un protocolo nativo es un fichero Go, no un rediseño.

Y la que cierra con el diseñador:

> **Todo lo que jaso-rc controla, front-rc lo dibuja.** El editor no tiene una lista propia de
> equipos: lee la del servidor.

⚠️ **Lo que no se puede escribir en esta tabla**: ver §5. En particular, **DALI está verificado
contra pasarela simulada, no contra una Lunatone física**.

### 3.9 Seguridad — el corte de reputación

Un integrador que ha visto instalaciones abiertas de par en par valora esto. Las cuatro capas de
jaso-rc, en su lenguaje:

- **Redes permitidas.** Solo se aceptan peticiones desde la LAN de control. El resto, 403.
- **Un token por panel.** Revocas el del vestíbulo sin tocar los demás. Del token solo se guarda su
  huella: quien lea el fichero de configuración no entra.
- **Login con contraseña** para las personas, con freno a la fuerza bruta.
- **HTTPS** servido por el propio binario, con certificado incluido.

Y las dos cajas de criterio. La primera ya estaba:

> **La API nunca acepta la cookie de sesión.** Si bastara, cualquier página web que visitara el
> administrador podría apagar un proyector con una etiqueta `<img>` invisible. Con token, no.

La segunda es de front-rc, y es igual de vendedora:

> **El token nunca llega a la tablet.** Una tablet colgada en la pared es un dispositivo público:
> el panel no lleva credenciales. Llama a su propio servidor, y este reenvía la orden poniendo el
> token. Quien descuelgue la tablet no se lleva la llave de la instalación.

⚠️ **Y hay que decir lo que no protege**, porque un integrador lo va a preguntar y porque es la
verdad: **los paneles no piden contraseña, a propósito** —una tablet en la pared no puede
escribirla—. Quien alcance el servidor de paneles puede pulsar un botón, igual que quien alcanza el
mando físico de la pared. **La defensa de los paneles es la red**: una VLAN de control y la lista
blanca de IPs de jaso-rc. Dilo como decisión razonada, no lo escondas: escondido parece un
descuido, contado es criterio.

### 3.10 Instalación y operación

Habla al que va a mantenerlo. **Ojo a §2.3 al redactar esta sección: es donde está la
contradicción.**

- **El control es un binario.** Sin base de datos, sin runtime que actualizar. Un servicio systemd
  endurecido, con instalador idempotente: reinstalar **no pisa** ni tu configuración, ni tus
  equipos, ni tu certificado.
- **El diseñador es un contenedor** (`docker compose up -d`) en la misma máquina. Solo lo necesitas
  cuando diseñas.
- **Todo cabe en dos carpetas de texto.** La configuración de jaso-rc es YAML legible; los diseños
  y las imágenes de front-rc son ficheros en `data/`. **Copia de seguridad, restauración y reset**
  desde las propias webs, y **clonar una instalación entera en otro edificio es restaurar una
  copia**.
- Corre en un **mini-PC con Ubuntu Server**. Sin hardware propietario.

### 3.11 Comparativa

Tabla, solo con hechos comprobables (§2.1). **Añade las dos filas nuevas, que son las que más
duelen al sistema propietario:**

| | Sistema propietario típico | **jaso-rc + front-rc** |
|---|---|---|
| Añadir un equipo | Programar, compilar, subir | **Un formulario web** |
| **Diseñar el mando** | **Entorno propietario y programación** | **Arrastrar y soltar en el navegador** |
| **Paneles táctiles** | **Hardware propietario, licencia por pantalla** | **Cualquier tablet con navegador. Sin licencia** |
| Cambios en caliente | Reinicio del procesador | **Sin reiniciar** |
| Entorno de desarrollo | Propietario, con certificación | **Ninguno** |
| Configuración | Dentro de un programa compilado | **YAML legible + HTML plano** |
| Integración con otro software | SDK del fabricante | **API HTTP + JSON** |
| Licencias | Por procesador / por módulo | *(ver §7.1: pendiente de decidir)* |

### 3.12 Precio / modelo comercial

**Bloqueada hasta decidir §7.1.** Es la sección que más conversiones decide y hoy no podemos
escribirla. Provisionalmente: no inventes una tabla de precios; pon una caja de `Hablemos de tu
instalación` con el formulario, que además cualifica al cliente.

### 3.13 FAQ

Las objeciones reales de un integrador, contestadas sin marketing:

- **¿Necesito saber programar?** *(No. Das de alta el equipo en un formulario y dibujas el mando
  arrastrando.)*
- **¿Y si se cae el servidor?** *(El control es un servicio systemd que rearranca solo; los equipos
  conservan su estado físico: una sala encendida no se apaga porque el control se reinicie.)*
- **¿Funciona sin internet?** *(Sí. Todo es LAN. No hay nube, no hay cuenta, no llama a casa.)*
- **¿Puedo controlar un equipo que no está en la lista?** *(§3.8.)*
- **¿Cuántas tablets puedo colgar?** *(Las que quieras. Es una URL.)*
- **¿Puedo seguir usando mis paneles actuales?** *(Si saben abrir una URL, sí: los comandos se
  ejecutan también por `GET`.)*
- **¿Puedo hacerme mi propio panel en vez de usar el editor?** *(Sí, contra la API. El editor es la
  vía cómoda, no una jaula. Enlazar a PLAN-FRONTEND.md.)*
- **¿Quién es el dueño de la configuración y de los diseños?** *(Tú. Son ficheros de texto en tu
  máquina.)*

### 3.14 CTA final + formulario

Un solo objetivo: **una conversación**. Campos mínimos —nombre, email, y una línea de «qué quieres
montar»— porque cada campo extra cuesta envíos. Ver §6.4: un sitio estático no puede recibir un
formulario por sí solo.

---

## 4. Pruebas: de dónde sale cada afirmación

Regla dura: **toda afirmación de la landing apunta a algo real del repo.** Si no puedes señalarlo,
no lo escribes.

| Afirmación en la página | Respaldo |
|---|---|
| «Se publica solo, sin reiniciar» | Recarga en caliente todo-o-nada, `internal/core/manager.go` (jaso-rc) |
| «Alta guiada por modelo» | Catálogo tipo → marca → modelo, `internal/catalog/` (jaso-rc) |
| «Escenas con esperas y política de fallo» | `configs/macros.yaml`, `internal/core/macro.go` (jaso-rc) |
| «Drivers reales» | `internal/drivers/{pjlink,philipssicp,midasx32,dali,...}` (jaso-rc) |
| «Un token por panel, revocable» | `system.yaml` → `api.tokens[]`, con `readonly` (jaso-rc) |
| «Solo se guarda la huella del token» | SHA-256 en `system.yaml`; `-gen-token` (jaso-rc) |
| «Login con freno a la fuerza bruta» | `internal/httpsec/session.go` (jaso-rc) |
| «HTTPS con certificado incluido» | `-gen-cert`, `internal/httpsec/cert.go` (jaso-rc) |
| «Instalador que no pisa nada» | `deploy/install.sh` idempotente (jaso-rc) |
| **«Diseñas el mando arrastrando»** | **Editor React con dnd-kit, `editor/` (front-rc)** |
| **«El editor no te deja inventarte un comando»** | **`GET /api/designs/:name/devices` → desplegables cerrados, `src/server/av.ts` (front-rc)** |
| **«El panel es HTML+CSS+JS sin framework»** | **`src/generator/` (front-rc)** |
| **«El token nunca llega a la tablet»** | **Proxy `/av/:name/*` con Bearer del servidor, `src/server/av.ts` (front-rc)** |
| **«El panel sigue la macro y dice qué falló»** | **Sondeo de `GET /api/runs/{id}` en el runtime generado, `src/generator/js.ts` (front-rc)** |
| **«El botón refleja el estado real del equipo»** | **Sondeo de `GET /api/devices/{id}/status` y clases `rc-active` / `rc-offline`, `src/generator/js.ts` (front-rc)** |
| **«El equipo que no responde se ve apagado en el panel»** | **`reachable: false` → `rc-offline` (front-rc)** |
| **«36 iconos SVG de AV incluidos»** | **`data/assets/` (front-rc)** |
| «Copia y restauración» | `internal/backup/` + `/ui/system` (jaso-rc) y `/api/backup` (front-rc) |

**Las capturas de pantalla son el mejor activo comercial que tenemos**, y son gratis. La lista, por
orden de valor:

1. **El editor de front-rc con un panel a medio dibujar** (lienzo + paleta + propiedades). *La
   más importante: es la única que se entiende sin leer.*
2. **El desplegable de equipos abierto**, enseñando equipos y macros reales del servidor. *Es la
   prueba literal de «no puedes equivocarte de comando».*
3. **`/ui/endpoints`** de jaso-rc con los endpoints de un proyector recién dado de alta. *Es la
   demostración literal de «el control se publica solo».*
4. **`/ui/devices`** con estado en vivo, y `/ui/macros`.
5. **El panel generado, en una tablet colgada en la pared.** *La foto que remata la página.*
6. **El aviso de error legible** del panel («epson power_on no responde»). *Cuenta la historia de
   §3.7 en una imagen.*

Tómalas con datos de una sala plausible (`proyector-sala1`, `pantalla`, `luz-sala1`), nunca con
`test`, `aaa`, `equipo-demo` o IPs de tu casa.

---

## 5. Lo que NO podemos prometer

Esta sección existe para que un agente que genere la copia no rellene huecos con optimismo. Un
integrador descubre la mentira **el día de la puesta en marcha**, que es el peor día posible.

**Vigentes del plan original:**

1. **DALI Lunatone no está verificado contra hardware físico.** Los paths REST llevan un
   `TODO(verificar)` en `lunatone.go`. Funciona de punta a punta contra pasarela simulada. → Se
   puede decir «soporte DALI vía pasarela». **No** «compatible con Lunatone DALI-2» como una
   casilla cerrada.
2. **No hay estado en vivo por push.** El estado se consulta (polling), no se empuja. → No prometas
   «monitorización en tiempo real». Di «estado en vivo bajo consulta».
3. **La administración de jaso-rc es solo por su web.** No hay API JSON para crear equipos o
   macros. → No prometas «totalmente automatizable por API».
4. **No hay instalaciones de referencia ni testimonios.** → Cero logos de clientes, cero citas
   inventadas, cero «+50 salas». Si no hay clientes, la honestidad **es** el argumento: enseña la
   ingeniería, que es de verdad.
5. **Las macros no se pueden cancelar** una vez lanzadas, ni encolar.
6. **Un solo proyecto, sin equipo detrás.** No escribas «nuestro equipo» ni inventes una empresa.
   Si hace falta una voz, es la de un ingeniero que ha montado salas.

**Nuevas, de front-rc:**

7. **El estado del panel se consulta, no se empuja** (igual que en jaso-rc, §5.2). El botón se
   ilumina cuando el proyector dice que está encendido, y el fader refleja el nivel real, pero con
   un sondeo cada 5 s: **no es instantáneo**. → Di «el panel refleja el estado real del equipo».
   **No** digas «en tiempo real» ni «al instante».
   Y hay dos matices que sí hay que respetar: **solo se puede reflejar lo que el driver publica**
   (varía por equipo: lo que hay es lo que devuelve su `/status`), y **el estado que no se publica
   no se inventa** —el elemento se queda como está—.
8. **El panel no piden contraseña** (§3.9). No lo vendas como «panel seguro»: véndelo como «el
   token no viaja a la tablet» —que es verdad— y remite a la red para lo demás.
9. **El diseñador no es responsive automático.** El diseño se dibuja en un lienzo de tamaño fijo y
   se escala al viewport. → No prometas «se adapta a cualquier pantalla» en el sentido de un
   diseño web adaptativo: se **escala**, que no es lo mismo.
10. **Los paneles los sirve front-rc.** Si el diseñador está caído, las tablets no cargan el panel
    (aunque jaso-rc siga controlando la sala). → Puedes decir «el panel es estático y no depende
    del editor para funcionar», pero **no** «los paneles siguen funcionando aunque se caiga
    front-rc», salvo que se sirvan desde otro sitio.
11. **No hay editor de macros en front-rc.** Las macros se definen en el YAML de jaso-rc; el
    diseñador solo las **ofrece y las dispara**. → No prometas «diseña escenas desde el editor».
12. **No hay multiusuario, ni roles, ni historial de cambios** en el editor. Una contraseña, una
    sesión.

---

## 6. Requisitos técnicos de la landing

Sitio estático, aparte de los dos artefactos. Eso da libertad, pero fija cosas:

### 6.1 Stack

**HTML + CSS a mano, sin framework.** El sitio son ~10 secciones y un formulario; React aquí es un
impuesto. Y es coherente con el producto: **el panel que vendemos es HTML plano sin framework**;
una landing con 300 KB de JavaScript se contradiría en su propia página. Si hace falta JS, que sea
un puñado de líneas (menú, ancla suave, lazy de capturas).

### 6.2 Rendimiento y calidad

- **Sin dependencias externas**: fuentes y assets servidos desde el propio sitio, no desde un CDN.
  Nada de trackers de terceros.
- Capturas en **WebP**, con `width`/`height` para que no salte el layout.
- **Responsive de verdad**: buena parte del público la abrirá desde el móvil, en obra.
- **Accesible**: contraste AA, navegación con teclado, `alt` en las capturas (que además es donde
  caben las palabras clave).
- **Modo claro y oscuro**, siguiendo `prefers-color-scheme`.

### 6.3 Identidad visual

- Hereda de la UI de administración de jaso-rc (`internal/web/assets/style.css`): **misma paleta y
  misma tipografía**. La landing debe parecerse a lo que el cliente verá después.
- ⚠️ **Y ahora hay una segunda interfaz que enseñar (el editor de front-rc).** Si sus paletas no
  coinciden, la página se ve como dos productos pegados. **Decidir**: o se unifica la paleta del
  editor con la de la UI de jaso-rc, o la landing usa un marco visual neutro que enmarque las dos
  capturas sin fingir que son la misma pantalla. *(Decisión de §7.6.)*
- Estética: **técnica, sobria, densa**. Nada de degradados morados ni ilustraciones isométricas. El
  público reconoce el producto serio porque **enseña producto**, no metáforas.
- Los activos visuales centrales son las **capturas reales**, el **YAML legible** y el **lienzo del
  editor**. Un bloque de código bien tipografiado convence a este público más que cualquier
  ilustración.

### 6.4 ⚠️ El formulario: el único hueco técnico real

Un sitio estático **no puede recibir un formulario**. Hay que decidirlo antes de maquetarlo, porque
cambia el marcado:

| Opción | Coste | Nota |
|---|---|---|
| **`mailto:` / email visible** | Cero | Convierte peor, pero funciona hoy y no depende de nadie |
| **Servicio externo** (Formspree, Buttondown…) | Bajo | Un tercero ve los datos de tus clientes potenciales |
| **Endpoint propio** | Medio | Coherente con «sin nube», pero ya no es un sitio estático |

Recomendación: **email visible + un servicio externo** para el formulario mientras no haya volumen.
No bloquees la landing por esto.

### 6.5 SEO

Búsquedas reales del público, en castellano y en inglés: «alternativa a Crestron», «control AV sin
programar», «PJLink API HTTP», «control DALI API REST», «sustituto AMX», «open source AV control
system», y las nuevas que abre front-rc: **«panel de control AV en tablet», «interfaz táctil sala
de reuniones», «crear panel de control AV sin programar», «touch panel alternative»**.

Lo mínimo, y basta: `<title>` y `meta description` escritos a mano, Open Graph con una captura de
verdad (esto es lo que se ve cuando alguien comparte el enlace por WhatsApp) —**y aquí la captura
que gana es la del editor o la de la tablet, no una tabla de endpoints**—, un `h1` único, HTML
semántico y URLs limpias.

---

## 7. Decisiones pendientes (bloquean parte de la copia)

Ninguna la puede tomar quien maqueta. Son tuyas:

1. **Modelo comercial.** ¿Licencia por instalación, soporte anual, llave en mano? Sin esto, §3.11 y
   §3.12 quedan cojas, y son las que cierran la venta. **Y ahora hay una pregunta más: ¿se venden
   por separado?** Recomendación: **no**. Un servidor de control sin mando no resuelve el dolor del
   cliente, y el diseñador sin servidor no controla nada. Véndelo como un sistema.
2. **Licencia del código.** **Hoy ningún repositorio tiene fichero `LICENSE`**, lo que legalmente
   significa «todos los derechos reservados». Si vas a vender, decide si el código es cerrado,
   abierto con soporte de pago, o dual —**y decídelo para los dos repos a la vez**—. Un integrador
   **preguntará** qué pasa con su instalación si tú desapareces, y es la objeción más razonable que
   existe.
3. **Nombre comercial y dominio.** `jaso-rc` y `front-rc` son nombres de repositorio, no de
   producto. **Y ahora hace falta un nombre para el conjunto**, porque es lo que se vende. Los
   nombres internos pueden sobrevivir como los de las dos piezas.
4. **Quién firma.** ¿Una empresa, o tú? Cambia toda la voz de la página.
5. **Idioma.** El código y las UIs están en castellano. Si el objetivo es solo España, castellano y
   ya. Si no, hay que planificar el inglés desde el marcado, no después.
6. **Unificación visual de las dos UIs** (§6.3). Barato de arreglar ahora, caro cuando haya
   capturas hechas y clientes que ya han visto la página.

---

## 8. Roadmap de construcción

Cada fase deja algo publicable; ninguna depende de las decisiones de §7 salvo donde se dice.

- **Fase L0 — Material.** Levantar **el sistema completo** con una sala plausible: equipos dados de
  alta en jaso-rc, **un panel de verdad diseñado en front-rc**, y una tablet enseñándolo. Tomar las
  seis capturas de §4. Sin esto, todo lo demás es un maquetado con cajas grises. *(Es la fase que
  más valor aporta y la única que no se puede saltar. Y ahora es más trabajo que antes: hay que
  diseñar un panel que se pueda enseñar sin vergüenza.)*
- **Fase L1 — Copia.** Escribir el texto completo antes de maquetar: titular (§2.1), cuatro pasos
  (§3.3), objeciones (§3.13). Contrastar cada frase contra §4 y §5.
- **Fase L2 — Maquetación.** HTML semántico + CSS con la paleta acordada (§6.3). Hero, problema,
  cómo funciona, diseñador, panel, macros, compatibilidad, seguridad, instalación, FAQ, CTA.
- **Fase L3 — Conversión.** Formulario (§6.4), CTA repetido, email visible.
- **Fase L4 — Pulido.** Responsive, modo oscuro, accesibilidad, Open Graph, rendimiento.
- **Fase L5 (requiere §7) — Comercial.** Precio, licencia, comparativa completa, y el primer caso
  real en cuanto exista una instalación de la que se pueda hablar.

---

## 9. La regla que resume el documento

El público de esta página **detecta el humo en cinco segundos**, porque se lo venden todas las
semanas. La ventaja de este sistema no es que suene mejor: es que **es verdad**, y se puede
enseñar. Una captura de `/ui/endpoints` con los endpoints de un proyector recién dado de alta, y
otra del editor con el desplegable abierto enseñando los comandos reales de ese proyector,
convencen más que cualquier adjetivo que podamos escribir.

**Enseña el producto. Reconoce los límites. Pide la conversación.**
