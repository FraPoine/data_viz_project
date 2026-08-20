export const DATA_CONTRACT = Object.freeze({
  schemaVersion: 1,
  derivedBasePath: "./data/derived/",
  files: Object.freeze({
    manifest: "manifest.json",
    films: "films.json",
    releaseCounts: "release-counts.json",
    rollingDomestic: "rolling-domestic.json",
    strategySummary: "strategy-summary.json",
    rivalryAnnotations: "rivalry-annotations.json"
  }),
  keys: Object.freeze({
    films: "film_id",
    releaseCounts: "release_year",
    rollingDomestic: ["animated_side", "window_end_year"],
    strategySummary: "strategy_group",
    rivalryAnnotations: "annotation_id"
  })
});
