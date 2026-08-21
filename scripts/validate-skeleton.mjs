import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { VISUAL_SYSTEM } from "../src/config/visualSystem.js";
import { DATA_CONTRACT } from "../src/config/dataContract.js";
import { createAppState } from "../src/state/appState.js";
import { formatAdjustedDomestic, formatDate, formatYearLabel } from "../src/utils/format.js";
import { initView1 } from "../src/views/view1Taxonomy.js";
import { initView2 } from "../src/views/view2RivalryTimeline.js";
import { initView3 } from "../src/views/view3Temporal.js";
import { initView4 } from "../src/views/view4StrategyDistribution.js";
import { createTooltip } from "../src/components/tooltip.js";
import { renderFilmDetail } from "../src/components/filmDetail.js";
import { createFilmNavigation } from "../src/utils/focusNavigation.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(ROOT, "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sectionIds = ["comparison", "rivalry", "balance", "strategies", "takeaway", "methodology"];
let previousIndex = -1;
for (const id of sectionIds) {
  const currentIndex = html.indexOf(`id="${id}"`);
  assert(currentIndex > previousIndex, `Section ${id} is missing or out of order`);
  previousIndex = currentIndex;
}

const viewRootCount = (html.match(/data-view-module=/g) || []).length;
assert(viewRootCount === 4, `Expected exactly 4 approved view roots, found ${viewRootCount}`);
assert(!html.toLowerCase().includes("implementation placeholder"), "Task 8 view placeholder text remains in the page");
assert([initView1, initView2, initView3, initView4].every((init) => typeof init === "function"), "A Task 8 view module does not export an initializer");
assert([createTooltip, renderFilmDetail, createFilmNavigation].every((item) => typeof item === "function"), "A shared Task 9 interaction module is missing");
assert(html.includes('id="view-3-detail"') && html.includes('id="view-4-detail"'), "Below-chart film detail strips are missing");
assert(html.includes('id="view-3-keyboard-instructions"') && html.includes('id="view-4-keyboard-instructions"'), "Dense-chart keyboard instructions are missing");
assert(html.includes('class="trend-focus-controls"'), "View 3 aggregate trend controls must be semantically separate from the film explorer");
assert(html.indexOf('id="view-3-detail"') > html.indexOf('id="view-3"'), "View 3 detail strip must follow View 3");
assert(html.indexOf('id="view-4-detail"') > html.indexOf('id="view-4"'), "View 4 detail strip must follow View 4");
assert(!/<(?:select|input)[\s>]/i.test(html), "Global filter controls are not allowed");

assert(VISUAL_SYSTEM.colors.wdas === "#2F6FB0", "WDAS color drifted from Design Freeze");
assert(VISUAL_SYSTEM.colors.pixar === "#A94F8A", "Pixar color drifted from Design Freeze");
assert(VISUAL_SYSTEM.colors.dreamworks === "#007C7C", "DreamWorks color drifted from Design Freeze");
assert(VISUAL_SYSTEM.colors.disneyAnimatedAggregate === "#6F4AA8", "Disney aggregate color drifted");
assert(VISUAL_SYSTEM.colors.disneyRemake === "#A65E1A", "Remake color drifted");
assert(VISUAL_SYSTEM.filmShapes["Pixar Animation Studios"] === "triangle-up", "Pixar shape drifted");
assert(DATA_CONTRACT.files.films === "films.json", "Data contract is malformed");

const store = createAppState();
store.set({ activeSection: "balance" });
assert(store.get().activeSection === "balance", "App state smoke test failed");
assert(formatAdjustedDomestic(245_000_000) === "$245M (July-2026 USD equivalent)", "Money formatting smoke test failed");
assert(formatYearLabel(2026) === "2026*", "Partial-year formatting smoke test failed");
assert(formatDate("1998-11-25") === "25 Nov 1998", "Date formatting smoke test failed");

const textFiles = [];
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["dist", "node_modules"].includes(entry.name)) await collect(full);
    } else if (/\.(?:html|js|mjs|css|md|json|py|txt)$/.test(entry.name)) {
      textFiles.push(full);
    }
  }
}
await collect(ROOT);
const packageJson = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
assert(!Object.keys(dependencies).some((name) => ["d3", "react", "vue", "svelte"].includes(name)), "A forbidden visualization/framework dependency was introduced");
const view4Source = await readFile(path.join(ROOT, "src/views/view4StrategyDistribution.js"), "utf8");
assert(!view4Source.includes("Math.random"), "View 4 jitter must be deterministic");
assert(!view4Source.includes("median-diamond"), "View 4 median must not reuse the remake diamond");
assert(!view4Source.includes("tabindex: 0"), "View 4 films must not become individual Tab stops");
assert(view4Source.includes("data-film-id"), "View 4 film marks need stable film IDs");
const view3Source = await readFile(path.join(ROOT, "src/views/view3Temporal.js"), "utf8");
assert(!view3Source.includes("tabindex: 0, role: \"option\""), "View 3 films must not become individual Tab stops");
assert(view3Source.includes("one-entry-activedescendant"), "View 3 dense-chart keyboard architecture is missing");
assert(view3Source.includes("data-film-id"), "View 3 film marks need stable film IDs");
assert(!/class: "trend-line"[^\n]+tabindex/.test(view3Source), "View 3 trend paths must not be focusable inside the film listbox");
assert(view3Source.includes('querySelector(".trend-focus-controls")'), "View 3 separate aggregate trend controls are missing");
const view2Source = await readFile(path.join(ROOT, "src/views/view2RivalryTimeline.js"), "utf8");
assert(!view2Source.includes("CASE_FILMS"), "View 2 must derive contextual films from runtime annotations");
assert(view2Source.includes("rivalryAnnotations.flatMap"), "View 2 runtime film-ID derivation is missing");
assert(view2Source.includes("restoreFocusedFilmId"), "View 2 responsive focus restoration is missing");
const mainSource = await readFile(path.join(ROOT, "src/main.js"), "utf8");
assert(mainSource.includes("loadVisualizationData"), "Application startup must use the shared data loader");
const forbiddenAbsolutePrefix = ["", "mnt", "data", ""].join("/");
for (const file of textFiles) {
  const content = await readFile(file, "utf8");
  assert(!content.includes(forbiddenAbsolutePrefix), `Legacy absolute sandbox path found in ${path.relative(ROOT, file)}`);
}
const architectureSource = await readFile(path.join(ROOT, "technical_architecture.md"), "utf8");
assert(!architectureSource.includes("viewShell.js"), "Architecture documentation references removed viewShell.js");


// Verify every relative JavaScript import resolves to an existing file.
for (const file of textFiles.filter((candidate) => /\.(?:js|mjs)$/.test(candidate))) {
  const content = await readFile(file, "utf8");
  const importPattern = /(?:from\s+|import\s*)["'](\.[^"']+)["']/g;
  for (const match of content.matchAll(importPattern)) {
    const resolved = path.resolve(path.dirname(file), match[1]);
    try {
      await readFile(resolved);
    } catch {
      throw new Error(`Broken relative import in ${path.relative(ROOT, file)}: ${match[1]}`);
    }
  }
}

console.log("Final implementation validation passed.");
console.log(`Narrative sections verified: ${sectionIds.join(" → ")}`);
console.log("Four rendering modules, local detail strips, runtime rivalry linkage, and controlled keyboard exploration verified.");
console.log("Visual-system, median semantics, deterministic jitter, imports, startup, dependencies, formatting, local state, and path smoke tests passed.");
