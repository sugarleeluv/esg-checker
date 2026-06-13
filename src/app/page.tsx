export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LandingHero } from "@/components/home/LandingHero";
import { LandingFeatures } from "@/components/home/LandingFeatures";
import { AskAIFab } from "@/components/ui/AskAIFab";


export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 lg:px-8">
        <LandingHero />
        <LandingFeatures />
      </main>
      <SiteFooter />
      <AskAIFab />
    </>
  );
}

