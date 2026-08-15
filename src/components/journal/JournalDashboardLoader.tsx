"use client";

import dynamic from "next/dynamic";

export const JournalDashboardLoader = dynamic(
  () => import("./JournalDashboard").then((m) => m.JournalDashboard),
  {
    ssr: false,

    loading: () => (
      <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 sm:py-10">
        <div
          role="status"
          aria-label="Loading your journal"
          className="mx-auto flex max-w-6xl flex-col gap-6"
        >
          <div className="h-52 rounded-3xl bg-surface shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]" />
          <div className="h-40 rounded-3xl bg-surface shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]" />
          <div className="h-14 rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]" />
          <div className="h-112 rounded-3xl bg-surface shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]" />
        </div>
      </main>
    ),
  },
);
