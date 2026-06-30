import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDiskAdapter } from "@church/core/storage/local";

/**
 * 로컬 디스크 어댑터: STORAGE_LOCAL_DIR 필수 + 경로조작(path traversal) 방어.
 * key 는 항상 ROOT 하위로만 해석되어야 하고, `..`·절대경로로 ROOT 밖을 가리키면 거부한다.
 * 루트는 생성자에서 STORAGE_LOCAL_DIR 을 읽으므로, env 설정 후 인스턴스를 만든다.
 */
describe("LocalDiskAdapter (필수 루트 + 경로조작 방어)", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "church-storage-"));
    process.env.STORAGE_LOCAL_DIR = root;
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("STORAGE_LOCAL_DIR 미설정 시 생성자가 실패한다", () => {
    const prev = process.env.STORAGE_LOCAL_DIR;
    delete process.env.STORAGE_LOCAL_DIR;
    try {
      expect(() => new LocalDiskAdapter()).toThrow(/STORAGE_LOCAL_DIR/);
    } finally {
      process.env.STORAGE_LOCAL_DIR = prev;
    }
  });

  it("정상 키는 ROOT 하위에 저장/조회된다", async () => {
    const a = new LocalDiskAdapter();
    const key = "church-1/forms/a.txt";
    await a.put(key, new TextEncoder().encode("hi"));
    const got = await a.get(key);
    expect(got).not.toBeNull();
    expect(new TextDecoder().decode(got!)).toBe("hi");
  });

  it("`..` 로 ROOT 밖을 가리키는 키는 put 에서 거부한다", async () => {
    const a = new LocalDiskAdapter();
    await expect(
      a.put("church-1/../../escape.txt", new TextEncoder().encode("x")),
    ).rejects.toThrow(/invalid storage key/);
  });

  it("경로조작 키 get 은 ROOT 밖 파일을 읽지 않고 null 을 반환한다", async () => {
    const a = new LocalDiskAdapter();
    expect(await a.get("church-1/../../../../etc/hosts")).toBeNull();
  });

  it("경로조작 put 은 ROOT 밖에 파일을 만들지 않는다", async () => {
    const a = new LocalDiskAdapter();
    const outside = join(root, "..", "leaked.txt");
    await a
      .put("church-1/../../leaked.txt", new TextEncoder().encode("x"))
      .catch(() => {});
    await expect(readFile(outside)).rejects.toThrow();
  });
});
