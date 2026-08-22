"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { chooseCommitmentAction, type OnboardingFormState } from "@/app/onboarding/actions";
import {
  BATTLE_CATEGORIES,
  CUSTOM_CATEGORY_ID,
  MAX_COMMITMENT_LABEL,
} from "@/lib/commitment-categories";
import { ROUTES } from "@/lib/routes";

const FIELD =
  "mt-3 w-full rounded-2xl bg-surface px-4 py-3 text-sm text-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const OPTION =
  "flex cursor-pointer items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm font-medium text-foreground transition-shadow duration-200 ease-out shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff] hover:shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] has-[:checked]:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent";

const SUBMIT =
  "mt-2 inline-flex items-center justify-center rounded-full bg-surface px-6 py-3 text-sm font-semibold text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff] disabled:opacity-60";

const ALERT =
  "rounded-2xl bg-surface px-4 py-3 text-sm text-danger shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const LINK =
  "rounded-sm font-semibold text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

export function CommitmentPicker() {
  const [state, formAction, pending] = useActionState<OnboardingFormState, FormData>(
    chooseCommitmentAction,
    { error: null },
  );
  const [chosen, setChosen] = useState<string>("");

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      {state.error ? (
        <p role="alert" className={ALERT}>
          {state.error}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Choose one
        </legend>

        {BATTLE_CATEGORIES.map((option) => (
          <label key={option.id} className={OPTION}>
            <input
              type="radio"
              name="category"
              value={option.id}
              required
              checked={chosen === option.id}
              onChange={() => setChosen(option.id)}
              className="size-4 shrink-0 accent-[var(--color-primary)]"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      {chosen === CUSTOM_CATEGORY_ID ? (
        <label className="block">
          <span className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Name it (optional)
          </span>
          <input
            type="text"
            name="customLabel"
            maxLength={MAX_COMMITMENT_LABEL}
            autoComplete="off"
            className={FIELD}
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            Encrypted before it is saved, and never shown anywhere in the app. You can leave it
            blank — the streak works the same.
          </span>
        </label>
      ) : null}

      <button type="submit" disabled={pending} aria-busy={pending} className={SUBMIT}>
        {pending ? "Setting up…" : "Start my commitment"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href={ROUTES.journal} className={LINK}>
          Skip for now
        </Link>
      </p>

      <p className="mt-2 flex items-start gap-2.5 rounded-2xl bg-surface px-4 py-3 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
        <Lock className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">
          Private by default. Your choice never appears on your dashboard, in a link, or in any
          notification — only the streak it builds does.
        </span>
      </p>
    </form>
  );
}
