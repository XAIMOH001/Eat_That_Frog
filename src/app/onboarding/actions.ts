"use server";

import { redirect } from "next/navigation";

import { startCommitment } from "@/app/actions";
import { CUSTOM_CATEGORY_ID } from "@/lib/commitment-categories";
import { ROUTES } from "@/lib/routes";

export type OnboardingFormState = { error: string | null };

export async function chooseCommitmentAction(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const category = formData.get("category");
  if (typeof category !== "string" || category === "") {
    return { error: "Choose one to continue." };
  }

  const rawLabel = formData.get("customLabel");
  const label = category === CUSTOM_CATEGORY_ID && typeof rawLabel === "string" ? rawLabel : null;

  const result = await startCommitment(category, label);

  if (!result.ok) {
    if (result.error === "unauthenticated") return { error: "Your session ended. Sign in again." };
    if (result.error === "not_allowed") return { error: "You already have a commitment." };
    return { error: "Something went wrong. Please try again." };
  }

  redirect(ROUTES.journal);
}
