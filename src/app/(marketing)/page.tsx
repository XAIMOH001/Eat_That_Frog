import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CtaPair } from "@/components/marketing/CtaPair";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { Hero } from "@/components/marketing/Hero";
import { BATTLE_EXAMPLES, FEATURES } from "@/components/marketing/features";
import { getOptionalUser } from "@/lib/dal/session";
import { OG_IMAGE } from "@/lib/og";
import { journalHref } from "@/lib/routes";

const TITLE = "Eat That Frog — Do the work that matters.";
const DESCRIPTION =
  "A personal discipline system: name your hardest task, block your hours, and build consistency one day at a time.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getOptionalUser();

  if (user) {
    const date = (await searchParams)["date"];
    if (typeof date === "string") redirect(journalHref(date));
  }

  const signedIn = Boolean(user);

  return (
    <main className="flex flex-col gap-8 sm:gap-12">
      <Hero signedIn={signedIn} />

      {FEATURES.map((feature) => (
        <FeatureSection
          key={feature.id}
          id={feature.id}
          icon={feature.icon}
          eyebrow={feature.eyebrow}
          title={feature.title}
          lead={feature.lead}
          points={feature.points}
          tone={feature.tone}
        >
          {feature.id === "battle" ? (
            <li className="mt-1">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                For example
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {BATTLE_EXAMPLES.map((example) => (
                  <li
                    key={example}
                    className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff]"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </li>
          ) : null}
        </FeatureSection>
      ))}

      <section
        aria-labelledby="start-title"
        className="flex flex-col items-center gap-6 rounded-3xl bg-surface p-8 text-center shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-12"
      >
        <h2
          id="start-title"
          className="max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Stop planning around the work. Start doing it.
        </h2>
        <CtaPair signedIn={signedIn} />
      </section>
    </main>
  );
}
