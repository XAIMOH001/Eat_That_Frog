import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import type { UserId } from "@/lib/dal/session";

const KEY_ID = "k1";
const PREFIX = "etf1";
const IV_BYTES = 12;
const KEY_BYTES = 32;

function loadKey(): Buffer {
  const raw = process.env["COMMITMENT_SECRET_KEY"];
  if (!raw) {
    throw new Error("COMMITMENT_SECRET_KEY is not set. Generate one with: openssl rand -base64 32");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `COMMITMENT_SECRET_KEY must decode to ${KEY_BYTES} bytes, got ${key.length}. Generate one with: openssl rand -base64 32`,
    );
  }
  return key;
}

let cachedKey: Buffer | null = null;
function key(): Buffer {
  cachedKey ??= loadKey();
  return cachedKey;
}

type Payload = { c: string; l: string | null };

export function sealBattle(userId: UserId, category: string, label: string | null): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(userId, "utf8"));

  const payload: Payload = { c: category, l: label };
  const body = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return `${PREFIX}.${KEY_ID}.${iv.toString("base64url")}.${body.toString("base64url")}`;
}

export function openBattle(
  userId: UserId,
  sealed: string,
): { category: string; label: string | null } {
  const parts = sealed.split(".");
  const [prefix, keyId, ivPart, bodyPart] = parts;
  if (parts.length !== 4 || prefix !== PREFIX || keyId !== KEY_ID || !ivPart || !bodyPart) {
    throw new Error("Sealed commitment is malformed.");
  }

  const body = Buffer.from(bodyPart, "base64url");
  const tag = body.subarray(body.length - 16);
  const cipherText = body.subarray(0, body.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivPart, "base64url"));
  decipher.setAAD(Buffer.from(userId, "utf8"));
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(cipherText), decipher.final()]).toString("utf8");
  const parsed = JSON.parse(plain) as Payload;
  return { category: parsed.c, label: parsed.l };
}
