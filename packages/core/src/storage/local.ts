import "server-only";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import type { StorageAdapter } from "./types";

/**
 * 로컬 디스크 어댑터 (개발/단일 인스턴스용). 운영 다중 인스턴스는 S3 호환(SeaweedFS) 어댑터로 교체(§10).
 * 앱 코드는 직접 디스크 접근 금지 — 반드시 이 어댑터 경유(AGENTS.md §4).
 *
 * 저장 루트는 STORAGE_LOCAL_DIR 로 **명시(필수)**. process.cwd() 기반 추론을 쓰지 않으므로
 * 빌드 트레이싱이 프로젝트 전체를 끌어오지 않는다. 루트는 생성자에서 읽으므로
 * 다른 드라이버(s3) 선택 시 모듈 import 만으로는 실패하지 않는다.
 */
export class LocalDiskAdapter implements StorageAdapter {
  private readonly root: string;

  constructor() {
    const dir = process.env.STORAGE_LOCAL_DIR;
    if (!dir) {
      throw new Error(
        "STORAGE_LOCAL_DIR 가 설정되지 않았습니다 (STORAGE_DRIVER=local). 저장 루트 디렉터리를 지정하세요.",
      );
    }
    this.root = resolve(dir);
  }

  /**
   * key 를 root 하위 절대경로로 해석. `..`·절대경로로 root 밖을 가리키면 거부.
   * (경로조작 path traversal 차단 — 저장소 루트 밖 파일 접근 방지.)
   */
  private resolveKey(key: string): string {
    const full = resolve(this.root, key);
    if (full !== this.root && !full.startsWith(this.root + sep)) {
      throw new Error("invalid storage key");
    }
    return full;
  }

  async put(key: string, data: Buffer | Uint8Array): Promise<void> {
    const path = this.resolveKey(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return await readFile(this.resolveKey(key));
    } catch {
      return null; // 미존재 / 잘못된 키 등
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  url(key: string): string {
    // 개발용 경로. 운영에선 nginx/스토리지 서명 URL 로 대체.
    return `/storage/${key}`;
  }
}
