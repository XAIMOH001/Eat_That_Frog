import { JournalDashboardLoader } from "@/components/journal/JournalDashboardLoader";

export default function Home() {
  return (
    <>
      <noscript>
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            JavaScript required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This journal runs entirely in your browser and needs JavaScript enabled. Nothing is sent
            to a server.
          </p>
        </div>
      </noscript>
      <JournalDashboardLoader />
    </>
  );
}
