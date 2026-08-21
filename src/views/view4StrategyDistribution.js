import { VISUAL_SYSTEM } from "../config/visualSystem.js";
import { createTooltip } from "../components/tooltip.js";
import { renderFilmDetail } from "../components/filmDetail.js";
import { formatAdjustedDomestic, formatDate, formatUsdCompact } from "../utils/format.js";
import { createFilmNavigation } from "../utils/focusNavigation.js";
import { linearScale, roundedMoneyMaximum, stableJitter } from "../utils/scale.js";
import { appendSvg, configureAccessibleSvg, createSvgElement, drawFilmMark } from "../utils/svg.js";
import { observeContainer } from "../utils/resize.js";

const { colors, filmShapes } = VISUAL_SYSTEM;
const STUDIO_COLOR = { "Walt Disney Animation Studios": colors.wdas, "Pixar Animation Studios": colors.pixar, "DreamWorks Animation": colors.dreamworks, "Walt Disney Pictures": colors.disneyRemake };
const GROUP_ORDER = ["Animated first entry", "Animated franchise extension", "Disney remake/reimagining layer"];

export function initView4(container, { films, strategySummary }) {
  if (!container) throw new Error("Missing container for View 4");
  const host = container.querySelector(".chart-host");
  const detailHost = document.querySelector("#view-4-detail");
  const availableFilms = films.filter((film) => film.domestic_box_office_usd_jul2026 !== null);
  const filmById = new Map(availableFilms.map((film) => [film.film_id, film]));
  const tooltip = createTooltip();
  let activeFilmId = null;
  let selectedFilmId = null;

  host.tabIndex = 0;
  host.setAttribute("role", "listbox");
  host.setAttribute("aria-label", "Explore films in the three strategy groups. Use arrow keys to move chronologically, Enter or Space to select, and Escape to clear selection.");
  host.setAttribute("aria-describedby", "view-4-keyboard-instructions");

  function markForFilm(filmId) {
    return host.querySelector(`#view4-film-${filmId}`);
  }

  function applyState() {
    host.querySelectorAll(".strategy-film-mark").forEach((group) => {
      const isActive = group.dataset.filmId === activeFilmId;
      const isSelected = group.dataset.filmId === selectedFilmId;
      group.classList.toggle("is-active", isActive);
      group.classList.toggle("is-selected", isSelected);
      group.classList.toggle("is-deemphasized", Boolean(activeFilmId) && !isActive && !isSelected);
      group.querySelector(".strategy-point")?.setAttribute("aria-selected", String(isSelected));
    });
  }

  function tooltipContent(film) {
    const note = film.has_release_context_caveat ? `Release context: ${film.release_context.replaceAll("_", " ")}.` : null;
    return {
      title: film.title,
      rows: [["Studio", film.studio], ["Strategy group", film.strategy_group], ["Adjusted U.S. domestic gross", formatAdjustedDomestic(film.domestic_box_office_usd_jul2026)], ["Release date", formatDate(film.release_date)]],
      note
    };
  }

  function focusFilm(film, mark, showTooltip = true) {
    activeFilmId = film.film_id;
    applyState();
    if (showTooltip && mark) tooltip.show(mark, tooltipContent(film));
  }

  function clearTemporaryFocus(mark = null) {
    activeFilmId = null;
    tooltip.hide(mark);
    applyState();
  }

  function selectFilm(film, mark) {
    selectedFilmId = film.film_id;
    activeFilmId = film.film_id;
    renderFilmDetail(detailHost, film, { includeStrategy: true, compact: true });
    applyState();
    if (mark) tooltip.show(mark, tooltipContent(film));
  }

  function clearSelection() {
    selectedFilmId = null;
    renderFilmDetail(detailHost, null);
    applyState();
  }

  function restoreDefault() {
    activeFilmId = null;
    tooltip.hide();
    clearSelection();
  }

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
        const groupMark = appendSvg(svg, "g", { class: "strategy-film-mark", "data-film-id": film.film_id });
        appendSvg(groupMark, "circle", { cx, cy, r: 11.5, class: "selection-ring" });
        const mark = drawFilmMark(groupMark, filmShapes[film.studio], cx, cy, 4.2, {
          fill: STUDIO_COLOR[film.studio], class: "strategy-point", id: `view4-film-${film.film_id}`,
          "data-film-id": film.film_id, role: "option",
          "aria-label": `${film.title}, ${film.studio}, ${film.strategy_group}, adjusted U.S. domestic gross ${formatAdjustedDomestic(film.domestic_box_office_usd_jul2026)}`
        });
        appendSvg(mark, "title", {}, `${film.title}, ${group}, ${formatUsdCompact(film.domestic_box_office_usd_jul2026)}`);
      });
      const medianX = x(summary.median_domestic_box_office_usd_jul2026);
      appendSvg(svg, "line", { x1: medianX, x2: medianX, y1: y - 39, y2: y + 39, class: "median-marker" });
      appendSvg(svg, "text", { x: medianX, y: y - 45, "text-anchor": "middle", class: "median-label" }, `Median ${formatUsdCompact(summary.median_domestic_box_office_usd_jul2026)}`);
    });
    applyState();
  };
  let navigation;
  const stopResize = observeContainer(host, (width) => {
    tooltip.hide();
    render(width);
    navigation?.restore();
  });
  navigation = createFilmNavigation({
    entry: host, films: availableFilms, elementForFilm: markForFilm,
    onActive: focusFilm, onSelect: selectFilm, onClear: restoreDefault
  });
  host.addEventListener("pointerover", (event) => {
    const group = event.target.closest?.(".strategy-film-mark");
    if (group) focusFilm(filmById.get(group.dataset.filmId), group.querySelector(".strategy-point"));
  });
  host.addEventListener("pointerout", (event) => {
    const group = event.target.closest?.(".strategy-film-mark");
    if (group && !group.contains(event.relatedTarget)) clearTemporaryFocus(group.querySelector(".strategy-point"));
  });
  host.addEventListener("click", (event) => {
    const group = event.target.closest?.(".strategy-film-mark");
    if (!group) return;
    host.focus({ preventScroll: true });
    navigation.activateFilm(group.dataset.filmId, { announce: false });
    selectFilm(filmById.get(group.dataset.filmId), group.querySelector(".strategy-point"));
  });
  host.addEventListener("focusout", (event) => {
    if (event.target === host) clearTemporaryFocus(markForFilm(activeFilmId));
  });
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape") restoreDefault();
  });
  container.dataset.viewStatus = "rendered";
  container.dataset.keyboardArchitecture = "one-entry-activedescendant";
  return () => { stopResize(); navigation.destroy(); tooltip.destroy(); };
}
