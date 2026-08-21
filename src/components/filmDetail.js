import { formatAdjustedDomestic, formatDate, formatNominalWorldwide, formatUsdCompact } from "../utils/format.js";

function readable(value) {
  return value ? String(value).replaceAll("_", " ") : "Not available";
}

export function renderFilmDetail(host, film, { includeStrategy = false, compact = false } = {}) {
  host.replaceChildren();
  if (!film) {
    host.hidden = true;
    return;
  }
  const title = document.createElement("h3");
  title.textContent = film.title;
  const grid = document.createElement("dl");
  grid.className = "film-detail__grid";
  const rows = [
    ["Studio", film.studio],
    ["Release date", formatDate(film.release_date)],
    ["Adjusted U.S. domestic gross", formatAdjustedDomestic(film.domestic_box_office_usd_jul2026)]
  ];
  if (includeStrategy) rows.push(["Strategy group", film.strategy_group]);
  if (!compact) {
    rows.push(
      ["Worldwide gross", formatNominalWorldwide(film.worldwide_box_office_usd_nominal)],
      ["Reported production budget", film.production_budget_usd_nominal === null ? "Not available" : `${formatUsdCompact(film.production_budget_usd_nominal)} (reported estimate)`],
      ["Franchise status", readable(film.franchise_status)],
      ["Release context", readable(film.release_context)]
    );
  }
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value;
    grid.append(term, detail);
  }
  host.append(title, grid);
  if (film.comparability_note) {
    const note = document.createElement("p");
    note.className = "film-detail__note";
    note.textContent = film.comparability_note;
    host.append(note);
  }
  host.hidden = false;
}
