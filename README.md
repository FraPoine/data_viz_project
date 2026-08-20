# Disney vs DreamWorks — Deliverable 3

Implementation project for the Data Visualization Lab visual story **Disney vs DreamWorks: The Evolution of an Animated Competition**.

The final visual story asks:

> **How has the competitive balance between Disney animation and DreamWorks Animation changed over time?**

## Current status

**Task 7 complete:** the technical architecture, runnable project skeleton, and deterministic visualization data layer are implemented.

Visualization-ready JSON is now generated and validated automatically from the frozen 120-film analytical dataset. The four final chart views, axes/SVG marks, production tooltips, and final visual interactions are **not implemented yet**. Task 8 is the next stage.

## Architecture

- semantic HTML;
- CSS with centralized design tokens;
- vanilla JavaScript ES modules;
- native SVG/DOM APIs for Task 8 chart rendering;
- Python + pandas for deterministic visualization-data preprocessing;
- zero frontend runtime dependencies and no backend;
- Node.js standard-library scripts for validation, local serving, and static production build.

See:

- [`technical_architecture.md`](./technical_architecture.md) — Task 6 architecture;
- [`visualization_data_layer.md`](./visualization_data_layer.md) — Task 7 runtime data contract and derivations.

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

Runs frozen-data validation, derived-data validation, and skeleton/architecture smoke checks.

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
2. validate frozen inputs, derived data, and skeleton;
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
    ├── components/
    ├── config/
    ├── data/
    │   └── loadVisualizationData.js
    ├── state/
    ├── styles/
    ├── utils/
    └── views/                     # Four placeholders; charts start in Task 8
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
→ Task 8 rendering
```

Narrative rivalry copy is curated, but every annotation is explicitly tied to the approved film IDs and frozen methodology.

## Runtime loader

`src/data/loadVisualizationData.js` provides the shared Task 8 loading boundary. It loads the manifest first, checks `schema_version` against the independent `schemaVersion` configuration and `data_contract_version` against `dataContractVersion`, then loads requested derived files with lightweight runtime checks.

It deliberately does not reproduce Python analytical validation in the browser.

## Static deployment

The production `dist/` directory is fully static and can be hosted on GitHub Pages, university web hosting, or another ordinary static host. No backend or commercial provider is required.

## Task boundary

After Task 7:

- deterministic visualization data: **implemented**;
- stale-data/source-hash protection: **implemented**;
- shared frontend loading contract: **implemented**;
- final View 1–4 rendering: **not implemented**;
- axes, marks, rolling lines, tooltips, roving keyboard UI, and visual polish: **not implemented**.

Task 8 will implement the approved visual story using the Task 7 data contract without changing the frozen analysis.
