import type { Metadata } from "next";
import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { CredentialsForm } from "@/components/auth/CredentialsForm";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const LINK =
  "rounded-sm font-semibold text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

export default function SignInPage() {
  return (
    <AuthCard
      headline="Welcome back."
      subhead="Sign in to pick up your journal."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.signUp} className={LINK}>
            Get started.
          </Link>
        </>
      }
    >
      <CredentialsForm
        action={signInAction}
        mode="sign-in"
        submitLabel="Sign in"
        pendingLabel="Signing in…"
      />
    </AuthCard>
  );
}
