import Link from "next/link";

import { ROUTES } from "@/lib/routes";

const PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-surface px-6 py-3 text-sm font-semibold text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const SECONDARY =
  "inline-flex items-center justify-center rounded-full bg-surface px-6 py-3 text-sm font-semibold text-muted-foreground shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff] active:shadow-[inset_6px_6px_12px_#a3b1c6,inset_-6px_-6px_12px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const ROW = "flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row";

export function CtaPair({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <div className={ROW}>
        <Link href={ROUTES.journal} className={PRIMARY}>
          Open your journal
        </Link>
      </div>
    );
  }

  return (
    <div className={ROW}>
      <Link href={ROUTES.signUp} className={PRIMARY}>
        Get Started
      </Link>
      <Link href={ROUTES.signIn} className={SECONDARY}>
        Log In
      </Link>
    </div>
  );
}
