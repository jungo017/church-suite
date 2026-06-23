import "server-only";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import type { StorageAdapter } from "./types";

/**
 * 로컬 디스크 어댑터 (개발용). 운영은 S3 호환(SeaweedFS) 어댑터로 교체(§10).
 * 앱 코드는 직접 디스크 접근 금지 — 반드시 이 어댑터 경유(AGENTS.md §4).
 */
const ROOT = process.env.STORAGE_LOCAL_DIR ?? join(process.cwd(), ".storage");

/**
 * key 를 ROOT 하위 절대경로로 해석. `..`·절대경로 등으로 ROOT 밖을 가리키면 거부.
 * (경로조작 path traversal 차단 — 저장소 루트 밖 파일 접근 방지.)
 */
function resolveKey(key: string): string {
  const root = resolve(ROOT);
  const full = resolve(root, key);
  if (full !== root && !full.startsWith(root + sep)) {
    throw new Error("invalid storage key");
  }
  return full;
}

export class LocalDiskAdapter implements StorageAdapter {
  async put(key: string, data: Buffer | Uint8Array): Promise<void> {
    const path = resolveKey(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return await readFile(resolveKey(key));
    } catch {
      return null; // 미존재 / 잘못된 키 등
    }
  }

  async delete(key: string): Promise<void> {
    await rm(resolveKey(key), { force: true });
  }

  url(key: string): string {
    // 개발용 경로. 운영에선 nginx/스토리지 서명 URL 로 대체.
    return `/storage/${key}`;
  }
}
