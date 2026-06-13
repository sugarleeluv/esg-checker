export interface EmitenEntry {
  ticker: string;
  name: string;
  sector: string;
}

/** Daftar 10 emiten IDX dari spreadsheet. */
export const IDX_EMITEN: EmitenEntry[] = [
  { ticker: "BBCA", name: "PT Bank Central Asia Tbk", sector: "Keuangan" },
  { ticker: "BBRI", name: "PT Bank Rakyat Indonesia (Persero) Tbk", sector: "Keuangan" },
  { ticker: "BMRI", name: "PT Bank Mandiri (Persero) Tbk", sector: "Keuangan" },
  { ticker: "BBNI", name: "PT Bank Negara Indonesia (Persero) Tbk", sector: "Keuangan" },
  { ticker: "ASII", name: "PT Astra International Tbk", sector: "Industri" },
  { ticker: "ANTM", name: "PT Aneka Tambang Tbk", sector: "Pertambangan" },
  { ticker: "MDKA", name: "PT Merdeka Copper Gold Tbk", sector: "Pertambangan" },
  { ticker: "UNTR", name: "PT United Tractors Tbk", sector: "Energi" },
  { ticker: "INDF", name: "PT Indofood Sukses Makmur Tbk", sector: "Konsumer Non-Siklikal" },
  { ticker: "KLBF", name: "PT Kalbe Farma Tbk", sector: "Kesehatan" },
];

export function getEmitenByTicker(ticker: string): EmitenEntry | undefined {
  return IDX_EMITEN.find((e) => e.ticker === ticker.toUpperCase());
}

