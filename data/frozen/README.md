# Frozen inputs

These files are read-only project inputs for Deliverable 3.

- `final_integrated_dataset.csv` — authoritative 120-film analytical dataset.
- `data_dictionary.csv` — field definitions and semantics.
- `canonical_film_catalogue.csv` — canonical catalogue reference.
- `rivalry_cases.md` — curated narrative annotations for the approved early-rivalry cases.
- `catalogue_methodology.md` — authoritative catalogue methodology and edge-case rules.

Do not edit these files inside the visualization pipeline. Task 7 must derive visualization-ready data deterministically from these inputs and must fail if the frozen assumptions are violated.
