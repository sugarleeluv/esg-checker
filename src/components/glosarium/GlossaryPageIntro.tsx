"use client";

import { PageBackHeader } from "@/components/ui/PageBackHeader";
import { GlossaryClient } from "@/components/glosarium/GlossaryClient";
import { useLocale } from "@/components/providers/LocaleProvider";

export function GlossaryPageIntro() {
  const { L } = useLocale();

  return (
    <>
      <PageBackHeader title={L.glossaryTitle} backPath="/" />
      <GlossaryClient />
    </>
  );
}
