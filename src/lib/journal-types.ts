export type AccountIdentity = { name: string; email: string };

export type CategoryId = "focus" | "admin" | "rest" | "wasted";

export type HourEntry = {
  note: string;
  category: CategoryId | null;
  taskId: string | null;
};

export type TaskPriority = "A1" | "A2" | "B" | "C";

export const TASK_PRIORITIES: {
  id: TaskPriority;
  label: string;
  short: string;
  hint: string;
}[] = [
  { id: "A1", label: "A1", short: "Frog", hint: "The frog — hardest and most important" },
  { id: "A2", label: "A2", short: "Must do", hint: "Must do, serious consequences if skipped" },
  { id: "B", label: "B", short: "Should do", hint: "Should do, mild consequences" },
  { id: "C", label: "C", short: "Nice to do", hint: "Nice to do, no consequences" },
];

export type PlannedTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  targetDate: string;
  estimatedHours: number;
  actualHours: number;
  completed: boolean;
};

export type DayEntry = {
  hours: Record<string, HourEntry>;
  coreRoutineMaintained: boolean;
  routineLockedAt: string | null;
};

export type JournalData = {
  version: 3;
  days: Record<string, DayEntry>;
  tasks: Record<string, PlannedTask>;
};

export const CATEGORIES: {
  id: CategoryId;
  label: string;
  short: string;
  colorVar: string;
  productive: boolean;
}[] = [
  {
    id: "focus",
    label: "Focus Time",
    short: "Focus",
    colorVar: "var(--cat-focus)",
    productive: true,
  },
  { id: "admin", label: "Admin", short: "Admin", colorVar: "var(--cat-admin)", productive: true },
  { id: "rest", label: "Rest", short: "Rest", colorVar: "var(--cat-rest)", productive: false },
  {
    id: "wasted",
    label: "Time Leaks",
    short: "Leaks",
    colorVar: "var(--cat-wasted)",
    productive: false,
  },
];

export function categoryMeta(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)!;
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function emptyDay(): DayEntry {
  return { hours: {}, coreRoutineMaintained: false, routineLockedAt: null };
}

export function emptyHour(): HourEntry {
  return { note: "", category: null, taskId: null };
}

export function tasksForDate(data: JournalData, key: string): PlannedTask[] {
  const order: Record<TaskPriority, number> = { A1: 0, A2: 1, B: 2, C: 3 };
  return Object.values(data.tasks)
    .filter((t) => t.targetDate === key)
    .sort((a, b) => order[a.priority] - order[b.priority] || a.title.localeCompare(b.title));
}

export function a1Task(data: JournalData, key: string): PlannedTask | undefined {
  return tasksForDate(data, key).find((t) => t.priority === "A1");
}

export function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function prettyDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
