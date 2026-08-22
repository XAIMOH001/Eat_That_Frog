import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CommitmentPicker } from "@/components/onboarding/CommitmentPicker";
import { hasLiveCommitment } from "@/lib/dal/commitment";
import { verifySession } from "@/lib/dal/session";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Private Commitment",
  robots: { index: false, follow: false },
};

export default async function ChooseCommitmentPage() {
  const user = await verifySession();

  if (await hasLiveCommitment(user.id)) redirect(ROUTES.journal);

  return (
    <div className="rounded-3xl bg-surface p-8 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-10">
      <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase">
        Eat That Frog
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        Choose your commitment.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everyone has something that repeatedly takes attention, time, or control. Pick the one you
        want to work on.
      </p>

      <CommitmentPicker />
    </div>
  );
}
