"use client";

import { PageBackHeader } from "@/components/ui/PageBackHeader";
import { CompareClient } from "@/components/compare/CompareClient";
import { useLocale } from "@/components/providers/LocaleProvider";

import type { AggregatedScores } from "@/lib/types";

export interface ClientCompany {
  ticker: string;
  name: string | null;
  sector: string | null;
  hasScores: boolean;
  hasBenefitScores: boolean;
  scores: AggregatedScores | null;
  benefitScores: AggregatedScores | null;
  profile: {
    ticker: string;
    name: string | null;
    sector: string | null;
    subSector: string | null;
    listingBoard: string | null;
  } | null;
  topicScores: {
    score: number;
    status: string;
    topicCode: string;
    type?: string;
    topic: {
      pillar: string;
    };
    disclosureTextId?: string | null;
    disclosureTextEn?: string | null;
    rationaleId?: string | null;
    rationaleEn?: string | null;
  }[];
}

export interface ClientTopic {
  code: string;
  pillar: string;
  sortOrder: number;
  titleId: string;
  titleEn: string;
}

export function ComparePageContent({
  companies,
  allTopics,
  initialTickers,
}: {
  companies: ClientCompany[];
  allTopics: ClientTopic[];
  initialTickers: string[];
}) {
  const { L } = useLocale();

  return (
    <>
      <PageBackHeader title={L.compareTitle} backPath="/companies" />
      <CompareClient
        allCompanies={companies}
        allTopics={allTopics}
        initialTickers={initialTickers}
      />
    </>
  );
}
