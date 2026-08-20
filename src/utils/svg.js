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
