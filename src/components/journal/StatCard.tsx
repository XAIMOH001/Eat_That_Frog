import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "primary" | "warning";
};

const toneColor: Record<NonNullable<Props["tone"]>, string> = {
  default: "#3f4a5f",
  success: "#00b894",
  primary: "#6c5ce7",
  warning: "var(--cat-wasted)",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: Props) {
  return (
    <div className="rounded-3xl bg-surface p-5 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </p>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <Icon className="size-4" style={{ color: toneColor[tone] }} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight" style={{ color: toneColor[tone] }}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
