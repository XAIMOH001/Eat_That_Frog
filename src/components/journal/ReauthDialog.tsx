"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Lock } from "lucide-react";

import { reauthenticateAction } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/components/auth/CredentialsForm";

const FIELD =
  "rounded-2xl bg-surface px-4 py-3 text-sm text-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const LABEL = "text-[0.65rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase";

const ALERT =
  "rounded-2xl bg-surface px-4 py-3 text-sm text-danger shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const BUTTON =
  "rounded-full bg-surface px-5 py-2.5 text-sm font-semibold transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const RAISED =
  "shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

export function ReauthDialog({
  open,
  reason,
  onVerified,
  onCancel,
}: {
  open: boolean;
  reason: string;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    reauthenticateAction,
    { error: null },
  );

  const panel = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  const cancelRef = useRef(onCancel);
  const verifiedRef = useRef(onVerified);
  useEffect(() => {
    cancelRef.current = onCancel;
    verifiedRef.current = onVerified;
  }, [onCancel, onVerified]);

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    passwordRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cancelRef.current();
    };

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      restoreTo.current?.focus();
    };
  }, [open]);

  const settled = !pending && state.error === null;
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    if (!wasOpen.current) {
      wasOpen.current = true;
      return;
    }
    if (settled) verifiedRef.current();
  }, [open, settled]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onMouseDown={(e) => {
        if (!panel.current?.contains(e.target as Node)) onCancel();
      }}
    >
      <div className="absolute inset-0 bg-[#c2c9d6]/70" aria-hidden="true" />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-sm rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            <Lock className="size-4 text-primary" aria-hidden="true" />
          </span>
          <h2 id={titleId} className="text-base font-semibold tracking-tight text-foreground">
            Confirm it&apos;s you
          </h2>
        </div>

        <p id={bodyId} className="mt-4 text-sm text-muted-foreground">
          {reason}
        </p>

        <form action={formAction} className="mt-5 flex flex-col gap-4">
          {state.error ? (
            <p role="alert" className={ALERT}>
              {state.error}
            </p>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className={LABEL}>Password</span>
            <input
              ref={passwordRef}
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={FIELD}
            />
          </label>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className={`${BUTTON} text-muted-foreground ${RAISED}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className={`${BUTTON} text-primary ${RAISED} disabled:shadow-[3px_3px_6px_#a3b1c6,-3px_-3px_6px_#ffffff] disabled:opacity-60`}
            >
              {pending ? "Checking…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
