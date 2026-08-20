# Frozen inputs

These files are read-only authoritative project inputs for Deliverable 3.

- `final_integrated_dataset.csv` — authoritative 120-film quantitative dataset;
- `data_dictionary.csv` — field definitions and semantics;
- `canonical_film_catalogue.csv` — canonical catalogue reference;
- `rivalry_cases.md` — curated narrative annotations for the approved early-rivalry cases;
- `catalogue_methodology.md` — authoritative catalogue methodology and edge-case rules.

Do not edit frozen files through the visualization-data pipeline. Quantitative runtime data must be regenerated deterministically from `final_integrated_dataset.csv`.

Task 7 records the source dataset SHA-256 in `public/data/derived/manifest.json`. Derived-data validation fails if the current frozen CSV no longer matches that hash, preventing stale visualization JSON from being treated as current.
