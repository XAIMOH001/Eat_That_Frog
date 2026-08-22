"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";

const SRC = "/dashboard-preview.png";
const WIDTH = 2400;
const HEIGHT = 1500;

const ALT =
  "The Eat That Frog dashboard: the day's discipline score and core-routine switch, the frog for the day, and a 24-hour log with each hour tagged Focus, Admin, Rest or Time Leaks.";

export function DashboardPreview() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="w-full max-w-5xl rounded-3xl bg-surface p-2.5 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-3">
      <div className="aspect-[8/5] w-full overflow-hidden rounded-2xl bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
        {failed ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
                <LayoutGrid className="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <p className="text-xs text-muted-foreground">Dashboard preview</p>
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={SRC}
            width={WIDTH}
            height={HEIGHT}
            alt={ALT}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={() => setFailed(true)}
            className="size-full object-cover object-top"
          />
        )}
      </div>
    </div>
  );
}
