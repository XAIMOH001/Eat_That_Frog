"use client";

import { Fragment, useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Trophy, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/initials";
import { ROUTES } from "@/lib/routes";
import type { AccountIdentity } from "@/lib/journal-types";

const ITEMS = [
  { id: "profile", label: "Profile", icon: User, soon: true },
  { id: "achievements", label: "Achievements", icon: Trophy, soon: true },
  { id: "settings", label: "Settings", icon: Settings, soon: true },
  { id: "signout", label: "Sign out", icon: LogOut, soon: false },
] as const;

const TRIGGER_BASE =
  "grid size-10 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold tracking-wide text-foreground transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const TRIGGER_RAISED =
  "shadow-[5px_5px_10px_#a3b1c6,-5px_-5px_10px_#ffffff] hover:shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const TRIGGER_PRESSED = "shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff]";

const PANEL =
  "absolute top-full right-0 z-40 mt-3 w-56 rounded-3xl bg-surface p-2 shadow-[9px_9px_16px_#a3b1c6,-9px_-9px_16px_#ffffff]";

const ITEM =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-shadow duration-200 ease-out hover:shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff] active:shadow-[inset_3px_3px_6px_#a3b1c6,inset_-3px_-3px_6px_#ffffff] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const ITEM_SOON =
  "flex w-full cursor-default items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground opacity-75 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

const PILL =
  "ml-auto rounded-full bg-surface px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff]";

const SEPARATOR = "mx-1 my-1.5 h-px bg-[#c8d0dd]";

export function UserMenu({
  user,
  onBeforeSignOut,
}: {
  user: AccountIdentity;
  onBeforeSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, startSignOut] = useTransition();

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const router = useRouter();

  const itemDomId = useCallback((id: string) => `${menuId}-${id}`, [menuId]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const target = ITEMS[active];
    if (target) document.getElementById(itemDomId(target.id))?.focus();
  }, [open, active, itemDomId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const signOut = () => {
    if (pending) return;
    startSignOut(async () => {
      // Must precede signOut(): otherwise queued journal writes are dropped.
      await onBeforeSignOut();
      await authClient.signOut();
      router.replace(ROUTES.signIn);
    });
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    setActive(e.key === "ArrowDown" ? 0 : ITEMS.length - 1);
    setOpen(true);
  };

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Tab"];
    if (!keys.includes(e.key)) return;

    if (e.key === "Tab") {
      e.preventDefault();
      close();
      return;
    }

    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? ITEMS.length - 1
          : (active + (e.key === "ArrowDown" ? 1 : -1) + ITEMS.length) % ITEMS.length;
    setActive(next);
  };

  const glyph = initials(user.name, user.email);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        {...(open ? { "aria-controls": menuId } : {})}
        aria-label={`Account: ${user.name || user.email}`}
        onClick={() => {
          setActive(0);
          setOpen((v) => !v);
        }}
        onKeyDown={onTriggerKeyDown}
        className={`${TRIGGER_BASE} ${open ? TRIGGER_PRESSED : TRIGGER_RAISED}`}
      >
        {glyph ? glyph : <User className="size-4" aria-hidden="true" />}
      </button>

      {open ? (
        <div className={PANEL}>
          <div className="px-3 pt-1 pb-3">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="mx-1 mb-1 h-px bg-[#c8d0dd]" aria-hidden="true" />

          <div id={menuId} role="menu" aria-label="Account" onKeyDown={onMenuKeyDown}>
            {ITEMS.map((item, i) => {
              const Icon = item.icon;
              const busy = item.id === "signout" && pending;
              return (
                <Fragment key={item.id}>
                  {item.id === "signout" ? <div role="separator" className={SEPARATOR} /> : null}
                  <button
                    id={itemDomId(item.id)}
                    type="button"
                    role="menuitem"
                    tabIndex={i === active ? 0 : -1}
                    {...(item.soon || busy ? { "aria-disabled": true } : {})}
                    {...(item.id === "signout" ? { "aria-busy": pending } : {})}
                    onClick={item.soon ? undefined : signOut}
                    className={item.soon ? ITEM_SOON : ITEM}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{busy ? "Signing out…" : item.label}</span>
                    {item.soon ? <span className={PILL}>Soon</span> : null}
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
