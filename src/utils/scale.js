export function linearScale(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin;
  return (value) => rangeMin + ((value - domainMin) / span) * (rangeMax - rangeMin);
}

export function dateScale(start, end, rangeMin, rangeMax) {
  return linearScale(start.getTime(), end.getTime(), rangeMin, rangeMax);
}

export function roundedMoneyMaximum(value, step = 50_000_000) {
  return Math.ceil(value / step) * step;
}

export function stableJitter(key, amplitude) {
  let hash = 2166136261;
  for (const character of key) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (((hash >>> 0) / 4294967295) * 2 - 1) * amplitude;
}
