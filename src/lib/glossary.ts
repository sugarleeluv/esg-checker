export interface GlossaryTerm {
  term: string;
  letter: string;
  definitionId: string;
  definitionEn: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "Asset",
    letter: "A",
    definitionId:
      "Sumber daya ekonomi yang dikendalikan perusahaan dan diharapkan memberi manfaat masa depan, termasuk aset lingkungan dan sosial yang relevan untuk pelaporan ESG.",
    definitionEn:
      "Economic resources controlled by a company expected to provide future benefits, including environmental and social assets relevant to ESG reporting.",
  },
  {
    term: "Accumulation",
    letter: "A",
    definitionId:
      "Akumulasi dampak atau biaya sustainability dari waktu ke waktu, misalnya investasi berkelanjutan dalam dekarbonisasi atau program komunitas.",
    definitionEn:
      "Accumulation of sustainability impacts or costs over time, e.g. ongoing decarbonization or community program investments.",
  },
  {
    term: "Benefit",
    letter: "B",
    definitionId:
      "Manfaat yang didistribusikan kepada pemangku kepentingan dari operasi perusahaan, termasuk gaji, pajak, royalti, dan investasi sosial (GRI 14.9).",
    definitionEn:
      "Benefits distributed to stakeholders from company operations, including wages, taxes, royalties, and social investment (GRI 14.9).",
  },
  {
    term: "Biodiversity",
    letter: "B",
    definitionId:
      "Keanekaragaman hayati yang terdampak operasi pertambangan; topik material GRI 14.4 yang mencakup konservasi dan rehabilitasi.",
    definitionEn:
      "Biodiversity affected by mining operations; GRI 14.4 material topic covering conservation and rehabilitation.",
  },
  {
    term: "Climate Adaptation",
    letter: "C",
    definitionId:
      "Langkah perusahaan mengurangi risiko dan membangun ketahanan terhadap perubahan iklim (GRI 14.2).",
    definitionEn:
      "Company actions to reduce risk and build resilience to climate change (GRI 14.2).",
  },
  {
    term: "Disclosure",
    letter: "D",
    definitionId:
      "Pengungkapan informasi sustainability secara transparan sesuai standar GRI untuk memungkinkan penilaian investor.",
    definitionEn:
      "Transparent sustainability information disclosure per GRI standards to enable investor assessment.",
  },
  {
    term: "ESG",
    letter: "E",
    definitionId:
      "Environmental, Social, and Governance - kerangka penilaian kinerja keberlanjutan perusahaan.",
    definitionEn:
      "Environmental, Social, and Governance - framework for assessing corporate sustainability performance.",
  },
  {
    term: "GRI 14",
    letter: "G",
    definitionId:
      "Standar sektor pertambangan Global Reporting Initiative (2024) yang mengidentifikasi 25 topik material untuk pelaporan sustainability.",
    definitionEn:
      "GRI Mining Sector Standard (2024) identifying 25 material topics for sustainability reporting.",
  },
  {
    term: "Kehati",
    letter: "K",
    definitionId:
      "Indeks sustainability Indonesia yang menilai kinerja ESG emiten IDX; referensi benchmark untuk investor berkelanjutan.",
    definitionEn:
      "Indonesian sustainability index assessing IDX issuers' ESG performance; benchmark for sustainable investors.",
  },
  {
    term: "Material Topic",
    letter: "M",
    definitionId:
      "Topik yang berdampak signifikan terhadap ekonomi, lingkungan, dan masyarakat - dasar checklist penilaian di platform ini.",
    definitionEn:
      "Topics with significant economic, environmental, and social impacts - basis for this platform's assessment checklist.",
  },
  {
    term: "Tailings",
    letter: "T",
    definitionId:
      "Endapan sisa proses penambangan; pengelolaannya adalah topik kritis GRI 14.6 dengan risiko lingkungan tinggi.",
    definitionEn:
      "Mining process residue deposits; management is critical GRI 14.6 topic with high environmental risk.",
  },
];
