import { BarChart3, CalendarDays, Flame, Lock, ShieldCheck, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FeatureTone = "default" | "primary" | "success";

export type Feature = {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
  points: readonly string[];
};

export const FEATURES: readonly (Feature & { tone: FeatureTone })[] = [
  {
    id: "frog",
    icon: Target,
    tone: "primary",
    eyebrow: "The Frog",
    title: "Eat your frog",
    lead: "Every day has one task that matters more than the rest. Name it first, and do it first.",
    points: [
      "Your A1 is the single hardest, highest-consequence thing on the list.",
      "One frog per day, so a long list cannot become a hiding place.",
      "Everything else sorts into A2, B and C — and stays there.",
      "The day is judged on whether the frog was eaten, not on how many boxes were ticked.",
    ],
  },
  {
    id: "plan",
    icon: CalendarDays,
    tone: "default",
    eyebrow: "Hourly plan",
    title: "Plan your day",
    lead: "Block the hours before the day spends them for you.",
    points: [
      "A 24-hour grid: plan the hour, then log what actually happened in it.",
      "Tag every hour as Focus, Admin, Rest or Time Leaks.",
      "Hours logged against a task roll up into planned versus actual.",
      "Deep work and time leaks stop being a feeling and become a number.",
    ],
  },
  {
    id: "discipline",
    icon: Flame,
    tone: "success",
    eyebrow: "Discipline",
    title: "Build discipline",
    lead: "A score you cannot argue with, and a streak you have to earn every day.",
    points: [
      "A Daily Discipline Score out of 100: 40 points for the frog, 60 for the hours.",
      "Confirm your Core Routine once a day. It locks after 18 hours, so yesterday cannot be edited into a win.",
      "Consecutive maintained days build a Focus Consistency Streak.",
      "Personal records that survive a broken streak.",
    ],
  },
  {
    id: "battle",
    icon: Lock,
    tone: "default",
    eyebrow: "Your commitment",
    title: "Fight what gets in your way",
    lead: "Choose one personal behaviour you want to gain more control over.",
    points: [
      "One private check-in a day, inside a window the server enforces — not your device clock.",
      "A missed day breaks the streak and starts a recovery, not a punishment.",
      "Your commitment is private by default.",
    ],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    tone: "success",
    eyebrow: "Privacy",
    title: "Private by default",
    lead: "Your private commitment is never shown on a profile, a leaderboard, or to an accountability group unless you explicitly choose to share it.",
    points: [
      "What anyone else could see is the discipline — how long the streak is, not what is behind it.",
      "The behaviour you chose never appears in a link, a page title, or a notification.",
      "Your journal is scoped to your account and re-checked on every single read and write.",
      "No analytics, no trackers, no third-party requests. The app talks to nothing but itself.",
    ],
  },
  {
    id: "progress",
    icon: BarChart3,
    tone: "primary",
    eyebrow: "Progress",
    title: "See your own consistency",
    lead: "Progress you can see, measured in weeks rather than hours.",
    points: [
      "Current streak and best record, side by side.",
      "A monthly calendar of the days you held and the days you missed.",
      "Recovery after a missed day, without erasing what you already earned.",
      "Seven-day trends for productive hours against time leaks, plus your frog completion rate.",
    ],
  },
];

export const BATTLE_EXAMPLES = [
  "Social media",
  "Gaming",
  "Doomscrolling",
  "Junk food",
  "Procrastination",
  "Something only you would name",
] as const;
