# Add Benefit-Based GRI 14 Comparison Table

The goal of this task is to add a second comparison checklist based on **Benefit** (loaded from the `ESG BENEFIT` sheet tab in Google Sheets) below the existing **Cost**-based checklist. This includes:
1. Extending the database schema to store a `type` (`COST` or `BENEFIT`) for each `TopicScore`.
2. Updating the Google Sheet sync script to fetch both GID `0` (Cost) and GID `810360985` (Benefit) and parse them appropriately.
3. Modifying data loaders to separate COST and BENEFIT scores.
4. Displaying both comparison tables/checklists on:
   - The company score details page (`/companies/[ticker]/score`).
   - The side-by-side comparison page (`/compare`).

## User Review Required

> [!IMPORTANT]
> The database schema unique constraint `@@unique([companyTicker, topicCode])` on `TopicScore` will be updated to `@@unique([companyTicker, topicCode, type])`.
> This requires running a database push or migration. Since this is in the local development environment, we will execute `npx prisma db push` to safely update the tables without losing existing data structure.

## Proposed Changes

---

### [Database Layer]

#### [MODIFY] [schema.prisma](file:///e:/ESGCheckerproject/prisma/schema.prisma)
- Add a new `type` field to `TopicScore` model (String, default is `"COST"`).
- Update unique constraint from `@@unique([companyTicker, topicCode])` to `@@unique([companyTicker, topicCode, type])`.

---

### [Sync & Parser scripts]

#### [MODIFY] [sheet-parser.ts](file:///e:/ESGCheckerproject/src/lib/sheet-parser.ts)
- Update parser functions to support both Cost and Benefit CSV layouts (specifically, accounting for the lack of the `Nominal Cost` column in the Benefit sheet).
- Add support for returning type (`COST` | `BENEFIT`) from sheet parser.

#### [MODIFY] [sync-from-sheet.ts](file:///e:/ESGCheckerproject/scripts/sync-from-sheet.ts)
- Fetch from GID `0` (Cost) and GID `810360985` (Benefit).
- Parse both sheets and upsert them to `TopicScore` table with their respective types (`COST` / `BENEFIT`).
- Adjust `prisma.topicScore.upsert` to target the new unique key: `companyTicker_topicCode_type`.

---

### [Data Fetching & Type Layer]

#### [MODIFY] [types.ts](file:///e:/ESGCheckerproject/src/lib/types.ts)
- Update `TopicScoreRow` to include `type?: "COST" | "BENEFIT"` or add it to types.

#### [MODIFY] [companies.ts](file:///e:/ESGCheckerproject/src/lib/companies.ts)
- Filter `topicScores` by `type: "COST"` when calculating aggregated scores for the general overview (to keep overall ratings consistent with the Cost metrics).
- Separate the fetched scores into cost and benefit lists in `getCompanyDetail` and `getAllCompaniesForComparison` so they can be returned separately.

---

### [UI / Frontend Components]

#### [MODIFY] [i18n.ts](file:///e:/ESGCheckerproject/src/lib/i18n.ts)
- Add new translations for Benefit and Cost tables:
  - `id`: `checklistCost: "Checklist GRI 14 (Cost)", checklistBenefit: "Checklist GRI 14 (Benefit)", costTable: "Tabel Komparasi - Cost-Based", benefitTable: "Tabel Komparasi - Benefit-Based", benefit: "Manfaat"`
  - `en`: `checklistCost: "GRI 14 Checklist (Cost)", checklistBenefit: "GRI 14 Checklist (Benefit)", costTable: "Comparison Table - Cost-Based", benefitTable: "Comparison Table - Benefit-Based", benefit: "Benefit"`

#### [MODIFY] [GriChecklistTable.tsx](file:///e:/ESGCheckerproject/src/components/GriChecklistTable.tsx)
- Accept a custom title or type parameter to distinguish between rendering "Cost" and "Benefit" checklists.
- For "Benefit" table, label the disclosure description row as **Manfaat / Benefit** instead of **Pengungkapan / Disclosure** (and hide the nominal cost field since it is null).

#### [MODIFY] [ScorePageClient.tsx](file:///e:/ESGCheckerproject/src/app/companies/%5Bticker%5D/score/ScorePageClient.tsx)
- Receive both `costTopicsByLocale` and `benefitTopicsByLocale`.
- Render both tables in sequence (Cost checklist on top, Benefit checklist below).

#### [MODIFY] [page.tsx (Score Details Server Page)](file:///e:/ESGCheckerproject/src/app/companies/%5Bticker%5D/score/page.tsx)
- Retrieve and pass both cost and benefit topics from `getCompanyDetail` to `ScorePageClient`.

#### [MODIFY] [CompareClient.tsx](file:///e:/ESGCheckerproject/src/components/compare/CompareClient.tsx)
- Separate the main comparison matrix into `matrixCost` and `matrixBenefit`.
- Render two side-by-side comparison tables (Cost-based and Benefit-based).

## Verification Plan

### Automated Tests
- Run `npm run dev:check` to verify database connection and schema constraints.
- Run `npm run build` to verify there are no compilation/TypeScript errors.

### Manual Verification
- Run `npm run sync:all` to fetch both sheets from Google Sheets and populate the database.
- Open `/companies/MDKA/score` to confirm both the Cost Checklist and Benefit Checklist tables render correctly.
- Open `/compare?tickers=MDKA,ANTM` to confirm both Cost-Based and Benefit-Based comparison matrices render.
