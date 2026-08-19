import { useState } from "react";
import { Quote as QuoteMark, RotateCw } from "lucide-react";
import { quoteCount, quoteForDate } from "@/lib/daily-quote";

type Props = {
  dateKey: string;
};

export function DailyQuoteCard({ dateKey }: Props) {
  const [offset, setOffset] = useState(0);
  const quote = quoteForDate(dateKey, offset);

  return (
    <section
      aria-label="Daily focus quote"
      className="rounded-3xl bg-surface p-5 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <QuoteMark className="size-4 text-primary" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1" aria-live="polite">
          <blockquote className="text-sm leading-relaxed text-foreground sm:text-base">
            {quote.text}
          </blockquote>
          <cite className="mt-2 block text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase not-italic">
            {quote.author}
          </cite>
        </div>

        <button
          type="button"
          onClick={() => setOffset((n) => (n + 1) % quoteCount())}
          aria-label="Show another quote"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-muted-foreground shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <RotateCw className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
