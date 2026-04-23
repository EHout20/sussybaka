export function formatUsd(cents: number | null | undefined) {
  const c = Math.round(cents ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(c / 100);
}

export function parseUsdToCents(value: string) {
  const n = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}
