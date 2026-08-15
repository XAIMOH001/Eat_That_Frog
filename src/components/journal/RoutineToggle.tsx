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
        className="flex h-10 w-18 shrink-0 items-center rounded-full bg-surface px-1.5 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <span
          className={`grid size-7 place-items-center rounded-full transition-transform duration-200 ease-out ${
            checked
              ? "translate-x-7 bg-success shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
              : "translate-x-0 bg-surface shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff]"
          }`}
        >
          {checked ? (
            <Check className="size-4 text-white" strokeWidth={3} aria-hidden="true" />
          ) : null}
        </span>
      </button>
    </div>
  );
}
