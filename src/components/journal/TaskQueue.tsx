import { useState } from "react";
import { Check, ListChecks, Moon, Plus, X } from "lucide-react";
import { TASK_PRIORITIES, type PlannedTask, type TaskPriority } from "@/lib/journal-types";

type Props = {
  tasks: PlannedTask[];
  /** The day these tasks belong to; drives the add form's target. */
  targetDate: string;
  /** True only while viewing today, so "tomorrow" means tomorrow. */
  isToday: boolean;
  tomorrowKey: string;
  planTomorrowOpen: boolean;
  planWindow: string;
  onAdd: (
    title: string,
    priority: TaskPriority,
    targetDate: string,
    estimatedHours: number,
  ) => void;
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
};

const priorityTone: Record<TaskPriority, string> = {
  A1: "var(--color-primary)",
  A2: "var(--color-primary)",
  B: "var(--cat-admin)",
  C: "var(--color-muted-foreground)",
};

export function TaskQueue({
  tasks,
  targetDate,
  isToday,
  tomorrowKey,
  planTomorrowOpen,
  planWindow,
  onAdd,
  onToggle,
  onRemove,
}: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("A2");
  const [hours, setHours] = useState("1");
  // Which day the add form targets. Only reachable when the evening window is open.
  const [forTomorrow, setForTomorrow] = useState(false);

  const canPlanTomorrow = isToday && planTomorrowOpen;
  const addTo = forTomorrow && canPlanTomorrow ? tomorrowKey : targetDate;
  const canSubmit = title.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const est = Math.max(0, Number(hours) || 0);
    onAdd(title, priority, addTo, est);
    setTitle("");
    setHours("1");
  };

  const done = tasks.filter((t) => t.completed).length;

  return (
    <section
      className="h-fit rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      aria-label="Planned tasks"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Today&apos;s Plan</h2>
        <p className="text-xs tabular-nums text-muted-foreground">
          {tasks.length ? `${done}/${tasks.length} done` : "Nothing planned"}
        </p>
      </div>

      {tasks.length ? (
        <ul className="mt-4 list-none space-y-2.5 p-0">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2.5 rounded-2xl bg-surface px-3 py-2.5 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={t.completed}
                aria-label={`Mark "${t.title}" complete`}
                onClick={() => onToggle(t.id, !t.completed)}
                className={`grid size-6 shrink-0 place-items-center rounded-full bg-surface transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  t.completed
                    ? "bg-success shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                    : "shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
                }`}
              >
                {t.completed ? (
                  <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden="true" />
                ) : null}
              </button>

              <span
                className="shrink-0 text-[0.65rem] font-bold tracking-wider uppercase tabular-nums"
                style={{ color: priorityTone[t.priority] }}
              >
                {t.priority}
              </span>

              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  t.completed ? "text-muted-foreground line-through" : "text-foreground"
                }`}
                title={t.title}
              >
                {t.title}
              </span>

              <span
                className="shrink-0 text-xs tabular-nums text-muted-foreground"
                title={`${t.actualHours}h logged of ${t.estimatedHours}h estimated`}
              >
                {t.actualHours}/{t.estimatedHours}h
              </span>

              <button
                type="button"
                aria-label={`Remove "${t.title}"`}
                onClick={() => onRemove(t.id)}
                className="grid size-6 shrink-0 place-items-center rounded-full bg-surface text-muted-foreground shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff] transition-shadow duration-200 ease-out hover:text-danger active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface px-4 py-5 text-center text-xs text-muted-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          Name your frog above, then add the A2, B and C work beneath it.
        </p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
          <ListChecks className="size-4 text-primary" aria-hidden="true" />
        </span>
        <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Add task
        </h3>
      </div>

      <div className="mt-3 space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="What else needs doing?"
          aria-label="New task title"
          className="w-full rounded-2xl bg-surface px-4 py-2.5 text-sm text-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent"
        />

        <div className="flex min-w-0 gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            aria-label="Priority"
            title={TASK_PRIORITIES.find((p) => p.id === priority)?.hint}
            className="min-w-0 flex-1 rounded-2xl bg-surface px-3 py-2 text-xs font-medium text-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p.id} value={p.id} title={p.hint}>
                {p.label} — {p.short}
              </option>
            ))}
          </select>

          <label className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-surface px-3 py-2 text-xs text-muted-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            <span>est</span>
            <input
              type="number"
              min={0}
              max={24}
              step={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              aria-label="Estimated hours"
              className="w-10 bg-transparent text-right tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span>h</span>
          </label>

          <button
            type="button"
            onClick={submit}
            aria-disabled={!canSubmit}
            className={`grid size-9 shrink-0 place-items-center rounded-full bg-surface transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              canSubmit
                ? "text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]"
                : "text-muted-foreground shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff]"
            }`}
            aria-label="Add task"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>

        {isToday ? (
          <div className="rounded-2xl bg-surface px-3 py-2.5 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={forTomorrow && canPlanTomorrow}
                disabled={!canPlanTomorrow}
                onChange={(e) => setForTomorrow(e.target.checked)}
                className="size-3.5 accent-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-accent"
              />
              <Moon className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span className={canPlanTomorrow ? "text-foreground" : "text-muted-foreground"}>
                Plan for tomorrow
              </span>
            </label>
            {!canPlanTomorrow ? (
              <p className="mt-1 pl-[1.4rem] text-[0.7rem] text-muted-foreground">
                Opens {planWindow} — plan the next day once this one is spent.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
