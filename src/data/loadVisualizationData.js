import { DATA_CONTRACT } from "../config/dataContract.js";

const FILE_KEYS = Object.freeze(
  Object.entries(DATA_CONTRACT.files).filter(([key]) => key !== "manifest")
);

function assert(condition, message) {
  if (!condition) throw new Error(`Visualization data error: ${message}`);
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Visualization data error: failed to load ${url} (${response.status})`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Visualization data error: malformed JSON at ${url}`, { cause: error });
  }
}

function derivedUrl(filename) {
  return `${DATA_CONTRACT.derivedBasePath}${filename}`;
}

export async function loadVisualizationManifest() {
  const manifest = await fetchJson(derivedUrl(DATA_CONTRACT.files.manifest));
  assert(manifest && typeof manifest === "object" && !Array.isArray(manifest), "manifest must be an object");
  assert(manifest.schema_version === DATA_CONTRACT.schemaVersion, `unsupported schema version ${manifest.schema_version}`);
  assert(manifest.data_contract_version === DATA_CONTRACT.dataContractVersion, `unsupported data-contract version ${manifest.data_contract_version}`);
  assert(manifest.source?.dataset === "final_integrated_dataset.csv", "unexpected authoritative source dataset");
  assert(manifest.source?.rows === 120, "manifest source row count must be 120");
  assert(manifest.generated_files && typeof manifest.generated_files === "object", "manifest generated_files is missing");
  return manifest;
}

function validateTopLevel(name, payload) {
  assert(Array.isArray(payload), `${name} must be a top-level array`);
  if (name === "films") {
    assert(payload.length === 120, "films must contain 120 records");
    assert(payload.every((row) => typeof row.film_id === "string" && typeof row.title === "string"), "films records require film_id and title");
  } else if (name === "releaseCounts") {
    assert(payload.length === 29, "release counts must contain 1998–2026 records");
    assert(payload.every((row) => Number.isInteger(row.release_year)), "release-count records require release_year");
  } else if (name === "rollingDomestic") {
    assert(payload.every((row) => typeof row.animated_side === "string" && Number.isInteger(row.window_end_year)), "rolling records require analytical side and endpoint year");
  } else if (name === "strategySummary") {
    assert(payload.length === 3, "strategy summary must contain three approved groups");
    assert(payload.every((row) => typeof row.strategy_group === "string"), "strategy records require strategy_group");
  } else if (name === "rivalryAnnotations") {
    assert(payload.length === 3, "rivalry annotations must contain three approved contextual cases");
    assert(payload.every((row) => typeof row.annotation_id === "string" && Array.isArray(row.film_ids)), "rivalry annotations require annotation_id and film_ids");
  }
}

export async function loadVisualizationData(requested = FILE_KEYS.map(([key]) => key)) {
  const manifest = await loadVisualizationManifest();
  const validNames = new Map(FILE_KEYS);
  const uniqueRequested = [...new Set(requested)];

  for (const name of uniqueRequested) {
    assert(validNames.has(name), `unknown derived dataset requested: ${name}`);
  }

  const entries = await Promise.all(
    uniqueRequested.map(async (name) => {
      const filename = validNames.get(name);
      assert(manifest.generated_files[filename], `${filename} is not declared by the manifest`);
      const payload = await fetchJson(derivedUrl(filename));
      validateTopLevel(name, payload);
      return [name, payload];
    })
  );

  return { manifest, ...Object.fromEntries(entries) };
}

export function createVisualizationDataErrorState(error) {
  return Object.freeze({
    status: "error",
    message: "Visualization data could not be loaded consistently.",
    detail: error instanceof Error ? error.message : String(error),
  });
}
