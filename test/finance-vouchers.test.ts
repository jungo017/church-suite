import { describe, it, expect, afterAll } from "vitest";
import { createAccount } from "@church/module-finance/accounts";
import {
  createVoucher,
  listVouchers,
  deleteVoucher,
} from "@church/module-finance/vouchers";
import { createMember } from "@church/module-members/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("전표", () => {
  it("등록/조인조회/필터/금액정확도 + 격리 + 삭제", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const inc = await createAccount(a, { code: "101", name: "십일조", type: "income" });
    const exp = await createAccount(a, { code: "501", name: "선교비", type: "expense" });
    const { memberId } = await createMember(a, { name: "헌금자" });

    const { voucherId } = await createVoucher(a, {
      voucherDate: "2026-06-01",
      type: "income",
      accountId: inc.accountId,
      memberId,
      amount: "1500000.00",
      method: "transfer",
      summary: "6월 십일조",
    });
    await createVoucher(a, {
      voucherDate: "2026-06-02",
      type: "expense",
      accountId: exp.accountId,
      amount: "300000.00",
    });

    const all = await listVouchers(a);
    expect(all).toHaveLength(2);
    const incRow = all.find((v) => v.voucherId === voucherId)!;
    expect(incRow.amount).toBe("1500000.00"); // numeric 정확도
    expect(incRow.accountName).toBe("십일조");
    expect(incRow.memberName).toBe("헌금자");

    // 필터
    expect((await listVouchers(a, { type: "income" })).length).toBe(1);
    expect((await listVouchers(a, { from: "2026-06-02" })).length).toBe(1);

    // 격리
    expect(await listVouchers(b)).toHaveLength(0);

    await deleteVoucher(a, voucherId);
    expect((await listVouchers(a)).length).toBe(1);
  });
});
