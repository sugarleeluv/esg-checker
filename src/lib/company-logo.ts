/** Public emiten logo sources (fallback to initials if load fails). */
const LOGO_SOURCES = [
  (ticker: string) =>
    `https://assets.stockbit.com/logos/companies/${ticker.toUpperCase()}.png`,
  (ticker: string) =>
    `https://pasardana.id/images/company-logo/${ticker.toUpperCase()}.png`,
];

export function getEmitenLogoUrl(ticker: string): string {
  return LOGO_SOURCES[0](ticker);
}

export function getEmitenLogoFallbacks(ticker: string): string[] {
  return LOGO_SOURCES.map((fn) => fn(ticker));
}
