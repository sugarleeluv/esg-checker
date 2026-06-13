export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AskAIFab } from "@/components/ui/AskAIFab";
import { GlossaryPageIntro } from "@/components/glosarium/GlossaryPageIntro";

export default async function GlosariumPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 pt-4 pb-8 lg:px-8">
        <GlossaryPageIntro />
      </main>
      <SiteFooter />
      <AskAIFab />
    </>
  );
}
