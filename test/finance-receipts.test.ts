import { describe, it, expect, afterAll } from "vitest";
import { createAccount } from "@church/module-finance/accounts";
import { createVoucher } from "@church/module-finance/vouchers";
import { createMember } from "@church/module-members/service";
import {
  annualGivingByMember,
  memberAnnualGiving,
} from "@church/module-finance/receipts";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("기부금영수증", () => {
  it("교인별 연간 헌금 합산 + 연도 필터 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const tithe = await createAccount(a, { code: "101", name: "십일조", type: "income" });
    const { memberId } = await createMember(a, { name: "기부자", birth: "1980-01-01" });

    await createVoucher(a, { voucherDate: "2026-01-05", type: "income", accountId: tithe.accountId, memberId, amount: "100000" });
    await createVoucher(a, { voucherDate: "2026-02-05", type: "income", accountId: tithe.accountId, memberId, amount: "200000" });
    // 다른 연도
    await createVoucher(a, { voucherDate: "2025-12-25", type: "income", accountId: tithe.accountId, memberId, amount: "999999" });

    const rows = await annualGivingByMember(a, 2026);
    const row = rows.find((r) => r.memberId === memberId)!;
    expect(Number(row.total)).toBe(300000);
    expect(row.cnt).toBe(2);

    const detail = await memberAnnualGiving(a, memberId, 2026);
    expect(detail.member?.name).toBe("기부자");
    expect(detail.total).toBe(300000);
    expect(detail.items).toHaveLength(2);

    // 격리
    expect(await annualGivingByMember(b, 2026)).toHaveLength(0);
  });
});
