import { describe, it, expect, afterAll } from "vitest";
import { onboardChurch } from "@/lib/onboarding/onboard";
import { reserveUsage, releaseUsage, getUsage } from "@/lib/storage/usage";
import { churchPrefix } from "@/lib/storage/types";
import { deleteChurches, closeDb, uniqueCode } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("저장소 사용량/쿼터", () => {
  it("예약(증가)/해제(감소) + 쿼터 초과 거부", async () => {
    const { churchId } = await onboardChurch({
      churchName: "스토리지",
      churchCode: uniqueCode("st"),
      adminLoginId: "admin",
      adminPassword: "pw12345678",
    });
    created.push(churchId);

    // free plan = 1 GiB
    expect(await reserveUsage(churchId, 1000, 1)).toBe(true);
    let usage = await getUsage(churchId);
    expect(usage?.bytesUsed).toBe(1000);
    expect(usage?.fileCount).toBe(1);

    // 한도 초과(>1GiB) 거부
    expect(await reserveUsage(churchId, 2 * 1024 * 1024 * 1024)).toBe(false);
    usage = await getUsage(churchId);
    expect(usage?.bytesUsed).toBe(1000); // 증가 안 함

    await releaseUsage(churchId, 1000, 1);
    usage = await getUsage(churchId);
    expect(usage?.bytesUsed).toBe(0);
    expect(usage?.fileCount).toBe(0);
  });

  it("churchPrefix 키 규칙", () => {
    expect(churchPrefix("abc", "photos/x.png")).toBe("church-abc/photos/x.png");
    expect(churchPrefix("abc", "/leading")).toBe("church-abc/leading");
  });
});
