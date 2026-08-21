# Final QA Report

## Scope

Final QA covered the approved four-view visual story, Task 9 interaction hardening, keyboard and semantic behavior, responsive rendering, color redundancy, analytical integrity, runtime error handling, documentation, and production output. No new chart, metric, comparison, filter, dataset, rivalry case, or analytical claim was added.

## Functional QA

- **View 1:** verified the non-proportional 120-film taxonomy, 106-film animated comparison, Disney animated 57 split into WDAS 29 and Pixar 28, DreamWorks 49, and the separate 14-film remake layer. No interaction is attached.
- **View 2:** browser-tested five runtime-derived contextual films, pointer/focus state, Enter, Space-equivalent activation code, Escape, one evidence block at a time, explicit unpaired Shrek wording, and focus restoration after responsive SVG replacement. All four external evidence URLs resolved during final review.
- **View 3 release activity:** inspected all 29 records from 1998–2026, preserved zero-release years and zero-to-three scale, WDAS/Pixar stacking and hatch, aligned DreamWorks row, remake exclusion, `2026*`, and the partial-year note. Browser tests confirmed exact year/studio coordination and default restoration.
- **View 3 financial panel:** browser-rendered 105 available animated points on a zero-origin linear scale with three studio shapes, exception halos, dominant precomputed rolling lines, direct labels, COVID/Soul/2026 caveats, and no remakes. Arrow navigation, Enter selection, Escape, local detail, aggregate trend focus, and selection/active-descendant persistence through resize passed.
- **View 4:** browser-rendered 118 available values across 71/71 first entries, 34/35 extensions, and 13/14 remakes. Deterministic jitter, zero-origin scale, precomputed median lines, hover/keyboard selection, compact detail, Escape, and isolation from View 3 passed.

## Analytical Integrity

Automated Python validation confirmed 120 unique films; studio/corpus counts 29 WDAS, 28 Pixar, 49 DreamWorks, and 14 remakes; 106 animated films; 29 release-count records; 50 rolling records; three strategy summaries; and three rivalry cases. Source and generated-file SHA-256 checks passed after deterministic regeneration.

Code inspection confirmed that rolling and strategy medians are consumed from runtime JSON, release counts are not recreated in the frontend, missing gross values are filtered rather than converted to zero, and audience metrics remain absent. Frozen inputs and the approved data-layer methodology were not changed.

## Keyboard Accessibility

A real headless-Chrome Tab pass produced this default order: skip link; five section-navigation links; five View 2 films; View 3 film listbox; two separate aggregate-trend buttons; View 4 film listbox; methodology summary. There were no per-film Tab sequences in Views 3 or 4 and no keyboard trap.

Browser interaction tests covered View 2 Enter/Escape, View 3 and View 4 arrows, selection, Escape, responsive selection restoration, and valid active descendants. Code inspection confirmed both Enter and Space branches and all four arrow directions. Visible `:focus-visible` styling and nearby keyboard instructions were inspected.

## Screen-Reader / Semantic Review

Chrome's accessibility tree exposed two listboxes and the expected buttons. DOM/AX inspection verified English language, document title, one main landmark, four figures and figcaptions, five accessible SVG title/description pairs, 223 option nodes, valid `aria-activedescendant` references before and after resize, `aria-selected`, native methodology disclosure, polite detail regions, tooltip roles, and external-link semantics.

View 3's film listbox and aggregate trends now have separate roles: SVG trend paths are no longer focusable controls inside the composite, and two native HTML buttons provide trend focus. No audio screen-reader session was available, so this is a semantic/accessibility-tree review rather than a screen-reader usability certification or WCAG certification.

## Color & Redundant Encoding

Headless Chrome simulations were visually inspected for protanopia, deuteranopia, and achromatopsia. Frozen colors were retained. Studio shape redundancy (circle, triangle, square, diamond), Pixar hatch, direct trend labels, dashed exception halo, and solid selection ring remain distinguishable when color differences are reduced.

Calculated contrast ratios for key combinations were: body text on page background 15.42:1; secondary text on page background 5.80:1; secondary text on white 6.05:1; focus color on page background 9.13:1; and Disney aggregate text on page background 6.25:1. This was a targeted contrast check, not a full WCAG audit.

## Responsive Review

The production build was browser-tested at 1440, 1100, 900, 700, and 390 pixels. Automated layout checks found no page-level horizontal overflow; narrow chart overflow remained local. Screenshots were inspected at 1440, 900, 700, and 390 pixels, with chart-level inspection of Views 2–4. Navigation wraps, annotation/detail grids stack, chart text remains legible through local scrolling, and View 3 retains its designed height.

## Interaction Review

Shared tooltips were inspected in code and exercised through film activation. They contain only approved view-specific fields, use viewport clamping, ignore pointer events, remove stale `aria-describedby`, and now also clear the current anchor during teardown. Persistent details are hidden by default, use `Not available` formatting for missing values, and remain local to their owning view.

Resize tests confirmed View 2 focus continuity and View 3/View 4 active selection continuity. Exactly two tooltip elements exist during normal runtime—one for each tooltip-enabled view—with teardown functions available; no duplicate listeners or repeated tooltip creation occurs during resize.

## Data / Build Validation

The following completed successfully in the final environment:

- `npm install`
- `python3 -m pip install -r requirements-data.txt`
- `npm run data:build`
- `npm run data:validate`
- `npm run validate`
- `npm run build`
- `npm run preview`

The production preview served `dist/` at the local preview address and was the target of browser QA. Static output includes `dist/index.html`, `dist/src/`, and `dist/data/derived/`; it uses relative runtime paths and does not request `data/frozen/`.

## Known Limitations

- No audio screen-reader session was available; Chrome accessibility-tree inspection was used instead.
- Automated color-vision simulation and visual inspection were performed, but not testing with users who have color-vision deficiencies.
- The project is desktop-first; at small widths, intentionally wide charts require local horizontal scrolling rather than a mobile chart redesign.
- Source availability was checked at final QA time, but external publishers can later move or restrict links.

## Final Status

All required automated validation and production-build checks pass. The tested static application is ready for Deliverable 3 submission, subject only to the student-controlled checklist items such as a clean final commit and any instructor-required deployment URL.
