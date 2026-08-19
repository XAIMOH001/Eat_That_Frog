import { ConfirmDialog } from "./ConfirmDialog";
import { LOCKOUT_HOURS } from "@/lib/routine-lock";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CoreRoutineModal({ open, onConfirm, onCancel }: Props) {
  return (
    <ConfirmDialog
      open={open}
      tone="affirmative"
      title="Anchor Today's Routine?"
      body={
        <>
          <p>Confirm that you successfully maintained your core focus routine today.</p>
          <p>
            Once locked, this status stays read-only for up to {LOCKOUT_HOURS} hours — until
            midnight at the latest — and cannot be un-toggled before then.
          </p>
        </>
      }
      confirmLabel="Confirm Anchor"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
