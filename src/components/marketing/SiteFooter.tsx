import Link from "next/link";

import { ROUTES } from "@/lib/routes";

const LINK =
  "rounded-sm font-semibold text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const ITEMS = [
  { href: ROUTES.privacy, label: "Privacy" },
  { href: ROUTES.terms, label: "Terms" },
  { href: ROUTES.signIn, label: "Sign In" },
  { href: ROUTES.signUp, label: "Create Account" },
] as const;

export function SiteFooter() {
  return (
    <footer className="rounded-2xl bg-surface px-5 py-3.5 shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Eat That Frog
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`${LINK} text-xs`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
