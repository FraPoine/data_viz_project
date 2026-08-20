#!/usr/bin/env python3
"""Build deterministic visualization-ready data from the frozen Deliverable 3 dataset."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FROZEN_DIR = ROOT / "data" / "frozen"
DERIVED_DIR = ROOT / "public" / "data" / "derived"
DATASET = FROZEN_DIR / "final_integrated_dataset.csv"
RIVALRY_METHOD = FROZEN_DIR / "rivalry_cases.md"

SCHEMA_VERSION = 1
DATA_CONTRACT_VERSION = 1
FROZEN_CUTOFF = "2026-08-18"

EXPECTED_STUDIOS = {
    "DreamWorks Animation": 49,
    "Walt Disney Animation Studios": 29,
    "Pixar Animation Studios": 28,
    "Walt Disney Pictures": 14,
}
EXPECTED_ASSIGNMENTS = {
    "CORE_DWA": 49,
    "CORE_WDAS": 29,
    "DISNEY_PIXAR": 28,
    "DISNEY_REMAKE": 14,
}
EXPECTED_STRATEGY_COUNTS = {
    "Animated first entry": 71,
    "Animated franchise extension": 35,
    "Disney remake/reimagining layer": 14,
}
EXPECTED_STRATEGY_AVAILABLE = {
    "Animated first entry": 71,
    "Animated franchise extension": 34,
    "Disney remake/reimagining layer": 13,
}
ANIMATED_ASSIGNMENTS = {"CORE_WDAS", "DISNEY_PIXAR", "CORE_DWA"}
DISNEY_ANIMATED_ASSIGNMENTS = {"CORE_WDAS", "DISNEY_PIXAR"}
NUMERIC_FIELDS = [
    "production_budget_usd_nominal",
    "domestic_box_office_usd_nominal",
    "domestic_box_office_usd_jul2026",
    "worldwide_box_office_usd_nominal",
]

RIVALRY_ANNOTATIONS = [
    {
        "annotation_id": "antz-bugs-life",
        "case_type": "documented_direct_rivalry_context",
        "film_ids": ["DWA_1998_ANTZ", "PIXAR_1998_A_BUG_S_LIFE"],
        "persistent_annotation": "The strongest documented early rivalry case. The two 1998 ant-colony films were released less than two months apart amid documented discussion of parallel premises and release timing.",
        "details": "Pixar remains Pixar Animation Studios. A Bug's Life belongs to the Disney analytical side under the documented Disney-Pixar co-production relationship; the case is contextual and does not define the analytical corpus.",
        "evidence_framing": "Strongest documented early rivalry case",
        "sources": [
            {
                "label": "Pixar SEC filing — Disney-Pixar Co-Production Agreement",
                "url": "https://www.sec.gov/Archives/edgar/data/1002114/000089161802001531/f80223e10-k405.htm",
            },
            {
                "label": "Wired — contemporary rivalry reporting",
                "url": "https://www.wired.com/1998/11/is-one-bug-as-good-as-another/",
            },
        ],
    },
    {
        "annotation_id": "el-dorado-emperors-new-groove",
        "case_type": "cautious_production_era_comparison",
        "film_ids": [
            "DWA_2000_THE_ROAD_TO_EL_DORADO",
            "WDAS_2000_THE_EMPEROR_S_NEW_GROOVE",
        ],
        "persistent_annotation": "A more cautious production-era comparison. Similarities were noticed during production, but the documented relationship is less direct than in the 1998 case.",
        "details": "The two films remain contextual narrative anchors, not a quantitative rivalry pair or a criterion for inclusion.",
        "evidence_framing": "More cautious production-era comparison",
        "sources": [
            {
                "label": "Cross-check cited by the frozen rivalry methodology",
                "url": "https://en.wikipedia.org/wiki/The_Emperor%27s_New_Groove",
            }
        ],
    },
    {
        "annotation_id": "shrek-subversion",
        "case_type": "disney_context_subversion",
        "film_ids": ["DWA_2001_SHREK"],
        "persistent_annotation": "A Disney-context subversion case, not a paired rivalry film. Contemporary reporting associated Shrek's irreverent fairy-tale approach with Disney criticism; no WDAS or Pixar counterpart is assigned.",
        "details": "The case supports a sourced discussion of DreamWorks differentiating itself through fairy-tale parody and subversion. It must not become a causal variable or an invented one-to-one pair.",
        "evidence_framing": "Disney-context subversion — no paired counterpart",
        "sources": [
            {
                "label": "Wired — contemporary Cannes reporting",
                "url": "https://www.wired.com/2001/05/cannes-fairy-tales/",
            }
        ],
    },
]


def fail(message: str) -> None:
    raise AssertionError(message)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def json_compatible(value: Any) -> Any:
    """Convert pandas/numpy scalar values to strict JSON-compatible Python values."""
    if value is None or pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, bool):
        return bool(value)
    if hasattr(value, "item"):
        value = value.item()
    if isinstance(value, float):
        if not math.isfinite(value):
            fail("Attempted to serialize a non-finite numeric value")
        return float(value)
    if isinstance(value, int):
        return int(value)
    return value


def write_json(path: Path, payload: Any) -> None:
    if isinstance(payload, list):
        lines = ["["]
        for index, record in enumerate(payload):
            suffix = "," if index < len(payload) - 1 else ""
            lines.append(json.dumps(record, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + suffix)
        lines.append("]")
        text = "\n".join(lines) + "\n"
    else:
        text = json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
    path.write_text(text, encoding="utf-8")


def load_and_validate_frozen() -> pd.DataFrame:
    df = pd.read_csv(DATASET, parse_dates=["release_date"])

    required_fields = {
        "film_id",
        "title",
        "studio",
        "corpus_assignment",
        "competitive_side",
        "release_date",
        "release_year",
        "release_type",
        "release_context",
        "franchise_status",
        "is_franchise_extension",
        "production_budget_usd_nominal",
        "domestic_box_office_usd_nominal",
        "domestic_box_office_usd_jul2026",
        "worldwide_box_office_usd_nominal",
        "box_office_note",
        "tmdb_user_rating",
        "tmdb_vote_count",
    }
    missing = required_fields - set(df.columns)
    if missing:
        fail(f"Missing required frozen fields: {sorted(missing)}")

    if len(df) != 120:
        fail(f"Expected 120 films, found {len(df)}")
    if not df["film_id"].is_unique:
        fail("film_id must be unique")
    if df["studio"].value_counts().to_dict() != EXPECTED_STUDIOS:
        fail(f"Unexpected studio counts: {df['studio'].value_counts().to_dict()}")
    if df["corpus_assignment"].value_counts().to_dict() != EXPECTED_ASSIGNMENTS:
        fail(f"Unexpected corpus-assignment counts: {df['corpus_assignment'].value_counts().to_dict()}")

    excluded = {"Illumination", "Sony Pictures Animation", "Blue Sky Studios"}
    if set(df["studio"]) & excluded:
        fail("Excluded studios are present in the frozen dataset")

    expected_side = df["corpus_assignment"].map(
        {
            "CORE_WDAS": "Disney",
            "DISNEY_PIXAR": "Disney",
            "DISNEY_REMAKE": "Disney",
            "CORE_DWA": "DreamWorks",
        }
    )
    if not expected_side.equals(df["competitive_side"]):
        fail("competitive_side mapping does not match the frozen methodology")

    if int(df["release_year"].min()) != 1998 or int(df["release_year"].max()) != 2026:
        fail("Unexpected release-year range")
    if (df["release_date"] > pd.Timestamp(FROZEN_CUTOFF)).any():
        fail(f"A film exceeds the frozen {FROZEN_CUTOFF} cutoff")
    if df["tmdb_user_rating"].notna().any() or df["tmdb_vote_count"].notna().any():
        fail("Audience fields must remain unavailable for the frozen 120-film corpus")

    for field in NUMERIC_FIELDS:
        numeric = pd.to_numeric(df[field], errors="coerce")
        invalid_type = df[field].notna() & numeric.isna()
        if invalid_type.any():
            fail(f"{field} contains non-numeric non-missing values")
        finite = numeric.dropna().map(math.isfinite)
        if not finite.all():
            fail(f"{field} contains non-finite values")
        if (numeric.dropna() < 0).any():
            fail(f"{field} contains negative values")

    return df


def derive_strategy_group(row: pd.Series) -> str:
    if row["corpus_assignment"] == "DISNEY_REMAKE":
        return "Disney remake/reimagining layer"
    if row["corpus_assignment"] not in ANIMATED_ASSIGNMENTS:
        fail(f"Unexpected non-remake corpus assignment: {row['corpus_assignment']}")
    if bool(row["is_franchise_extension"]):
        return "Animated franchise extension"
    return "Animated first entry"


def build_films(df: pd.DataFrame) -> list[dict[str, Any]]:
    working = df.copy()
    working["strategy_group"] = working.apply(derive_strategy_group, axis=1)
    working["has_release_context_caveat"] = (
        working["release_context"].ne("standard") | working["release_type"].ne("theatrical")
    )

    if working["strategy_group"].value_counts().to_dict() != EXPECTED_STRATEGY_COUNTS:
        fail(f"Unexpected strategy-group totals: {working['strategy_group'].value_counts().to_dict()}")

    fields = [
        "film_id",
        "title",
        "studio",
        "corpus_assignment",
        "release_date",
        "release_year",
        "release_type",
        "release_context",
        "franchise_status",
        "is_franchise_extension",
        "strategy_group",
        "production_budget_usd_nominal",
        "domestic_box_office_usd_jul2026",
        "worldwide_box_office_usd_nominal",
        "has_release_context_caveat",
    ]

    records: list[dict[str, Any]] = []
    for _, row in working.sort_values(["release_date", "film_id"], kind="stable").iterrows():
        record = {field: json_compatible(row[field]) for field in fields}
        record["comparability_note"] = None
        if row["film_id"] == "PIXAR_2020_SOUL":
            note = str(row["box_office_note"])
            if "2024 U.S. theatrical re-release" not in note or "canonical 2020-12 release month" not in note:
                fail("Soul source note no longer contains the approved re-release/CPI caveat")
            record["comparability_note"] = (
                "U.S. domestic source value comes from the 2024 theatrical re-release, "
                "while the approved CPI adjustment uses the canonical December 2020 release month."
            )
        records.append(record)

    if len(records) != 120 or len({r["film_id"] for r in records}) != 120:
        fail("films.json records do not resolve to 120 unique film IDs")
    return records


def build_release_counts(df: pd.DataFrame) -> list[dict[str, Any]]:
    animated = df[df["corpus_assignment"].isin(ANIMATED_ASSIGNMENTS)]
    records: list[dict[str, Any]] = []
    for year in range(1998, 2027):
        year_rows = animated[animated["release_year"] == year]
        wdas = int((year_rows["corpus_assignment"] == "CORE_WDAS").sum())
        pixar = int((year_rows["corpus_assignment"] == "DISNEY_PIXAR").sum())
        dreamworks = int((year_rows["corpus_assignment"] == "CORE_DWA").sum())
        records.append(
            {
                "release_year": year,
                "wdas": wdas,
                "pixar": pixar,
                "disney_animated": wdas + pixar,
                "dreamworks": dreamworks,
                "is_partial_year": year == 2026,
            }
        )

    if len(records) != 29:
        fail("release-counts.json must contain one record for every year 1998–2026")
    if sum(r["wdas"] for r in records) != 29:
        fail("WDAS release counts do not reconcile to 29")
    if sum(r["pixar"] for r in records) != 28:
        fail("Pixar release counts do not reconcile to 28")
    if sum(r["disney_animated"] for r in records) != 57:
        fail("Disney animated release counts do not reconcile to 57")
    if sum(r["dreamworks"] for r in records) != 49:
        fail("DreamWorks release counts do not reconcile to 49")
    if not records[-1]["is_partial_year"] or records[-1]["release_year"] != 2026:
        fail("2026 must be explicitly marked as partial")
    return records


def build_rolling_domestic(df: pd.DataFrame) -> list[dict[str, Any]]:
    animated = df[df["corpus_assignment"].isin(ANIMATED_ASSIGNMENTS)].copy()
    animated["animated_side"] = animated["corpus_assignment"].map(
        {
            "CORE_WDAS": "Disney animated (WDAS + Pixar)",
            "DISNEY_PIXAR": "Disney animated (WDAS + Pixar)",
            "CORE_DWA": "DreamWorks",
        }
    )

    records: list[dict[str, Any]] = []
    for side in ["Disney animated (WDAS + Pixar)", "DreamWorks"]:
        side_rows = animated[animated["animated_side"] == side]
        for endpoint in range(2002, 2027):
            start = endpoint - 4
            window = side_rows[
                (side_rows["release_year"] >= start) & (side_rows["release_year"] <= endpoint)
            ]
            values = window["domestic_box_office_usd_jul2026"].dropna()
            available = int(values.shape[0])
            if available < 4:
                continue
            median = float(values.median())
            if not math.isfinite(median) or median < 0:
                fail("Rolling domestic median must be finite and non-negative")
            records.append(
                {
                    "animated_side": side,
                    "window_start_year": start,
                    "window_end_year": endpoint,
                    "domestic_available": available,
                    "median_domestic_box_office_usd_jul2026": median,
                }
            )

    records.sort(key=lambda r: (r["animated_side"], r["window_end_year"]))

    sides = {r["animated_side"] for r in records}
    if sides != {"Disney animated (WDAS + Pixar)", "DreamWorks"}:
        fail(f"Unexpected rolling analytical sides: {sorted(sides)}")
    if any(r["window_end_year"] - r["window_start_year"] != 4 for r in records):
        fail("Rolling windows must span exactly five calendar years")
    if any(r["domestic_available"] < 4 for r in records):
        fail("Rolling output violates the minimum-observation rule")

    # Independent validation checkpoints from Deliverable 2, not runtime hard-coded chart values.
    disney = [r for r in records if r["animated_side"] == "Disney animated (WDAS + Pixar)"]
    dwa = [r for r in records if r["animated_side"] == "DreamWorks"]
    disney_peak = max(disney, key=lambda r: r["median_domestic_box_office_usd_jul2026"])
    dwa_peak = max(dwa, key=lambda r: r["median_domestic_box_office_usd_jul2026"])
    if (disney_peak["window_start_year"], disney_peak["window_end_year"]) != (2015, 2019):
        fail(f"Unexpected Disney rolling peak window: {disney_peak}")
    if abs(disney_peak["median_domestic_box_office_usd_jul2026"] - 478_500_000) > 1_000_000:
        fail(f"Disney rolling peak materially disagrees with validated D2 checkpoint: {disney_peak}")
    if (dwa_peak["window_start_year"], dwa_peak["window_end_year"]) != (2006, 2010):
        fail(f"Unexpected DreamWorks rolling peak window: {dwa_peak}")
    if abs(dwa_peak["median_domestic_box_office_usd_jul2026"] - 297_300_000) > 1_000_000:
        fail(f"DreamWorks rolling peak materially disagrees with validated D2 checkpoint: {dwa_peak}")

    return records


def build_strategy_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    working = df.copy()
    working["strategy_group"] = working.apply(derive_strategy_group, axis=1)
    records: list[dict[str, Any]] = []
    order = [
        "Animated first entry",
        "Animated franchise extension",
        "Disney remake/reimagining layer",
    ]
    for group in order:
        subset = working[working["strategy_group"] == group]
        values = subset["domestic_box_office_usd_jul2026"].dropna()
        records.append(
            {
                "strategy_group": group,
                "total_films": int(len(subset)),
                "domestic_available": int(len(values)),
                "median_domestic_box_office_usd_jul2026": float(values.median()),
            }
        )

    totals = {r["strategy_group"]: r["total_films"] for r in records}
    available = {r["strategy_group"]: r["domestic_available"] for r in records}
    if totals != EXPECTED_STRATEGY_COUNTS:
        fail(f"Unexpected strategy totals: {totals}")
    if available != EXPECTED_STRATEGY_AVAILABLE:
        fail(f"Unexpected strategy adjusted-domestic availability: {available}")
    return records


def build_rivalry_annotations(film_ids: set[str]) -> list[dict[str, Any]]:
    frozen_text = RIVALRY_METHOD.read_text(encoding="utf-8")
    required_phrases = [
        "Antz (1998) / A Bug's Life (1998)",
        "The Road to El Dorado (2000) / The Emperor's New Groove (2000)",
        "Shrek (2001)",
        "no WDAS or Pixar counterpart is assigned",
    ]
    for phrase in required_phrases:
        if phrase not in frozen_text:
            fail(f"Frozen rivalry methodology is missing required approved evidence text: {phrase}")

    allowed_ids = {
        "DWA_1998_ANTZ",
        "PIXAR_1998_A_BUG_S_LIFE",
        "DWA_2000_THE_ROAD_TO_EL_DORADO",
        "WDAS_2000_THE_EMPEROR_S_NEW_GROOVE",
        "DWA_2001_SHREK",
    }
    referenced: set[str] = set()
    for annotation in RIVALRY_ANNOTATIONS:
        annotation_ids = set(annotation["film_ids"])
        if not annotation_ids <= film_ids:
            fail(f"Rivalry annotation references unknown film IDs: {sorted(annotation_ids - film_ids)}")
        referenced |= annotation_ids
        if annotation["annotation_id"] == "shrek-subversion" and len(annotation["film_ids"]) != 1:
            fail("Shrek must not receive an invented paired counterpart")
    if referenced != allowed_ids:
        fail(f"Rivalry annotations must reference exactly the five approved films: {sorted(referenced)}")
    return RIVALRY_ANNOTATIONS


def file_metadata(path: Path, records: int) -> dict[str, Any]:
    return {"records": records, "sha256": sha256_file(path), "bytes": path.stat().st_size}


def main() -> int:
    df = load_and_validate_frozen()
    DERIVED_DIR.mkdir(parents=True, exist_ok=True)

    films = build_films(df)
    release_counts = build_release_counts(df)
    rolling_domestic = build_rolling_domestic(df)
    strategy_summary = build_strategy_summary(df)
    rivalry_annotations = build_rivalry_annotations({r["film_id"] for r in films})

    payloads = {
        "films.json": films,
        "release-counts.json": release_counts,
        "rolling-domestic.json": rolling_domestic,
        "strategy-summary.json": strategy_summary,
        "rivalry-annotations.json": rivalry_annotations,
    }
    for filename, payload in payloads.items():
        write_json(DERIVED_DIR / filename, payload)

    generated_files = {
        filename: file_metadata(DERIVED_DIR / filename, len(payload))
        for filename, payload in payloads.items()
    }

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "data_contract_version": DATA_CONTRACT_VERSION,
        "frozen_cutoff": FROZEN_CUTOFF,
        "source": {
            "dataset": "final_integrated_dataset.csv",
            "sha256": sha256_file(DATASET),
            "rows": int(len(df)),
        },
        "supporting_sources": {
            "rivalry_cases": {
                "file": "rivalry_cases.md",
                "sha256": sha256_file(RIVALRY_METHOD),
            },
        },
        "corpus": {
            "total_films": int(len(df)),
            "animated_films": int(df["corpus_assignment"].isin(ANIMATED_ASSIGNMENTS).sum()),
            "disney_animated_films": int(df["corpus_assignment"].isin(DISNEY_ANIMATED_ASSIGNMENTS).sum()),
            "dreamworks_animated_films": int((df["corpus_assignment"] == "CORE_DWA").sum()),
            "studio_counts": EXPECTED_STUDIOS,
            "corpus_assignment_counts": EXPECTED_ASSIGNMENTS,
            "strategy_counts": EXPECTED_STRATEGY_COUNTS,
        },
        "generated_files": generated_files,
        "generation": {
            "script": "scripts/build_visualization_data.py",
            "deterministic": True,
            "volatile_timestamp_omitted": True,
        },
    }
    write_json(DERIVED_DIR / "manifest.json", manifest)

    print("Visualization data build passed.")
    print(f"Source SHA-256: {manifest['source']['sha256']}")
    for filename, meta in generated_files.items():
        print(f"{filename}: {meta['records']} records | {meta['bytes']} bytes | {meta['sha256']}")
    print("manifest.json: deterministic metadata; no volatile timestamp")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
