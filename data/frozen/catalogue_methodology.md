# Canonical Film Catalogue v2.1 — Revised Methodology

**Project:** *Disney vs DreamWorks: The Evolution of an Animated Competition*  
**Task:** Revised Task 2 — Canonical Film Catalogue  
**Revision date:** 2026-08-19  
**Frozen analytical cutoff:** 2026-08-18

## 1. Revision objective

This revision narrows the quantitative film universe back to the project's central Disney-vs-DreamWorks framing. The v2.0 candidate master is retained as the starting point and revised rather than rebuilt. Box office, ratings, popularity, and data availability are never used to decide film membership.

The analytical corpus now contains four explicit components:

- `CORE_WDAS`: qualifying theatrical animated features produced by Walt Disney Animation Studios;
- `CORE_DWA`: qualifying theatrical animated features produced by DreamWorks Animation;
- `DISNEY_PIXAR`: qualifying theatrical Pixar Animation Studios features treated as a separate Disney-side layer while preserving `studio = Pixar Animation Studios`;
- `DISNEY_REMAKE`: qualifying theatrical Disney live-action or photorealistic remakes/reimaginings derived from the WDAS animated canon.

Illumination, Sony Pictures Animation, and Blue Sky Studios are no longer quantitative competitor layers. Their previous candidate rows are retained only as audit evidence; any row that was formerly included is now `EXCLUDE` with `exclusion_reason = studio_removed_from_revised_scope`.

## 2. Single-source-of-truth rule

`film_candidates_v2_1.csv` is the only curated film-list source of truth. All included, excluded, core, Disney-side, and year-count files are derived mechanically from it using `derive_catalogue_views_v2_1.py`. The migration audit files compare v2.0 with v2.1 and are therefore generated from the two candidate-master snapshots.

## 3. Time and release eligibility

The analytical time window remains 1998-01-01 through 2026-08-18. The cutoff is intentionally not advanced during this revision.

Qualifying films must have a genuine commercial theatrical release. Standard theatrical, genuine limited theatrical, and genuine day-and-date theatrical/streaming releases are eligible. Festival-only, awards-qualifying-only, direct-to-video, and streaming-only releases are excluded. A title whose streaming debut precedes a later theatrical rerelease remains excluded as `streaming_first_later_theatrical`.

### Soul correction

*Soul* is corrected from `EXCLUDE` to `INCLUDE`. Disney's official release announcement stated that the film would debut on Disney+ on 2020-12-25 while receiving theatrical releases in international markets where Disney+ was unavailable; The Numbers records commercial international theatrical openings from 2020-12-24. Under the existing Task 2 rule allowing genuine day-and-date theatrical/streaming releases, *Soul* therefore qualifies. This correction is methodological, not success-based.

Sources:
- https://press.disneyplus.com/news/disney-pixar-soul-to-make-exclusive-holiday-debut-on-disney-plus
- https://www.the-numbers.com/movie/Soul-%282020%29

## 4. Pixar / Disney reproducible rule

Pixar is always attributed to `Pixar Animation Studios`; it is never relabelled as WDAS.

The Disney-side inclusion rule is:

1. the film must be a Pixar Animation Studios feature;
2. it must satisfy the same 1998–cutoff theatrical-release rule used elsewhere;
3. for releases before Disney completed the Pixar acquisition on 2006-05-05, the film must be demonstrably governed by the Disney-Pixar feature-film/co-production relationship;
4. releases after acquisition are Disney-side by corporate ownership while remaining Pixar studio observations.

Pixar's SEC filings document that the 1997 Co-Production Agreement covered *A Bug's Life*, *Monsters, Inc.*, *Finding Nemo*, *The Incredibles*, and *Cars*, and explicitly state that *Toy Story 2* was also governed by the same agreement even though it did not count toward the five original Pictures. Disney completed its acquisition of Pixar on 2006-05-05.

Primary evidence:
- https://www.sec.gov/Archives/edgar/data/1002114/000089161802001531/f80223e10-k405.htm
- https://www.sec.gov/Archives/edgar/data/1002114/000119312506047278/d10k.htm
- https://thewaltdisneycompany.com/press-releases/disney-completes-pixar-acquisition/

Within the analytical window, the pre-acquisition qualifying Pixar films are therefore *A Bug's Life* (1998), *Toy Story 2* (1999), *Monsters, Inc.* (2001), *Finding Nemo* (2003), and *The Incredibles* (2004). *Cars* was developed under the same agreement but released after the acquisition closed, so it is classified as post-acquisition Disney-side at release.

## 5. Studio and production attribution

Production-studio identity and Disney-side analytical grouping are separate concepts. `studio` retains the actual studio name. `corporate_group_at_release` continues to distinguish independent pre-acquisition Pixar from post-acquisition Pixar. Distribution alone is not enough to qualify a film for WDAS or DWA core membership.

Pre-acquisition Pixar partnership films retain `production_status = co_production` and `production_partners = Walt Disney Pictures`, supported by Pixar SEC filings describing Disney/Pixar co-financing, co-ownership and co-branding under the agreement. No Pixar row is converted to WDAS.

## 6. WDAS and DreamWorks completeness

WDAS candidates were reconciled against the official Walt Disney Animation Studios feature-film catalogue. The frozen cutoff includes releases through *Zootopia 2* (2025); *Hexed* (2026-11-25) remains an explicit post-cutoff boundary exclusion.

DreamWorks candidates were reconciled against the official DreamWorks movie catalogue and NBCUniversal/DreamWorks corporate material. The frozen analytical set runs through *The Bad Guys 2* (2025-08-01). *Forgotten Island* (2026-09-25) remains a post-cutoff boundary exclusion. Streaming-only and true live-action/hybrid boundary cases remain excluded under the existing release/animation rules.

Sources:
- https://disneyanimation.com/films/
- https://www.dreamworks.com/movies
- https://www.nbcuniversal.com/article/dreamworks-celebrates-30th-anniversary
- https://www.universalpictures.com/movies/forgotten-island/

## 7. Disney remake/reimagining layer

The remake layer remains separate from WDAS core and includes qualifying theatrical Disney live-action/photorealistic remakes or reimaginings derived from the WDAS animated canon. It is not merged into WDAS studio averages. Streaming-only remakes remain exclusions. The 2026 live-action *Moana* remains eligible because its theatrical release on 2026-07-10 precedes the frozen cutoff.

## 8. Franchise and source-material classification

The v2.0 distinction is retained:

- `franchise_status`: `first_entry`, `sequel`, `prequel`, `spin_off`, `remake_reimagining`;
- `source_material_status`: `original_screen_ip`, `adaptation_existing_source`, `existing_screen_ip`.

These dimensions are independent. No inclusion decision is based on whether a film is original, a sequel, a franchise extension, or a remake.

## 9. Rivalry annotations

Rivalry cases remain narrative annotations only and do not control catalogue membership. The *Antz* / *A Bug's Life* case is now explicitly described as DreamWorks versus a Pixar film on the Disney side under the Disney-Pixar co-production relationship, while still preserving Pixar studio identity.

## 10. Revised counts

The revised analytical catalogue contains **120 included films** from **216 candidate rows**:

- Walt Disney Animation Studios: **29**
- Pixar Animation Studios: **28**
- DreamWorks Animation: **49**
- Disney remake/reimagining layer: **14**

There are **96 exclusions** and zero review rows. Compared with Task 2 v2.0, **48 films** are removed from the analytical corpus because Illumination, Sony Pictures Animation, and Blue Sky Studios are no longer comparator layers, while *Soul* is added after release-eligibility correction.

## 11. Scope amendment and downstream impact

This revision conflicts with the previous Dataset Scope v2.0 in two formal places: (a) Pixar is no longer `context_competitor` but a Disney-side layer, and (b) Illumination, Sony Pictures Animation, and Blue Sky Studios are no longer analytical comparator layers. Task 1 is not silently rewritten. The amendment is recorded in `scope_amendment_v2_1.md`.

Task 3–5 files were inspected only to identify dependencies and were not modified. They will later need synchronized updates to allowed `corpus_role` / `corpus_assignment` values, film counts, data collection rows, EDA, figures, and report text.
