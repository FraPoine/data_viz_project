const SVG_NS = "http://www.w3.org/2000/svg";

export function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tagName);
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined) element.setAttribute(name, String(value));
  }
  return element;
}

export function configureAccessibleSvg(svg, { titleId, descriptionId, label, description }) {
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", `${titleId} ${descriptionId}`);

  const title = createSvgElement("title", { id: titleId });
  title.textContent = label;
  const desc = createSvgElement("desc", { id: descriptionId });
  desc.textContent = description;

  svg.prepend(desc);
  svg.prepend(title);
  return svg;
}

export function appendSvg(parent, tagName, attributes = {}, text = null) {
  const element = createSvgElement(tagName, attributes);
  if (text !== null) element.textContent = text;
  parent.append(element);
  return element;
}

export function drawFilmMark(parent, shape, x, y, size, attributes = {}) {
  if (shape === "circle") return appendSvg(parent, "circle", { cx: x, cy: y, r: size, ...attributes });
  if (shape === "square") return appendSvg(parent, "rect", { x: x - size, y: y - size, width: size * 2, height: size * 2, ...attributes });
  const points = shape === "triangle-up"
    ? `${x},${y - size * 1.25} ${x - size * 1.1},${y + size} ${x + size * 1.1},${y + size}`
    : `${x},${y - size * 1.35} ${x - size * 1.15},${y} ${x},${y + size * 1.35} ${x + size * 1.15},${y}`;
  return appendSvg(parent, "polygon", { points, ...attributes });
}

export function linePath(points) {
  return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}
