import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "primary" | "warning";
};

const toneColor: Record<NonNullable<Props["tone"]>, string> = {
  default: "var(--foreground)",
  success: "var(--success)",
  primary: "var(--primary)",
  warning: "var(--cat-wasted)",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: Props) {
  return (
    <div className="neu-raised rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span className="neu-inset-sm grid size-9 shrink-0 place-items-center rounded-full">
          <Icon className="size-4" style={{ color: toneColor[tone] }} />
        </span>
      </div>
      <p
        className="mt-4 text-3xl font-semibold tracking-tight"
        style={{ color: toneColor[tone] }}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
