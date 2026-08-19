import { useEffect, useId, useRef } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

type Tone = "danger" | "affirmative";

type Props = {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: () => void;
  onCancel: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const BUTTON =
  "rounded-full bg-surface px-5 py-2.5 text-sm font-semibold transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const RAISED =
  "shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const TONES = {
  danger: {
    role: "alertdialog",
    Icon: AlertTriangle,
    accent: "text-danger",
    cancel: `text-muted-foreground ${RAISED}`,
  },
  affirmative: {
    role: "dialog",
    Icon: ShieldCheck,
    accent: "text-success",
    cancel:
      "text-muted-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff] active:shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff]",
  },
} as const;

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const { role, Icon, accent, cancel } = TONES[tone];

  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    confirmBtn.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const items = panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-sm rounded-3xl bg-surface p-6 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
            <Icon className={`size-4 ${accent}`} aria-hidden="true" />
          </span>
          <h2 id={titleId} className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>

        <div id={bodyId} className="mt-4 space-y-2 text-sm text-muted-foreground">
          {body}
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} className={`${BUTTON} ${cancel}`}>
            {cancelLabel}
          </button>
          <button
            ref={confirmBtn}
            type="button"
            onClick={onConfirm}
            className={`${BUTTON} ${accent} ${RAISED}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
