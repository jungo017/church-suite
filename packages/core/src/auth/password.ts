import "server-only";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Node 내장 scrypt 사용(외부 의존 없음). 저장 형식: `scrypt:<salt-hex>:<hash-hex>`.
const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const dk = await scryptAsync(password, salt, KEYLEN);
  return `scrypt:${salt}:${dk.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const dk = await scryptAsync(password, salt, KEYLEN);
  const hashBuf = Buffer.from(hash, "hex");
  return hashBuf.length === dk.length && timingSafeEqual(hashBuf, dk);
}
