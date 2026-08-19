import { getJournalWindow } from "@/app/actions";
import { JournalDashboardLoader } from "@/components/journal/JournalDashboardLoader";
import { hydrateJournal } from "@/lib/journal-hydrate";
import { dateKey } from "@/lib/journal-types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Same bounds the header's date input enforces, applied again because the URL bypasses it. */
const MIN_DATE = "2000-01-01";
const MAX_DATE = "2100-12-31";

function resolveDate(raw: string | string[] | undefined, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  if (!ISO_DATE.test(raw) || raw < MIN_DATE || raw > MAX_DATE) return fallback;
  // Rejects the likes of 2026-02-31, which passes the regex but is not a real day.
  return dateKey(new Date(`${raw}T00:00:00`)) === raw ? raw : fallback;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Local, not UTC: the client computes its own todayKey with dateKey() too, and a UTC/local
  // split would leave the two disagreeing about which day it is either side of midnight.
  const todayKey = dateKey(new Date());
  const selected = resolveDate(params["date"], todayKey);

  // Read-only: a GET must never write. The daily_records row is created lazily by the first
  // mutation instead, so crawling every ?date= in range cannot seed the table.
  const window = await getJournalWindow(selected, todayKey);
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

      <JournalDashboardLoader selected={selected} initialData={initialData} />
    </>
  );
}
