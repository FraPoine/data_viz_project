import { VISUAL_SYSTEM } from "../config/visualSystem.js";
import { formatDate } from "../utils/format.js";
import { dateScale } from "../utils/scale.js";
import { appendSvg, configureAccessibleSvg, createSvgElement, drawFilmMark } from "../utils/svg.js";
import { observeContainer } from "../utils/resize.js";

const { colors, filmShapes } = VISUAL_SYSTEM;
const STUDIO_COLOR = { "Walt Disney Animation Studios": colors.wdas, "Pixar Animation Studios": colors.pixar, "DreamWorks Animation": colors.dreamworks };

function renderAnnotations(host, annotations) {
  host.replaceChildren(...annotations.map((annotation, index) => {
    const article = document.createElement("article");
    article.className = "annotation-card";
    article.dataset.annotationId = annotation.annotation_id;
    const number = document.createElement("span");
    number.className = "annotation-card__number";
    number.textContent = `0${index + 1}`;
    const title = document.createElement("h4");
    title.textContent = annotation.evidence_framing;
    const copy = document.createElement("p");
    copy.textContent = annotation.persistent_annotation;
    const evidence = document.createElement("div");
    evidence.className = "annotation-evidence";
    evidence.hidden = true;
    const details = document.createElement("p");
    details.textContent = annotation.details;
    const sourceTitle = document.createElement("h5");
    sourceTitle.textContent = "Evidence sources";
    const sources = document.createElement("ul");
    for (const source of annotation.sources) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = source.url;
      link.textContent = source.label;
      link.target = "_blank";
      link.rel = "noreferrer";
      item.append(link);
      sources.append(item);
    }
    evidence.append(details, sourceTitle, sources);
    article.append(number, title, copy, evidence);
    return article;
  }));
}

function renderLaterContext(container, films) {
  const filmById = new Map(films.map((film) => [film.film_id, film]));
  container.querySelectorAll("[data-later-film-id]").forEach((article) => {
    const film = filmById.get(article.dataset.laterFilmId);
    if (!film) throw new Error(`A later rivalry-context film could not be resolved: ${article.dataset.laterFilmId}`);
    const marker = document.createElement("span");
    marker.className = `later-context__marker later-context__marker--${film.studio === "Pixar Animation Studios" ? "pixar" : "dreamworks"}`;
    marker.setAttribute("aria-hidden", "true");
    const title = document.createElement("h4");
    title.textContent = film.title;
    const metadata = document.createElement("p");
    metadata.textContent = `${film.release_year} · ${film.studio}`;
    article.replaceChildren(marker, title, metadata);
  });
}

export function initView2(container, { films, rivalryAnnotations }) {
  if (!container) throw new Error("Missing container for View 2");
  const chartHost = container.querySelector(".chart-host");
  renderAnnotations(container.querySelector(".annotation-list"), rivalryAnnotations);
  renderLaterContext(container.closest("#rivalry"), films);
  const contextualFilmIds = new Set(rivalryAnnotations.flatMap((annotation) => annotation.film_ids));
  const caseFilms = films.filter((film) => contextualFilmIds.has(film.film_id));
  if (caseFilms.length !== contextualFilmIds.size) throw new Error("A View 2 rivalry annotation film could not be resolved");
  const annotationByFilm = new Map(rivalryAnnotations.flatMap((annotation) => annotation.film_ids.map((filmId) => [filmId, annotation])));
  let focusedFilmId = null;
  let openAnnotationId = null;

  function applyState() {
    chartHost.querySelectorAll(".timeline-mark").forEach((mark) => {
      const annotation = annotationByFilm.get(mark.dataset.filmId);
      mark.classList.toggle("is-focused", mark.dataset.filmId === focusedFilmId);
      mark.setAttribute("aria-expanded", String(annotation?.annotation_id === openAnnotationId));
    });
    container.querySelectorAll(".annotation-card").forEach((card) => {
      const isOpen = card.dataset.annotationId === openAnnotationId;
      card.classList.toggle("is-open", isOpen);
      card.querySelector(".annotation-evidence").hidden = !isOpen;
    });
  }

  function openEvidence(filmId) {
    openAnnotationId = annotationByFilm.get(filmId)?.annotation_id ?? null;
    applyState();
    if (openAnnotationId) container.querySelector(`[data-annotation-id="${openAnnotationId}"]`).scrollIntoView({ block: "nearest" });
  }

  const render = (availableWidth) => {
    const focusedMark = document.activeElement?.closest?.(".timeline-mark");
    const restoreFocusedFilmId = focusedMark && chartHost.contains(focusedMark) ? focusedMark.dataset.filmId : null;
    chartHost.replaceChildren();
    const narrow = availableWidth < 700;
    const width = narrow ? 700 : 1080;
    const height = narrow ? 455 : 360;
    const left = narrow ? 145 : 180;
    const right = width - 34;
    const lanes = narrow
      ? { "Pixar Animation Studios": 105, "Walt Disney Animation Studios": 230, "DreamWorks Animation": 355 }
      : { "Pixar Animation Studios": 92, "Walt Disney Animation Studios": 180, "DreamWorks Animation": 268 };
    const x = dateScale(new Date("1998-01-01T00:00:00Z"), new Date("2001-12-31T00:00:00Z"), left, right);
    const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart chart--timeline" });
    configureAccessibleSvg(svg, {
      titleId: "view-2-svg-title", descriptionId: "view-2-svg-description",
      label: "Exact-date timeline of five early rivalry context films from 1998 to 2001",
      description: "Antz and A Bug's Life form the strongest documented early rivalry case. The Road to El Dorado and The Emperor's New Groove are a cautious production-era comparison. Shrek is a Disney-context subversion case with no paired Disney counterpart."
    });
    chartHost.append(svg);
    for (const [studio, y] of Object.entries(lanes)) {
      appendSvg(svg, "line", { x1: left, x2: right, y1: y, y2: y, class: "timeline-lane" });
      drawFilmMark(svg, filmShapes[studio], 22, y - 3, 6, { fill: STUDIO_COLOR[studio] });
      const short = studio === "Walt Disney Animation Studios" ? "Walt Disney\nAnimation Studios" : studio;
      short.split("\n").forEach((line, i) => appendSvg(svg, "text", { x: 38, y: y - 8 + i * 16, class: "timeline-lane-label" }, line));
    }
    for (const year of [1998, 1999, 2000, 2001]) {
      const yearX = x(new Date(`${year}-01-01T00:00:00Z`));
      appendSvg(svg, "line", { x1: yearX, x2: yearX, y1: 52, y2: height - 42, class: "chart-grid" });
      appendSvg(svg, "text", { x: yearX + 6, y: 32, class: "axis-label" }, year);
    }
    caseFilms.forEach((film) => {
      const cx = x(new Date(`${film.release_date}T00:00:00Z`));
      const cy = lanes[film.studio];
      const annotation = annotationByFilm.get(film.film_id);
      drawFilmMark(svg, filmShapes[film.studio], cx, cy, 7, {
        fill: STUDIO_COLOR[film.studio], class: "timeline-mark", id: `view2-film-${film.film_id}`,
        "data-film-id": film.film_id, tabindex: 0, role: "button",
        "aria-label": `${film.title}, ${film.studio}, released ${formatDate(film.release_date)}. ${annotation.evidence_framing}. Press Enter or Space for evidence detail.`
      });
      const anchor = (film.studio === "DreamWorks Animation" && film.release_year === 2000) || cx > right - 160 ? "end" : "start";
      const tx = cx + (anchor === "end" ? -10 : 10);
      appendSvg(svg, "text", { x: tx, y: cy - 16, "text-anchor": anchor, class: "film-label" }, film.title);
      appendSvg(svg, "text", { x: tx, y: cy + 23, "text-anchor": anchor, class: "chart-note" }, formatDate(film.release_date));
    });
    appendSvg(svg, "text", { x: right, y: lanes["DreamWorks Animation"] + 50, "text-anchor": "end", class: "timeline-unpaired" }, "No paired Disney counterpart");
    applyState();
    if (restoreFocusedFilmId) chartHost.querySelector(`#view2-film-${restoreFocusedFilmId}`)?.focus({ preventScroll: true });
  };
  chartHost.addEventListener("pointerover", (event) => {
    const mark = event.target.closest?.(".timeline-mark");
    if (!mark) return;
    focusedFilmId = mark.dataset.filmId;
    applyState();
  });
  chartHost.addEventListener("pointerout", (event) => {
    if (!event.target.closest?.(".timeline-mark")) return;
    focusedFilmId = null;
    applyState();
  });
  chartHost.addEventListener("focusin", (event) => {
    const mark = event.target.closest?.(".timeline-mark");
    if (!mark) return;
    focusedFilmId = mark.dataset.filmId;
    applyState();
  });
  chartHost.addEventListener("focusout", (event) => {
    if (!event.target.closest?.(".timeline-mark")) return;
    focusedFilmId = null;
    applyState();
  });
  chartHost.addEventListener("click", (event) => {
    const mark = event.target.closest?.(".timeline-mark");
    if (mark) { mark.focus({ preventScroll: true }); openEvidence(mark.dataset.filmId); }
  });
  chartHost.addEventListener("keydown", (event) => {
    const mark = event.target.closest?.(".timeline-mark");
    if (mark && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      openEvidence(mark.dataset.filmId);
    } else if (event.key === "Escape") {
      openAnnotationId = null;
      applyState();
    }
  });
  container.dataset.viewStatus = "rendered";
  return observeContainer(chartHost, render);
}
