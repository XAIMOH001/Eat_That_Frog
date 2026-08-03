import { Check } from "lucide-react";

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function RoutineToggle({ checked, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right sm:text-left">
        <p className="text-sm font-semibold text-foreground">Core Routine Maintained</p>
        <p className="text-xs text-muted-foreground">
          {checked ? "Logged for today" : "Not yet logged"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Core Routine Maintained"
        onClick={() => onChange(!checked)}
        className="neu-inset neu-focus flex h-10 w-[4.5rem] shrink-0 items-center rounded-full px-1.5"
      >
        <span
          className="grid size-7 place-items-center rounded-full"
          style={{
            transform: checked ? "translateX(1.75rem)" : "translateX(0)",
            transition: "transform 200ms ease, box-shadow 200ms ease",
            background: checked ? "var(--success)" : "var(--background)",
            boxShadow: checked
              ? "0 3px 8px rgba(0,184,148,0.45)"
              : "-3px -3px 6px var(--neu-light), 4px 4px 8px var(--neu-dark)",
          }}
        >
          {checked ? <Check className="size-4 text-success-foreground" strokeWidth={3} /> : null}
        </span>
      </button>
    </div>
  );
}
