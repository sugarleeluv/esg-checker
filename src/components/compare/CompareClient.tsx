"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { EmitenLogo } from "@/components/EmitenLogo";
import { InsightBox } from "@/components/ui/InsightBox";
import { levelLabel, aggregateScores, getTopicTitleTranslation } from "@/lib/scoring";
import type { ClientCompany, ClientTopic } from "./ComparePageContent";


const renderTextWithTickerHighlights = (text: string, tickerA: string, tickerB: string) => {
  if (!text) return "";
  const regex = new RegExp(`(\\b${tickerA}\\b|\\b${tickerB}\\b|\\b\\d+(?:\\.\\d+)?\\s*(?:poin|points|point)\\b)`, 'g');
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part === tickerA || part === tickerB) {
      return (
        <span key={index} className="font-bold text-[#0F1B33]">
          {part}
        </span>
      );
    }
    if (/^\d+(?:\.\d+)?\s*(?:poin|points|point)$/i.test(part)) {
      return (
        <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-extrabold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] mx-0.5">
          {part}
        </span>
      );
    }
    return part;
  });
};

export function CompareClient({
  allCompanies,
  allTopics,
  initialTickers,
}: {
  allCompanies: ClientCompany[];
  allTopics: ClientTopic[];
  initialTickers: string[];
}) {
  const { locale, L } = useLocale();

  // Precomputed ESG Cost and Benefit scores for each company
  const computedScores = useMemo(() => {
    return allCompanies.reduce((acc, c) => {
      acc[c.ticker] = {
        hasCost: c.hasScores,
        hasBenefit: c.hasBenefitScores,
        cost: c.scores,
        benefit: c.benefitScores,
      };
      return acc;
    }, {} as Record<string, {
      hasCost: boolean;
      hasBenefit: boolean;
      cost: ClientCompany["scores"];
      benefit: ClientCompany["benefitScores"];
    }>);
  }, [allCompanies]);

  // Find initial companies based on tickers in URL params
  const [leftCompany, setLeftCompany] = useState<ClientCompany | null>(() => {
    if (initialTickers && initialTickers[0]) {
      return allCompanies.find((c) => c.ticker === initialTickers[0]) || null;
    }
    return null;
  });

  const [rightCompany, setRightCompany] = useState<ClientCompany | null>(() => {
    if (initialTickers && initialTickers[1]) {
      return allCompanies.find((c) => c.ticker === initialTickers[1]) || null;
    }
    return null;
  });

  // Display comparison if both were initially provided
  const [showComparison, setShowComparison] = useState(() => {
    return (
      initialTickers &&
      initialTickers.length >= 2 &&
      allCompanies.some((c) => c.ticker === initialTickers[0]) &&
      allCompanies.some((c) => c.ticker === initialTickers[1])
    );
  });

  // Modal and search states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<"left" | "right" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tab & Filters State Management
  const [activeTab, setActiveTab] = useState<"summary" | "pillars" | "cost" | "benefit" | "readiness">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "summary" || tabParam === "pillars" || tabParam === "cost" || tabParam === "benefit" || tabParam === "readiness") {
        return tabParam;
      }
    }
    return "summary";
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "summary" || tabParam === "pillars" || tabParam === "cost" || tabParam === "benefit" || tabParam === "readiness") {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tab: "summary" | "pillars" | "cost" | "benefit" | "readiness") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  // Cost Filters & Pagination State
  const [costDiffsOnly, setCostDiffsOnly] = useState(false);
  const [costPillarFilter, setCostPillarFilter] = useState<"all" | "E" | "S" | "G">("all");
  const [costExpanded, setCostExpanded] = useState<Record<"E" | "S" | "G", boolean>>({
    E: true,
    S: false,
    G: false,
  });
  const [costShowAll, setCostShowAll] = useState<Record<"E" | "S" | "G", boolean>>({
    E: false,
    S: false,
    G: false,
  });

  // Benefit Filters & Pagination State
  const [benefitDiffsOnly, setBenefitDiffsOnly] = useState(false);
  const [benefitPillarFilter, setBenefitPillarFilter] = useState<"all" | "E" | "S" | "G">("all");
  const [benefitExpanded, setBenefitExpanded] = useState<Record<"E" | "S" | "G", boolean>>({
    E: true,
    S: false,
    G: false,
  });
  const [benefitShowAll, setBenefitShowAll] = useState<Record<"E" | "S" | "G", boolean>>({
    E: false,
    S: false,
    G: false,
  });

  // Readiness Filters & Expanded State
  const [readinessDiffsOnly, setReadinessDiffsOnly] = useState(false);
  const [readinessPillarFilter, setReadinessPillarFilter] = useState<"all" | "E" | "S" | "G">("all");
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Reset filters when selections change (using render-time state synchronization to avoid effect cascading renders)
  const [prevLeftTicker, setPrevLeftTicker] = useState(leftCompany?.ticker || "");
  const [prevRightTicker, setPrevRightTicker] = useState(rightCompany?.ticker || "");

  if (leftCompany?.ticker !== prevLeftTicker || rightCompany?.ticker !== prevRightTicker) {
    setPrevLeftTicker(leftCompany?.ticker || "");
    setPrevRightTicker(rightCompany?.ticker || "");
    setCostDiffsOnly(false);
    setCostPillarFilter("all");
    setCostExpanded({ E: true, S: false, G: false });
    setCostShowAll({ E: false, S: false, G: false });

    setBenefitDiffsOnly(false);
    setBenefitPillarFilter("all");
    setBenefitExpanded({ E: true, S: false, G: false });
    setBenefitShowAll({ E: false, S: false, G: false });

    setReadinessDiffsOnly(false);
    setReadinessPillarFilter("all");
    setExpandedTopics({});
  }

  const toggleCostAccordion = (p: "E" | "S" | "G") => {
    setCostExpanded((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  const toggleBenefitAccordion = (p: "E" | "S" | "G") => {
    setBenefitExpanded((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  // Focus search input when modal opens
  useEffect(() => {
    if (isModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered list of companies based on search
  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allCompanies;
    return allCompanies.filter(
      (c) =>
        c.ticker.toLowerCase().includes(term) ||
        (c.name && c.name.toLowerCase().includes(term))
    );
  }, [allCompanies, searchTerm]);

  // Button Logic handlers
  const handleCompareClick = () => {
    if (leftCompany && rightCompany) {
      setShowComparison(true);
      // Synchronize URL search params
      const url = new URL(window.location.href);
      url.searchParams.set("tickers", `${leftCompany.ticker},${rightCompany.ticker}`);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const handleResetClick = () => {
    setLeftCompany(null);
    setRightCompany(null);
    setShowComparison(false);
    // Remove parameters from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("tickers");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const handleSwapClick = () => {
    const tempLeft = leftCompany;
    setLeftCompany(rightCompany);
    setRightCompany(tempLeft);

    // If already showing comparison, update the URL immediately to reflect swapped state
    if (showComparison && leftCompany && rightCompany) {
      const url = new URL(window.location.href);
      url.searchParams.set("tickers", `${rightCompany.ticker},${leftCompany.ticker}`);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } else {
      setShowComparison(false);
    }
  };

  const selectCompany = (company: ClientCompany) => {
    if (modalSlot === "left") {
      if (rightCompany?.ticker === company.ticker) {
        setRightCompany(null);
      }
      setLeftCompany(company);
    } else if (modalSlot === "right") {
      if (leftCompany?.ticker === company.ticker) {
        setLeftCompany(null);
      }
      setRightCompany(company);
    }

    // Hide active comparison because one of the inputs changed
    setShowComparison(false);
    setIsModalOpen(false);
    setModalSlot(null);
    setSearchTerm("");
  };

  // Dynamic Insights Calculation (Client-Side)
  const insights = useMemo(() => {
    const cA = leftCompany;
    const cB = rightCompany;

    if (!cA || !cB || !showComparison) {
      return {
        insufficient: false,
        bullets: [] as string[],
        conclusionPoints: [] as string[],
        isMixed: false,
        mixedText: "",
        insufficientText: "",
      };
    }

    const scoreInfoA = computedScores[cA.ticker];
    const scoreInfoB = computedScores[cB.ticker];

    const hasAnyScoresA = scoreInfoA && (scoreInfoA.hasCost || scoreInfoA.hasBenefit);
    const hasAnyScoresB = scoreInfoB && (scoreInfoB.hasCost || scoreInfoB.hasBenefit);

    if (!hasAnyScoresA || !hasAnyScoresB) {
      return {
        insufficient: true,
        bullets: [] as string[],
        conclusionPoints: [] as string[],
        isMixed: false,
        mixedText: "",
        insufficientText: locale === "id"
          ? "Data scoring belum cukup untuk menghasilkan perbandingan."
          : "The scoring data is insufficient to generate a comparison.",
      };
    }

    const getPillarStats = (scoreInfo: typeof scoreInfoA) => {
      if (!scoreInfo) return null;

      const costPillars = scoreInfo.cost?.pillars ?? { E: null, S: null, G: null };
      
      const pValues = [
        { key: "E", name: "Environmental", val: costPillars.E },
        { key: "S", name: "Social", val: costPillars.S },
        { key: "G", name: "Governance", val: costPillars.G },
      ].filter((p) => p.val !== null && p.val !== undefined) as { key: string; name: string; val: number }[];

      if (pValues.length === 0) return null;

      const sorted = [...pValues].sort((a, b) => a.val - b.val);
      const weakest = sorted[0].name;
      const strongest = sorted[sorted.length - 1].name;

      const costOverall = scoreInfo.cost?.overall ?? null;
      const benefitOverall = scoreInfo.benefit?.overall ?? null;

      let benefitVsCostRelation = "equal";
      let gap = 0;

      if (costOverall !== null && benefitOverall !== null) {
        const costVal = costOverall * 100;
        const benefitVal = benefitOverall * 100;
        gap = Math.abs(benefitVal - costVal);
        if (benefitVal > costVal) {
          benefitVsCostRelation = "higher";
        } else if (benefitVal < costVal) {
          benefitVsCostRelation = "lower";
        }
      }

      return {
        strongest,
        weakest,
        relation: benefitVsCostRelation,
        gap,
        costOverall: costOverall !== null ? costOverall * 100 : null,
        benefitOverall: benefitOverall !== null ? benefitOverall * 100 : null,
      };
    };

    const statsA = getPillarStats(scoreInfoA);
    const statsB = getPillarStats(scoreInfoB);
    const isId = locale === "id";

    let sentenceA = "";
    if (statsA) {
      if (isId) {
        sentenceA = `${cA.ticker} memiliki performa terkuat pada pilar ${statsA.strongest}, sedangkan pilar ${statsA.weakest} menjadi komponen yang masih perlu diperkuat.`;
        if (statsA.costOverall !== null && statsA.benefitOverall !== null) {
          const relationWord = statsA.relation === "higher" ? "lebih tinggi" : statsA.relation === "lower" ? "lebih rendah" : "sama dengan";
          sentenceA += ` ESG Benefit Score ${relationWord} ${statsA.gap.toFixed(2)} poin dibandingkan ESG Cost Score.`;
        }
      } else {
        sentenceA = `${cA.ticker} performs strongest in the ${statsA.strongest} pillar, while ${statsA.weakest} remains its main improvement priority.`;
        if (statsA.costOverall !== null && statsA.benefitOverall !== null) {
          const relationWord = statsA.relation === "higher" ? "higher" : statsA.relation === "lower" ? "lower" : "equal to";
          sentenceA += ` Its ESG Benefit Score is ${statsA.gap.toFixed(2)} points ${relationWord} than its ESG Cost Score.`;
        }
      }
    }

    let sentenceB = "";
    if (statsB) {
      if (isId) {
        sentenceB = `${cB.ticker} unggul pada pilar ${statsB.strongest}, tetapi masih memiliki skor terendah pada pilar ${statsB.weakest}.`;
      } else {
        sentenceB = `${cB.ticker} leads in the ${statsB.strongest} pillar but records its lowest result in ${statsB.weakest}.`;
      }
    }

    // Determine the largest absolute difference
    let largestGap = -1;
    let largestGapName = "";
    let largestGapType: "PILLAR" | "TOPIC" = "PILLAR";
    let valA: number | null = null;
    let valB: number | null = null;

    const hasTopicScores = cA.topicScores.length > 0 && cB.topicScores.length > 0;

    if (hasTopicScores) {
      for (const topic of allTopics) {
        // Cost
        const tsA_Cost = cA.topicScores.find((ts) => ts.topicCode === topic.code && (!ts.type || ts.type === "COST"));
        const tsB_Cost = cB.topicScores.find((ts) => ts.topicCode === topic.code && (!ts.type || ts.type === "COST"));
        if (tsA_Cost && tsB_Cost) {
          const gap = Math.abs(tsA_Cost.score - tsB_Cost.score);
          if (gap > largestGap) {
            largestGap = gap;
            largestGapName = getTopicTitleTranslation(topic.code, locale, isId ? topic.titleId : topic.titleEn);
            largestGapType = "TOPIC";
            valA = tsA_Cost.score;
            valB = tsB_Cost.score;
          }
        }

        // Benefit
        const tsA_Benefit = cA.topicScores.find((ts) => ts.topicCode === topic.code && ts.type === "BENEFIT");
        const tsB_Benefit = cB.topicScores.find((ts) => ts.topicCode === topic.code && ts.type === "BENEFIT");
        if (tsA_Benefit && tsB_Benefit) {
          const gap = Math.abs(tsA_Benefit.score - tsB_Benefit.score);
          if (gap > largestGap) {
            largestGap = gap;
            largestGapName = getTopicTitleTranslation(topic.code, locale, isId ? topic.titleId : topic.titleEn);
            largestGapType = "TOPIC";
            valA = tsA_Benefit.score;
            valB = tsB_Benefit.score;
          }
        }
      }
    }

    if (largestGap === -1) {
      largestGapType = "PILLAR";
      const pillars: ("E" | "S" | "G")[] = ["E", "S", "G"];
      for (const p of pillars) {
        const pA_Cost = scoreInfoA.cost?.pillars[p] ?? null;
        const pB_Cost = scoreInfoB.cost?.pillars[p] ?? null;
        if (pA_Cost !== null && pB_Cost !== null) {
          const gap = Math.abs(pA_Cost - pB_Cost) * 100;
          if (gap > largestGap) {
            largestGap = gap;
            largestGapName = p === "E" ? (isId ? "Lingkungan" : "Environmental") : p === "S" ? (isId ? "Sosial" : "Social") : (isId ? "Tata Kelola" : "Governance");
            valA = pA_Cost * 100;
            valB = pB_Cost * 100;
          }
        }

        const pA_Benefit = scoreInfoA.benefit?.pillars[p] ?? null;
        const pB_Benefit = scoreInfoB.benefit?.pillars[p] ?? null;
        if (pA_Benefit !== null && pB_Benefit !== null) {
          const gap = Math.abs(pA_Benefit - pB_Benefit) * 100;
          if (gap > largestGap) {
            largestGap = gap;
            largestGapName = p === "E" ? (isId ? "Lingkungan" : "Environmental") : p === "S" ? (isId ? "Sosial" : "Social") : (isId ? "Tata Kelola" : "Governance");
            valA = pA_Benefit * 100;
            valB = pB_Benefit * 100;
          }
        }
      }
    }

    const cleanGapName = largestGapType === "TOPIC"
      ? largestGapName.replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "").trim()
      : largestGapName;

    let sentenceDiff = "";
    if (largestGap !== -1) {
      if (largestGapType === "TOPIC") {
        if (isId) {
          sentenceDiff = `Perbedaan terbesar antara kedua perusahaan terdapat pada topik ${cleanGapName}, dengan selisih sebesar ${largestGap} poin (skor ${cA.ticker}: ${valA}/3 vs ${cB.ticker}: ${valB}/3). Topik ini berkontribusi paling besar terhadap gap perbandingan.`;
        } else {
          sentenceDiff = `The largest difference between the two companies occurs in the ${cleanGapName} topic, with a gap of ${largestGap} points (score ${cA.ticker}: ${valA}/3 vs ${cB.ticker}: ${valB}/3). This topic contributes most to the comparison gap.`;
        }
      } else {
        if (isId) {
          sentenceDiff = `Perbedaan terbesar antara kedua perusahaan terdapat pada pilar ${cleanGapName}, dengan selisih sebesar ${largestGap.toFixed(2)} poin.`;
        } else {
          sentenceDiff = `The largest difference between the two companies occurs in the ${cleanGapName} pillar, with a gap of ${largestGap.toFixed(2)} points.`;
        }
      }
    }

    const costOverallA = scoreInfoA.cost?.overall ?? null;
    const costOverallB = scoreInfoB.cost?.overall ?? null;
    const benefitOverallA = scoreInfoA.benefit?.overall ?? null;
    const benefitOverallB = scoreInfoB.benefit?.overall ?? null;

    let isMixed = false;
    let mixedText = "";

    if (costOverallA !== null && costOverallB !== null && benefitOverallA !== null && benefitOverallB !== null) {
      const costDiff = costOverallA - costOverallB;
      const benefitDiff = benefitOverallA - benefitOverallB;

      if ((costDiff > 0 && benefitDiff < 0) || (costDiff < 0 && benefitDiff > 0)) {
        isMixed = true;
        const higherCostCo = costDiff > 0 ? cA.ticker : cB.ticker;
        const higherBenefitCo = benefitDiff > 0 ? cA.ticker : cB.ticker;

        if (isId) {
          mixedText = `Perbandingan menunjukkan hasil yang beragam. ${higherCostCo} unggul pada komitmen pendanaan dan transparansi biaya, sedangkan ${higherBenefitCo} menunjukkan manfaat ESG yang lebih tinggi.`;
        } else {
          mixedText = `The comparison shows mixed results. ${higherCostCo} leads in cost commitment and transparency, while ${higherBenefitCo} demonstrates higher ESG benefits.`;
        }
      }
    }

    const conclusionPoints: string[] = [];
    if (!isMixed) {
      if (costOverallA !== null && costOverallB !== null) {
        const costValA = costOverallA * 100;
        const costValB = costOverallB * 100;
        if (costValA > costValB) {
          conclusionPoints.push(
            isId
              ? `${cA.ticker} memiliki Skor ESG Cost yang lebih tinggi (${costValA.toFixed(2)}% vs ${costValB.toFixed(2)}%).`
              : `${cA.ticker} has a higher ESG Cost Score (${costValA.toFixed(2)}% vs ${costValB.toFixed(2)}%).`
          );
        } else if (costValB > costValA) {
          conclusionPoints.push(
            isId
              ? `${cB.ticker} memiliki Skor ESG Cost yang lebih tinggi (${costValB.toFixed(2)}% vs ${costValA.toFixed(2)}%).`
              : `${cB.ticker} has a higher ESG Cost Score (${costValB.toFixed(2)}% vs ${costValA.toFixed(2)}%).`
          );
        } else {
          conclusionPoints.push(
            isId
              ? `Kedua perusahaan memiliki Skor ESG Cost yang sama (${costValA.toFixed(2)}%).`
              : `Both companies have the same ESG Cost Score (${costValA.toFixed(2)}%).`
          );
        }
      }

      if (benefitOverallA !== null && benefitOverallB !== null) {
        const benefitValA = benefitOverallA * 100;
        const benefitValB = benefitOverallB * 100;
        if (benefitValA > benefitValB) {
          conclusionPoints.push(
            isId
              ? `${cA.ticker} memiliki Skor ESG Benefit yang lebih tinggi (${benefitValA.toFixed(2)}% vs ${benefitValB.toFixed(2)}%).`
              : `${cA.ticker} has a higher ESG Benefit Score (${benefitValA.toFixed(2)}% vs ${benefitValB.toFixed(2)}%).`
          );
        } else if (benefitValB > benefitValA) {
          conclusionPoints.push(
            isId
              ? `${cB.ticker} memiliki Skor ESG Benefit yang lebih tinggi (${benefitValB.toFixed(2)}% vs ${benefitValA.toFixed(2)}%).`
              : `${cB.ticker} has a higher ESG Benefit Score (${benefitValB.toFixed(2)}% vs ${benefitValA.toFixed(2)}%).`
          );
        } else {
          conclusionPoints.push(
            isId
              ? `Kedua perusahaan memiliki Skor ESG Benefit yang sama (${benefitValA.toFixed(2)}%).`
              : `Both companies have the same ESG Benefit Score (${benefitValA.toFixed(2)}%).`
          );
        }
      }

      if (largestGap !== -1) {
        const gapVal = largestGapType === "TOPIC" ? `${largestGap} poin` : `${largestGap.toFixed(2)}%`;
        conclusionPoints.push(
          isId
            ? `${largestGapType === "TOPIC" ? "Topik" : "Pilar"} ${cleanGapName} menghasilkan perbedaan terbesar dengan selisih ${gapVal}.`
            : `The ${largestGapType === "TOPIC" ? "topic" : "pillar"} ${cleanGapName} creates the largest difference with a gap of ${gapVal}.`
        );
      }
    }

    return {
      insufficient: false,
      bullets: [sentenceA, sentenceB, sentenceDiff].filter(Boolean),
      conclusionPoints,
      isMixed,
      mixedText,
      insufficientText: "",
    };
  }, [leftCompany, rightCompany, showComparison, locale, allTopics, computedScores]);

  // Dynamic Matrix Comparison Table Calculation (Cost-Based)
  const matrixCost = useMemo(() => {
    if (!leftCompany || !rightCompany || !showComparison) return [];
    return allTopics.map((topic) => {
      const cellA = leftCompany.topicScores.find((s) => s.topicCode === topic.code && (!s.type || s.type === "COST"));
      const cellB = rightCompany.topicScores.find((s) => s.topicCode === topic.code && (!s.type || s.type === "COST"));

      const cells: Record<string, { score: number; status: string } | null> = {
        [leftCompany.ticker]: cellA ? { score: cellA.score, status: cellA.status } : null,
        [rightCompany.ticker]: cellB ? { score: cellB.score, status: cellB.status } : null,
      };

      return {
        topicCode: topic.code,
        pillar: topic.pillar,
        title: getTopicTitleTranslation(topic.code, locale, locale === "id" ? topic.titleId : topic.titleEn),
        cells,
      };
    });
  }, [leftCompany, rightCompany, showComparison, locale, allTopics]);

  // Dynamic Matrix Comparison Table Calculation (Benefit-Based)
  const matrixBenefit = useMemo(() => {
    if (!leftCompany || !rightCompany || !showComparison) return [];
    return allTopics.map((topic) => {
      const cellA = leftCompany.topicScores.find((s) => s.topicCode === topic.code && s.type === "BENEFIT");
      const cellB = rightCompany.topicScores.find((s) => s.topicCode === topic.code && s.type === "BENEFIT");

      const cells: Record<string, { score: number; status: string } | null> = {
        [leftCompany.ticker]: cellA ? { score: cellA.score, status: cellA.status } : null,
        [rightCompany.ticker]: cellB ? { score: cellB.score, status: cellB.status } : null,
      };

      return {
        topicCode: topic.code,
        pillar: topic.pillar,
        title: getTopicTitleTranslation(topic.code, locale, locale === "id" ? topic.titleId : topic.titleEn),
        cells,
      };
    });
  }, [leftCompany, rightCompany, showComparison, locale, allTopics]);

  // Display columns for table headers
  const tableCompanies = useMemo(() => {
    if (!leftCompany || !rightCompany) return [];
    return [leftCompany, rightCompany].map((c) => ({
      ticker: c.ticker,
      name: c.name,
      scores: c.scores,
      hasScores: c.hasScores,
    }));
  }, [leftCompany, rightCompany]);

  // Dynamic Accordion Stats Calculation
  const costPillarStats = useMemo(() => {
    const stats = {
      E: { total: 0, diffs: 0 },
      S: { total: 0, diffs: 0 },
      G: { total: 0, diffs: 0 },
    };

    if (!leftCompany || !rightCompany) return stats;

    for (const topic of allTopics) {
      const p = topic.pillar as "E" | "S" | "G";
      if (p !== "E" && p !== "S" && p !== "G") continue;

      const cellA = leftCompany.topicScores.find((ts) => ts.topicCode === topic.code && (!ts.type || ts.type === "COST"));
      const cellB = rightCompany.topicScores.find((ts) => ts.topicCode === topic.code && (!ts.type || ts.type === "COST"));

      const hasScoreA = !!cellA;
      const hasScoreB = !!cellB;

      if (hasScoreA || hasScoreB) {
        stats[p].total++;
        const scoreA = cellA ? cellA.score : null;
        const scoreB = cellB ? cellB.score : null;
        if (scoreA !== scoreB) {
          stats[p].diffs++;
        }
      }
    }

    return stats;
  }, [leftCompany, rightCompany, allTopics]);

  const benefitPillarStats = useMemo(() => {
    const stats = {
      E: { total: 0, diffs: 0 },
      S: { total: 0, diffs: 0 },
      G: { total: 0, diffs: 0 },
    };

    if (!leftCompany || !rightCompany) return stats;

    for (const topic of allTopics) {
      const p = topic.pillar as "E" | "S" | "G";
      if (p !== "E" && p !== "S" && p !== "G") continue;

      const cellA = leftCompany.topicScores.find((ts) => ts.topicCode === topic.code && ts.type === "BENEFIT");
      const cellB = rightCompany.topicScores.find((ts) => ts.topicCode === topic.code && ts.type === "BENEFIT");

      const hasScoreA = !!cellA;
      const hasScoreB = !!cellB;

      if (hasScoreA || hasScoreB) {
        stats[p].total++;
        const scoreA = cellA ? cellA.score : null;
        const scoreB = cellB ? cellB.score : null;
        if (scoreA !== scoreB) {
          stats[p].diffs++;
        }
      }
    }

    return stats;
  }, [leftCompany, rightCompany, allTopics]);

  // Helper selector card renderer
  const renderSelectorCard = (slot: "left" | "right") => {
    const company = slot === "left" ? leftCompany : rightCompany;

    if (!company) {
      return (
        <div
          onClick={() => {
            setModalSlot(slot);
            setIsModalOpen(true);
          }}
          className="relative cursor-pointer w-full sm:w-[280px] min-h-[220px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 shadow-sm hover:shadow-md hover:border-[#087A5B] hover:bg-white transition duration-300 ease-in-out group"
        >
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:border-emerald-400 group-hover:text-[#087A5B] transition duration-300 shadow-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="mt-3.5 text-slate-500 group-hover:text-[#0F1B33] font-semibold text-xs transition-colors">
            {locale === "id" ? "Pilih Emiten" : "Select Issuer"}
          </p>
        </div>
      );
    }

    const scoreInfo = computedScores[company.ticker];

    return (
      <div className="relative w-full sm:w-[280px] min-h-[220px] py-4 px-5 flex flex-col items-center justify-between rounded-2xl border border-[#E2E8F0] hover:border-[#0F1B33]/30 bg-white shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-[#0F1B33] transition duration-300">
        {/* Remove item button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (slot === "left") {
              setLeftCompany(null);
            } else {
              setRightCompany(null);
            }
            setShowComparison(false);
          }}
          className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200"
          title={locale === "id" ? "Hapus pilihan" : "Clear selection"}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Selected Card body - click to edit selection */}
        <div
          onClick={() => {
            setModalSlot(slot);
            setIsModalOpen(true);
          }}
          className="flex flex-col items-center w-full cursor-pointer group select-none text-center"
        >
          <EmitenLogo ticker={company.ticker} name={company.name} size={56} />
          <p className="mt-2.5 font-mono font-bold text-[#0F1B33] group-hover:text-[#087A5B] transition-colors uppercase leading-tight text-sm">
            {company.ticker}
          </p>
          <p className="mt-1 text-center text-xs text-[#64748B] line-clamp-1 h-4 font-semibold">
            {company.name}
          </p>

          {/* ESG Cost and Benefit scores */}
          <div className="mt-3.5 w-full grid grid-cols-2 gap-2 text-center border-t border-slate-100 pt-3">
            {/* ESG Cost Score */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#E67E00] uppercase tracking-wider">
                {locale === "id" ? "Skor ESG Cost" : "ESG Cost Score"}
              </span>
              {scoreInfo?.hasCost && scoreInfo?.cost ? (
                <div className="mt-1 flex flex-col items-center">
                  <span className="text-base font-extrabold text-[#0F1B33] font-mono leading-none">
                    {(scoreInfo.cost.overall * 100).toFixed(2)}%
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-bold mt-1.5 border ${
                      scoreInfo.cost.overallLevel === "HIGH"
                        ? "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]"
                        : scoreInfo.cost.overallLevel === "MEDIUM"
                        ? "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                        : "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"
                    }`}
                  >
                    {levelLabel(scoreInfo.cost.overallLevel, locale)}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-bold mt-1.5 border bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]">
                  {locale === "id" ? "Belum dianalisis" : "Not analyzed"}
                </span>
              )}
            </div>

            {/* ESG Benefit Score */}
            <div className="flex flex-col items-center border-l border-slate-100">
              <span className="text-[10px] font-bold text-[#087A5B] uppercase tracking-wider pl-1">
                {locale === "id" ? "Skor ESG Benefit" : "ESG Benefit Score"}
              </span>
              {scoreInfo?.hasBenefit && scoreInfo?.benefit ? (
                <div className="mt-1 flex flex-col items-center pl-1">
                  <span className="text-base font-extrabold text-[#0F1B33] font-mono leading-none">
                    {(scoreInfo.benefit.overall * 100).toFixed(2)}%
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-bold mt-1.5 border ${
                      scoreInfo.benefit.overallLevel === "HIGH"
                        ? "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]"
                        : scoreInfo.benefit.overallLevel === "MEDIUM"
                        ? "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                        : "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"
                    }`}
                  >
                    {levelLabel(scoreInfo.benefit.overallLevel, locale)}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-bold mt-1.5 border bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0] ml-1">
                  {locale === "id" ? "Belum dianalisis" : "Not analyzed"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper pillar comparison rows renderer
  const renderPillarComparison = () => {
    if (!leftCompany || !rightCompany || !showComparison) return null;

    const scoresA = computedScores[leftCompany.ticker];
    const scoresB = computedScores[rightCompany.ticker];

    if (!scoresA || !scoresB) return null;

    const pillars = [
      {
        key: "E",
        label: "Environmental",
        accent: "#087A5B",
        bg: "bg-[#F0FDF4]",
        borderColor: "border-[#087A5B]/15",
        textAccent: "text-[#087A5B]",
        borderTop: "border-t-[#087A5B]",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m.358-5.577a9 9 0 11-12.84 12.84" />
          </svg>
        )
      },
      {
        key: "S",
        label: "Social",
        accent: "#E67E00",
        bg: "bg-[#FFF7ED]",
        borderColor: "border-[#E67E00]/15",
        textAccent: "text-[#E67E00]",
        borderTop: "border-t-[#E67E00]",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      },
      {
        key: "G",
        label: "Governance",
        accent: "#0F1B33",
        bg: "bg-[#F1F5F9]",
        borderColor: "border-[#0F1B33]/15",
        textAccent: "text-[#0F1B33]",
        borderTop: "border-t-[#0F1B33]",
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      },
    ];

    const formatScore = (val: number | null) => {
      if (val === null || val === undefined) return "-";
      return (val * 100).toFixed(2) + "%";
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p) => {
          const costA = scoresA.cost?.pillars[p.key as "E" | "S" | "G"] ?? null;
          const benefitA = scoresA.benefit?.pillars[p.key as "E" | "S" | "G"] ?? null;
          const costB = scoresB.cost?.pillars[p.key as "E" | "S" | "G"] ?? null;
          const benefitB = scoresB.benefit?.pillars[p.key as "E" | "S" | "G"] ?? null;

          const diffCost = costA !== null && costB !== null ? (Math.abs(costA - costB) * 100).toFixed(2) : null;
          const diffBenefit = benefitA !== null && benefitB !== null ? (Math.abs(benefitA - benefitB) * 100).toFixed(2) : null;

          const costLeader = costA !== null && costB !== null && costA !== costB ? (costA > costB ? leftCompany.ticker : rightCompany.ticker) : null;
          const benefitLeader = benefitA !== null && benefitB !== null && benefitA !== benefitB ? (benefitA > benefitB ? leftCompany.ticker : rightCompany.ticker) : null;

          return (
            <div
              key={p.key}
              className={`rounded-2xl border-t-4 ${p.borderTop} border border-x-slate-200 border-b-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`w-8 h-8 rounded-lg ${p.bg} ${p.textAccent} flex items-center justify-center`}>
                    {p.icon}
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0F1B33] uppercase tracking-wider">
                    {p.label}
                  </h4>
                </div>

                <div className="space-y-4">
                  {/* Cost Row */}
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#E67E00] uppercase mb-1.5">
                      <span>Cost Score</span>
                      {diffCost !== null && (
                        <span className="bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono">
                          Δ {diffCost}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {leftCompany.ticker}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#0F1B33] font-mono">{formatScore(costA)}</span>
                          {costLeader === leftCompany.ticker && (
                            <span className="text-[#047857] text-[10px]" title="Higher">▲</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {rightCompany.ticker}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#0F1B33] font-mono">{formatScore(costB)}</span>
                          {costLeader === rightCompany.ticker && (
                            <span className="text-[#047857] text-[10px]" title="Higher">▲</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Benefit Row */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#087A5B] uppercase mb-1.5">
                      <span>Benefit Score</span>
                      {diffBenefit !== null && (
                        <span className="bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono">
                          Δ {diffBenefit}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {leftCompany.ticker}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#0F1B33] font-mono">{formatScore(benefitA)}</span>
                          {benefitLeader === leftCompany.ticker && (
                            <span className="text-[#047857] text-[10px]" title="Higher">▲</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {rightCompany.ticker}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#0F1B33] font-mono">{formatScore(benefitB)}</span>
                          {benefitLeader === rightCompany.ticker && (
                            <span className="text-[#047857] text-[10px]" title="Higher">▲</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper cost details table renderer
  const renderCostTable = () => {
    if (!leftCompany || !rightCompany || !showComparison) return null;

    const pillars: { key: "E" | "S" | "G"; name: string }[] = [
      { key: "E", name: "Environmental" },
      { key: "S", name: "Social" },
      { key: "G", name: "Governance" },
    ];

    return (
      <div className="space-y-4">
        {/* Compact Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Group 1: Filter Diffs */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCostDiffsOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !costDiffsOnly
                  ? "bg-white text-[#0f1b33] shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {L.filterAll}
            </button>
            <button
              onClick={() => setCostDiffsOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                costDiffsOnly
                  ? "bg-[#E67E00] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {L.filterDiff}
            </button>
          </div>

          {/* Group 2: Filter Pillars */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCostPillarFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                costPillarFilter === "all"
                  ? "bg-white text-[#0f1b33] shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {locale === "id" ? "Semua Pilar" : "All Pillars"}
            </button>
            {pillars.map((p) => (
              <button
                key={p.key}
                onClick={() => setCostPillarFilter(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  costPillarFilter === p.key
                    ? "bg-[#E67E00]/10 text-[#E67E00] shadow-sm border border-[#E67E00]/20"
                    : "text-[#64748B] hover:text-[#0f1b33]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {pillars.map((p) => {
            if (costPillarFilter !== "all" && costPillarFilter !== p.key) return null;

            const stats = costPillarStats[p.key];
            if (costDiffsOnly && stats.diffs === 0) return null;

            const isExpanded = costExpanded[p.key];
            
            const allRows = matrixCost.filter((row) => {
              const topic = allTopics.find((t) => t.code === row.topicCode);
              return topic?.pillar === p.key;
            });

            const visibleRows = allRows.filter((row) => {
              if (costDiffsOnly) {
                const cellA = row.cells[leftCompany.ticker];
                const cellB = row.cells[rightCompany.ticker];
                return cellA?.score !== cellB?.score;
              }
              return true;
            });

            const hasPagination = visibleRows.length > 10;
            const shownRows = (hasPagination && !costShowAll[p.key])
              ? visibleRows.slice(0, 8)
              : visibleRows;

            return (
              <div key={p.key} className="border border-slate-200 rounded-2xl bg-white shadow-sm animate-fade-in">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCostAccordion(p.key)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50/70 border-b border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#0F1B33]">
                      {p.name}
                    </span>
                    <span className="text-xs text-[#64748B]">
                      — {stats.total} {locale === "id" ? "topik" : "topics"} · {stats.diffs} {locale === "id" ? "perbedaan" : "differences"}
                    </span>
                  </div>
                  <span className="text-[#0F1B33]">
                    {isExpanded ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="overflow-x-auto rounded-b-2xl">
                    <table className="w-full text-sm table-fixed border-collapse min-w-[600px] md:min-w-full">
                      <thead className="bg-[#F8FAFC] text-left text-xs uppercase text-[#0F1B33] border-b border-slate-200">
                        <tr>
                          <th className="py-[12px] px-[14px] font-extrabold tracking-wider w-[60%] text-left text-[#0F1B33] bg-[#F8FAFC]">
                            {L.topic}
                          </th>
                          <th className="py-[12px] px-[14px] text-center w-[20%] font-extrabold tracking-wider text-[#0F1B33] bg-[#F8FAFC]">
                            {leftCompany.ticker}
                          </th>
                          <th className="py-[12px] px-[14px] text-center w-[20%] font-extrabold tracking-wider text-[#0F1B33] bg-[#F8FAFC]">
                            {rightCompany.ticker}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownRows.map((row) => {
                          const cleanTitle = row.title
                            .replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "")
                            .trim();

                          return (
                            <tr
                              key={row.topicCode}
                              className="border-b border-slate-100 last:border-0 hover:bg-[#E67E00]/5 transition-colors"
                            >
                              <td className="py-[12px] px-[14px] text-[#0F1B33] w-[60%] text-left whitespace-normal break-words">
                                <span className="font-mono text-xs text-[#94A3B8] mr-2.5">
                                  {row.topicCode}
                                </span>
                                <span className="font-bold text-xs sm:text-sm">{cleanTitle}</span>
                              </td>
                              {tableCompanies.map((c) => {
                                const cell = row.cells[c.ticker];
                                if (!cell) {
                                  return (
                                    <td key={c.ticker} className="py-[12px] px-[14px] text-center w-[20%]">
                                      <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                                        -
                                      </span>
                                    </td>
                                  );
                                }

                                let badgeClass = "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]";
                                let statusLabel = cell.status;

                                if (cell.status === "HIGH") {
                                  badgeClass = "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]";
                                  statusLabel = L.high;
                                } else if (cell.status === "MEDIUM") {
                                  badgeClass = "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
                                  statusLabel = L.medium;
                                } else if (cell.status === "LOW") {
                                  badgeClass = "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]";
                                  statusLabel = L.low;
                                }

                                return (
                                  <td key={c.ticker} className="py-[12px] px-[14px] text-center w-[20%]">
                                    <div className="flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap">
                                      <span className="font-bold text-[#0F1B33] font-mono text-xs">
                                        {cell.score}/3
                                      </span>
                                      <span
                                        className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-bold border ${badgeClass}`}
                                      >
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {hasPagination && (
                      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                        <button
                          onClick={() => {
                            setCostShowAll((prev) => ({
                              ...prev,
                              [p.key]: !prev[p.key],
                            }));
                          }}
                          className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition"
                        >
                          {costShowAll[p.key] ? L.showLess : L.showAll}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper benefit details table renderer
  const renderBenefitTable = () => {
    if (!leftCompany || !rightCompany || !showComparison) return null;

    const pillars: { key: "E" | "S" | "G"; name: string }[] = [
      { key: "E", name: "Environmental" },
      { key: "S", name: "Social" },
      { key: "G", name: "Governance" },
    ];

    return (
      <div className="space-y-4">
        {/* Compact Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Group 1: Filter Diffs */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setBenefitDiffsOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !benefitDiffsOnly
                  ? "bg-white text-[#0f1b33] shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {L.filterAll}
            </button>
            <button
              onClick={() => setBenefitDiffsOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                benefitDiffsOnly
                  ? "bg-[#087A5B] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {L.filterDiff}
            </button>
          </div>

          {/* Group 2: Filter Pillars */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setBenefitPillarFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                benefitPillarFilter === "all"
                  ? "bg-white text-[#0f1b33] shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {locale === "id" ? "Semua Pilar" : "All Pillars"}
            </button>
            {pillars.map((p) => (
              <button
                key={p.key}
                onClick={() => setBenefitPillarFilter(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  benefitPillarFilter === p.key
                    ? "bg-[#087A5B]/10 text-[#087A5B] shadow-sm border border-[#087A5B]/20"
                    : "text-[#64748B] hover:text-[#0f1b33]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {pillars.map((p) => {
            if (benefitPillarFilter !== "all" && benefitPillarFilter !== p.key) return null;

            const stats = benefitPillarStats[p.key];
            if (benefitDiffsOnly && stats.diffs === 0) return null;

            const isExpanded = benefitExpanded[p.key];
            
            const allRows = matrixBenefit.filter((row) => {
              const topic = allTopics.find((t) => t.code === row.topicCode);
              return topic?.pillar === p.key;
            });

            const visibleRows = allRows.filter((row) => {
              if (benefitDiffsOnly) {
                const cellA = row.cells[leftCompany.ticker];
                const cellB = row.cells[rightCompany.ticker];
                return cellA?.score !== cellB?.score;
              }
              return true;
            });

            const hasPagination = visibleRows.length > 10;
            const shownRows = (hasPagination && !benefitShowAll[p.key])
              ? visibleRows.slice(0, 8)
              : visibleRows;

            return (
              <div key={p.key} className="border border-slate-200 rounded-2xl bg-white shadow-sm animate-fade-in">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleBenefitAccordion(p.key)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50/70 border-b border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#0F1B33]">
                      {p.name}
                    </span>
                    <span className="text-xs text-[#64748B]">
                      — {stats.total} {locale === "id" ? "topik" : "topics"} · {stats.diffs} {locale === "id" ? "perbedaan" : "differences"}
                    </span>
                  </div>
                  <span className="text-[#0F1B33]">
                    {isExpanded ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="overflow-x-auto rounded-b-2xl">
                    <table className="w-full text-sm table-fixed border-collapse min-w-[600px] md:min-w-full">
                      <thead className="bg-[#F8FAFC] text-left text-xs uppercase text-[#0F1B33] border-b border-slate-200">
                        <tr>
                          <th className="py-[12px] px-[14px] font-extrabold tracking-wider w-[60%] text-left text-[#0F1B33] bg-[#F8FAFC]">
                            {L.topic}
                          </th>
                          <th className="py-[12px] px-[14px] text-center w-[20%] font-extrabold tracking-wider text-[#0F1B33] bg-[#F8FAFC]">
                            {leftCompany.ticker}
                          </th>
                          <th className="py-[12px] px-[14px] text-center w-[20%] font-extrabold tracking-wider text-[#0F1B33] bg-[#F8FAFC]">
                            {rightCompany.ticker}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownRows.map((row) => {
                          const cleanTitle = row.title
                            .replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "")
                            .trim();

                          return (
                            <tr
                              key={row.topicCode}
                              className="border-b border-slate-100 last:border-0 hover:bg-[#087A5B]/5 transition-colors"
                            >
                              <td className="py-[12px] px-[14px] text-[#0F1B33] w-[60%] text-left whitespace-normal break-words">
                                <span className="font-mono text-xs text-[#94A3B8] mr-2.5">
                                  {row.topicCode}
                                </span>
                                <span className="font-bold text-xs sm:text-sm">{cleanTitle}</span>
                              </td>
                              {tableCompanies.map((c) => {
                                const cell = row.cells[c.ticker];
                                if (!cell) {
                                  return (
                                    <td key={c.ticker} className="py-[12px] px-[14px] text-center w-[20%]">
                                      <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                                        -
                                      </span>
                                    </td>
                                  );
                                }

                                let badgeClass = "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]";
                                let statusLabel = cell.status;

                                if (cell.status === "HIGH") {
                                  badgeClass = "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]";
                                  statusLabel = L.high;
                                } else if (cell.status === "MEDIUM") {
                                  badgeClass = "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
                                  statusLabel = L.medium;
                                } else if (cell.status === "LOW") {
                                  badgeClass = "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]";
                                  statusLabel = L.low;
                                }

                                return (
                                  <td key={c.ticker} className="py-[12px] px-[14px] text-center w-[20%]">
                                    <div className="flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap">
                                      <span className="font-bold text-[#0F1B33] font-mono text-xs">
                                        {cell.score}/3
                                      </span>
                                      <span
                                        className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-bold border ${badgeClass}`}
                                      >
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {hasPagination && (
                      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                        <button
                          onClick={() => {
                            setBenefitShowAll((prev) => ({
                              ...prev,
                              [p.key]: !prev[p.key],
                            }));
                          }}
                          className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition"
                        >
                          {benefitShowAll[p.key] ? L.showLess : L.showAll}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper readiness summary & table renderer
  const renderReadinessTab = () => {
    if (!leftCompany || !rightCompany || !showComparison) return null;

    const getCompanyReadinessStats = (company: ClientCompany) => {
      let high = 0;
      let medium = 0;
      let low = 0;
      let assessed = 0;

      for (const topic of allTopics) {
        const costScore = company.topicScores.find(ts => ts.topicCode === topic.code && (!ts.type || ts.type === "COST"))?.score ?? null;
        const benefitScore = company.topicScores.find(ts => ts.topicCode === topic.code && ts.type === "BENEFIT")?.score ?? null;

        if (costScore !== null && benefitScore !== null) {
          assessed++;
          const avg = (costScore + benefitScore) / 2;
          if (avg >= 2.5) high++;
          else if (avg >= 1.5) medium++;
          else low++;
        }
      }

      return { high, medium, low, assessed };
    };

    const statsLeft = getCompanyReadinessStats(leftCompany);
    const statsRight = getCompanyReadinessStats(rightCompany);

    const getReadinessCategory = (costScore: number | null, benefitScore: number | null) => {
      if (costScore === null || benefitScore === null) return "UNASSESSED";
      const avg = (costScore + benefitScore) / 2;
      if (avg >= 2.5) return "HIGH";
      if (avg >= 1.5) return "MEDIUM";
      return "LOW";
    };

    const getCategoryRank = (category: string) => {
      if (category === "HIGH") return 3;
      if (category === "MEDIUM") return 2;
      if (category === "LOW") return 1;
      return 0;
    };

    const readinessList = allTopics.map((topic) => {
      const code = topic.code;
      
      const scoreObjA_Cost = leftCompany.topicScores.find((ts) => ts.topicCode === code && (!ts.type || ts.type === "COST"));
      const scoreObjA_Benefit = leftCompany.topicScores.find((ts) => ts.topicCode === code && ts.type === "BENEFIT");
      const scoreObjB_Cost = rightCompany.topicScores.find((ts) => ts.topicCode === code && (!ts.type || ts.type === "COST"));
      const scoreObjB_Benefit = rightCompany.topicScores.find((ts) => ts.topicCode === code && ts.type === "BENEFIT");

      const costA = scoreObjA_Cost?.score ?? null;
      const benefitA = scoreObjA_Benefit?.score ?? null;
      const costB = scoreObjB_Cost?.score ?? null;
      const benefitB = scoreObjB_Benefit?.score ?? null;

      const catA = getReadinessCategory(costA, benefitA);
      const catB = getReadinessCategory(costB, benefitB);

      const avgA = costA !== null && benefitA !== null ? (costA + benefitA) / 2 : null;
      const avgB = costB !== null && benefitB !== null ? (costB + benefitB) / 2 : null;

      const rankA = getCategoryRank(catA);
      const rankB = getCategoryRank(catB);

      let note = "-";
      if (catA !== "UNASSESSED" && catB !== "UNASSESSED" && catA !== catB) {
        if (rankA > rankB) {
          note = locale === "id" ? `${leftCompany.ticker} lebih siap` : `${leftCompany.ticker} more ready`;
        } else if (rankB > rankA) {
          note = locale === "id" ? `${rightCompany.ticker} lebih siap` : `${rightCompany.ticker} more ready`;
        }
      }

      const costTextA = locale === "id" ? scoreObjA_Cost?.disclosureTextId : scoreObjA_Cost?.disclosureTextEn;
      const costRationaleA = locale === "id" ? scoreObjA_Cost?.rationaleId : scoreObjA_Cost?.rationaleEn;

      const benefitTextA = locale === "id" ? scoreObjA_Benefit?.disclosureTextId : scoreObjA_Benefit?.disclosureTextEn;
      const benefitRationaleA = locale === "id" ? scoreObjA_Benefit?.rationaleId : scoreObjA_Benefit?.rationaleEn;

      const costTextB = locale === "id" ? scoreObjB_Cost?.disclosureTextId : scoreObjB_Cost?.disclosureTextEn;
      const costRationaleB = locale === "id" ? scoreObjB_Cost?.rationaleId : scoreObjB_Cost?.rationaleEn;

      const benefitTextB = locale === "id" ? scoreObjB_Benefit?.disclosureTextId : scoreObjB_Benefit?.disclosureTextEn;
      const benefitRationaleB = locale === "id" ? scoreObjB_Benefit?.rationaleId : scoreObjB_Benefit?.rationaleEn;

      return {
        code,
        pillar: topic.pillar,
        title: getTopicTitleTranslation(topic.code, locale, locale === "id" ? topic.titleId : topic.titleEn),
        costA,
        benefitA,
        avgA,
        catA,
        costB,
        benefitB,
        avgB,
        catB,
        note,
        costTextA,
        costRationaleA,
        benefitTextA,
        benefitRationaleA,
        costTextB,
        costRationaleB,
        benefitTextB,
        benefitRationaleB,
      };
    });

    const isMdkaAntm =
      (leftCompany.ticker === "MDKA" && rightCompany.ticker === "ANTM") ||
      (leftCompany.ticker === "ANTM" && rightCompany.ticker === "MDKA");

    const tableRows = readinessList.filter((item) => {
      // Filter by Pillar
      if (readinessPillarFilter !== "all" && item.pillar !== readinessPillarFilter) return false;
      
      // Filter by Differences Only
      if (readinessDiffsOnly) {
        return item.catA !== item.catB && item.catA !== "UNASSESSED" && item.catB !== "UNASSESSED";
      }
      return true;
    });

    const generateReadinessConclusion = () => {
      if (isMdkaAntm) {
        if (locale === "id") {
          return "Secara keseluruhan, ANTM menunjukkan tingkat kesiapan pengungkapan GRI 14 yang lebih tinggi dibandingkan MDKA. ANTM memiliki 14 unit penilaian dalam kategori High Readiness, sedangkan MDKA memiliki 12 unit. Dari 23 unit penilaian, 20 menunjukkan kategori yang sama dan tiga menunjukkan perbedaan, yaitu pada topik Tailings, Artisanal and Small-Scale Mining, serta Occupational Health and Safety. Pada ketiga topik tersebut, ANTM memiliki tingkat readiness yang lebih tinggi.";
        } else {
          return "Overall, ANTM demonstrates a higher level of GRI 14 disclosure readiness than MDKA. ANTM has 14 assessment units classified as High Readiness, compared with 12 for MDKA. Of the 23 assessment units, 20 share the same category and three differ: Tailings, Artisanal and Small-Scale Mining, and Occupational Health and Safety. ANTM records the higher readiness category in all three topics.";
        }
      }

      // General fallback dynamic message
      const nameA = leftCompany.ticker;
      const nameB = rightCompany.ticker;
      const highA = statsLeft.high;
      const highB = statsRight.high;

      const totalCompared = readinessList.filter((item) => item.catA !== "UNASSESSED" && item.catB !== "UNASSESSED").length;
      const sameCount = readinessList.filter(
        (item) => item.catA !== "UNASSESSED" && item.catB !== "UNASSESSED" && item.catA === item.catB
      ).length;
      const diffCount = totalCompared - sameCount;

      const winner = highA > highB ? nameA : highB > highA ? nameB : null;

      if (locale === "id") {
        if (winner) {
          const winnerHigh = winner === nameA ? highA : highB;
          const loser = winner === nameA ? nameB : nameA;
          const loserHigh = winner === nameA ? highB : highA;
          return `${winner} menunjukkan tingkat readiness yang lebih tinggi dengan ${winnerHigh} topik berkategori High Readiness, dibandingkan ${loser} dengan ${loserHigh} topik. Dari ${totalCompared} topik yang dibandingkan, ${sameCount} memiliki kategori yang sama dan ${diffCount} menunjukkan perbedaan.`;
        } else {
          return `Kedua perusahaan menunjukkan tingkat readiness yang sama dengan ${highA} topik berkategori High Readiness. Dari ${totalCompared} topik yang dibandingkan, ${sameCount} memiliki kategori yang sama dan ${diffCount} menunjukkan perbedaan.`;
        }
      } else {
        if (winner) {
          const winnerHigh = winner === nameA ? highA : highB;
          const loser = winner === nameA ? nameB : nameA;
          const loserHigh = winner === nameA ? highB : highA;
          return `${winner} demonstrates a higher readiness level with ${winnerHigh} topics classified as High Readiness, compared with ${loserHigh} topics for ${loser}. Of the ${totalCompared} topics compared, ${sameCount} share the same readiness category and ${diffCount} show differences.`;
        } else {
          return `Both companies demonstrate the same readiness level with ${highA} topics classified as High Readiness. Of the ${totalCompared} topics compared, ${sameCount} share the same readiness category and ${diffCount} show differences.`;
        }
      }
    };

    const renderReadinessCard = (company: ClientCompany, stats: ReturnType<typeof getCompanyReadinessStats>) => {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5 mb-4">
            <EmitenLogo ticker={company.ticker} name={company.name} size={44} />
            <div>
              <h4 className="font-mono font-bold text-[#0F1B33] uppercase leading-tight">
                {company.ticker}
              </h4>
              <p className="text-xs text-[#64748B] font-semibold line-clamp-1">
                {company.name}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Assessed Topics Info */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2 mb-2">
              <span>{locale === "id" ? "Topik yang dinilai" : "Assessed topics"}</span>
              <span className="font-mono font-bold text-slate-800">{stats.assessed} of 25</span>
            </div>

            {/* High Readiness */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-slate-600">High Readiness</span>
              </div>
              <span className="font-mono font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {stats.high} {locale === "id" ? "topik" : "topics"}
              </span>
            </div>

            {/* Medium Readiness */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="text-slate-600">Medium Readiness</span>
              </div>
              <span className="font-mono font-bold text-[#F59E0B] bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                {stats.medium} {locale === "id" ? "topik" : "topics"}
              </span>
            </div>

            {/* Low Readiness */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="text-slate-600">Low Readiness</span>
              </div>
              <span className="font-mono font-bold text-[#EF4444] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                {stats.low} {locale === "id" ? "topik" : "topics"}
              </span>
            </div>
          </div>
        </div>
      );
    };

    const renderReadinessBadge = (category: string) => {
      let badgeClass = "bg-slate-50 text-slate-500 border-slate-200";
      let label = category;

      if (category === "HIGH") {
        badgeClass = "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]";
        label = locale === "id" ? "High Readiness" : "High Readiness";
      } else if (category === "MEDIUM") {
        badgeClass = "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
        label = locale === "id" ? "Medium Readiness" : "Medium Readiness";
      } else if (category === "LOW") {
        badgeClass = "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]";
        label = locale === "id" ? "Low Readiness" : "Low Readiness";
      } else {
        badgeClass = "bg-slate-100 text-slate-400 border-slate-200";
        label = locale === "id" ? "Belum Dinilai" : "Not Assessed";
      }

      return (
        <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-bold border ${badgeClass}`}>
          {label}
        </span>
      );
    };

    const toggleExpandTopic = (code: string) => {
      setExpandedTopics((prev) => ({ ...prev, [code]: !prev[code] }));
    };

    return (
      <div className="space-y-6">
        {/* Readiness Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderReadinessCard(leftCompany, statsLeft)}
          {renderReadinessCard(rightCompany, statsRight)}
        </div>

        {/* How to Read Information Box */}
        <div className="bg-[#0F1B33]/5 border border-[#0F1B33]/12 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#0F1B33]/10 pb-2">
            <h4 className="font-extrabold text-xs text-[#0F1B33] uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0F1B33]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.832.477 5 1.253m0-13C14.168 5.477 15.754 5 17.5 5s3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18s-3.832.477-5 1.253" />
              </svg>
              {locale === "id" ? "Cara Membaca" : "How to Read"}
            </h4>
            
            {/* Calculation Basis Tooltip/Small Note */}
            <div className="relative group flex items-center gap-1 cursor-pointer">
              <span className="text-[10px] font-bold text-[#087A5B] bg-white border border-[#087A5B]/20 rounded px-1.5 py-0.5 shadow-sm inline-flex items-center gap-1 hover:bg-emerald-50">
                <svg className="w-3 h-3 text-[#087A5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {locale === "id" ? "Basis Perhitungan" : "Calculation Basis"}
              </span>
              {/* Tooltip Content */}
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 bg-[#0F1B33] text-white text-[11px] p-2.5 rounded-lg shadow-xl z-50 border border-slate-800 leading-normal animate-scale-in">
                {locale === "id"
                  ? "Readiness ditentukan berdasarkan rata-rata ESG Cost Score dan ESG Expected Benefit Score pada setiap topik."
                  : "Readiness is determined from the average ESG Cost Score and ESG Expected Benefit Score for each topic."}
              </div>
            </div>
          </div>
          
          <p className="text-slate-600 font-medium">
            {locale === "id"
              ? "High Readiness menunjukkan bahwa pengungkapan perusahaan telah relatif lengkap dan terukur sesuai topik GRI 14. Medium Readiness menunjukkan bahwa topik telah diungkapkan, tetapi masih memerlukan penguatan pada kelengkapan atau keterukurannya. Low Readiness menunjukkan bahwa pengungkapan masih terbatas atau belum memadai. Jika kedua perusahaan memiliki kategori yang sama, tingkat readiness dinilai setara. Jika kategorinya berbeda, perusahaan dengan kategori lebih tinggi dinilai lebih siap."
              : "High Readiness indicates that the company’s disclosure is relatively complete and measurable for the relevant GRI 14 topic. Medium Readiness indicates that the topic has been disclosed but still requires improvement in completeness or measurability. Low Readiness indicates limited or inadequate disclosure. When both companies have the same category, their readiness is considered equivalent. When the categories differ, the company with the higher category is considered more ready."}
          </p>
        </div>

        {/* Readiness Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Group 1: Filter Diffs */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReadinessDiffsOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !readinessDiffsOnly
                  ? "bg-white text-[#0f1b33] shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {locale === "id" ? "Semua Topik" : "All Topics"}
            </button>
            <button
              onClick={() => setReadinessDiffsOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readinessDiffsOnly
                  ? "bg-[#087A5B] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {locale === "id" ? "Hanya Perbedaan" : "Differences Only"}
            </button>
          </div>

          {/* Group 2: Filter Pillars */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReadinessPillarFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readinessPillarFilter === "all"
                  ? "bg-white text-[#0f1b33] shadow-sm"
                  : "text-[#64748B] hover:text-[#0f1b33]"
              }`}
            >
              {locale === "id" ? "Semua Pilar" : "All Pillars"}
            </button>
            {[
              { key: "E", name: "Environmental" },
              { key: "S", name: "Social" },
              { key: "G", name: "Governance" }
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setReadinessPillarFilter(p.key as "E" | "S" | "G")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  readinessPillarFilter === p.key
                    ? "bg-[#087A5B]/10 text-[#087A5B] shadow-sm border border-[#087A5B]/20"
                    : "text-[#64748B] hover:text-[#0f1b33]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop View: Detailed Side-by-Side Table (Hidden on small screens) */}
        <div className="hidden md:block border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed border-collapse min-w-[700px] md:min-w-full">
              <thead className="bg-[#F8FAFC] text-left text-xs uppercase text-[#0F1B33] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-extrabold tracking-wider w-[35%] text-left text-[#0F1B33] bg-[#F8FAFC]">
                    {locale === "id" ? "Topik Material GRI 14" : "GRI 14 Material Topic"}
                  </th>
                  <th className="py-3 px-3 text-center w-[20%] font-extrabold tracking-wider text-[#0F1B33] bg-[#F8FAFC]">
                    {leftCompany.ticker} Readiness
                  </th>
                  <th className="py-3 px-3 text-center w-[20%] font-extrabold tracking-wider text-[#0F1B33] bg-[#F8FAFC]">
                    {rightCompany.ticker} Readiness
                  </th>
                  <th className="py-3 px-4 text-center w-[25%] font-extrabold tracking-wider text-[#0F1B33] bg-[#F8FAFC]">
                    {locale === "id" ? "Perbandingan" : "Comparison"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => {
                  const cleanTitle = row.title
                    .replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "")
                    .trim();

                  const isExpanded = !!expandedTopics[row.code];
                  
                  const hasSource = row.costTextA || row.costRationaleA || row.benefitTextA || row.benefitRationaleA ||
                                    row.costTextB || row.costRationaleB || row.benefitTextB || row.benefitRationaleB;

                  const isDifferent = row.catA !== row.catB && row.catA !== "UNASSESSED" && row.catB !== "UNASSESSED";
                  const rowClass = isDifferent 
                    ? "border-b border-slate-100 bg-[#FEF3C7]/15 border-l-[3.5px] border-l-[#E67E00] hover:bg-[#FEF3C7]/25 transition-colors"
                    : "border-b border-slate-100 hover:bg-slate-50/50 transition-colors";

                  return (
                    <tr key={row.code} className={rowClass}>
                      {/* Topic Code & Title */}
                      <td className="py-3.5 px-4 text-[#0F1B33] text-left whitespace-normal break-words">
                        <div className="flex items-center">
                          <span className="font-mono text-xs text-[#94A3B8] mr-2">
                            {row.code}
                          </span>
                          <span className="font-bold text-xs sm:text-sm">{cleanTitle}</span>
                        </div>
                      </td>

                      {/* Left Company Readiness */}
                      <td className="py-3.5 px-3 text-center">
                        {renderReadinessBadge(row.catA)}
                      </td>

                      {/* Right Company Readiness */}
                      <td className="py-3.5 px-3 text-center">
                        {renderReadinessBadge(row.catB)}
                      </td>

                      {/* Comparison badge */}
                      <td className="py-3.5 px-4 text-center">
                        {row.note !== "-" && row.note !== "" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#E67E00]/10 text-[#CC7000] border border-[#FEF6E6]">
                            {row.note}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: Stacked Topic Cards (Visible only on small screens) */}
        <div className="md:hidden space-y-4">
          {tableRows.map((row) => {
            const cleanTitle = row.title
              .replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "")
              .trim();

            const isExpanded = !!expandedTopics[row.code];
            
            const hasSource = row.costTextA || row.costRationaleA || row.benefitTextA || row.benefitRationaleA ||
                              row.costTextB || row.costRationaleB || row.benefitTextB || row.benefitRationaleB;

            const isDifferent = row.catA !== row.catB && row.catA !== "UNASSESSED" && row.catB !== "UNASSESSED";
            const cardClass = isDifferent
              ? "border border-slate-200 bg-[#FEF3C7]/5 border-l-[3.5px] border-l-[#E67E00] rounded-2xl p-4 shadow-sm space-y-3 hover:shadow transition-all"
              : "border border-slate-200 rounded-2xl bg-white p-4 shadow-sm space-y-3 hover:shadow transition-all";

            return (
              <div key={row.code} className={cardClass}>
                {/* Topic Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                  <div className="pr-2">
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                      {row.code}
                    </span>
                    <span className="font-bold text-[#0F1B33] text-sm">{cleanTitle}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">
                    {row.pillar === "E" ? "Env" : row.pillar === "S" ? "Soc" : "Gov"}
                  </span>
                </div>

                {/* Company Readiness Side-by-Side Grid */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  {/* Left Company Stats */}
                  <div className="space-y-1.5 border-r border-slate-100 pr-4 flex flex-col items-center">
                    <h5 className="font-bold text-xs text-[#0F1B33] uppercase tracking-wider flex items-center gap-1.5 self-start">
                      <EmitenLogo ticker={leftCompany.ticker} name={leftCompany.name} size={16} />
                      {leftCompany.ticker}
                    </h5>
                    <div className="pt-1">
                      {renderReadinessBadge(row.catA)}
                    </div>
                  </div>

                  {/* Right Company Stats */}
                  <div className="space-y-1.5 flex flex-col items-center">
                    <h5 className="font-bold text-xs text-[#0F1B33] uppercase tracking-wider flex items-center gap-1.5 self-start">
                      <EmitenLogo ticker={rightCompany.ticker} name={rightCompany.name} size={16} />
                      {rightCompany.ticker}
                    </h5>
                    <div className="pt-1">
                      {renderReadinessBadge(row.catB)}
                    </div>
                  </div>
                </div>

                {/* Comparison Note */}
                <div className="border-t border-slate-100 pt-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 font-medium">{locale === "id" ? "Perbandingan:" : "Comparison:"}</span>
                    <span>
                      {row.note !== "-" && row.note !== "" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E67E00]/10 text-[#CC7000] border border-[#FEF6E6]">
                          {row.note}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Source label below the table */}
        <p className="text-xs text-[#64748B] italic mt-3 mb-1">
          {locale === "id"
            ? "Sumber: Hasil scoring ESG Cost dan ESG Expected Benefit berdasarkan topik material GRI 14."
            : "Source: ESG Cost and ESG Expected Benefit scoring results based on GRI 14 material topics."}
        </p>

        {/* Conclusion Paragraph */}
        <div className="rounded-xl p-4 bg-[#0F1B33]/5 text-sm text-slate-700 leading-relaxed font-semibold border border-[#0F1B33]/10">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-lg bg-[#0F1B33]/10 flex items-center justify-center text-[#0F1B33] shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span>
              {generateReadinessConclusion()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "summary", label: L.tabSummary },
    { id: "pillars", label: L.tabPillars },
    { id: "cost", label: L.tabCost },
    { id: "benefit", label: L.tabBenefit },
    { id: "readiness", label: L.tabReadiness },
  ];

  return (
    <div className="space-y-6">
      {/* Styles for dynamic transitions */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-scale-in {
            animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `
      }} />

      {/* Selectors VS Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 md:gap-8 my-4">
        {renderSelectorCard("left")}

        {/* Swap button */}
        <button
          type="button"
          onClick={handleSwapClick}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-[#0F1B33] hover:text-[#087A5B] hover:border-[#087A5B] shadow-sm hover:shadow active:scale-95 transition-all duration-200 shrink-0 group focus:outline-none focus:ring-2 focus:ring-[#087A5B]/30"
          title={locale === "id" ? "Tukar posisi" : "Swap positions"}
        >
          <svg
            className="w-4.5 h-4.5 text-[#0F1B33] group-hover:text-[#087A5B] transition"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </button>

        {renderSelectorCard("right")}
      </div>

      {/* Action Buttons: Bandingkan & Reset */}
      <div className="flex flex-col items-center gap-4 mt-3">
        <div className="flex gap-4">
          <button
            onClick={handleCompareClick}
            disabled={!leftCompany || !rightCompany}
            className={`px-8 py-2.5 rounded-xl font-bold tracking-wide shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E67E00]/30 ${
              leftCompany && rightCompany
                ? "bg-[#E67E00] text-white hover:bg-[#CC7000] hover:shadow-md cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {L.compare}
          </button>
          {(leftCompany || rightCompany) && (
            <button
              onClick={handleResetClick}
              className="px-6 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 font-semibold text-[#0F1B33] hover:text-[#0F1B33] shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#0F1B33]/20"
            >
              {L.reset}
            </button>
          )}
        </div>
      </div>

      {/* Comparison Results Area */}
      {showComparison && leftCompany && rightCompany && (
        <div className="animate-fade-in space-y-6 mt-8 border-t border-slate-100 pt-6">
          {/* Sticky Tab Navigation Bar */}
          <div className="sticky top-[68px] z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0] -mx-4 px-4 lg:-mx-8 lg:px-8 py-1.5">
            <div className="max-w-6xl mx-auto flex overflow-x-auto gap-2 no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
                let activeClass = "";
                if (isActive) {
                  if (tab.id === "summary") {
                    activeClass = "bg-[#0F1B33]/5 text-[#0F1B33] border-[#0F1B33]";
                  } else if (tab.id === "pillars") {
                    activeClass = "bg-[#087A5B]/5 text-[#087A5B] border-[#087A5B]";
                  } else if (tab.id === "cost") {
                    activeClass = "bg-[#E67E00]/5 text-[#E67E00] border-[#E67E00]";
                  } else if (tab.id === "benefit") {
                    activeClass = "bg-[#087A5B]/5 text-[#087A5B] border-[#087A5B]";
                  } else if (tab.id === "readiness") {
                    activeClass = "bg-[#087A5B]/5 text-[#087A5B] border-[#087A5B]";
                  }
                } else {
                  activeClass = "border-transparent text-[#64748B] hover:text-[#0F1B33] hover:bg-slate-50";
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as "summary" | "pillars" | "cost" | "benefit" | "readiness")}
                    className={`px-4 py-2 border-b-2 font-bold text-sm rounded-t-lg transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 shrink-0 ${activeClass}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab View Rendering */}
          <div className="animate-fade-in mt-6">
            {/* Tab 1: SUMMARY */}
            {activeTab === "summary" && (
              <div className="space-y-6 animate-fade-in">
                <InsightBox className="border-slate-200 bg-white">
                  {insights.insufficient ? (
                    <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                      {insights.insufficientText}
                    </p>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-[#087A5B]/10 flex items-center justify-center text-[#087A5B] shrink-0">
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#0F1B33] uppercase tracking-wider">
                          {L.analysisTitle}
                        </h4>
                      </div>
                      
                      <ul className="space-y-3">
                        {insights.bullets.map((bullet, index) => (
                          <li
                            key={index}
                            className="text-sm leading-relaxed text-slate-600 flex items-start gap-1.5"
                          >
                            <span className="text-slate-400 mt-1.5 shrink-0">•</span>
                            <span className="text-slate-600 font-medium">
                              {renderTextWithTickerHighlights(bullet, leftCompany.ticker, rightCompany.ticker)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <h4 className="font-extrabold text-xs text-[#0F1B33] mb-3 uppercase tracking-wider">
                          {L.conclusionTitle}
                        </h4>
                        <div className="rounded-xl p-4 bg-[#0F1B33]/5 text-sm text-slate-700 leading-relaxed font-semibold border border-[#0F1B33]/10">
                          {insights.isMixed ? (
                            <span>
                              {renderTextWithTickerHighlights(insights.mixedText, leftCompany.ticker, rightCompany.ticker)}
                            </span>
                          ) : (
                            <ul className="space-y-2">
                              {insights.conclusionPoints.map((pt, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-[#0F1B33] mt-1 shrink-0">•</span>
                                  <span>
                                    {renderTextWithTickerHighlights(pt, leftCompany.ticker, rightCompany.ticker)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </InsightBox>
              </div>
            )}

            {/* Tab 2: PILLAR COMPARISON */}
            {activeTab === "pillars" && (
              <div className="animate-fade-in">
                {renderPillarComparison()}
              </div>
            )}

            {/* Tab 3: COST DETAILS */}
            {activeTab === "cost" && (
              <div className="animate-fade-in">
                {renderCostTable()}
              </div>
            )}

            {/* Tab 4: BENEFIT DETAILS */}
            {activeTab === "benefit" && (
              <div className="animate-fade-in">
                {renderBenefitTable()}
              </div>
            )}

            {/* Tab 5: GRI 14 READINESS */}
            {activeTab === "readiness" && (
              <div className="animate-fade-in">
                {renderReadinessTab()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog: Search & Select Emiten */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in">
            {/* Modal Header & Search Box */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 relative">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder={locale === "id" ? "Cari emiten (ticker atau nama)..." : "Search company (ticker or name)..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-[#0F172A] shadow-sm outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 transition"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                title={locale === "id" ? "Tutup" : "Close"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable Company List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-slate-50/30">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((c) => {
                  const isLeft = leftCompany?.ticker === c.ticker;
                  const isRight = rightCompany?.ticker === c.ticker;
                  const isSelected = isLeft || isRight;

                  return (
                    <div
                      key={c.ticker}
                      onClick={() => selectCompany(c)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition cursor-pointer text-left group ${
                        isSelected ? "bg-amber-50/40 border-amber-100" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <EmitenLogo ticker={c.ticker} name={c.name} size={44} />
                        <div>
                          <p className="font-mono font-bold text-[#0F172A] uppercase flex items-center gap-2">
                            {c.ticker}
                            {isSelected && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                                {isLeft
                                  ? locale === "id"
                                    ? "Dipilih Kiri"
                                    : "Selected Left"
                                  : locale === "id"
                                  ? "Dipilih Kanan"
                                  : "Selected Right"}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">
                            {c.name}
                          </p>
                        </div>
                      </div>

                      {c.hasScores && c.scores && (
                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-xs text-[#0F172A]">
                            {(c.scores.overall * 100).toFixed(2)}%
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">
                            {levelLabel(c.scores.overallLevel, locale)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  {locale === "id" ? "Emiten tidak ditemukan" : "No companies found"}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium uppercase tracking-wide">
              {locale === "id" ? `Total ${filteredCompanies.length} emiten` : `Total ${filteredCompanies.length} issuers`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
