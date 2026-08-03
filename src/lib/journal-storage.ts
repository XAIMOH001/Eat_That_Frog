import type { JournalData } from "./journal-types";

const STORAGE_KEY = "focus-audit-journal:v1";

export function emptyJournal(): JournalData {
  return { version: 1, days: {} };
}

export function loadJournal(): JournalData {
  if (typeof window === "undefined") return emptyJournal();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyJournal();
    const parsed = JSON.parse(raw) as JournalData;
    if (!parsed || typeof parsed !== "object" || !parsed.days) return emptyJournal();
    return { version: 1, days: parsed.days };
  } catch {
    return emptyJournal();
  }
}

export function saveJournal(data: JournalData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked — stay silent, data is non-critical */
  }
}

export function exportJournal(data: JournalData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `time-audit-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
