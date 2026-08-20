#!/usr/bin/env python3
"""Validate the authoritative frozen inputs required by Deliverable 3."""

from pathlib import Path
import sys
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "frozen" / "final_integrated_dataset.csv"

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
REQUIRED_FIELDS = {
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
    "worldwide_box_office_usd_nominal",
    "domestic_box_office_usd_jul2026",
    "tmdb_user_rating",
    "tmdb_vote_count",
}


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> int:
    df = pd.read_csv(DATASET, parse_dates=["release_date"])

    if len(df) != 120:
        fail(f"Expected 120 films, found {len(df)}")
    if not df["film_id"].is_unique:
        fail("film_id must be unique")

    missing_fields = REQUIRED_FIELDS - set(df.columns)
    if missing_fields:
        fail(f"Missing required fields: {sorted(missing_fields)}")

    if df["studio"].value_counts().to_dict() != EXPECTED_STUDIOS:
        fail(f"Unexpected studio counts: {df['studio'].value_counts().to_dict()}")
    if df["corpus_assignment"].value_counts().to_dict() != EXPECTED_ASSIGNMENTS:
        fail(f"Unexpected corpus-assignment counts: {df['corpus_assignment'].value_counts().to_dict()}")

    excluded = {"Illumination", "Sony Pictures Animation", "Blue Sky Studios"}
    if set(df["studio"]) & excluded:
        fail("Excluded studios are present in the frozen analytical dataset")

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
    if (df["release_date"] > pd.Timestamp("2026-08-18")).any():
        fail("A film exceeds the frozen 2026-08-18 cutoff")

    if df["tmdb_user_rating"].notna().any() or df["tmdb_vote_count"].notna().any():
        fail("Task 6 expects the frozen audience fields to remain unavailable")

    print("Frozen-input validation passed.")
    print(f"Rows: {len(df)} | Unique film IDs: {df['film_id'].nunique()}")
    print(f"Studios: {EXPECTED_STUDIOS}")
    print(f"Corpus assignments: {EXPECTED_ASSIGNMENTS}")
    print("Audience fields available: 0/120")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Frozen-input validation failed: {exc}", file=sys.stderr)
        raise
