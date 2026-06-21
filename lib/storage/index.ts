import "server-only";
import type { StorageAdapter } from "./types";
import { LocalDiskAdapter } from "./local";

export type { StorageAdapter } from "./types";
export { churchPrefix } from "./types";

/**
 * 저장소 어댑터 선택 (STORAGE_DRIVER). 기본 local.
 * 's3' = SeaweedFS/S3 호환 — 연동 시 ./s3 어댑터를 추가해 연결(§10, §14).
 */
let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") {
    throw new Error(
      "STORAGE_DRIVER=s3 어댑터가 아직 구성되지 않았습니다. lib/storage/s3.ts(SeaweedFS) 연동 필요(§10).",
    );
  }
  cached = new LocalDiskAdapter();
  return cached;
}
