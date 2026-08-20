export function observeContainer(container, render) {
  let frame = 0;
  const dimensions = () => Math.max(280, container.clientWidth);
  const draw = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => render(dimensions()));
  };
  render(dimensions());
  if (typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(frame);
  const observer = new ResizeObserver(draw);
  observer.observe(container);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
