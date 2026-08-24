// The one social preview card, shared by the root metadata and the landing page so the
// declared dimensions can never drift from the file in `public/`.
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "The Eat That Frog dashboard: the day's discipline score, the core-routine switch, the frog for the day, and stat cards for productive hours, time leaks and streaks.",
} as const;
