#!/usr/bin/env python3
"""Validate generated visualization data, manifest integrity, and source freshness."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "frozen" / "final_integrated_dataset.csv"
RIVALRY_METHOD = ROOT / "data" / "frozen" / "rivalry_cases.md"
DERIVED_DIR = ROOT / "public" / "data" / "derived"

EXPECTED_FILES = [
    "films.json",
    "release-counts.json",
    "rolling-domestic.json",
    "strategy-summary.json",
    "rivalry-annotations.json",
]
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


def fail(message: str) -> None:
    raise AssertionError(message)


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> Any:
    if not path.is_file():
        fail(f"Missing derived file: {path.relative_to(ROOT)}")
    try:
        return json.loads(path.read_text(encoding="utf-8"), parse_constant=lambda value: fail(f"Invalid JSON numeric constant: {value}"))
    except json.JSONDecodeError as exc:
        fail(f"Malformed JSON in {path.name}: {exc}")


def assert_finite_nonnegative(value: Any, label: str) -> None:
    if value is None:
        return
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        fail(f"{label} must be numeric or null")
    if not math.isfinite(float(value)) or value < 0:
        fail(f"{label} must be finite and non-negative")


def main() -> int:
    manifest = load_json(DERIVED_DIR / "manifest.json")
    if manifest.get("schema_version") != 1 or manifest.get("data_contract_version") != 1:
        fail("Unsupported manifest/data-contract version")
    if manifest.get("frozen_cutoff") != "2026-08-18":
        fail("Manifest frozen cutoff drifted")

    current_source_hash = sha256_file(DATASET)
    if manifest.get("source", {}).get("sha256") != current_source_hash:
        fail("Derived data are stale: manifest source hash does not match the frozen CSV")
    if manifest.get("source", {}).get("rows") != 120:
        fail("Manifest source row count must be 120")

    rivalry_source = manifest.get("supporting_sources", {}).get("rivalry_cases", {})
    if rivalry_source.get("file") != "rivalry_cases.md":
        fail("Manifest rivalry methodology filename is missing or unexpected")
    current_rivalry_hash = sha256_file(RIVALRY_METHOD)
    if rivalry_source.get("sha256") != current_rivalry_hash:
        fail("Derived data are stale: manifest rivalry methodology hash does not match rivalry_cases.md")

    generated = manifest.get("generated_files")
    if set(generated or {}) != set(EXPECTED_FILES):
        fail("Manifest generated-file list does not match the data contract")

    loaded: dict[str, Any] = {}
    for filename in EXPECTED_FILES:
        path = DERIVED_DIR / filename
        payload = load_json(path)
        loaded[filename] = payload
        meta = generated[filename]
        if meta.get("sha256") != sha256_file(path):
            fail(f"Manifest hash mismatch for {filename}")
        if meta.get("bytes") != path.stat().st_size:
            fail(f"Manifest byte-size mismatch for {filename}")
        if meta.get("records") != len(payload):
            fail(f"Manifest record-count mismatch for {filename}")

    films = loaded["films.json"]
    if len(films) != 120:
        fail(f"films.json must contain 120 records, found {len(films)}")
    film_ids = [row.get("film_id") for row in films]
    if len(set(film_ids)) != 120 or None in film_ids:
        fail("films.json film IDs must be present and unique")

    studios: dict[str, int] = {}
    assignments: dict[str, int] = {}
    strategies: dict[str, int] = {}
    animated_count = 0
    for row in films:
        studios[row.get("studio")] = studios.get(row.get("studio"), 0) + 1
        assignments[row.get("corpus_assignment")] = assignments.get(row.get("corpus_assignment"), 0) + 1
        strategies[row.get("strategy_group")] = strategies.get(row.get("strategy_group"), 0) + 1
        if row.get("corpus_assignment") in {"CORE_WDAS", "DISNEY_PIXAR", "CORE_DWA"}:
            animated_count += 1
        for field in [
            "production_budget_usd_nominal",
            "domestic_box_office_usd_jul2026",
            "worldwide_box_office_usd_nominal",
        ]:
            assert_finite_nonnegative(row.get(field), f"films.json {row.get('film_id')} {field}")
        if not isinstance(row.get("is_franchise_extension"), bool):
            fail("films.json is_franchise_extension must be a JSON boolean")
        if not isinstance(row.get("has_release_context_caveat"), bool):
            fail("films.json has_release_context_caveat must be a JSON boolean")
        date = row.get("release_date")
        if not isinstance(date, str) or len(date) != 10 or date[4] != "-" or date[7] != "-":
            fail(f"Invalid runtime release_date for {row.get('film_id')}")

    if studios != EXPECTED_STUDIOS:
        fail(f"films.json studio counts drifted: {studios}")
    if assignments != EXPECTED_ASSIGNMENTS:
        fail(f"films.json corpus counts drifted: {assignments}")
    if strategies != EXPECTED_STRATEGY_COUNTS:
        fail(f"films.json strategy totals drifted: {strategies}")
    if animated_count != 106:
        fail(f"Expected 106 animated films, found {animated_count}")

    soul = next((row for row in films if row["film_id"] == "PIXAR_2020_SOUL"), None)
    if not soul or not soul.get("comparability_note"):
        fail("Soul comparability note is missing from films.json")

    release = loaded["release-counts.json"]
    if [row.get("release_year") for row in release] != list(range(1998, 2027)):
        fail("release-counts.json must contain every year 1998–2026 in order")
    count_fields = ("wdas", "pixar", "disney_animated", "dreamworks")
    for row in release:
        for field in count_fields:
            value = row.get(field)
            if not isinstance(value, int) or isinstance(value, bool):
                fail(f"release-counts {field} must be an integer for {row.get('release_year')}")
            if value < 0:
                fail(f"release-counts {field} must be non-negative for {row.get('release_year')}")
    if sum(row["wdas"] for row in release) != 29:
        fail("release-counts WDAS total must be 29")
    if sum(row["pixar"] for row in release) != 28:
        fail("release-counts Pixar total must be 28")
    if sum(row["disney_animated"] for row in release) != 57:
        fail("release-counts Disney animated total must be 57")
    if sum(row["dreamworks"] for row in release) != 49:
        fail("release-counts DreamWorks total must be 49")
    if any(row["disney_animated"] != row["wdas"] + row["pixar"] for row in release):
        fail("release-counts Disney animated must equal WDAS + Pixar in every year")
    if [row["release_year"] for row in release if row.get("is_partial_year")] != [2026]:
        fail("Only 2026 may be marked as a partial year")
    if any(not isinstance(row.get("is_partial_year"), bool) for row in release):
        fail("release-counts is_partial_year must be a JSON boolean")
    if max(row["disney_animated"] for row in release) != 3:
        fail("Maximum annual Disney animated release count must be exactly 3")
    if max(row["dreamworks"] for row in release) != 3:
        fail("Maximum annual DreamWorks release count must be exactly 3")

    rolling = loaded["rolling-domestic.json"]
    allowed_sides = {"Disney animated (WDAS + Pixar)", "DreamWorks"}
    if {row.get("animated_side") for row in rolling} != allowed_sides:
        fail("rolling-domestic contains unexpected analytical sides")
    seen_keys: set[tuple[str, int]] = set()
    for row in rolling:
        key = (row["animated_side"], row["window_end_year"])
        if key in seen_keys:
            fail(f"Duplicate rolling key: {key}")
        seen_keys.add(key)
        if row["window_end_year"] - row["window_start_year"] != 4:
            fail(f"Invalid five-year window: {row}")
        if row["window_end_year"] < 2002:
            fail("Audience-facing rolling endpoints must begin at 2002")
        if row["domestic_available"] < 4:
            fail("Rolling output violates minimum domestic_available >= 4")
        assert_finite_nonnegative(row["median_domestic_box_office_usd_jul2026"], "rolling median")

    disney_peak = max(
        (r for r in rolling if r["animated_side"] == "Disney animated (WDAS + Pixar)"),
        key=lambda r: r["median_domestic_box_office_usd_jul2026"],
    )
    dwa_peak = max(
        (r for r in rolling if r["animated_side"] == "DreamWorks"),
        key=lambda r: r["median_domestic_box_office_usd_jul2026"],
    )
    if (disney_peak["window_start_year"], disney_peak["window_end_year"]) != (2015, 2019):
        fail("Disney rolling checkpoint window mismatch")
    if abs(disney_peak["median_domestic_box_office_usd_jul2026"] - 478_500_000) > 1_000_000:
        fail("Disney rolling checkpoint value materially differs from validated D2 result")
    if (dwa_peak["window_start_year"], dwa_peak["window_end_year"]) != (2006, 2010):
        fail("DreamWorks rolling checkpoint window mismatch")
    if abs(dwa_peak["median_domestic_box_office_usd_jul2026"] - 297_300_000) > 1_000_000:
        fail("DreamWorks rolling checkpoint value materially differs from validated D2 result")

    strategy = loaded["strategy-summary.json"]
    totals = {r["strategy_group"]: r["total_films"] for r in strategy}
    available = {r["strategy_group"]: r["domestic_available"] for r in strategy}
    if totals != EXPECTED_STRATEGY_COUNTS:
        fail(f"strategy-summary totals drifted: {totals}")
    if available != EXPECTED_STRATEGY_AVAILABLE:
        fail(f"strategy-summary availability drifted: {available}")
    for row in strategy:
        assert_finite_nonnegative(row["median_domestic_box_office_usd_jul2026"], "strategy median")
        film_values = [
            f["domestic_box_office_usd_jul2026"]
            for f in films
            if f["strategy_group"] == row["strategy_group"] and f["domestic_box_office_usd_jul2026"] is not None
        ]
        ordered = sorted(film_values)
        n = len(ordered)
        midpoint = n // 2
        independent_median = (
            float(ordered[midpoint]) if n % 2 else float((ordered[midpoint - 1] + ordered[midpoint]) / 2)
        )
        if abs(independent_median - row["median_domestic_box_office_usd_jul2026"]) > 1e-6:
            fail(f"strategy-summary median mismatch for {row['strategy_group']}")

    rivalry = loaded["rivalry-annotations.json"]
    if len(rivalry) != 3:
        fail("Expected exactly three approved rivalry annotation cases")
    allowed_ids = {
        "DWA_1998_ANTZ",
        "PIXAR_1998_A_BUG_S_LIFE",
        "DWA_2000_THE_ROAD_TO_EL_DORADO",
        "WDAS_2000_THE_EMPEROR_S_NEW_GROOVE",
        "DWA_2001_SHREK",
    }
    referenced = {film_id for row in rivalry for film_id in row.get("film_ids", [])}
    if referenced != allowed_ids:
        fail("Rivalry annotations reference an unapproved or missing film")
    shrek = next((row for row in rivalry if row["annotation_id"] == "shrek-subversion"), None)
    if not shrek or shrek["film_ids"] != ["DWA_2001_SHREK"]:
        fail("Shrek must have no invented paired counterpart")
    if any(film_id not in film_ids for film_id in referenced):
        fail("A rivalry annotation film ID does not resolve against films.json")

    corpus = manifest.get("corpus", {})
    if corpus.get("total_films") != 120 or corpus.get("animated_films") != 106:
        fail("Manifest corpus counts are inconsistent")
    if corpus.get("studio_counts") != EXPECTED_STUDIOS:
        fail("Manifest studio counts are inconsistent")
    if corpus.get("corpus_assignment_counts") != EXPECTED_ASSIGNMENTS:
        fail("Manifest corpus-assignment counts are inconsistent")
    if corpus.get("strategy_counts") != EXPECTED_STRATEGY_COUNTS:
        fail("Manifest strategy counts are inconsistent")

    print("Visualization-data validation passed.")
    print(f"Source freshness SHA-256: {current_source_hash}")
    print(f"Rivalry methodology freshness SHA-256: {current_rivalry_hash}")
    print(f"films.json: {len(films)} records | animated: {animated_count}")
    print(f"release-counts.json: {len(release)} records")
    print(f"rolling-domestic.json: {len(rolling)} records")
    print(f"strategy-summary.json: {len(strategy)} records")
    print(f"rivalry-annotations.json: {len(rivalry)} cases")
    print(
        "Rolling checkpoints: "
        f"Disney {disney_peak['window_start_year']}-{disney_peak['window_end_year']} "
        f"{disney_peak['median_domestic_box_office_usd_jul2026']:.2f}; "
        f"DreamWorks {dwa_peak['window_start_year']}-{dwa_peak['window_end_year']} "
        f"{dwa_peak['median_domestic_box_office_usd_jul2026']:.2f}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
