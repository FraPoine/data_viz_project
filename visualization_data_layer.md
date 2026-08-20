# Visualization Data Layer

## 1. Purpose

Task 7 implements the deterministic data boundary between the frozen Deliverable 2 analytical dataset and the Deliverable 3 frontend.

The frontend does not compute analytical summaries. Quantitative chart inputs are generated at build time from the authoritative frozen CSV, validated, serialized as strict JSON, and described by a reproducible manifest.

The approved Task 6 runtime contract is retained unchanged:

```text
public/data/derived/
├── manifest.json
├── films.json
├── release-counts.json
├── rolling-domestic.json
├── strategy-summary.json
└── rivalry-annotations.json
```

## 2. Authoritative Inputs

The quantitative source of truth is:

```text
data/frozen/final_integrated_dataset.csv
```

It contains exactly 120 theatrical films through the frozen cutoff **2026-08-18**.

Supporting frozen references are:

- `data/frozen/data_dictionary.csv`;
- `data/frozen/canonical_film_catalogue.csv`;
- `data/frozen/rivalry_cases.md`;
- `data/frozen/catalogue_methodology.md`.

Validated Deliverable 2 EDA outputs are reference checkpoints only. Runtime values are not copied from them.

## 3. Data Flow

```text
Frozen authoritative inputs
        ↓
validate_frozen_inputs.py / build-time assertions
        ↓
build_visualization_data.py
        ↓
approved deterministic transformations
        ↓
strict JSON runtime files
        ↓
validate_visualization_data.py
        ↓
manifest source/file hashes + frontend loading contract
```

`npm run build` regenerates the visualization data before validation and static packaging. This prevents an old derived JSON snapshot from being deployed after the frozen CSV changes.

## 4. Validation Rules

### Frozen input

Validation requires:

- exactly 120 rows;
- unique `film_id`;
- exact studio counts: 29 WDAS, 28 Pixar, 49 DreamWorks, 14 Walt Disney Pictures remakes;
- exact corpus assignments: 29 `CORE_WDAS`, 28 `DISNEY_PIXAR`, 49 `CORE_DWA`, 14 `DISNEY_REMAKE`;
- no Illumination, Sony Pictures Animation, or Blue Sky Studios rows;
- deterministic `competitive_side` mapping;
- release dates no later than 2026-08-18;
- TMDB rating and vote-count fields unavailable for all 120 films;
- production budget, domestic gross, adjusted domestic gross, and worldwide gross numeric, finite, and non-negative where present.

Approved missing values are preserved and never imputed.

### Derived data

Derived validation checks:

- runtime file existence and strict JSON syntax;
- source freshness against the manifest SHA-256;
- per-file SHA-256, byte size, and record count;
- 120 unique runtime film records;
- exact strategy totals 71 / 35 / 14;
- animated corpus = exactly 106 films;
- annual release counts reconcile to 29 WDAS, 28 Pixar, 57 Disney animated, and 49 DreamWorks;
- rolling windows span exactly five calendar years and contain at least four available adjusted-domestic observations;
- strategy availability = 71/71, 34/35, 13/14;
- rivalry annotations resolve only to the five approved contextual films;
- `Shrek` has no invented paired counterpart.

## 5. `films.json`

### Purpose

Minimal film-level runtime data for:

- View 2 film identity and release dates;
- View 3 individual film marks and future film details;
- View 4 individual distribution marks and future film details.

### Ordering and key

- Primary key: `film_id`.
- Stable ordering: `release_date`, then `film_id`.

### Fields

| Field | Type | Definition |
| --- | --- | --- |
| `film_id` | string | Frozen unique film identifier |
| `title` | string | Film title |
| `studio` | string | Actual production studio identity; Pixar remains Pixar Animation Studios |
| `corpus_assignment` | string | Frozen analytical layer |
| `release_date` | `YYYY-MM-DD` string | Canonical release date |
| `release_year` | integer | Canonical release year |
| `release_type` | string | Frozen theatrical/release-model classification |
| `release_context` | string | Frozen context such as `standard` or `covid_disrupted` |
| `franchise_status` | string | Frozen franchise classification |
| `is_franchise_extension` | boolean | Frozen deterministic franchise-extension flag |
| `strategy_group` | string | Task 7 mutually exclusive derived strategy group |
| `production_budget_usd_nominal` | number or `null` | Reported nominal production budget |
| `domestic_box_office_usd_jul2026` | number or `null` | U.S. domestic theatrical gross in July-2026 USD equivalent |
| `worldwide_box_office_usd_nominal` | number | Nominal worldwide theatrical gross |
| `has_release_context_caveat` | boolean | `true` when `release_context != standard` or `release_type != theatrical` |
| `comparability_note` | string or `null` | Targeted approved comparability note; currently used for the `Soul` re-release/CPI alignment case |

### Strategy-group derivation

The rule is evaluated in this order:

1. `corpus_assignment == DISNEY_REMAKE` → **Disney remake/reimagining layer**;
2. otherwise, animated film with `is_franchise_extension == true` → **Animated franchise extension**;
3. remaining animated film → **Animated first entry**.

Expected totals:

- Animated first entry: 71;
- Animated franchise extension: 35;
- Disney remake/reimagining layer: 14.

### Missing-value serialization

Missing numeric values are serialized as JSON `null`.

The generated JSON never contains `NaN` or `Infinity`, and booleans remain JSON booleans rather than strings.

## 6. `release-counts.json`

### Purpose

View 3 annual release-activity component.

### Key and coverage

- Key: `release_year`.
- Exactly one record per year from 1998 through 2026, including years with zero releases.

### Fields

| Field | Type | Definition |
| --- | --- | --- |
| `release_year` | integer | Calendar release year |
| `wdas` | integer | `CORE_WDAS` releases in the year |
| `pixar` | integer | `DISNEY_PIXAR` releases in the year |
| `disney_animated` | integer | `wdas + pixar` |
| `dreamworks` | integer | `CORE_DWA` releases in the year |
| `is_partial_year` | boolean | `true` only for 2026 |

Disney remakes never enter these counts.

## 7. `rolling-domestic.json`

### Purpose

Primary quantitative summary for View 3.

### Analytical sides

Exactly:

- `Disney animated (WDAS + Pixar)` = `CORE_WDAS` + `DISNEY_PIXAR`;
- `DreamWorks` = `CORE_DWA`.

`DISNEY_REMAKE` is excluded.

### Rolling definition

For endpoint year `Y`:

```text
window = Y-4 ... Y
```

Use all films in the analytical side within the five calendar years with non-missing:

```text
domestic_box_office_usd_jul2026
```

Then compute the median.

Rules:

- window length: exactly five calendar years;
- minimum available observations: 4;
- output records below the threshold are **omitted**;
- audience-facing endpoints begin at 2002, the first complete five-year window within the 1998-start corpus;
- the statistic is descriptive and is not a winner score.

### Key and fields

Composite key:

```text
(animated_side, window_end_year)
```

Fields:

- `animated_side`;
- `window_start_year`;
- `window_end_year`;
- `domestic_available`;
- `median_domestic_box_office_usd_jul2026`.

### D2 validation checkpoints

The independently generated values reproduce the validated D2 checkpoints:

- Disney animated peak: 2015–2019, approximately $478.5M;
- DreamWorks peak: 2006–2010, approximately $297.3M.

These values are assertions/checkpoints in the preprocessing QA; chart rendering reads the generated JSON rather than hard-coded frontend constants.

## 8. `strategy-summary.json`

### Purpose

View 4 summary labels and data-quality context. Individual film points remain in `films.json`.

### Key and fields

Key: `strategy_group`.

Fields:

- `strategy_group`;
- `total_films`;
- `domestic_available`;
- `median_domestic_box_office_usd_jul2026`.

Expected totals/availability:

| Group | Total | Adjusted domestic available |
| --- | ---: | ---: |
| Animated first entry | 71 | 71 |
| Animated franchise extension | 35 | 34 |
| Disney remake/reimagining layer | 14 | 13 |

The median is computed directly from non-missing frozen adjusted-domestic values. No imputation is performed.

## 9. `rivalry-annotations.json`

### Purpose

Curated contextual copy for View 2, explicitly linked to frozen film IDs.

### Key and fields

Key: `annotation_id`.

Each record contains:

- `annotation_id`;
- `case_type`;
- `film_ids`;
- `persistent_annotation`;
- `details`;
- `evidence_framing`;
- `sources` with readable label and URL.

### Approved cases only

1. `Antz` + `A Bug's Life` — strongest documented early rivalry case;
2. `The Road to El Dorado` + `The Emperor's New Groove` — more cautious production-era comparison;
3. `Shrek` — Disney-context/fairy-tale subversion case, with one film ID only.

No numeric evidence-strength field, pairing algorithm, or rivalry score exists.

## 10. `manifest.json`

### Purpose

Build reproducibility, stale-data protection, and frontend compatibility.

### Fields

The manifest includes:

- `schema_version`;
- `data_contract_version`;
- `frozen_cutoff`;
- authoritative source dataset filename, row count, and SHA-256;
- total/animated/side counts;
- exact studio, corpus-assignment, and strategy counts;
- generated-file record count, SHA-256, and byte size;
- generation script metadata.

No wall-clock generation timestamp is stored. Omitting volatile timestamps makes two builds from unchanged inputs byte-for-byte reproducible.

The manifest does not hash itself; it hashes the five runtime data payloads it describes.

## 11. Reproducibility

Generate:

```bash
npm run data:build
```

Validate:

```bash
npm run data:validate
```

`build_visualization_data.py` uses repository-relative paths only.

Determinism is supported by:

- stable film ordering;
- fixed year/strategy/side ordering;
- strict JSON serialization;
- no volatile timestamp;
- SHA-256 metadata for authoritative input and derived payloads.

If the frozen CSV changes without regenerating derived JSON, `data:validate` fails on the source hash.

## 12. Build Integration

The project uses **automatic data generation before production build**:

```bash
npm run build
```

runs, in order:

1. `data:build`;
2. frozen + derived + skeleton validation;
3. static build into `dist/`.

This is preferred to requiring a developer to remember a manual regeneration step.

The static builder copies `public/` into `dist/`, so all six generated files appear under:

```text
dist/data/derived/
```

## 13. Runtime Loading Contract

Frontend module:

```text
src/data/loadVisualizationData.js
```

The loader:

1. loads `manifest.json` first;
2. checks schema/data-contract compatibility;
3. verifies the expected authoritative dataset identity and 120-row contract;
4. loads only requested runtime datasets;
5. checks lightweight top-level structure and required key fields;
6. returns a clear error state instead of silently rendering partial data.

Python remains responsible for the full analytical validation. The browser does not duplicate the build-time audit.

Example future Task 8 usage:

```js
const { films, rollingDomestic } = await loadVisualizationData([
  "films",
  "rollingDomestic"
]);
```

This module loads data only; it does not render a view.

## 14. Known Missingness / Caveats

- TMDB rating and vote-count data are unavailable for 120/120 films and do not enter the runtime contract.
- Adjusted domestic gross retains approved missing values; no zero substitution is performed.
- International gross remains too sparse for systematic visualization and is omitted from the runtime film records.
- Worldwide gross remains nominal.
- Production budget remains a reported estimate.
- Gross-to-budget is not part of the Task 7 runtime files because the approved final views do not use it as a primary metric.
- Non-standard release context is preserved, not corrected counterfactually.
- `Soul` keeps its original adjusted value and receives a structured comparability note explaining the 2024 U.S. re-release / canonical 2020 CPI alignment issue.
- 2026 remains partial through 18 Aug and is explicitly marked in annual data.

## 15. Decisions to Carry Forward

Task 8 should treat these as frozen data-layer decisions:

- `final_integrated_dataset.csv` remains the authoritative quantitative source;
- the six-file Task 6 contract is sufficient and unchanged;
- all chart values come from generated runtime data rather than frontend analysis constants;
- `films.json` is the only film-level quantitative runtime payload;
- five-year rolling medians are precomputed by Python with minimum `domestic_available >= 4`;
- annual activity includes all years 1998–2026 and marks 2026 partial;
- View 4 medians and availability are precomputed;
- rivalry context is curated text tied to explicit approved film IDs;
- source/file hashes protect against stale or malformed derived data;
- browser validation stays lightweight;
- no final chart rendering or interaction behavior is implemented in Task 7.
