import "server-only";
import type { StorageAdapter } from "./types";
import { LocalDiskAdapter } from "./local";
import { S3Adapter } from "./s3";

export type { StorageAdapter } from "./types";
export { churchPrefix } from "./types";

/**
 * 저장소 어댑터 선택 (STORAGE_DRIVER). 기본 local.
 * 's3' = SeaweedFS/MinIO/AWS S3 호환(§10, §14).
 */
let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  cached = driver === "s3" ? new S3Adapter() : new LocalDiskAdapter();
  return cached;
}
