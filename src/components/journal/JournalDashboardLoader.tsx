"use client";

import dynamic from "next/dynamic";

// Client-only: the dashboard derives "today" from the browser clock, and
// pre-rendering it on the server would mismatch for any visitor whose time
// zone differs from the deployment's.
export const JournalDashboardLoader = dynamic(
  () => import("./JournalDashboard").then((m) => m.JournalDashboard),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-[#e0e5ec] px-4 py-6 sm:px-6 sm:py-10">
        <div
          className="mx-auto h-64 max-w-6xl rounded-3xl bg-[#e0e5ec] shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
          aria-busy="true"
        />
      </main>
    ),
  },
);
