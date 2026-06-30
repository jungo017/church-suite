import { describe, it, expect } from "vitest";
import { S3Adapter } from "@church/core/storage/s3";

/**
 * S3(SeaweedFS) 어댑터. url/설정은 항상 검증.
 * put/get/delete 라운드트립은 실 S3 엔드포인트가 있을 때만(STORAGE_S3_TEST=1 + STORAGE_*):
 *   docker compose --profile storage up -d
 *   STORAGE_S3_TEST=1 STORAGE_ENDPOINT=http://localhost:8333 STORAGE_BUCKET=church-suite \
 *   STORAGE_ACCESS_KEY=any STORAGE_SECRET_KEY=any npx vitest run test/storage-s3.test.ts
 */
describe("S3 어댑터 (SeaweedFS/S3 호환)", () => {
  it("url 은 path-style 공개 경로를 만든다(설정 와이어링)", () => {
    const prev = { ...process.env };
    process.env.STORAGE_ENDPOINT = "http://localhost:8333/";
    process.env.STORAGE_BUCKET = "church-suite";
    process.env.STORAGE_ACCESS_KEY = "k";
    process.env.STORAGE_SECRET_KEY = "s";
    const a = new S3Adapter();
    expect(a.url("church-x/forms/a.pdf")).toBe(
      "http://localhost:8333/church-suite/church-x/forms/a.pdf",
    );
    Object.assign(process.env, prev);
  });

  it("필수 환경변수 누락 시 명확히 실패한다", () => {
    const prev = { ...process.env };
    delete process.env.STORAGE_ENDPOINT;
    delete process.env.STORAGE_BUCKET;
    expect(() => new S3Adapter()).toThrow(/STORAGE_ENDPOINT/);
    Object.assign(process.env, prev);
  });

  const RUN = process.env.STORAGE_S3_TEST === "1";
  it.skipIf(!RUN)("put → get → delete 라운드트립(실 S3)", async () => {
    const { S3Client, CreateBucketCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION ?? "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    });
    try {
      await client.send(new CreateBucketCommand({ Bucket: process.env.STORAGE_BUCKET! }));
    } catch {
      /* 이미 존재 */
    }

    const a = new S3Adapter();
    const key = `church-test/_it/roundtrip.txt`;
    await a.put(key, new TextEncoder().encode("hello-seaweed"), "text/plain");

    const got = await a.get(key);
    expect(got).not.toBeNull();
    expect(new TextDecoder().decode(got!)).toBe("hello-seaweed");

    await a.delete(key);
    expect(await a.get(key)).toBeNull(); // 삭제 후 404 → null
  });
});
