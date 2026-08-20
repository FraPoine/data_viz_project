import { VISUAL_SYSTEM } from "../config/visualSystem.js";
import { formatUsdCompact } from "../utils/format.js";
import { linearScale, roundedMoneyMaximum, stableJitter } from "../utils/scale.js";
import { appendSvg, configureAccessibleSvg, createSvgElement, drawFilmMark } from "../utils/svg.js";
import { observeContainer } from "../utils/resize.js";

const { colors, filmShapes } = VISUAL_SYSTEM;
const STUDIO_COLOR = { "Walt Disney Animation Studios": colors.wdas, "Pixar Animation Studios": colors.pixar, "DreamWorks Animation": colors.dreamworks, "Walt Disney Pictures": colors.disneyRemake };
const GROUP_ORDER = ["Animated first entry", "Animated franchise extension", "Disney remake/reimagining layer"];

export function initView4(container, { films, strategySummary }) {
  if (!container) throw new Error("Missing container for View 4");
  const host = container.querySelector(".chart-host");
  const availableFilms = films.filter((film) => film.domestic_box_office_usd_jul2026 !== null);
  const render = (availableWidth) => {
    host.replaceChildren();
    const narrow = availableWidth < 720;
    const width = narrow ? 760 : 1020;
    const height = narrow ? 520 : 475;
    const margin = { left: narrow ? 250 : 285, right: 35, top: 56, bottom: 62 };
    const maximum = roundedMoneyMaximum(Math.max(...availableFilms.map((film) => film.domestic_box_office_usd_jul2026)));
    const x = linearScale(0, maximum, margin.left, width - margin.right);
    const groupY = [132, 252, 372];
    const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart chart--strategy" });
    configureAccessibleSvg(svg, {
      titleId: "view-4-svg-title", descriptionId: "view-4-svg-description",
      label: "Adjusted domestic gross distributions for first entries, franchise extensions, and Disney remakes",
      description: "A zero-origin horizontal strip plot groups films by strategy. Individual films use subdued studio shapes and deterministic vertical jitter. Dark median markers use the precomputed data summaries. Missing financial values are omitted. The comparison is descriptive, not causal."
    });
    host.append(svg);
    appendSvg(svg, "text", { x: margin.left, y: 24, class: "chart-kicker" }, "U.S. DOMESTIC THEATRICAL GROSS · JULY-2026 USD EQUIVALENT");
    for (let tick = 0; tick <= maximum; tick += 100_000_000) {
      const tx = x(tick);
      appendSvg(svg, "line", { x1: tx, x2: tx, y1: margin.top, y2: height - margin.bottom, class: tick === 0 ? "axis-line" : "chart-grid" });
      appendSvg(svg, "text", { x: tx, y: height - 25, "text-anchor": "middle", class: "axis-label" }, formatUsdCompact(tick));
    }
    GROUP_ORDER.forEach((group, index) => {
      const y = groupY[index];
      const summary = strategySummary.find((row) => row.strategy_group === group);
      appendSvg(svg, "line", { x1: margin.left, x2: width - margin.right, y1: y, y2: y, class: "strip-baseline" });
      appendSvg(svg, "text", { x: margin.left - 18, y: y - 9, "text-anchor": "end", class: "strategy-label" }, group);
      appendSvg(svg, "text", { x: margin.left - 18, y: y + 13, "text-anchor": "end", class: "chart-note" }, `${summary.domestic_available} available / ${summary.total_films} total`);
      availableFilms.filter((film) => film.strategy_group === group).forEach((film) => {
        const cx = x(film.domestic_box_office_usd_jul2026);
        const cy = y + stableJitter(film.film_id, 25);
        const mark = drawFilmMark(svg, filmShapes[film.studio], cx, cy, 4.2, { fill: STUDIO_COLOR[film.studio], class: "strategy-point", id: `view4-film-${film.film_id}`, "data-film-id": film.film_id });
        appendSvg(mark, "title", {}, `${film.title}, ${group}, ${formatUsdCompact(film.domestic_box_office_usd_jul2026)}`);
      });
      const medianX = x(summary.median_domestic_box_office_usd_jul2026);
      appendSvg(svg, "line", { x1: medianX, x2: medianX, y1: y - 39, y2: y + 39, class: "median-marker" });
      drawFilmMark(svg, "diamond", medianX, y, 7, { fill: colors.exceptionalRelease, class: "median-diamond" });
      appendSvg(svg, "text", { x: medianX, y: y - 45, "text-anchor": "middle", class: "median-label" }, `Median ${formatUsdCompact(summary.median_domestic_box_office_usd_jul2026)}`);
    });
  };
  container.dataset.viewStatus = "rendered";
  return observeContainer(host, render);
}
