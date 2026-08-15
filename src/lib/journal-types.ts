export type CategoryId = "focus" | "admin" | "rest" | "wasted";

export type HourEntry = {
  note: string;
  category: CategoryId | null;
};

export type Frog = {
  text: string;
  completed: boolean;
};

export type DayEntry = {
  hours: Record<string, HourEntry>;
  coreRoutineMaintained: boolean;
  frog: Frog;
};

export type JournalData = {
  version: 2;
  days: Record<string, DayEntry>;
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
    label: "Unproductive",
    short: "Wasted",
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
  return { hours: {}, coreRoutineMaintained: false, frog: { text: "", completed: false } };
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
