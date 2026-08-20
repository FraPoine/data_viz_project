import { VISUAL_SYSTEM } from "../config/visualSystem.js";
import { formatDate } from "../utils/format.js";
import { dateScale } from "../utils/scale.js";
import { appendSvg, configureAccessibleSvg, createSvgElement, drawFilmMark } from "../utils/svg.js";
import { observeContainer } from "../utils/resize.js";

const { colors, filmShapes } = VISUAL_SYSTEM;
const CASE_FILMS = new Set(["DWA_1998_ANTZ", "PIXAR_1998_A_BUG_S_LIFE", "DWA_2000_THE_ROAD_TO_EL_DORADO", "WDAS_2000_THE_EMPEROR_S_NEW_GROOVE", "DWA_2001_SHREK"]);
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
    article.append(number, title, copy);
    return article;
  }));
}

export function initView2(container, { films, rivalryAnnotations }) {
  if (!container) throw new Error("Missing container for View 2");
  const chartHost = container.querySelector(".chart-host");
  renderAnnotations(container.querySelector(".annotation-list"), rivalryAnnotations);
  const caseFilms = films.filter((film) => CASE_FILMS.has(film.film_id));
  const render = (availableWidth) => {
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
      drawFilmMark(svg, filmShapes[film.studio], cx, cy, 7, { fill: STUDIO_COLOR[film.studio], class: "timeline-mark", "data-film-id": film.film_id });
      const anchor = cx > right - 110 ? "end" : "start";
      const tx = cx + (anchor === "end" ? -10 : 10);
      appendSvg(svg, "text", { x: tx, y: cy - 16, "text-anchor": anchor, class: "film-label" }, film.title);
      appendSvg(svg, "text", { x: tx, y: cy + 23, "text-anchor": anchor, class: "chart-note" }, formatDate(film.release_date));
    });
    appendSvg(svg, "text", { x: x(new Date("2001-05-18T00:00:00Z")) + 12, y: lanes["DreamWorks Animation"] + 50, class: "timeline-unpaired" }, "No paired Disney counterpart");
  };
  container.dataset.viewStatus = "rendered";
  return observeContainer(chartHost, render);
}
