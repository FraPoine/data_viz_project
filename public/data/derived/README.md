# Generated visualization data

Task 7 generates the visualization-ready runtime data in this directory from the authoritative frozen input `data/frozen/final_integrated_dataset.csv`.

Generated outputs:

- `manifest.json` — schema/data-contract version, frozen cutoff, source SHA-256, corpus counts, and per-file hashes/counts;
- `films.json` — minimal film-level runtime records for Views 2–4 and film detail;
- `release-counts.json` — annual WDAS, Pixar, Disney-animated, and DreamWorks counts for 1998–2026;
- `rolling-domestic.json` — validated five-year trailing medians for the two approved animated sides;
- `strategy-summary.json` — group totals, adjusted-domestic availability, and medians for View 4;
- `rivalry-annotations.json` — curated approved contextual annotations tied to explicit film IDs.

Do not edit generated JSON manually. Regenerate and validate it from the repository root:

```bash
npm run data:build
npm run data:validate
```

`npm run build` regenerates and validates the derived data automatically so stale JSON cannot be deployed after the frozen CSV changes.
