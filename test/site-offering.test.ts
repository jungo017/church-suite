import { describe, it, expect, afterAll } from "vitest";
import { createAccount } from "@/lib/finance/accounts";
import { listVouchers } from "@/lib/finance/vouchers";
import {
  submitOnlineOffering,
  listOnlineOfferings,
  reflectOffering,
} from "@/lib/site/offering";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("온라인 헌금 접수", () => {
  it("제출(paid) → 재정 반영(전표 생성, reflected) + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const { offeringId } = await submitOnlineOffering(a, {
      donorName: "익명헌금자",
      offeringKind: "감사헌금",
      amount: "50000",
    });
    let list = await listOnlineOfferings(a);
    expect(list).toHaveLength(1);
    expect(list[0]!.status).toBe("paid"); // mock PG

    // 격리
    expect(await listOnlineOfferings(b)).toHaveLength(0);

    // 재정 반영 → 전표 생성
    const acc = await createAccount(a, { code: "102", name: "감사헌금", type: "income" });
    const res = await reflectOffering(a, offeringId, acc.accountId, "2026-06-10");
    expect(res?.voucherId).toBeTruthy();

    list = await listOnlineOfferings(a);
    expect(list[0]!.status).toBe("reflected");
    expect(list[0]!.voucherId).toBe(res!.voucherId);

    const vouchers = await listVouchers(a);
    expect(vouchers).toHaveLength(1);
    expect(Number(vouchers[0]!.amount)).toBe(50000);

    // 중복 반영 방지
    expect(await reflectOffering(a, offeringId, acc.accountId, "2026-06-10")).toBeNull();
  });
});
