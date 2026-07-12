import type { Design, DesignElement, LabelElement } from "../schema/design.ts";
import type { Background, ElementStyle, Position } from "../schema/style.ts";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function styleString(pos: Position, style?: ElementStyle): string {
  const parts = [
    `left:${pos.x}px`,
    `top:${pos.y}px`,
    `width:${pos.width}px`,
    `height:${pos.height}px`,
  ];
  if (style) {
    if (style.backgroundColor) parts.push(`background-color:${style.backgroundColor}`);
    if (style.color) parts.push(`color:${style.color}`);
    if (style.fontSize !== undefined) parts.push(`font-size:${style.fontSize}px`);
    if (style.borderRadius !== undefined) parts.push(`border-radius:${style.borderRadius}px`);
    if (style.borderColor) parts.push(`border-color:${style.borderColor}`);
    if (style.borderWidth !== undefined) {
      parts.push(`border-width:${style.borderWidth}px`);
      parts.push(`border-style:solid`);
    }
    if (style.opacity !== undefined) parts.push(`opacity:${style.opacity}`);
  }
  return parts.join(";");
}

function backgroundCss(bg: Background): string {
  switch (bg.type) {
    case "color":
      return `background:${bg.color}`;
    case "gradient":
      return `background:linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
    case "image":
      return `background:url('${bg.src}') center/cover no-repeat`;
  }
}

function alignCss(el: LabelElement): string {
  switch (el.align ?? "left") {
    case "center": return "justify-content:center";
    case "right": return "justify-content:flex-end";
    default: return "justify-content:flex-start";
  }
}

function elementHtml(el: DesignElement): string {
  const style = styleString(el.position, el.style);

  switch (el.type) {
    case "button":
      return `      <button id="${el.id}" class="rc-btn" style="${style}">${escapeHtml(el.label)}</button>`;

    case "slider":
      return `      <div class="rc-slider" style="${style}">
        ${el.label ? `<label for="${el.id}">${escapeHtml(el.label)}</label>` : ""}
        <input type="range" id="${el.id}" min="${el.min}" max="${el.max}" step="${el.step}" value="${el.value}">
      </div>`;

    case "image":
      return `      <img id="${el.id}" class="rc-img" src="${el.src}" alt="" style="${style}">`;

    case "label":
      return `      <div id="${el.id}" class="rc-label" style="${style};${alignCss(el)}">${escapeHtml(el.text)}</div>`;

    case "line":
      return `      <div id="${el.id}" class="rc-line" style="${style}"></div>`;

    case "rectangle":
      return `      <div id="${el.id}" class="rc-rect" style="${style}"></div>`;
  }
}

export function generateHtml(design: Design): string {
  const screens = design.screens
    .map((screen, i) => {
      const cls = i === 0 ? "screen active" : "screen";
      const bgAttr = screen.background ? ` style="${backgroundCss(screen.background)}"` : "";
      const elements = screen.elements.map(elementHtml).join("\n");
      return `    <div id="screen-${screen.id}" class="${cls}"${bgAttr}>
${elements}
    </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(design.config.name)}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="rc-canvas">
${screens}
  </div>
  <script src="app.js"></script>
</body>
</html>
`;
}
