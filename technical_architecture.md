# Technical Architecture

## 1. Architecture Summary

The final project is a static, vertically scrolling editorial visual story built with semantic HTML, CSS, vanilla JavaScript ES modules, and native SVG. Python and pandas perform deterministic preprocessing before the browser receives data. There is no backend, frontend framework, visualization library, live API, or client-side analytical computation.

The architecture implements the frozen research question and six-section story order without dashboard controls or cross-section filtering. The default state communicates the complete argument; interaction adds optional, local detail.

## 2. Selected Stack and Rationale

### Frontend

- Semantic HTML5 for landmarks, narrative sections, figures, captions, detail regions, and methodology.
- CSS custom properties and component/state classes for the frozen visual system.
- Vanilla JavaScript ES modules for loading, rendering, responsive redraw, and local interaction.
- Native SVG for all four approved views.

Native SVG is appropriate for roughly 120 films, supports the required custom marks and direct labels, and preserves direct accessibility control. React, Svelte, D3, Canvas, and WebGL would add complexity without a performance benefit at this scale.

### Data and build

- Python 3.11+ and pandas 2.2.x for validation, grouping, rolling summaries, medians, and JSON generation.
- Node.js 20+ standard-library scripts for implementation validation, serving, and static builds.
- Browser-native ES modules; production output is a validated static copy in `dist/`.

### Backend

None. Inputs are frozen and all analytical derivation occurs at build time.

## 3. Rendering Architecture

`index.html` owns the exact narrative order:

1. What Are We Comparing?
2. A Rivalry in Context
3. The Balance Moves Over Time
4. Franchises, First Entries, and Disney Remakes
5. No Single Winner, No Single Measure
6. Methodology & Sources

Each visualization is a semantic `<figure>` with a visible title and description. View modules render responsive SVG into stable HTML chart hosts. SVGs use a `viewBox`; narrow layouts retain a minimum drawing width so horizontal scrolling stays inside the chart host rather than creating page-level overflow.

- `view1Taxonomy.js` renders the non-proportional corpus taxonomy.
- `view2RivalryTimeline.js` renders five exact-date contextual marks and three approved evidence cards.
- `view3Temporal.js` renders annual release activity plus adjusted-domestic marks and precomputed five-year trailing medians.
- `view4StrategyDistribution.js` renders three strategy groups, deterministic jitter, and precomputed medians.

View renderers replace SVG contents after `ResizeObserver` reports a material width change. View-local selection is reapplied after redraw. View 2 also restores the currently focused film mark when its SVG node is replaced.

## 4. Data Architecture

### Authoritative inputs

`data/frozen/final_integrated_dataset.csv` is the authoritative 120-film quantitative corpus. `data/frozen/rivalry_cases.md` is the frozen narrative-evidence source. Frozen inputs are never served to the browser.

### Generated runtime contract

`scripts/build_visualization_data.py` deterministically writes:

- `public/data/derived/manifest.json`
- `public/data/derived/films.json`
- `public/data/derived/release-counts.json`
- `public/data/derived/rolling-domestic.json`
- `public/data/derived/strategy-summary.json`
- `public/data/derived/rivalry-annotations.json`

The manifest records contract versions, source hashes, row counts, and output hashes. `scripts/validate_visualization_data.py` independently verifies schemas, counts, analytical populations, medians, rolling values, missingness, and freshness.

The browser loader reads the manifest first, checks its versions and declared source, then loads all runtime arrays. A failed request or malformed payload rejects initialization; `src/main.js` displays one accessible error alert and never reports the application as ready.

### Frozen analytical boundaries

- View 3 contains `CORE_WDAS`, `DISNEY_PIXAR`, and `CORE_DWA` only.
- Disney remakes remain separate from the animated temporal comparison.
- Missing financial values are omitted, never converted to zero.
- Rolling medians come only from `rolling-domestic.json`.
- Strategy medians come only from `strategy-summary.json`.
- Rivalry film IDs and sources come only from `rivalry-annotations.json`.
- Frontend code formats and positions values but does not calculate analytical summaries.

The complete derivation methodology remains in `visualization_data_layer.md`.

## 5. Final Project Structure

```text
data_viz_project/
├── index.html
├── README.md
├── technical_architecture.md
├── visualization_data_layer.md
├── qa_report.md
├── SUBMISSION_CHECKLIST.md
├── package.json
├── requirements-data.txt
├── data/frozen/                    # Read-only authoritative inputs
├── public/data/derived/            # Deterministic browser runtime data
├── scripts/
│   ├── build_visualization_data.py
│   ├── validate_visualization_data.py
│   ├── validate_frozen_inputs.py
│   ├── validate-skeleton.mjs
│   ├── build.mjs
│   └── serve.mjs
└── src/
    ├── main.js
    ├── components/
    │   ├── filmDetail.js
    │   └── tooltip.js
    ├── config/
    ├── data/loadVisualizationData.js
    ├── state/appState.js
    ├── styles/
    ├── utils/
    │   ├── focusNavigation.js
    │   ├── format.js
    │   ├── resize.js
    │   ├── scale.js
    │   └── svg.js
    └── views/
        ├── index.js
        ├── view1Taxonomy.js
        ├── view2RivalryTimeline.js
        ├── view3Temporal.js
        └── view4StrategyDistribution.js
```

`dist/`, local environments, browser profiles, and caches are generated and ignored.

## 6. Module Responsibilities

| Module | Final responsibility |
| --- | --- |
| `index.html` | Story structure, hosts, instructions, detail roots, conclusion, methodology |
| `src/main.js` | Data lifecycle, view initialization, accessible fatal error state |
| `src/config/*` | Frozen palette/shapes/labels and runtime data contract |
| `src/data/loadVisualizationData.js` | Manifest-first fetch and lightweight shape checks |
| `src/state/appState.js` | Optional shared section state; no film selection |
| `src/components/tooltip.js` | Viewport-clamped tooltip and ARIA cleanup |
| `src/components/filmDetail.js` | Persistent below-chart selected-film detail |
| `src/utils/focusNavigation.js` | One-entry chronological `aria-activedescendant` navigation |
| `src/utils/format.js` | Audience-facing dates, money, years, and missing values |
| `src/utils/resize.js` | Width observation and teardown |
| `src/utils/scale.js` | Presentation scales and deterministic jitter |
| `src/utils/svg.js` | SVG construction, marks, paths, titles, and descriptions |
| `src/views/*.js` | View-specific rendering and local interaction |
| `scripts/*.py` | Input/data generation and analytical validation |
| `scripts/validate-skeleton.mjs` | Final implementation invariant checks |
| `scripts/build.mjs` | Validated static copy into `dist/` |
| `scripts/serve.mjs` | Dependency-free development/preview server |

## 7. State and Interaction Model

Shared state contains only optional `activeSection`. Film focus and selection never propagate between views.

### View 2

Each of five marks is a keyboard focus target with button semantics. Enter, Space, or click opens approved evidence; Escape closes it. Focus returns to the equivalent mark after responsive SVG replacement.

### View 3 film explorer

The stable financial chart host is one `role="listbox"` Tab entry. Its 105 film marks use `role="option"`, stable IDs, useful labels, and `aria-selected`. Arrow keys move a chronological active index and update `aria-activedescendant`; Enter/Space selects; Escape clears. The active descendant is restored after resize. Marks are not sequential Tab stops.

The two rolling trends are separate native HTML buttons after the chart. They temporarily emphasize the matching SVG line and do not sit inside or corrupt the film listbox composite.

### View 4 film explorer

View 4 uses the same one-entry listbox model for 118 available films. Its selection and detail remain local.

### Pointer and persistent detail

Pointer hover and keyboard activation expose the same concise tooltip fields. Selection writes to an `aria-live="polite"` below-chart detail region without moving focus. Tooltips clamp to the viewport, ignore pointer events, remove stale `aria-describedby`, and clean up on teardown.

## 8. Accessibility Architecture

- `lang="en"`, skip link, landmarks, ordered headings, figures, and figcaptions provide structure.
- Every chart has a programmatic title and description; film options add specific labels without excessive Tab stops.
- Visible instructions describe arrow, Enter/Space, and Escape behavior.
- `:focus-visible` styles provide consistent high-contrast focus.
- Meaning is redundant: circle/triangle/square/diamond shapes, Pixar hatch, direct trend labels, dashed exception halos, and solid selection rings.
- Methodology uses native `<details>/<summary>`.
- Reduced-motion preferences disable non-essential transitions.
- The default story remains understandable without examining individual marks.

This supports accessibility review but does not claim WCAG certification.

## 9. Visual and Responsive System

`src/styles/tokens.css` is the authoritative CSS token source. `src/config/visualSystem.js` mirrors frozen encoding colors and shapes for SVG. Studio colors are not repurposed for annotation categories.

View modules use explicit wide/narrow layouts rather than illegibly shrinking type. Chart hosts use local overflow. View 3 retains its financial-panel height, and fixed-position tooltips remain attached to viewport-clamped anchor coordinates during local horizontal scrolling.

## 10. Validation and Build Workflow

```bash
npm install
python3 -m pip install -r requirements-data.txt
npm run data:build
npm run data:validate
npm run validate
npm run build
npm run preview
```

`npm run validate` combines frozen-input, derived-data, and dependency-free implementation checks. It protects story order, view count, frozen encodings, absence of global filters/frameworks/random jitter, runtime rivalry linkage, dense-chart navigation, separate trend semantics, detail placement, import resolution, and machine-independent paths.

The production build regenerates and validates data before copying source/runtime assets. Deployment uses only relative static URLs and has no dependency on localhost, private paths, or `data/frozen/`.

## 11. Robustness and Performance

Native SVG is comfortably performant at this scale. Resize observers avoid repeated same-width renders and expose cleanup functions. Tooltips are created once per interactive view and destroyed during teardown. Selection and active-descendant state are reapplied after responsive rendering.

No virtualization, Canvas, WebGL, backend, or optimization framework is warranted.

## 12. Final Architectural Decisions

- Semantic HTML + CSS + vanilla ES modules.
- Native SVG for four approved views.
- Python/pandas preprocessing with frozen, hashed inputs.
- No frontend analytical recomputation.
- No backend, framework, D3, or runtime dependency.
- Minimal shared state; film interaction is view-local.
- One dense-chart Tab entry with deterministic arrow navigation.
- Aggregate trend controls separated from the View 3 film composite.
- Relative-path, deployment-ready static `dist/` output.

No conflict with the frozen design or analytical decisions remains.
