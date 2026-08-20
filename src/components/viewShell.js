export function registerViewPlaceholder(container, viewName) {
  if (!container) throw new Error(`Missing container for ${viewName}`);
  container.dataset.viewStatus = "placeholder";
  container.dataset.viewName = viewName;
  return container;
}
