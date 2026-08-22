import type { Metadata } from "next";
import Link from "next/link";

import { signUpAction } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { CredentialsForm } from "@/components/auth/CredentialsForm";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Get started",
  robots: { index: false, follow: false },
};

const LINK =
  "rounded-sm font-semibold text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

export default function SignUpPage() {
  return (
    <AuthCard
      headline="Create your account."
      subhead="One important task, one focused day, one honest review."
      footer={
        <>
          Already have an account?{" "}
          <Link href={ROUTES.signIn} className={LINK}>
            Sign in.
          </Link>
        </>
      }
    >
      <CredentialsForm
        action={signUpAction}
        mode="sign-up"
        submitLabel="Create account"
        pendingLabel="Creating account…"
      />
    </AuthCard>
  );
}
