// Shorter than the product spec on purpose. Do not restore the removed options; use "other".
export const BATTLE_CATEGORIES = [
  { id: "social_media", label: "Social media" },
  { id: "gaming", label: "Gaming" },
  { id: "doomscrolling", label: "Doomscrolling" },
  { id: "junk_food", label: "Junk food" },
  { id: "smoking", label: "Smoking" },
  { id: "procrastination", label: "Procrastination" },
  { id: "other", label: "Something else" },
] as const;

export type BattleCategoryId = (typeof BATTLE_CATEGORIES)[number]["id"];

export const CUSTOM_CATEGORY_ID = "other";

export const MAX_COMMITMENT_LABEL = 80;
