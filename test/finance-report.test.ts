import { describe, it, expect, afterAll } from "vitest";
import { createAccount } from "@church/module-finance/accounts";
import { createVoucher } from "@church/module-finance/vouchers";
import { accountSummary } from "@church/module-finance/report";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("재정 보고서 (raw SQL 집계)", () => {
  it("계정별 기간 집계 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const tithe = await createAccount(a, { code: "101", name: "십일조", type: "income" });
    const mission = await createAccount(a, { code: "501", name: "선교비", type: "expense" });

    await createVoucher(a, { voucherDate: "2026-03-01", type: "income", accountId: tithe.accountId, amount: "1000000" });
    await createVoucher(a, { voucherDate: "2026-03-08", type: "income", accountId: tithe.accountId, amount: "500000" });
    await createVoucher(a, { voucherDate: "2026-03-10", type: "expense", accountId: mission.accountId, amount: "200000" });
    // 기간 밖
    await createVoucher(a, { voucherDate: "2026-01-01", type: "income", accountId: tithe.accountId, amount: "999999" });

    const summary = await accountSummary(a, "2026-03-01", "2026-03-31");
    const titheRow = summary.find((r) => r.code === "101")!;
    expect(titheRow.type).toBe("income");
    expect(Number(titheRow.total)).toBe(1500000); // 3월 합계(1월 제외)
    expect(titheRow.cnt).toBe(2);
    const missionRow = summary.find((r) => r.code === "501")!;
    expect(Number(missionRow.total)).toBe(200000);

    // 다른 교회는 빈 결과
    expect(await accountSummary(b, "2026-03-01", "2026-03-31")).toHaveLength(0);
  });
});
