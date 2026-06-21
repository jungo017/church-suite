import "server-only";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StorageAdapter } from "./types";

/**
 * 로컬 디스크 어댑터 (개발용). 운영은 S3 호환(SeaweedFS) 어댑터로 교체(§10).
 * 앱 코드는 직접 디스크 접근 금지 — 반드시 이 어댑터 경유(AGENTS.md §4).
 */
const ROOT = process.env.STORAGE_LOCAL_DIR ?? join(process.cwd(), ".storage");

export class LocalDiskAdapter implements StorageAdapter {
  async put(key: string, data: Buffer | Uint8Array): Promise<void> {
    const path = join(ROOT, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async delete(key: string): Promise<void> {
    await rm(join(ROOT, key), { force: true });
  }

  url(key: string): string {
    // 개발용 경로. 운영에선 nginx/스토리지 서명 URL 로 대체.
    return `/storage/${key}`;
  }
}
