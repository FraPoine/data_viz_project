# Disney vs DreamWorks — Deliverable 3

Implementation project for the Data Visualization Lab visual story **Disney vs DreamWorks: The Evolution of an Animated Competition**.

The final visual story asks:

> **How has the competitive balance between Disney animation and DreamWorks Animation changed over time?**

## Final status

The approved visual story, controlled exploration layer, final QA hardening, accessibility review, and submission documentation are complete. The default reading experience remains complete without interaction; optional depth includes tooltips, focus states, persistent local film selection, below-chart detail strips, View 3 release-year/studio coordination, aggregate-trend focus, and dense-chart arrow navigation.

## Quick start

After extracting the project ZIP archive, open a terminal in the project root directory (the folder containing `package.json`).

Do not open `index.html` directly from the filesystem. The project uses JavaScript ES modules and runtime-loaded JSON data, so it must be started through the provided local server.

Run:

```bash
npm install
python3 -m pip install -r requirements-data.txt
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

## Architecture

- semantic HTML;
- CSS with centralized design tokens;
- vanilla JavaScript ES modules;
- native SVG/DOM APIs for responsive chart rendering;
- Python + pandas for deterministic visualization-data preprocessing;
- zero frontend runtime dependencies and no backend;
- Node.js standard-library scripts for validation, local serving, and static production build.

See:

- [`technical_architecture.md`](./technical_architecture.md) — final application architecture;
- [`visualization_data_layer.md`](./visualization_data_layer.md) — frozen runtime data contract and derivations;
- [`qa_report.md`](./qa_report.md) — final QA evidence and limitations;
- [`SUBMISSION_CHECKLIST.md`](./SUBMISSION_CHECKLIST.md) — last student-controlled submission checks.

## Prerequisites

- Node.js 20 or newer;
- npm;
- Python 3.11 or newer;
- pip.

## Installation

```bash
npm install
python3 -m pip install -r requirements-data.txt
```

The npm project intentionally has no third-party runtime/build dependencies. Python uses pandas for preprocessing.

## Data workflow

### Validate frozen authoritative inputs

```bash
npm run data:check
```

Checks the frozen 120-film corpus, studio/corpus rules, release cutoff, missing audience fields, and the numeric fields required by Deliverable 3.

### Generate visualization-ready data

```bash
npm run data:build
```

Generates:

```text
public/data/derived/
├── manifest.json
├── films.json
├── release-counts.json
├── rolling-domestic.json
├── strategy-summary.json
└── rivalry-annotations.json
```

### Validate generated data and freshness

```bash
npm run data:validate
```

This validates generated schemas/counts/medians, checks per-file hashes, and fails if the manifest SHA-256 provenance no longer matches either `data/frozen/final_integrated_dataset.csv` or `data/frozen/rivalry_cases.md`.

### Full project validation

```bash
npm run validate
```

Runs frozen-data validation, derived-data validation, and implementation/architecture smoke checks.

## Local development

```bash
npm run dev
```

This regenerates and validates visualization data before starting the development server.

Open:

```text
http://127.0.0.1:5173
```

The development server exposes the application source and `public/` runtime assets. The authoritative `data/frozen/` directory is not served to the browser.

## Production build

```bash
npm run build
```

The build intentionally follows the safe option:

1. regenerate visualization data;
2. validate frozen inputs, derived data, and the core implementation;
3. copy the static application to `dist/`.

This prevents stale derived JSON from being deployed after a frozen-source change.

The build output is:

```text
dist/
```

Generated runtime data are included under:

```text
dist/data/derived/
```

## Preview the production build

```bash
npm run preview
```

Open:

```text
http://127.0.0.1:4173
```

## Folder structure

```text
data_viz_project/
├── index.html
├── README.md
├── technical_architecture.md
├── visualization_data_layer.md
├── package.json
├── package-lock.json
├── requirements-data.txt
├── data/
│   └── frozen/                    # Read-only authoritative project inputs
├── public/
│   ├── assets/
│   └── data/derived/              # Deterministically generated runtime JSON
├── scripts/
│   ├── build_visualization_data.py
│   ├── validate_visualization_data.py
│   ├── validate_frozen_inputs.py
│   ├── validate-skeleton.mjs
│   ├── build.mjs
│   └── serve.mjs
└── src/
    ├── main.js
    ├── components/                # Shared tooltip and film-detail renderers
    ├── config/
    ├── data/
    │   └── loadVisualizationData.js
    ├── state/
    ├── styles/
    ├── utils/
    └── views/                     # Four responsive native-SVG story views
```

`dist/` and local caches are generated/ignored rather than source-controlled.

## Frozen data policy

`data/frozen/final_integrated_dataset.csv` is the authoritative analytical input. The manifest also hashes `data/frozen/rivalry_cases.md`, the supporting frozen methodology for the curated rivalry annotations, so either input changing requires regeneration.

Do not manually edit generated JSON and do not type quantitative chart values into frontend view modules. The required flow is:

```text
frozen CSV
→ Python preprocessing
→ validated derived JSON
→ frontend loader
→ native-SVG rendering
```

Narrative rivalry copy is curated, but every annotation is explicitly tied to the approved film IDs and frozen methodology.

## Runtime loader

`src/data/loadVisualizationData.js` provides the shared loading boundary. It loads the manifest first, checks `schema_version` against the independent `schemaVersion` configuration and `data_contract_version` against `dataContractVersion`, then loads requested derived files with lightweight runtime checks.

It deliberately does not reproduce Python analytical validation in the browser.

## Static deployment

The production `dist/` directory is fully static and can be hosted on GitHub Pages, university web hosting, or another ordinary static host. No backend or commercial provider is required.

## Core visual story

The core visual story includes:

- deterministic visualization data: **implemented**;
- stale-data/source-hash protection: **implemented**;
- shared frontend loading contract: **implemented**;
- responsive View 1–4 default rendering: **implemented**;
- zero-origin annual activity and adjusted-domestic axes: **implemented**;
- precomputed rolling lines and strategy medians: **implemented**;
- persistent rivalry/release-context narrative: **implemented**.

## Controlled exploration

Optional interaction remains view-local and does not change evidence or analytical populations:

- all five View 2 films support pointer/keyboard focus and open approved source details;
- Views 3 and 4 share restrained HTML tooltips for pointer and keyboard focus;
- film selection is persistent within its own view and populates a below-chart detail strip;
- View 3 selection coordinates only the selected film’s exact release year/studio bar segment;
- View 3’s two approved aggregate trends use semantically separate native focus controls;
- Views 3 and 4 use one chart-level Tab entry with deterministic arrow-key film navigation rather than one Tab stop per point;
- Enter/Space selects and Escape restores the default state.

## Accessibility model

The page provides semantic landmarks and figures, a skip link, accessible SVG names/descriptions, visible focus states, reduced-motion support, and redundant shape/hatch/line encodings. View 2 exposes five direct keyboard targets. Views 3 and 4 each expose one listbox entry with chronological arrow navigation instead of one Tab stop per film. Enter/Space selects and Escape clears; selected-film detail is announced below the owning chart. View 3 aggregate trends use separate native buttons.

The project has been reviewed for accessibility but does not claim formal WCAG certification. See `qa_report.md` for the exact checks performed.
