import type { Metadata } from "next";

import { JournalDashboardLoader } from "@/components/journal/JournalDashboardLoader";
import { getCommitmentCard } from "@/lib/dal/commitment";
import { hasFreshReauth } from "@/lib/dal/reauth";
import { getJournalWindow } from "@/lib/dal/journal";
import { currentSession, verifySession } from "@/lib/dal/session";
import { hydrateJournal } from "@/lib/journal-hydrate";
import { dateKey } from "@/lib/journal-types";

export const metadata: Metadata = {
  title: "Journal",
  robots: { index: false, follow: false },
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_DATE = "2000-01-01";
const MAX_DATE = "2100-12-31";

function resolveDate(raw: string | string[] | undefined, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  if (!ISO_DATE.test(raw) || raw < MIN_DATE || raw > MAX_DATE) return fallback;
  return dateKey(new Date(`${raw}T00:00:00`)) === raw ? raw : fallback;
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await verifySession();
  const session = await currentSession();

  const params = await searchParams;

  const todayKey = dateKey(new Date());
  const selected = resolveDate(params["date"], todayKey);

  const window = await getJournalWindow(user.id, selected, todayKey);
  const commitment = await getCommitmentCard(user.id, new Date());
  const reauthFresh = session ? await hasFreshReauth(session.userId, session.sessionId) : false;
  const initialData = hydrateJournal(window.records, window.logs, window.tasks);

  return (
    <>
      <noscript>
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            JavaScript required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This journal runs entirely in your browser and needs JavaScript enabled.
          </p>
        </div>
      </noscript>

      <JournalDashboardLoader
        selected={selected}
        initialData={initialData}
        commitment={commitment}
        user={{ name: user.name, email: user.email }}
        reauthFresh={reauthFresh}
      />
    </>
  );
}
