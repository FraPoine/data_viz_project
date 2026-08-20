const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export function formatUsdCompact(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Not available";
  const numeric = Number(value);
  const absolute = Math.abs(numeric);
  if (absolute >= 1_000_000_000) {
    const billions = numeric / 1_000_000_000;
    return `$${billions >= 10 ? billions.toFixed(1) : billions.toFixed(2).replace(/0$/, "")}B`;
  }
  if (absolute >= 1_000_000) return `$${Math.round(numeric / 1_000_000)}M`;
  return `$${Math.round(numeric).toLocaleString("en-US")}`;
}

export function formatAdjustedDomestic(value) {
  const compact = formatUsdCompact(value);
  return compact === "Not available" ? compact : `${compact} (July-2026 USD equivalent)`;
}

export function formatNominalWorldwide(value) {
  const compact = formatUsdCompact(value);
  return compact === "Not available" ? compact : `${compact} (nominal USD)`;
}

export function formatDate(value) {
  if (!value) return "Not available";
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "Not available" : DATE_FORMATTER.format(date);
}

export function formatFilmCount(value) {
  return `${Number(value).toLocaleString("en-US")} film${Number(value) === 1 ? "" : "s"}`;
}

export function formatYearLabel(year) {
  return Number(year) === 2026 ? "2026*" : String(year);
}
