"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ROUTES, safeNext } from "@/lib/routes";
import { currentSession } from "@/lib/dal/session";
import { grantReauth, isReauthLocked, recordReauthFailure } from "@/lib/dal/reauth";
import type { AuthFormState } from "@/components/auth/CredentialsForm";

const SIGN_IN_FAILED = "That email and password do not match an account.";
const GENERIC_FAILED = "Something went wrong. Please try again.";
const REAUTH_FAILED = "That password does not match. Try again in a moment.";

function readCredentials(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") return null;
  return { email, password };
}

export async function signInAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = readCredentials(formData);
  if (!credentials) return { error: SIGN_IN_FAILED };

  const next = safeNext(formData.get("next")?.toString());

  try {
    await auth.api.signInEmail({ body: credentials, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) return { error: SIGN_IN_FAILED };
    console.error("[auth] signIn failed:", error);
    return { error: GENERIC_FAILED };
  }

  redirect(next);
}

export async function signUpAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = readCredentials(formData);
  const name = formData.get("name");
  if (!credentials || typeof name !== "string" || !name.trim()) {
    return { error: "Please fill in your name, email, and password." };
  }

  const next = safeNext(formData.get("next")?.toString(), ROUTES.onboardingCommitment);

  try {
    await auth.api.signUpEmail({
      body: { ...credentials, name: name.trim() },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message || GENERIC_FAILED };
    }
    console.error("[auth] signUp failed:", error);
    return { error: GENERIC_FAILED };
  }

  redirect(next);
}

export async function reauthenticateAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password === "") {
    return { error: REAUTH_FAILED };
  }

  const session = await currentSession();
  if (!session) return { error: "Your session ended. Sign in again." };

  if (await isReauthLocked(session.userId)) return { error: REAUTH_FAILED };

  try {
    await auth.api.verifyPassword({ body: { password }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) {
      await recordReauthFailure(session.userId);
      return { error: REAUTH_FAILED };
    }
    console.error("[auth] reauthenticate failed:", error);
    return { error: GENERIC_FAILED };
  }

  await grantReauth(session.userId, session.sessionId);
  return { error: null };
}
