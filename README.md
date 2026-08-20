# Disney vs DreamWorks — Deliverable 3

Technical skeleton for the Data Visualization Lab project **Disney vs DreamWorks: The Evolution of an Animated Competition**.

The final visual story asks:

> **How has the competitive balance between Disney animation and DreamWorks Animation changed over time?**

## Current status

**Task 6 complete:** the technical architecture and runnable project skeleton are in place.

The four final visualization views, final visualization preprocessing, film interactions, and production chart rendering are **not implemented yet**. Task 7 will build the visualization data layer; Task 8 will begin implementing the approved views.

## Selected architecture

- semantic HTML;
- CSS with centralized design tokens;
- vanilla JavaScript ES modules;
- native SVG/DOM APIs for future chart rendering;
- Python + pandas for deterministic visualization-data preprocessing;
- zero frontend runtime dependencies and no backend;
- small Node.js standard-library scripts for validation, local serving, and static production build.

See [`technical_architecture.md`](./technical_architecture.md) for the full rationale and data contract.

## Prerequisites

- Node.js 20 or newer;
- npm;
- Python 3.11 or newer;
- pip.

## Installation

There are currently no npm package dependencies, but run the normal install step to create/verify the local npm environment:

```bash
npm install
```

Install the preprocessing dependency:

```bash
python3 -m pip install -r requirements-data.txt
```

## Validate frozen inputs and skeleton

```bash
npm run validate
```

This checks the frozen 120-film assumptions, section order, the exact four view placeholders, the frozen visual-system constants, formatting helpers, the minimal state store, and the absence of legacy absolute filesystem paths.

## Local development

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The development server exposes only the application source and `public/` assets; the authoritative `data/frozen/` files are not served directly.

## Visualization data generation

Task 7 will implement the final generation step. The current command is intentionally validation-only:

```bash
npm run data:check
```

Task 7 will generate the files defined in `src/config/dataContract.js` into `public/data/derived/`.

## Production build

```bash
npm run build
```

The static build is written to:

```text
dist/
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
deliverable3_visualization/
├── index.html                     # Semantic visual-story shell and four view placeholders
├── technical_architecture.md      # Approved technical architecture candidate for Manager review
├── README.md
├── package.json                   # Zero-dependency Node workflow scripts
├── package-lock.json
├── requirements-data.txt          # Python preprocessing dependency
├── data/
│   └── frozen/                    # Read-only authoritative project inputs
├── public/
│   ├── assets/                    # Future static assets
│   └── data/derived/              # Task 7 generated visualization-ready data
├── scripts/
│   ├── validate_frozen_inputs.py  # Frozen-input assertions
│   ├── validate-skeleton.mjs      # Structural/architecture smoke checks
│   ├── build.mjs                  # Dependency-free static build
│   └── serve.mjs                  # Local development/preview server
└── src/
    ├── main.js                    # Application entry point
    ├── components/                # Shared presentation components
    ├── config/                    # Visual-system and data-contract constants
    ├── state/                     # Minimal shared application state
    ├── styles/                    # Tokens, base, layout, component styles
    ├── utils/                     # Formatting and SVG accessibility helpers
    └── views/                     # One module boundary per approved view
```

## Frozen data policy

`data/frozen/final_integrated_dataset.csv` is the authoritative analytical input. The other files in `data/frozen/` document the schema, catalogue, rivalry annotations, and catalogue methodology.

Do not manually type plotted quantitative values into JavaScript. Task 7 must derive all quantitative visualization-ready files deterministically from frozen inputs.

## Static deployment

The production `dist/` directory contains only static files and can be hosted on GitHub Pages, university web hosting, or any ordinary static server. No backend or commercial platform is required.
