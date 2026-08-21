let tooltipSequence = 0;

export function createTooltip() {
  const element = document.createElement("div");
  element.className = "chart-tooltip";
  element.id = `chart-tooltip-${++tooltipSequence}`;
  element.setAttribute("role", "tooltip");
  element.hidden = true;
  document.body.append(element);
  let currentAnchor = null;

  function show(anchor, { title, rows, note = null }) {
    currentAnchor?.removeAttribute("aria-describedby");
    currentAnchor = anchor;
    element.replaceChildren();
    const heading = document.createElement("strong");
    heading.className = "chart-tooltip__title";
    heading.textContent = title;
    const list = document.createElement("dl");
    for (const [label, value] of rows) {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = value;
      list.append(term, detail);
    }
    element.append(heading, list);
    if (note) {
      const context = document.createElement("p");
      context.className = "chart-tooltip__note";
      context.textContent = note;
      element.append(context);
    }
    element.hidden = false;
    element.style.visibility = "hidden";
    const anchorBox = anchor.getBoundingClientRect();
    const tooltipBox = element.getBoundingClientRect();
    const gap = 12;
    let left = anchorBox.right + gap;
    if (left + tooltipBox.width > window.innerWidth - gap) left = anchorBox.left - tooltipBox.width - gap;
    left = Math.max(gap, Math.min(left, window.innerWidth - tooltipBox.width - gap));
    let top = anchorBox.top + anchorBox.height / 2 - tooltipBox.height / 2;
    top = Math.max(gap, Math.min(top, window.innerHeight - tooltipBox.height - gap));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.visibility = "visible";
    anchor.setAttribute("aria-describedby", element.id);
  }

  function hide(anchor = null) {
    (anchor || currentAnchor)?.removeAttribute("aria-describedby");
    currentAnchor = null;
    element.hidden = true;
  }

  return Object.freeze({
    element,
    show,
    hide,
    destroy() {
      currentAnchor?.removeAttribute("aria-describedby");
      currentAnchor = null;
      element.remove();
    }
  });
}
