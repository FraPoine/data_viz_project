# Technical Architecture

## 1. Technical Requirements

The architecture must implement the approved Design Freeze rather than reshape it around a preferred framework.

### Visualization requirements

- Four major views only.
- Custom categorical taxonomy, exact-date timeline, coordinated temporal view, and jittered distribution.
- View 3 is the densest view: annual count bars, approximately 105 adjusted-domestic film marks, two five-year rolling-median lines, direct labels, contextual annotations, and selected-film/year coordination.
- Required native marks include circles, upward triangles, squares, diamonds, hatched Pixar bar segments, solid aggregate lines, and dashed exceptional-release halos.
- Direct labels, axes, annotations, reading guides, and responsive relayout are required.
- The linear zero-origin adjusted-domestic scale and the frozen studio/layer semantics must be preserved.

### Interaction requirements

- Hover and keyboard-equivalent film focus.
- Persistent film selection and clear-selection behavior.
- Below-chart persistent film-detail strip.
- Aggregate-side focus in View 3.
- Limited selected-film → corresponding release-year highlight inside View 3.
- No generic filtering, metric selectors, year sliders, zoom/pan, or cross-section filtering.

### Accessibility requirements

- Semantic document landmarks and heading order.
- Accessible chart title/description.
- One chart-level keyboard entry point for dense View 3.
- Roving/arrow-key navigation among film marks, Enter to select, Escape to clear.
- Hover information must have keyboard/click equivalents.
- Focus-visible states independent of the dashed release-context halo.
- Accessible film labels and persistent detail content.
- Reduced-motion support.
- Color-independent shape/hatch/direct-label cues.
- Semantic expandable methodology disclosure.

### Data requirements

- `final_integrated_dataset.csv` remains the authoritative quantitative input.
- Quantitative visualization data must be generated deterministically; plotted values must not be manually typed into frontend code.
- Rivalry annotation copy may be curated, but every annotation must explicitly reference the approved films and source methodology.
- Frozen assumptions must fail loudly if they drift.

### Delivery requirements

- Simple local setup.
- Reproducible validation and data-generation workflow.
- Static deployment.
- No backend.
- Maintainable modules without framework-driven boilerplate.
- No dependency on legacy Deliverable 2 absolute paths or pipeline directories.

## 2. Candidate Stack Comparison

| Criterion | Vanilla ES modules + native SVG + CSS | Vite + D3 | Svelte + D3 | React + D3 |
| --- | --- | --- | --- | --- |
| Fidelity to custom design | **Excellent** — complete DOM/SVG control | **Excellent** | Excellent | Excellent |
| SVG/data-binding capability | Good; small project makes explicit joins manageable | **Excellent** D3 selections/scales/axes | Excellent | Excellent, but D3/React ownership boundaries need care |
| Interaction implementation | **Good** with small explicit state | Excellent | Excellent | Excellent |
| Accessibility control | **Excellent** — direct semantic DOM/SVG ownership | Excellent | Excellent | Excellent |
| Responsive behavior | **Excellent** with `viewBox`, ResizeObserver, relayout functions | Excellent | Excellent | Excellent |
| Code complexity | **Lowest** for four fixed views | Low–moderate | Moderate | Highest of the candidates |
| Learning/implementation overhead | Low | Low–moderate | Moderate | Moderate–high |
| Reproducibility | **Excellent**, no frontend package dependency | Good; npm dependency graph required | Good | Good |
| Dependency footprint | **Minimal** | Small/moderate | Moderate | Moderate |
| Build/deployment simplicity | **Highest** — static ES modules | High with Vite | High | High |
| Risk of overengineering | **Lowest** | Low | Moderate | High |
| Suitability for this four-view visual story | **Very high** | Very high | High | Medium |

### Strongest alternative: Vite + D3

D3 is the strongest alternative because its scale, axis, shape, and data-join utilities would shorten some chart code, especially for View 3. It was not selected because the approved project contains only four fixed views and approximately 120 observations. The project does not require a virtual DOM, reactive component framework, or large-scale data binding. Native SVG plus a small set of shared scale/axis utilities can cover the required representations while preserving exact accessibility semantics and eliminating frontend dependency/build-tool overhead.

If later implementation demonstrates that hand-maintaining the scale/axis utilities is materially increasing risk, introducing narrowly scoped D3 modules would be a Manager-reviewable architecture change. Task 6 does not require that change.

## 3. Selected Stack

### Frontend

- **Semantic HTML5** for story structure, navigation, methodology disclosure, and accessible detail regions.
- **CSS** with custom properties for the frozen visual system and reusable state classes.
- **Vanilla JavaScript ES modules** for application/view modules and the small interaction state.
- **Native SVG** for all four visualization views.

### Data preprocessing

- **Python 3.11+**.
- **pandas 2.2.x** for deterministic validation, grouping, rolling summaries, JSON serialization, and dataset contracts in Task 7.

### Development/build

- **Node.js 20+ standard-library scripts**, with no third-party build dependency.
- Source ES modules are browser-native; the production build is a deterministic static copy into `dist/`.

### Backend

**None.** The dataset is frozen, the computations are build-time deterministic, and there are no accounts, live queries, user-generated records, or server-only operations.

### Why this stack fits

- It preserves full SVG/accessibility control for the custom frozen encodings.
- It is sufficient for 105 film marks plus lines/bars without performance concerns.
- The small app state does not justify a component framework or Redux-like store.
- Static deployment is trivial.
- The build remains inspectable by a course reviewer.
- Python keeps analytical preparation separate from presentation and aligns with the existing pandas-based project work without reusing old paths.

### Main risks

1. Native SVG means the project must maintain a small set of scale/axis/layout helpers that D3 would otherwise provide.
2. Annotation collision and responsive relayout require deliberate view-specific layout functions.
3. Roving keyboard navigation in View 3 must be implemented carefully so passive SVG marks do not become 100+ Tab stops.
4. Browser ES modules require serving through HTTP for local development; opening `index.html` directly from `file://` is not a supported workflow.

## 4. Rendering Strategy

### Semantic HTML

Use HTML for:
- page/section structure;
- section navigation;
- reading guides;
- persistent contextual prose;
- methodology disclosure;
- tooltip shell when implemented as an HTML overlay;
- persistent selected-film detail strip.

### SVG

Use SVG for Views 1–4.

SVG is more than sufficient for:
- ~105 interactive film marks;
- annual release bars;
- two rolling lines;
- axes and direct labels;
- circle/triangle/square/diamond marks;
- dashed exception halos;
- Pixar hatch pattern;
- annotation rules and reference marks;
- responsive `viewBox` rendering;
- explicit accessible title/description and keyboard focus architecture.

### Canvas/WebGL

Not selected. They would reduce per-mark semantic accessibility while providing no measurable performance benefit for ~120 films.

## 5. Application Architecture

### App/page shell

`index.html` owns the frozen story order, semantic landmarks, section navigation, four view roots, detail-strip roots, conclusion, and methodology disclosure.

### Data layer

Task 7 generates static JSON into `public/data/derived/`. View modules receive only the files they need through the shared data loader. Frozen CSV/Markdown sources remain outside the public runtime bundle in `data/frozen/`.

### Shared configuration

`src/config/visualSystem.js`
- frozen palette;
- studio shapes;
- canonical aggregate/remake labels.

`src/config/dataContract.js`
- derived file names;
- schema version;
- stable record keys.

### Shared utilities

`src/utils/format.js`
- all audience-facing money/date/year/missing formatting.

`src/utils/svg.js`
- SVG creation and accessible title/description helpers.

Task 8 adds narrowly scoped `scale.js` and `resize.js` helpers plus SVG mark/path helpers. They support the four views without becoming a general charting framework.

### Views

- `view1Taxonomy.js` — compact taxonomy.
- `view2RivalryTimeline.js` — exact-date contextual timeline.
- `view3Temporal.js` — coordinated release activity + adjusted-domestic temporal panel and dense-film keyboard navigation.
- `view4StrategyDistribution.js` — strategy-group film distribution and medians.

Each view owns its SVG layout and temporary interaction focus. Shared semantics and formatting remain centralized.

### Detail components

Task 9 implements a shared persistent film-detail renderer and HTML tooltip. Each consumes an approved subset of a selected/focused film record; neither exposes every dataset field.

## 6. State Model

The interaction vocabulary is deliberately small.

### Shared application state

```text
activeSection: null | string
```

`activeSection` is optional navigation state; it should be updated only if later navigation behavior needs it.

### View-local state

View 3:
- temporarily focused film;
- persistently selected View 3 film;
- roving active-film index;
- focused aggregate side (`Disney animated` / `DreamWorks` / null).

View 2:
- temporary contextual case focus;
- locked evidence detail if implemented.

View 4:
- temporary focused film.
- persistently selected View 4 film.

Film selection remains local to its owning view. View 2, View 3, and View 4 do not propagate selection or focus across sections.

### Native DOM state

Methodology expanded/collapsed should use semantic `<details>` rather than duplicating the state in JavaScript unless later UI requirements make synchronization necessary.

No Redux-like or framework state library is justified.

## 7. Data Architecture

### Authoritative frozen inputs

The standalone project keeps read-only copies under `data/frozen/`:

- `final_integrated_dataset.csv` — authoritative quantitative source;
- `data_dictionary.csv`;
- `canonical_film_catalogue.csv`;
- `rivalry_cases.md`;
- `catalogue_methodology.md`.

### Proposed Task 7 derived contract

| File | Purpose | Source | Key | Generated/curated | Consumers |
| --- | --- | --- | --- | --- | --- |
| `manifest.json` | Schema/version, source hash, cutoff, row counts, derived-file metadata | All frozen inputs | `schema_version` | Generated | App/data loader, QA |
| `films.json` | Minimal film-level fields required for marks/tooltips/strategy grouping | `final_integrated_dataset.csv` | `film_id` | Generated | Views 2, 3, 4; detail strip |
| `release-counts.json` | Annual WDAS/Pixar/Disney-animated/DreamWorks counts | `films.json` / frozen dataset | `release_year` | Generated | View 3 release activity |
| `rolling-domestic.json` | Validated five-year trailing adjusted-domestic medians | frozen dataset | (`animated_side`, `window_end_year`) | Generated | View 3 rolling lines |
| `strategy-summary.json` | Strategy-group counts, availability, adjusted-domestic medians | frozen dataset | `strategy_group` | Generated | View 4 labels/medians; QA |
| `rivalry-annotations.json` | Curated annotation copy and source links explicitly tied to approved film IDs | `rivalry_cases.md` + canonical film lookup | `annotation_id` | Curated/generated linkage | View 2 |

### `films.json` expected fields

Task 7 should keep the record deliberately small. Expected fields include:

- `film_id`;
- `title`;
- `studio`;
- `corpus_assignment`;
- `release_date`;
- `release_year`;
- `release_type`;
- `release_context`;
- `franchise_status`;
- `is_franchise_extension`;
- generated `strategy_group`;
- `production_budget_usd_nominal`;
- `domestic_box_office_usd_jul2026`;
- `worldwide_box_office_usd_nominal`;
- generated `has_release_context_caveat`.

TMDB fields and sparse international gross do not need to enter the runtime visualization contract.

## 8. Preprocessing Strategy

Task 7 should implement one Python entry point, conceptually:

```bash
python3 scripts/build_visualization_data.py
```

The script should:

1. load `data/frozen/final_integrated_dataset.csv`;
2. run frozen-input validation before transformation;
3. derive only approved visualization fields and aggregations;
4. validate derived counts/rolling formulas;
5. resolve approved rivalry annotations against explicit film IDs;
6. write deterministic JSON to `public/data/derived/`;
7. write a manifest including source checksums and schema version.

Python is preferred to Node preprocessing because pandas already matches the project's analytical workflow and makes the rolling/grouping validation concise. The frontend remains presentation-only.

Task 6 does **not** generate the final derived files.

## 9. Validation Strategy

### Preprocessing/build-time — authoritative validation

Run once in Python before any visualization-data generation:

- exactly 120 film rows;
- unique `film_id`;
- exact studio counts 29/28/49/14;
- exact corpus-assignment counts;
- expected fields present;
- no excluded studios;
- deterministic competitive-side mapping;
- release range 1998–2026-08-18;
- audience fields remain unavailable in the frozen input;
- numeric fields used for visualization are non-negative where present.

Task 7 will add:
- derived file schemas;
- release-count totals;
- rolling-window formula/minimum-observation checks;
- strategy-group totals 71/35/14;
- adjusted-domestic availability;
- rivalry annotation film-ID resolution.

### Frontend load-time — lightweight validation

Do not duplicate the entire Python audit in the browser. The frontend should check only:
- manifest/schema version compatibility;
- required derived files load successfully;
- top-level arrays/keys exist;
- record IDs needed by a view are present.

If this fails, show a clear non-analytical error message and do not draw partial charts.

## 10. Project Structure

```text
deliverable3_visualization/
├── index.html
├── README.md
├── technical_architecture.md
├── package.json
├── package-lock.json
├── requirements-data.txt
├── data/
│   └── frozen/
│       ├── final_integrated_dataset.csv
│       ├── data_dictionary.csv
│       ├── canonical_film_catalogue.csv
│       ├── rivalry_cases.md
│       ├── catalogue_methodology.md
│       └── README.md
├── public/
│   ├── assets/
│   └── data/derived/
│       └── README.md
├── scripts/
│   ├── validate_frozen_inputs.py
│   ├── validate-skeleton.mjs
│   ├── build.mjs
│   └── serve.mjs
└── src/
    ├── main.js
    ├── components/
    │   └── viewShell.js
    ├── config/
    │   ├── dataContract.js
    │   └── visualSystem.js
    ├── state/
    │   └── appState.js
    ├── styles/
    │   ├── tokens.css
    │   ├── base.css
    │   ├── layout.css
    │   ├── components.css
    │   └── main.css
    ├── utils/
    │   ├── format.js
    │   └── svg.js
    └── views/
        ├── index.js
        ├── view1Taxonomy.js
        ├── view2RivalryTimeline.js
        ├── view3Temporal.js
        └── view4StrategyDistribution.js
```

`dist/` is generated and ignored by version control.

## 11. Module Responsibilities

| Module | Responsibility |
| --- | --- |
| `index.html` | Frozen page order, semantic landmarks, view/detail roots, methodology disclosure |
| `src/main.js` | Application startup and view-module registration |
| `config/visualSystem.js` | Single JavaScript source for palette, shapes, canonical labels |
| `config/dataContract.js` | Static filenames, keys, schema version for Task 7 outputs |
| `state/appState.js` | Minimal shared persistent state; no view-local hover state |
| `utils/format.js` | Central audience-facing money/date/count/missing formatting |
| `utils/svg.js` | Native SVG construction and accessibility metadata helpers |
| `components/viewShell.js` | Shared view-root registration; later common figure states |
| `views/*.js` | One implementation boundary per approved major view |
| `scripts/validate_frozen_inputs.py` | Authoritative frozen-input assertions |
| `scripts/validate-skeleton.mjs` | Architecture/shell smoke checks |
| `scripts/build.mjs` | Deterministic static production build |
| `scripts/serve.mjs` | Dependency-free local source/production server |

## 12. Accessibility Architecture

### Chart container

Each implemented view should use a semantic `<figure>` with:
- visible view title;
- visible or screen-reader chart description;
- an SVG with `role="img"` and `<title>/<desc>` where appropriate;
- a separate concise accessible text summary of the main takeaway and caveat.

Hundreds of passive SVG marks should **not** each become Tab stops.

### Dense View 3 film navigation

The architecture reserves one chart-level interactive entry point.

Expected Task 8 behavior:

1. `Tab` reaches the View 3 film-navigation entry once.
2. An active-film index is stored locally in View 3.
3. Arrow keys move the active film according to deterministic temporal/spatial ordering.
4. The currently active film receives the same detail information as pointer hover.
5. `Enter` selects/locks the film through shared `selectedFilm` state.
6. `Escape` clears the selection/focus state.
7. Passive film marks remain `tabindex=-1` or otherwise outside sequential Tab navigation.

Exact DOM focus technique is implementation-dependent, but the one-entry/roving behavior is frozen.

### Tooltip/detail equivalence

- Pointer hover can show temporary detail.
- Keyboard focus must expose equivalent content.
- Persistent selection writes to the semantic below-chart detail strip.
- Essential information is never hover-only.
- The detail strip should not steal focus automatically unless a later usability test demonstrates a need; selection feedback can be announced through appropriate accessible status text.

### Methodology

Use native `<details>/<summary>` unless the final design needs a custom control. Native semantics minimize code and preserve keyboard support.

### Reduced motion

The stylesheet already includes `prefers-reduced-motion: reduce`. Final transitions must remain non-essential.

## 13. Responsive Architecture

### SVG pattern

Every view should expose a pure `render(container, data, layout)`/equivalent layout function using:
- a stable SVG `viewBox`;
- width derived from its measured container;
- view-specific minimum/maximum height rules from the Design Freeze;
- scales recomputed from the measured layout rather than CSS-transforming a desktop chart.

### Measurement

Use `ResizeObserver` where supported, with one observer per view root or one shared observer utility. Debounce only if actual profiling shows repeated expensive work; ~120 films do not justify aggressive optimization.

### Breakpoints

CSS controls page composition. View modules receive a coarse layout mode derived from measured width, e.g.:
- desktop;
- narrow/tablet;
- single-column.

The breakpoint numbers remain a Task 8/CSS implementation detail; the Design Freeze principles are binding.

### Annotation repositioning

Annotations are data-aware layout elements, not absolutely positioned page decorations. Each view should define desktop and narrow placement rules. If annotation text must shorten at narrow widths, the full caveat remains accessible through detail/methodology content.

## 14. Styling System

`src/styles/tokens.css` is the authoritative CSS token source for:
- frozen colors;
- Inter/system font stack;
- content/prose widths;
- base spacing/radius/focus tokens.

Chart modules should reference semantic CSS custom properties or values exported by `visualSystem.js`; HEX literals should not be scattered across view code.

Reusable CSS states later should include:
- `.is-focused`;
- `.is-selected`;
- `.is-deemphasized`;
- `.has-context-caveat`;
- focus-visible rules;
- tooltip/detail styles.

Their semantics must remain aligned with Task 4: de-emphasis means temporarily outside focus, not lower importance.

## 15. Formatting Conventions

Formatting is centralized in `src/utils/format.js`.

| Content | Output example |
| --- | --- |
| Adjusted domestic | `$245M (July-2026 USD equivalent)` |
| Nominal worldwide | `$1.05B (nominal USD)` |
| Reported budget | `$150M` plus explicit field label |
| Date | `25 Nov 1998` |
| Film count | `49 films` |
| Missing value | `Not available` |
| Partial year | `2026*` with nearby `*Partial through 18 Aug` |

Gross-to-budget, if a deeper detail ever exposes it, must be formatted as a multiple and explicitly labelled `descriptive only`; it is not a normal View 3/4 tooltip field.

## 16. Dependencies

### Frontend npm dependencies

**None.** Native browser APIs are sufficient for the approved four-view scope.

### Development npm dependencies

**None.** Node's standard library handles the static build, local server, and skeleton validation.

### Python dependency

`pandas==2.2.3`

Required because Task 7 needs reliable tabular validation, grouping, rolling-window calculation, missing-value handling, and deterministic JSON generation. Reimplementing those operations manually in Node would add code without improving the final visualization.

### Native browser APIs relied on

- SVG DOM;
- ES modules;
- `fetch`;
- `ResizeObserver`;
- `Intl` formatting;
- `<details>/<summary>`;
- CSS custom properties;
- `prefers-reduced-motion`.

## 17. Development Workflow

### First-time setup

```bash
npm install
python3 -m pip install -r requirements-data.txt
```

### Validate authoritative inputs and architecture

```bash
npm run validate
```

### Current Task 6 data command

```bash
npm run data:check
```

Task 7 will extend the workflow with the final visualization-data generation command.

### Local development

```bash
npm run dev
```

Serves the source application at `http://127.0.0.1:5173`.

### Production build

```bash
npm run build
```

Runs validation and writes static output to `dist/`.

### Production preview

```bash
npm run preview
```

Serves `dist/` at `http://127.0.0.1:4173`.

## 18. Deployment Assumption

The project should be delivered as the static contents of `dist/`.

Suitable targets:
- GitHub Pages;
- university static web hosting;
- any generic static HTTP host.

No provider-specific API, serverless function, database, or authentication is required.

All application URLs should remain relative so deployment under a repository subpath is possible.

## 19. Testing Strategy

Task 6 establishes smoke validation; later tasks should expand testing without introducing an oversized test framework unless needed.

### Data tests

- frozen row/studio/corpus counts;
- required fields;
- unique IDs;
- derived release counts;
- rolling values and observation threshold;
- strategy groups and medians;
- source-hash/manifest consistency;
- no manually hard-coded plotted numbers.

### Rendering tests

- all four view modules mount;
- exactly four SVG charts are eventually present;
- no missing axes/labels;
- responsive rerender after container resize;
- no runtime exceptions if a film's optional field is missing.

### Interaction tests

- pointer/keyboard focus parity;
- View 3 roving navigation;
- Enter selection;
- Escape/clear;
- aggregate-side focus;
- selected-film → annual release highlight;
- methodology disclosure.

### Accessibility tests

- semantic heading/landmark order;
- focus-visible;
- no 100+ sequential film Tab stops;
- accessible chart names/descriptions;
- accessible film label formatting;
- hover information available through keyboard/persistent details;
- reduced-motion behavior;
- grayscale/protanopia/deuteranopia visual QA.

### Content correctness

- `Pixar Animation Studios` never relabelled WDAS;
- aggregate always `Disney animated (WDAS + Pixar)`;
- remakes remain separate;
- adjusted versus nominal financial labels remain distinct;
- no profit/ROI language;
- audience reception absent;
- `2026*` partial-year convention present in temporal claims;
- Soul/COVID release-context notes present where approved.

## 20. Performance Assessment

The complete corpus has 120 films; View 3 contains about 105 adjusted-domestic film marks plus two lines and small annual bars.

- Native SVG is comfortably performant at this scale.
- Client-side rendering is appropriate.
- DOM virtualization is unnecessary.
- Canvas is unnecessary.
- WebGL is unnecessary.
- Complex memoization/state libraries are unnecessary.
- Resize work should remain inexpensive; optimize only if profiling identifies a real issue.

## 21. Technical Risks

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Hand-built scale/axis helpers drift between views | Inconsistent labels/scales | Keep a small shared utility and test key domains/ticks |
| View 3 annotation/point density | Visual overload | Preserve Design Freeze hierarchy and view-specific relayout |
| Roving SVG keyboard focus is implemented incorrectly | Poor keyboard accessibility | Treat navigation as a first-class View 3 module concern; test with keyboard before polish |
| Derived JSON diverges from frozen methodology | Misleading final chart | Python build-time validation + manifest/source hash |
| Static relative paths break under subpath hosting | Deployment failure | Use document-relative URLs/data paths and test preview under a subpath before final delivery |
| Inter is not installed locally | Font fallback differs slightly | CSS uses the frozen Inter-first system stack; do not depend on font availability for layout correctness |

## 22. Decisions to Carry Forward

Subject to Manager Chat approval, Task 7/8 should treat these as frozen technical decisions:

- semantic HTML + CSS + vanilla ES modules;
- native SVG for all four approved views;
- no backend;
- no frontend framework;
- no D3 unless a later concrete implementation problem justifies Manager review;
- Python + pandas preprocessing;
- authoritative inputs under `data/frozen/`;
- generated runtime JSON under `public/data/derived/`;
- the six-file derived data contract defined above;
- build-time authoritative data validation and lightweight frontend schema checks;
- one view module per approved view;
- minimal shared state, with temporary focus remaining view-local;
- one chart-level keyboard entry + roving film focus for View 3;
- centralized visual tokens and formatting helpers;
- dependency-free Node build/dev scripts;
- static `dist/` deployment;
- no final chart implementation before Task 8.

# Conflict Requiring Manager Review

None. The selected architecture can implement the approved Design Freeze without simplifying the narrative, metrics, visual encodings, interaction vocabulary, or accessibility requirements.
