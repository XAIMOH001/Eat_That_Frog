import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export type UserId = string & { readonly __userId: unique symbol };

export type SessionUser = {
  id: UserId;
  name: string;
  email: string;
};

const readSession = cache(async () => auth.api.getSession({ headers: await headers() }));

function toDto(user: { id: string; name: string; email: string }): SessionUser {
  return { id: user.id as UserId, name: user.name, email: user.email };
}

export const verifySession = cache(async (): Promise<SessionUser> => {
  const session = await readSession();
  if (!session?.user) redirect(ROUTES.signIn);
  return toDto(session.user);
});

export const getOptionalUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  return session?.user ? toDto(session.user) : null;
});

export async function currentUserId(): Promise<UserId | null> {
  const session = await readSession();
  return session?.user ? (session.user.id as UserId) : null;
}

export async function currentSession(): Promise<{ userId: UserId; sessionId: string } | null> {
  const session = await readSession();
  if (!session?.user || !session.session) return null;
  return { userId: session.user.id as UserId, sessionId: session.session.id };
}
