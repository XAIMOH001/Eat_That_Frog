export const ROUTES = {
  home: "/",
  journal: "/journal",
  signIn: "/sign-in",
  signUp: "/sign-up",
  onboardingCommitment: "/onboarding/commitment",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export function journalHref(dateKey: string): string {
  return `${ROUTES.journal}?date=${dateKey}`;
}

export function safeNext(next: string | undefined, fallback: string = ROUTES.journal): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
