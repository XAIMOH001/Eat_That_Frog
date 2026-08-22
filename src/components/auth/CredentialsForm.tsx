"use client";

import { useActionState } from "react";

export type AuthFormState = { error: string | null };

const LABEL = "text-[0.65rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase";

const FIELD =
  "rounded-2xl bg-surface px-4 py-3 text-sm text-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const SUBMIT =
  "mt-2 inline-flex items-center justify-center rounded-full bg-surface px-6 py-3 text-sm font-semibold text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff] disabled:opacity-60";

const ALERT =
  "rounded-2xl bg-surface px-4 py-3 text-sm text-danger shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const MIN_PASSWORD_LENGTH = 12;

export function CredentialsForm({
  action,
  mode,
  submitLabel,
  pendingLabel,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  mode: "sign-in" | "sign-up";
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      {state.error ? (
        <p role="alert" className={ALERT}>
          {state.error}
        </p>
      ) : null}

      {isSignUp ? (
        <label className="flex flex-col gap-2">
          <span className={LABEL}>Name</span>
          <input name="name" type="text" required autoComplete="name" className={FIELD} />
        </label>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className={LABEL}>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={LABEL}>Password</span>
        <input
          name="password"
          type="password"
          required
          {...(isSignUp ? { minLength: MIN_PASSWORD_LENGTH } : {})}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className={FIELD}
        />
        {isSignUp ? (
          <span className="text-xs text-muted-foreground">
            At least {MIN_PASSWORD_LENGTH} characters.
          </span>
        ) : null}
      </label>

      <button type="submit" disabled={pending} aria-busy={pending} className={SUBMIT}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
