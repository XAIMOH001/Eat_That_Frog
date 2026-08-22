import Link from "next/link";

import { getOptionalUser } from "@/lib/dal/session";
import { ROUTES } from "@/lib/routes";

const BRAND =
  "rounded-sm text-[0.65rem] font-semibold tracking-[0.22em] text-primary uppercase focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const GHOST =
  "rounded-sm px-2 py-1 text-sm font-semibold text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const SOLID =
  "inline-flex items-center justify-center rounded-full bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] transition-shadow duration-200 ease-out hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

export async function SiteNav() {
  const user = await getOptionalUser();

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href={ROUTES.home} className={BRAND}>
        Eat That Frog
      </Link>

      <nav aria-label="Account" className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <Link href={ROUTES.journal} className={SOLID}>
            Open journal
          </Link>
        ) : (
          <>
            <Link href={ROUTES.signIn} className={GHOST}>
              Log in
            </Link>
            <Link href={ROUTES.signUp} className={SOLID}>
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
