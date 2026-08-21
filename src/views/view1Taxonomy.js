import { VISUAL_SYSTEM } from "../config/visualSystem.js";
import { appendSvg, configureAccessibleSvg, createSvgElement, drawFilmMark } from "../utils/svg.js";
import { observeContainer } from "../utils/resize.js";

const { colors, filmShapes, labels } = VISUAL_SYSTEM;

function labelBlock(parent, x, y, count, title, subtitle, color) {
  appendSvg(parent, "text", { x, y, class: "taxonomy-count", fill: color }, count);
  appendSvg(parent, "text", { x, y: y + 25, class: "taxonomy-label" }, title);
  if (subtitle) appendSvg(parent, "text", { x, y: y + 44, class: "chart-note" }, subtitle);
}

export function initView1(container, { manifest }) {
  if (!container) throw new Error("Missing container for View 1");
  const host = container.querySelector(".chart-host");
  const corpus = manifest.corpus;
  const render = (availableWidth) => {
    host.replaceChildren();
    const narrow = availableWidth < 720;
    const width = narrow ? 640 : 1080;
    const height = narrow ? 534 : 310;
    const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart chart--taxonomy" });
    configureAccessibleSvg(svg, {
      titleId: "view-1-svg-title", descriptionId: "view-1-svg-description",
      label: "Conceptual taxonomy of the 120-film corpus",
      description: `The corpus contains a ${corpus.animated_films}-film primary animated comparison: ${corpus.disney_animated_films} Disney animated films, split into ${corpus.studio_counts["Walt Disney Animation Studios"]} Walt Disney Animation Studios and ${corpus.studio_counts["Pixar Animation Studios"]} Pixar films, and ${corpus.dreamworks_animated_films} DreamWorks films. ${corpus.studio_counts["Walt Disney Pictures"]} Disney remakes form a separate analytical layer. Box sizes are not proportional.`
    });
    host.append(svg);
    appendSvg(svg, "text", { x: 26, y: 34, class: "chart-kicker" }, `${corpus.total_films} FILMS · CONCEPTUAL GROUPING, NOT AREA`);
    const animated = narrow ? { x: 26, y: 62, width: 588, height: 334 } : { x: 26, y: 62, width: 790, height: 220 };
    appendSvg(svg, "rect", { ...animated, rx: 14, class: "taxonomy-container" });
    const header = appendSvg(svg, "g", { transform: `translate(${animated.x + 24} ${animated.y + 45})`, class: "taxonomy-header" });
    labelBlock(header, 0, 0, corpus.animated_films, "Primary animated comparison", "Disney animated and DreamWorks", colors.primaryText);
    const childRow = appendSvg(svg, "g", { transform: `translate(${animated.x + 24} ${animated.y + 112})`, class: "taxonomy-child-row" });
    const disney = narrow ? { x: 0, y: 0, width: 540, height: 112 } : { x: 0, y: 0, width: 475, height: 108 };
    appendSvg(childRow, "rect", { ...disney, rx: 10, class: "taxonomy-subcontainer taxonomy-subcontainer--disney" });
    const studioCounts = corpus.studio_counts;
    labelBlock(childRow, disney.x + 18, disney.y + 34, corpus.disney_animated_films, labels.disneyAnimatedAggregate, `${studioCounts["Walt Disney Animation Studios"]} WDAS + ${studioCounts["Pixar Animation Studios"]} Pixar`, colors.disneyAnimatedAggregate);
    drawFilmMark(childRow, filmShapes["Walt Disney Animation Studios"], disney.x + 26, disney.y + 88, 6, { fill: colors.wdas });
    appendSvg(childRow, "text", { x: disney.x + 40, y: disney.y + 93, class: "chart-note" }, `${studioCounts["Walt Disney Animation Studios"]} Walt Disney Animation Studios`);
    drawFilmMark(childRow, filmShapes["Pixar Animation Studios"], disney.x + (narrow ? 302 : 270), disney.y + 88, 6, { fill: colors.pixar });
    appendSvg(childRow, "text", { x: disney.x + (narrow ? 316 : 284), y: disney.y + 93, class: "chart-note" }, `${studioCounts["Pixar Animation Studios"]} Pixar Animation Studios`);
    const dwa = narrow ? { x: 0, y: 130, width: 540, height: 68 } : { x: 498, y: 0, width: 244, height: 108 };
    appendSvg(childRow, "rect", { ...dwa, rx: 10, class: "taxonomy-subcontainer taxonomy-subcontainer--dwa" });
    drawFilmMark(childRow, filmShapes["DreamWorks Animation"], dwa.x + 22, dwa.y + 27, 6, { fill: colors.dreamworks });
    appendSvg(childRow, "text", { x: dwa.x + 38, y: dwa.y + 32, class: "taxonomy-label" }, `${corpus.dreamworks_animated_films} DreamWorks Animation`);
    if (!narrow) appendSvg(childRow, "text", { x: dwa.x + 22, y: dwa.y + 65, class: "chart-note" }, "Animated comparison side");
    const remake = narrow ? { x: 26, y: 418, width: 588, height: 90 } : { x: 840, y: 62, width: 214, height: 220 };
    appendSvg(svg, "rect", { ...remake, rx: 14, class: "taxonomy-remake" });
    drawFilmMark(svg, filmShapes["Walt Disney Pictures"], remake.x + 26, remake.y + 33, 7, { fill: colors.disneyRemake });
    const remakeTextX = remake.x + (narrow ? 48 : 22);
    const remakeTextY = remake.y + (narrow ? 20 : 82);
    appendSvg(svg, "text", { x: remakeTextX, y: remakeTextY, class: "taxonomy-count", fill: colors.disneyRemake }, corpus.strategy_counts[labels.remakeLayer]);
    appendSvg(svg, "text", { x: remakeTextX, y: remakeTextY + 25, class: "taxonomy-label" }, "Disney remake/reimagining");
    appendSvg(svg, "text", { x: remakeTextX, y: remakeTextY + 42, class: "taxonomy-label" }, "layer");
    appendSvg(svg, "text", { x: remakeTextX, y: remakeTextY + 62, class: "chart-note" }, "Separate from animated comparison");
  };
  container.dataset.viewStatus = "rendered";
  return observeContainer(host, render);
}
