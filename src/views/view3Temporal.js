import { VISUAL_SYSTEM } from "../config/visualSystem.js";
import { formatAdjustedDomestic, formatDate, formatUsdCompact, formatYearLabel } from "../utils/format.js";
import { createTooltip } from "../components/tooltip.js";
import { renderFilmDetail } from "../components/filmDetail.js";
import { createFilmNavigation } from "../utils/focusNavigation.js";
import { dateScale, linearScale, roundedMoneyMaximum } from "../utils/scale.js";
import { appendSvg, configureAccessibleSvg, createSvgElement, drawFilmMark, linePath } from "../utils/svg.js";
import { observeContainer } from "../utils/resize.js";

const { colors, filmShapes, labels } = VISUAL_SYSTEM;
const ANIMATED = new Set(["CORE_WDAS", "DISNEY_PIXAR", "CORE_DWA"]);
const STUDIO_COLOR = { "Walt Disney Animation Studios": colors.wdas, "Pixar Animation Studios": colors.pixar, "DreamWorks Animation": colors.dreamworks };
const START = new Date("1998-01-01T00:00:00Z");
const END = new Date("2026-12-31T00:00:00Z");

function addPixarPattern(svg) {
  const defs = appendSvg(svg, "defs");
  const pattern = appendSvg(defs, "pattern", { id: "pixar-hatch", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  appendSvg(pattern, "rect", { width: 8, height: 8, fill: colors.pixar });
  appendSvg(pattern, "line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#ffffff", "stroke-width": 2, opacity: 0.7 });
}

function renderReleaseChart(host, releaseCounts, availableWidth) {
  host.replaceChildren();
  const narrow = availableWidth < 720;
  const width = narrow ? 760 : 1120;
  const height = narrow ? 300 : 265;
  const margin = { left: narrow ? 112 : 150, right: 24, top: 34, bottom: 45 };
  const plotWidth = width - margin.left - margin.right;
  const step = plotWidth / releaseCounts.length;
  const barWidth = Math.max(5, step * 0.62);
  const barHeight = linearScale(0, 3, 0, 58);
  const baselines = { disney: 110, dreamworks: 205 };
  const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart chart--release" });
  configureAccessibleSvg(svg, {
    titleId: "view-3-release-title", descriptionId: "view-3-release-description",
    label: "Annual theatrical release activity, 1998 to 2026",
    description: "Aligned zero-baseline rows compare Disney animated releases, stacked by Walt Disney Animation Studios and Pixar, with DreamWorks Animation releases. Counts range from zero to three; 2026 is partial through 18 August."
  });
  addPixarPattern(svg);
  host.append(svg);
  appendSvg(svg, "text", { x: margin.left, y: 18, class: "chart-kicker" }, "ANNUAL THEATRICAL RELEASES");
  [["Disney animated", baselines.disney], ["DreamWorks", baselines.dreamworks]].forEach(([name, baseline]) => {
    appendSvg(svg, "line", { x1: margin.left, x2: width - margin.right, y1: baseline, y2: baseline, class: "axis-line" });
    appendSvg(svg, "text", { x: margin.left - 12, y: baseline - 24, "text-anchor": "end", class: "row-label" }, name);
    for (const count of [1, 2, 3]) {
      const y = baseline - barHeight(count);
      appendSvg(svg, "line", { x1: margin.left - 4, x2: width - margin.right, y1: y, y2: y, class: "chart-grid chart-grid--subtle" });
      appendSvg(svg, "text", { x: margin.left - 12, y: y + 4, "text-anchor": "end", class: "axis-label" }, count);
    }
  });
  releaseCounts.forEach((row, index) => {
    const x = margin.left + index * step + (step - barWidth) / 2;
    const wdasHeight = barHeight(row.wdas);
    const pixarHeight = barHeight(row.pixar);
    if (row.wdas) appendSvg(svg, "rect", { x, y: baselines.disney - wdasHeight, width: barWidth, height: wdasHeight, fill: colors.wdas, class: "release-segment", "data-release-year": row.release_year, "data-studio": "Walt Disney Animation Studios" });
    if (row.pixar) appendSvg(svg, "rect", { x, y: baselines.disney - wdasHeight - pixarHeight, width: barWidth, height: pixarHeight, fill: "url(#pixar-hatch)", class: "release-segment", "data-release-year": row.release_year, "data-studio": "Pixar Animation Studios" });
    if (row.dreamworks) appendSvg(svg, "rect", { x, y: baselines.dreamworks - barHeight(row.dreamworks), width: barWidth, height: barHeight(row.dreamworks), fill: colors.dreamworks, class: "release-segment", "data-release-year": row.release_year, "data-studio": "DreamWorks Animation" });
    const showYear = row.release_year === 1998 || row.release_year === 2026 || (row.release_year % (narrow ? 5 : 3) === 0 && !(narrow && row.release_year === 2025));
    if (showYear) appendSvg(svg, "text", { x: x + barWidth / 2, y: height - 18, "text-anchor": "middle", class: "axis-label" }, formatYearLabel(row.release_year));
  });
  appendSvg(svg, "rect", { x: margin.left + 8, y: 124, width: 10, height: 10, fill: colors.wdas });
  appendSvg(svg, "text", { x: margin.left + 24, y: 133, class: "chart-note" }, "WDAS");
  appendSvg(svg, "rect", { x: margin.left + 78, y: 124, width: 10, height: 10, fill: "url(#pixar-hatch)" });
  appendSvg(svg, "text", { x: margin.left + 94, y: 133, class: "chart-note" }, "Pixar");
  appendSvg(svg, "text", { x: width - margin.right, y: height - 1, "text-anchor": "end", class: "chart-note" }, labels.partial2026);
}

function renderFinancialChart(host, films, rollingDomestic, availableWidth) {
  host.replaceChildren();
  const narrow = availableWidth < 720;
  const width = narrow ? 780 : 1120;
  const height = narrow ? 600 : 650;
  const margin = { left: narrow ? 92 : 116, right: narrow ? 200 : 190, top: 48, bottom: 68 };
  const animatedFilms = films.filter((film) => ANIMATED.has(film.corpus_assignment) && film.domestic_box_office_usd_jul2026 !== null);
  const maximum = roundedMoneyMaximum(Math.max(...animatedFilms.map((film) => film.domestic_box_office_usd_jul2026)));
  const x = dateScale(START, END, margin.left, width - margin.right);
  const y = linearScale(0, maximum, height - margin.bottom, margin.top);
  const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart chart--financial" });
  configureAccessibleSvg(svg, {
    titleId: "view-3-financial-title", descriptionId: "view-3-financial-description",
    label: "Adjusted U.S. domestic theatrical gross and five-year trailing medians over time",
    description: "A zero-origin linear chart plots 105 animated films by exact release date and adjusted domestic gross. Thick precomputed median lines show Disney animated and DreamWorks trends. Dashed halos identify unusual release contexts, especially around 2020 and 2021."
  });
  host.append(svg);
  appendSvg(svg, "text", { x: margin.left, y: 22, class: "chart-kicker" }, "U.S. DOMESTIC THEATRICAL GROSS · JULY-2026 USD EQUIVALENT");
  for (let tick = 0; tick <= maximum; tick += 100_000_000) {
    const ty = y(tick);
    appendSvg(svg, "line", { x1: margin.left, x2: width - margin.right, y1: ty, y2: ty, class: tick === 0 ? "axis-line" : "chart-grid" });
    appendSvg(svg, "text", { x: margin.left - 12, y: ty + 4, "text-anchor": "end", class: "axis-label" }, formatUsdCompact(tick));
  }
  for (let year = 1998; year < 2026; year += narrow ? 7 : 4) {
    const tx = x(new Date(`${year}-01-01T00:00:00Z`));
    appendSvg(svg, "line", { x1: tx, x2: tx, y1: margin.top, y2: height - margin.bottom, class: "chart-grid chart-grid--subtle" });
    appendSvg(svg, "text", { x: tx, y: height - margin.bottom + 26, "text-anchor": "middle", class: "axis-label" }, year);
  }
  const endX = x(new Date("2026-12-31T00:00:00Z"));
  appendSvg(svg, "text", { x: endX, y: height - margin.bottom + 26, "text-anchor": "middle", class: "axis-label" }, "2026*");
  const covidX = x(new Date("2020-01-01T00:00:00Z"));
  appendSvg(svg, "line", { x1: covidX, x2: covidX, y1: margin.top + 10, y2: height - margin.bottom, class: "context-rule" });
  appendSvg(svg, "text", { x: covidX + 8, y: margin.top + 18, class: "context-label" }, "2020–21: unusual release conditions");
  const marksLayer = appendSvg(svg, "g", { class: "film-marks", role: "list" });
  animatedFilms.forEach((film) => {
    const cx = x(new Date(`${film.release_date}T00:00:00Z`));
    const cy = y(film.domestic_box_office_usd_jul2026);
    const group = appendSvg(marksLayer, "g", { class: "film-mark", "data-film-id": film.film_id, "data-release-year": film.release_year, "data-studio": film.studio });
    appendSvg(group, "circle", { cx, cy, r: 11.5, class: "selection-ring" });
    if (film.has_release_context_caveat) appendSvg(group, "circle", { cx, cy, r: 8.5, class: "exception-halo" });
    const mark = drawFilmMark(group, filmShapes[film.studio], cx, cy, 4.2, {
      fill: STUDIO_COLOR[film.studio], class: "film-point", id: `view3-film-${film.film_id}`,
      "data-film-id": film.film_id, "data-release-year": film.release_year, role: "option",
      "aria-label": `${film.title}, ${film.studio}, released ${formatDate(film.release_date)}, adjusted U.S. domestic gross ${formatAdjustedDomestic(film.domestic_box_office_usd_jul2026)}`
    });
    appendSvg(mark, "title", {}, `${film.title}, ${film.studio}, ${formatUsdCompact(film.domestic_box_office_usd_jul2026)}`);
  });
  const sides = [
    { name: labels.disneyAnimatedAggregate, color: colors.disneyAnimatedAggregate },
    { name: "DreamWorks", color: colors.dreamworks }
  ];
  sides.forEach((side) => {
    const rows = rollingDomestic.filter((row) => row.animated_side === side.name);
    const points = rows.map((row) => [x(new Date(`${row.window_end_year}-07-01T00:00:00Z`)), y(row.median_domestic_box_office_usd_jul2026)]);
    appendSvg(svg, "path", { d: linePath(points), fill: "none", stroke: colors.background, "stroke-width": 8, "stroke-linejoin": "round", "stroke-linecap": "round", class: "trend-underlay" });
    appendSvg(svg, "path", { d: linePath(points), fill: "none", stroke: side.color, "stroke-width": 4.5, "stroke-linejoin": "round", "stroke-linecap": "round", class: "trend-line", "data-animated-side": side.name, tabindex: 0, role: "button", "aria-label": `Focus ${side.name} five-year trailing median trend` });
    const [lastX, lastY] = points.at(-1);
    appendSvg(svg, "line", { x1: lastX, x2: lastX + 14, y1: lastY, y2: lastY, stroke: side.color, "stroke-width": 3 });
    appendSvg(svg, "text", { x: lastX + 20, y: lastY + 4, fill: side.color, class: "direct-line-label", "data-animated-side": side.name }, side.name);
  });
  appendSvg(svg, "text", { x: width - margin.right, y: height - 12, "text-anchor": "end", class: "chart-note" }, labels.partial2026);
}

export function initView3(container, { films, releaseCounts, rollingDomestic }) {
  if (!container) throw new Error("Missing container for View 3");
  const releaseHost = container.querySelector(".release-chart-host");
  const financialHost = container.querySelector(".financial-chart-host");
  const detailHost = document.querySelector("#view-3-detail");
  const animatedFilms = films.filter((film) => ANIMATED.has(film.corpus_assignment) && film.domestic_box_office_usd_jul2026 !== null);
  const filmById = new Map(animatedFilms.map((film) => [film.film_id, film]));
  const tooltip = createTooltip();
  let activeFilmId = null;
  let selectedFilmId = null;
  let focusedSide = null;

  financialHost.tabIndex = 0;
  financialHost.setAttribute("role", "listbox");
  financialHost.setAttribute("aria-label", "Explore 105 animated films chronologically. Use arrow keys to move, Enter or Space to select, and Escape to clear selection.");
  financialHost.setAttribute("aria-describedby", "view-3-keyboard-instructions");

  function markForFilm(filmId) {
    return financialHost.querySelector(`#view3-film-${filmId}`);
  }

  function tooltipContent(film) {
    let note = null;
    if (film.film_id === "PIXAR_2020_SOUL") note = "Soul: U.S. gross reflects a later theatrical re-release.";
    else if (film.has_release_context_caveat) note = `Release context: ${film.release_context.replaceAll("_", " ")}.`;
    return {
      title: film.title,
      rows: [["Studio", film.studio], ["Release date", formatDate(film.release_date)], ["Adjusted U.S. domestic gross", formatAdjustedDomestic(film.domestic_box_office_usd_jul2026)]],
      note
    };
  }

  function applyReleaseSelection() {
    const selected = filmById.get(selectedFilmId);
    releaseHost.querySelectorAll(".release-segment").forEach((segment) => {
      const matches = selected && Number(segment.dataset.releaseYear) === selected.release_year && segment.dataset.studio === selected.studio;
      segment.classList.toggle("is-coordinated", Boolean(matches));
      segment.classList.toggle("is-muted", Boolean(selected) && !matches);
    });
  }

  function applyFinancialState() {
    financialHost.querySelectorAll(".film-mark").forEach((group) => {
      const isActive = group.dataset.filmId === activeFilmId;
      const isSelected = group.dataset.filmId === selectedFilmId;
      group.classList.toggle("is-active", isActive);
      group.classList.toggle("is-selected", isSelected);
      group.classList.toggle("is-deemphasized", Boolean(activeFilmId || focusedSide) && !isActive && !isSelected);
      group.querySelector(".film-point")?.setAttribute("aria-selected", String(isSelected));
    });
    financialHost.querySelectorAll(".trend-line").forEach((line) => {
      line.classList.toggle("is-focused", line.dataset.animatedSide === focusedSide);
      line.classList.toggle("is-deemphasized", Boolean(focusedSide) && line.dataset.animatedSide !== focusedSide);
    });
    applyReleaseSelection();
  }

  function focusFilm(film, mark, showTooltip = true) {
    activeFilmId = film.film_id;
    applyFinancialState();
    if (showTooltip && mark) tooltip.show(mark, tooltipContent(film));
  }

  function clearTemporaryFocus(mark = null) {
    activeFilmId = null;
    tooltip.hide(mark);
    applyFinancialState();
  }

  function selectFilm(film, mark) {
    selectedFilmId = film.film_id;
    activeFilmId = film.film_id;
    renderFilmDetail(detailHost, film);
    applyFinancialState();
    if (mark) tooltip.show(mark, tooltipContent(film));
  }

  function clearSelection() {
    selectedFilmId = null;
    renderFilmDetail(detailHost, null);
    applyFinancialState();
  }

  function restoreDefault() {
    activeFilmId = null;
    focusedSide = null;
    tooltip.hide();
    clearSelection();
  }

  let navigation;
  const stopRelease = observeContainer(releaseHost, (width) => {
    renderReleaseChart(releaseHost, releaseCounts, width);
    applyReleaseSelection();
  });
  const stopFinancial = observeContainer(financialHost, (width) => {
    tooltip.hide();
    renderFinancialChart(financialHost, films, rollingDomestic, width);
    applyFinancialState();
    navigation?.restore();
  });
  navigation = createFilmNavigation({
    entry: financialHost, films: animatedFilms, elementForFilm: markForFilm,
    onActive: focusFilm, onSelect: selectFilm, onClear: restoreDefault
  });

  financialHost.addEventListener("pointerover", (event) => {
    const group = event.target.closest?.(".film-mark");
    if (group) focusFilm(filmById.get(group.dataset.filmId), group.querySelector(".film-point"));
    const sideTarget = event.target.closest?.("[data-animated-side]");
    if (sideTarget) { focusedSide = sideTarget.dataset.animatedSide; applyFinancialState(); }
  });
  financialHost.addEventListener("pointerout", (event) => {
    const group = event.target.closest?.(".film-mark");
    if (group && !group.contains(event.relatedTarget)) clearTemporaryFocus(group.querySelector(".film-point"));
    const sideTarget = event.target.closest?.("[data-animated-side]");
    if (sideTarget && !sideTarget.contains(event.relatedTarget)) { focusedSide = null; applyFinancialState(); }
  });
  financialHost.addEventListener("click", (event) => {
    const group = event.target.closest?.(".film-mark");
    if (!group) return;
    financialHost.focus({ preventScroll: true });
    navigation.activateFilm(group.dataset.filmId, { announce: false });
    selectFilm(filmById.get(group.dataset.filmId), group.querySelector(".film-point"));
  });
  financialHost.addEventListener("focusin", (event) => {
    const side = event.target.dataset?.animatedSide;
    if (side) { focusedSide = side; applyFinancialState(); }
  });
  financialHost.addEventListener("focusout", (event) => {
    if (event.target.dataset?.animatedSide) { focusedSide = null; applyFinancialState(); }
    if (event.target === financialHost) clearTemporaryFocus(markForFilm(activeFilmId));
  });
  financialHost.addEventListener("keydown", (event) => {
    if (event.key === "Escape") restoreDefault();
  });
  container.dataset.viewStatus = "rendered";
  container.dataset.keyboardArchitecture = "one-entry-activedescendant";
  return () => { stopRelease(); stopFinancial(); navigation.destroy(); tooltip.destroy(); };
}
